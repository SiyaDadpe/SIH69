import os
import joblib
import json
import numpy as np
import pandas as pd
import logging
import matplotlib.pyplot as plt
from datetime import datetime
from typing import Dict, List, Optional
from sklearn.multioutput import MultiOutputRegressor
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.inspection import permutation_importance
try:
    import shap
    _HAS_SHAP = True
except Exception:
    shap = None
    _HAS_SHAP = False
    # shap is optional; proceed without SHAP plots if missing
    # logging at module import time may be too early for configured logger, so use print as fallback
    try:
        logger = logging.getLogger(__name__)
        logger.warning('shap not available; SHAP plots will be skipped')
    except Exception:
        print('shap not available; SHAP plots will be skipped')

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def train_smelting_model(processed_data_path: str, model_output_path: str, 
                        test_size=0.2, random_state=42, tune_hyperparams=False) -> Dict:
    """
    Train the smelting model using preprocessed data with enhanced evaluation and explainability.

    Args:
        processed_data_path (str): Path to processed dataset CSV.
        model_output_path (str): Path to save the trained model.
        test_size (float): Fraction of data for testing.
        random_state (int): Random seed.
        tune_hyperparams (bool): Whether to perform hyperparameter tuning.

    Returns:
        Dict: Evaluation metrics and model information.
    """
    try:
        logger.info("Loading processed smelting data...")
        df = pd.read_csv(processed_data_path)

        # Load preprocessing artifacts with error handling
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        feature_names_path = os.path.join(project_root, 'preprocessing', 'smelting_feature_names.joblib')
        target_names_path = os.path.join(project_root, 'preprocessing', 'smelting_target_names.joblib')

        if not os.path.exists(feature_names_path) or not os.path.exists(target_names_path):
            logger.error("Preprocessing artifacts not found. Please run preprocessing first.")
            raise FileNotFoundError("Preprocessing artifacts not found")
            
        feature_names = joblib.load(feature_names_path)
        target_names = joblib.load(target_names_path)

        logger.info(f"Loaded {len(feature_names)} features and {len(target_names)} targets")

        # Check if columns exist
        missing_features = [f for f in feature_names if f not in df.columns]
        missing_targets = [t for t in target_names if t not in df.columns]
        
        if missing_features:
            logger.warning(f"Missing features: {missing_features}")
            feature_names = [f for f in feature_names if f in df.columns]
            
        if missing_targets:
            logger.warning(f"Missing targets: {missing_targets}")
            target_names = [t for t in target_names if t in df.columns]
            
        if not feature_names or not target_names:
            logger.error("No valid features or targets after filtering.")
            raise ValueError("Missing features or targets")

        # Prepare X and y
        X = df[feature_names].values
        y = df[target_names].values

        logger.info("Splitting data into training and test sets...")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )

        # Hyperparameter tuning or default parameters
        if tune_hyperparams:
            logger.info("Performing hyperparameter tuning...")
            best_params = tune_hyperparameters(X_train, y_train, target_names, random_state)
            base_model = GradientBoostingRegressor(**best_params, random_state=random_state)
        else:
            # Use optimized parameters
            base_model = GradientBoostingRegressor(
                n_estimators=300,
                learning_rate=0.1,
                max_depth=5,
                random_state=random_state,
                subsample=0.8,
                min_samples_split=5,
                validation_fraction=0.1,
                n_iter_no_change=10,
                tol=1e-4
            )
            
        model = MultiOutputRegressor(base_model)

        logger.info("Training the model...")
        model.fit(X_train, y_train)

        logger.info("Evaluating model performance...")
        y_pred = model.predict(X_test)
        metrics = {}
        
        for i, target in enumerate(target_names):
            rmse = mean_squared_error(y_test[:, i], y_pred[:, i], squared=False)
            mae = mean_absolute_error(y_test[:, i], y_pred[:, i])
            r2 = r2_score(y_test[:, i], y_pred[:, i])
            
            # Calculate relative errors for better interpretation
            y_mean = np.mean(y_test[:, i])
            rmse_relative = rmse / y_mean if y_mean != 0 else float('inf')
            mae_relative = mae / y_mean if y_mean != 0 else float('inf')
            
            metrics[target] = {
                'RMSE': float(rmse),
                'MAE': float(mae),
                'R2': float(r2),
                'RMSE_relative': float(rmse_relative),
                'MAE_relative': float(mae_relative),
                'y_mean': float(y_mean)
            }
            
            logger.info(f"Target: {target}")
            logger.info(f"  RMSE: {rmse:.4f} ({rmse_relative:.2%} of mean)")
            logger.info(f"  MAE: {mae:.4f} ({mae_relative:.2%} of mean)")
            logger.info(f"  R²: {r2:.4f}")

        logger.info("Performing cross-validation...")
        cv_scores = {}
        for i, target in enumerate(target_names):
            scores = cross_val_score(
                model.estimators_[i], X, y[:, i], 
                cv=5, scoring='neg_mean_squared_error'
            )
            cv_rmse = np.sqrt(-scores.mean())
            cv_scores[target] = float(cv_rmse)
            logger.info(f"Target: {target} - CV RMSE: {cv_rmse:.4f}")
            
        metrics['cross_validation'] = cv_scores

        # Generate explainability plots
        if len(target_names) > 0:
            plot_feature_importance(model.estimators_[0], feature_names, target_names[0], model_output_path)
            # Generate SHAP only if shap is available
            if '_HAS_SHAP' in globals() and _HAS_SHAP:
                try:
                    if X_test.shape[0] <= 1000:  # Limit for performance reasons
                        generate_shap_plots(model.estimators_[0], X_test, feature_names, target_names[0], model_output_path)
                except Exception as e:
                    logger.warning(f"Could not generate SHAP plots: {e}")

        logger.info(f"Saving model to {model_output_path}...")
        os.makedirs(os.path.dirname(model_output_path), exist_ok=True)
        joblib.dump(model, model_output_path)

        # Save metrics
        metrics_path = os.path.join(os.path.dirname(model_output_path), 'smelting_model_metrics.json')
        with open(metrics_path, 'w') as f:
            json.dump(metrics, f, indent=4)

        # Save metadata with more details
        # Build metadata, guarding against non-target entries in metrics (e.g., 'cross_validation')
        r2_items = [(k, v['R2']) for k, v in metrics.items() if isinstance(v, dict) and 'R2' in v]
        if r2_items:
            best_target = max(r2_items, key=lambda x: x[1])[0]
            worst_target = min(r2_items, key=lambda x: x[1])[0]
            avg_r2 = float(np.mean([v for _, v in r2_items]))
        else:
            best_target = 'N/A'
            worst_target = 'N/A'
            avg_r2 = 0.0

        metadata = {
            'training_date': datetime.now().isoformat(),
            'model_type': 'GradientBoostingRegressor',
            'feature_names': feature_names,
            'target_names': target_names,
            'dataset_size': len(df),
            'test_size': test_size,
            'random_state': random_state,
            'hyperparameters_tuned': tune_hyperparams,
            'model_performance': {
                'best_target': best_target,
                'worst_target': worst_target,
                'avg_r2': avg_r2
            }
        }
        
        metadata_path = os.path.join(os.path.dirname(model_output_path), 'smelting_model_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=4)

        logger.info("Training completed successfully.")
        return metrics

    except Exception as e:
        logger.error(f"Error during training: {e}")
        raise

def tune_hyperparameters(X_train, y_train, target_names, random_state):
    """
    Perform hyperparameter tuning for the first target and use those parameters for all targets.
    """
    param_grid = {
        'n_estimators': [100, 200, 300],
        'learning_rate': [0.05, 0.1, 0.2],
        'max_depth': [3, 5, 7],
        'subsample': [0.8, 0.9],
        'min_samples_split': [2, 5, 10]
    }
    
    # Tune on the first target
    gb = GradientBoostingRegressor(random_state=random_state)
    grid_search = GridSearchCV(
        gb, param_grid, cv=3, scoring='neg_mean_squared_error', 
        n_jobs=-1, verbose=1
    )
    
    grid_search.fit(X_train, y_train[:, 0])
    logger.info(f"Best parameters: {grid_search.best_params_}")
    
    return grid_search.best_params_

def plot_feature_importance(model, feature_names, target_name, model_output_path):
    """
    Plot and save feature importance visualization.
    """
    try:
        importance = model.feature_importances_
        indices = np.argsort(importance)[::-1]
        
        # Only show top features
        n_features = min(15, len(importance))
        indices = indices[:n_features]
        importance = importance[indices]
        feature_names_subset = [feature_names[i] for i in indices]
        
        plt.figure(figsize=(12, 8))
        plt.title(f"Feature Importance for {target_name}", fontsize=16)
        bars = plt.bar(range(len(importance)), importance)
        plt.xticks(range(len(importance)), feature_names_subset, rotation=45, ha='right')
        plt.ylabel('Importance', fontsize=12)
        plt.tight_layout()

        plots_dir = os.path.join(os.path.dirname(model_output_path), 'plots')
        os.makedirs(plots_dir, exist_ok=True)
        plot_path = os.path.join(plots_dir, f'feature_importance_{target_name}.png')
        plt.savefig(plot_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        logger.info(f"Feature importance plot saved to {plot_path}")
    except Exception as e:
        logger.error(f"Error saving feature importance plot: {e}")

def generate_shap_plots(model, X_test, feature_names, target_name, model_output_path):
    """
    Generate SHAP plots for model explainability.
    """
    try:
        # Create a small sample for SHAP analysis
        sample_size = min(100, X_test.shape[0])
        X_sample = X_test[:sample_size]
        
        # Create SHAP explainer
        explainer = shap.Explainer(model, X_sample, feature_names=feature_names)
        shap_values = explainer(X_sample)
        
        # Summary plot
        plt.figure(figsize=(10, 8))
        shap.summary_plot(shap_values, X_sample, feature_names=feature_names, show=False)
        plt.title(f"SHAP Summary for {target_name}", fontsize=16)
        
        plots_dir = os.path.join(os.path.dirname(model_output_path), 'plots')
        os.makedirs(plots_dir, exist_ok=True)
        shap_summary_path = os.path.join(plots_dir, f'shap_summary_{target_name}.png')
        plt.savefig(shap_summary_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        logger.info(f"SHAP summary plot saved to {shap_summary_path}")
        
    except Exception as e:
        logger.warning(f"SHAP analysis failed: {e}")

if __name__ == "__main__":
    # Diagnostic prints to ensure visible output in all environments
    print("Starting smelting model training...", flush=True)
    try:
        print(f"Python executable: {os.sys.executable}", flush=True)
        print(f"Working dir: {os.getcwd()}", flush=True)
        print("Checking processed data presence...", flush=True)
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        processed_data_path = os.path.join(project_root, 'data', 'processed', 'smelting_processed.csv')
        model_output_path = os.path.join(project_root, 'models', 'smelting_model.joblib')
        
        # Check if processed data exists
        if not os.path.exists(processed_data_path):
            print(f"Processed data not found at {processed_data_path}")
            print("Please run preprocessing first.")
            exit(1)
            
        print(f"Processed data path: {processed_data_path}", flush=True)
        if not os.path.exists(processed_data_path):
            print(f"Processed data not found at {processed_data_path}", flush=True)
            print("Please run preprocessing first.", flush=True)
            exit(1)
        metrics = train_smelting_model(processed_data_path, model_output_path, tune_hyperparams=False)
        
        print("\n=== SMELTING MODEL TRAINING SUMMARY ===")
        for target, vals in metrics.items():
            if target != 'cross_validation':
                print(f"\n{target}:")
                for metric, value in vals.items():
                    if metric in ['RMSE_relative', 'MAE_relative']:
                        print(f"  {metric}: {value:.2%}")
                    else:
                        print(f"  {metric}: {value:.4f}")
        
        print("\nTraining process finished successfully.")
        
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        logger.error(f"Training failed: {e}\n{tb}")
        print(f"Training failed: {e}")
        print(tb)