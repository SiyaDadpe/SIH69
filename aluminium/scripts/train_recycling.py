import os
import joblib
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import logging
import seaborn as sns
from datetime import datetime
from typing import Dict, List, Tuple
from sklearn.multioutput import MultiOutputRegressor
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score, mean_absolute_percentage_error
from sklearn.inspection import permutation_importance

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def load_preprocessing_artifacts(project_root: str) -> Tuple:
    """Load preprocessing objects with enhanced error handling."""
    try:
        preprocessor_path = os.path.join(project_root, 'preprocessing', 'recycling_preprocessor.joblib')
        feature_names_path = os.path.join(project_root, 'preprocessing', 'recycling_feature_names.joblib')
        target_names_path = os.path.join(project_root, 'preprocessing', 'recycling_target_names.joblib')
        metadata_path = os.path.join(project_root, 'preprocessing', 'recycling_metadata.joblib')
        
        preprocessor = joblib.load(preprocessor_path)
        feature_names = joblib.load(feature_names_path)
        target_names = joblib.load(target_names_path)
        
        # Try to load metadata if it exists
        try:
            metadata = joblib.load(metadata_path)
            logger.info("Loaded preprocessing metadata")
        except:
            metadata = {}
            logger.warning("Could not load preprocessing metadata")
            
        return preprocessor, feature_names, target_names, metadata
    except Exception as e:
        logger.error(f"Error loading preprocessing artifacts: {e}")
        raise

def align_features(df: pd.DataFrame, feature_names: List[str], target_names: List[str]) -> pd.DataFrame:
    """Align columns to expected feature order with enhanced validation."""
    # Check for missing features
    missing_features = [f for f in feature_names if f not in df.columns]
    if missing_features:
        logger.warning(f"Missing {len(missing_features)} features: {missing_features[:5]}{'...' if len(missing_features) > 5 else ''}")
    
    # Check for extra features
    extra_features = [f for f in df.columns if f not in feature_names + target_names]
    if extra_features:
        logger.warning(f"Found {len(extra_features)} extra features: {extra_features[:5]}{'...' if len(extra_features) > 5 else ''}")
    
    # Ensure we have the correct features in the correct order
    present_features = [f for f in feature_names if f in df.columns]
    present_targets = [t for t in target_names if t in df.columns]
    
    if not present_features:
        logger.error("No expected features found in the dataset")
        raise ValueError("No expected features found in the dataset")
        
    if not present_targets:
        logger.error("No expected targets found in the dataset")
        raise ValueError("No expected targets found in the dataset")
    
    return df[present_features + present_targets]

def train_recycling_model(processed_data_path: str, model_output_path: str,
                          test_size=0.2, random_state=42, perform_hyperparameter_tuning=False) -> Dict:
    """Train the recycling ML model with enhanced capabilities."""
    try:
        logger.info("Loading processed recycling data...")
        df = pd.read_csv(processed_data_path)

        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        
        preprocessor, feature_names, target_names, metadata = load_preprocessing_artifacts(project_root)
        logger.info(f"Loaded {len(feature_names)} features and {len(target_names)} targets")

        # Align features with expected preprocessing output
        df = align_features(df, feature_names, target_names)

        # Prepare data
        X = df[feature_names].values
        y = df[target_names].values

        logger.info("Splitting data into train/test sets...")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, shuffle=True
        )

        logger.info("Initializing models...")
        # Base model with reasonable defaults for recycling data
        base_model = GradientBoostingRegressor(
            n_estimators=200,
            learning_rate=0.05,
            max_depth=4,
            random_state=random_state,
            subsample=0.8,
            min_samples_split=10,
            min_samples_leaf=4,
            validation_fraction=0.1,
            n_iter_no_change=10,
            tol=1e-4
        )
        
        model = MultiOutputRegressor(base_model)

        # Hyperparameter tuning if requested
        if perform_hyperparameter_tuning:
            logger.info("Performing hyperparameter tuning...")
            param_grid = {
                'estimator__n_estimators': [100, 200, 300],
                'estimator__learning_rate': [0.01, 0.05, 0.1],
                'estimator__max_depth': [3, 4, 5],
                'estimator__subsample': [0.8, 0.9, 1.0]
            }
            
            grid_search = GridSearchCV(
                model, param_grid, cv=3, scoring='neg_mean_squared_error',
                n_jobs=-1, verbose=1
            )
            
            grid_search.fit(X_train, y_train)
            model = grid_search.best_estimator_
            logger.info(f"Best parameters: {grid_search.best_params_}")
        else:
            logger.info("Training the model with default parameters...")
            model.fit(X_train, y_train)

        logger.info("Evaluating model performance...")
        y_pred = model.predict(X_test)
        metrics = {}
        
        for i, target in enumerate(target_names):
            rmse = mean_squared_error(y_test[:, i], y_pred[:, i], squared=False)
            mae = mean_absolute_error(y_test[:, i], y_pred[:, i])
            r2 = r2_score(y_test[:, i], y_pred[:, i])
            mape = mean_absolute_percentage_error(y_test[:, i], y_pred[:, i])
            
            metrics[target] = {
                'RMSE': float(rmse),
                'MAE': float(mae),
                'R2': float(r2),
                'MAPE': float(mape)
            }
            logger.info(f"{target}: RMSE={rmse:.4f}, MAE={mae:.4f}, R²={r2:.4f}, MAPE={mape:.4f}")

        logger.info("Running cross-validation...")
        cv_scores = {}
        for i, target in enumerate(target_names):
            scores = cross_val_score(
                model.estimators_[i], X, y[:, i],
                cv=5, scoring='neg_mean_squared_error'
            )
            cv_rmse = np.sqrt(-scores.mean())
            cv_scores[target] = {
                'RMSE': float(cv_rmse),
                'Std': float(np.std(np.sqrt(-scores)))
            }
            logger.info(f"CV RMSE for {target}: {cv_rmse:.4f} ± {np.std(np.sqrt(-scores)):.4f}")
        
        metrics['cross_validation'] = cv_scores

        # Calculate permutation importance
        logger.info("Calculating permutation importance...")
        perm_importance = {}
        for i, target in enumerate(target_names):
            result = permutation_importance(
                model.estimators_[i], X_test, y_test[:, i],
                n_repeats=10, random_state=random_state, n_jobs=-1
            )
            perm_importance[target] = {
                'importances_mean': result.importances_mean.tolist(),
                'importances_std': result.importances_std.tolist()
            }
        
        metrics['permutation_importance'] = perm_importance

        # Save the model
        logger.info(f"Saving model to {model_output_path}...")
        os.makedirs(os.path.dirname(model_output_path), exist_ok=True)
        joblib.dump(model, model_output_path)

        # Save metrics
        metrics_path = os.path.join(os.path.dirname(model_output_path), 'recycling_model_metrics.json')
        with open(metrics_path, 'w') as f:
            json.dump(metrics, f, indent=4)

        # Save metadata
        metadata = {
            'training_date': datetime.now().isoformat(),
            'model_type': 'GradientBoostingRegressor',
            'features': feature_names,
            'targets': target_names,
            'dataset_size': len(df),
            'test_size': test_size,
            'random_state': random_state,
            'preprocessing_metadata': metadata
        }
        metadata_path = os.path.join(os.path.dirname(model_output_path), 'recycling_model_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=4)

        logger.info("Creating visualizations...")
        # Plot feature importance for all targets
        for i, target in enumerate(target_names):
            plot_feature_importance(model.estimators_[i], feature_names, target, model_output_path)
        
        # Plot actual vs predicted for all targets
        plot_actual_vs_predicted(y_test, y_pred, target_names, model_output_path)
        
        # Plot correlation matrix of targets
        plot_target_correlations(df[target_names], model_output_path)

        logger.info("Recycling model training completed successfully.")
        return metrics

    except Exception as e:
        logger.error(f"Training failed: {e}")
        raise

def plot_feature_importance(model, feature_names, target_name, output_path):
    """Plot and save feature importance with enhanced visualization."""
    try:
        importance = model.feature_importances_
        indices = np.argsort(importance)[::-1]
        top_n = min(15, len(importance))
        
        # Get top features
        top_indices = indices[:top_n]
        top_importance = importance[top_indices]
        top_names = [feature_names[i] for i in top_indices]
        
        # Create horizontal bar plot for better readability
        plt.figure(figsize=(10, 8))
        y_pos = np.arange(len(top_importance))
        plt.barh(y_pos, top_importance, align='center')
        plt.yticks(y_pos, top_names)
        plt.xlabel('Feature Importance')
        plt.title(f'Feature Importance for {target_name}')
        plt.gca().invert_yaxis()  # Most important at the top
        plt.tight_layout()

        plot_dir = os.path.join(os.path.dirname(output_path), 'plots')
        os.makedirs(plot_dir, exist_ok=True)
        plot_file = os.path.join(plot_dir, f'feature_importance_{target_name}.png')
        plt.savefig(plot_file, dpi=300, bbox_inches='tight')
        plt.close()
        logger.info(f"Saved feature importance plot: {plot_file}")
    except Exception as e:
        logger.error(f"Failed to plot feature importance for {target_name}: {e}")

def plot_actual_vs_predicted(y_test, y_pred, target_names, output_path):
    """Plot actual vs predicted values for all targets."""
    try:
        n_targets = len(target_names)
        fig, axes = plt.subplots(2, 4, figsize=(20, 10))
        axes = axes.flat
        
        for i, target in enumerate(target_names):
            if i >= len(axes):
                break
                
            # Calculate R² for this target
            r2 = r2_score(y_test[:, i], y_pred[:, i])
            
            # Create scatter plot
            axes[i].scatter(y_test[:, i], y_pred[:, i], alpha=0.5)
            
            # Add perfect prediction line
            max_val = max(np.max(y_test[:, i]), np.max(y_pred[:, i]))
            min_val = min(np.min(y_test[:, i]), np.min(y_pred[:, i]))
            axes[i].plot([min_val, max_val], [min_val, max_val], 'r--')
            
            axes[i].set_xlabel('Actual')
            axes[i].set_ylabel('Predicted')
            axes[i].set_title(f'{target}\nR² = {r2:.3f}')
        
        plt.tight_layout()
        
        plot_dir = os.path.join(os.path.dirname(output_path), 'plots')
        os.makedirs(plot_dir, exist_ok=True)
        plot_file = os.path.join(plot_dir, 'actual_vs_predicted.png')
        plt.savefig(plot_file, dpi=300, bbox_inches='tight')
        plt.close()
        logger.info(f"Saved actual vs predicted plot: {plot_file}")
    except Exception as e:
        logger.error(f"Failed to plot actual vs predicted: {e}")

def plot_target_correlations(target_df, output_path):
    """Plot correlation matrix of target variables."""
    try:
        plt.figure(figsize=(10, 8))
        corr_matrix = target_df.corr()
        mask = np.triu(np.ones_like(corr_matrix, dtype=bool))
        
        sns.heatmap(
            corr_matrix, 
            mask=mask, 
            annot=True, 
            cmap='coolwarm', 
            center=0,
            square=True,
            fmt='.2f'
        )
        plt.title('Correlation Matrix of Target Variables')
        plt.tight_layout()
        
        plot_dir = os.path.join(os.path.dirname(output_path), 'plots')
        os.makedirs(plot_dir, exist_ok=True)
        plot_file = os.path.join(plot_dir, 'target_correlations.png')
        plt.savefig(plot_file, dpi=300, bbox_inches='tight')
        plt.close()
        logger.info(f"Saved target correlation plot: {plot_file}")
    except Exception as e:
        logger.error(f"Failed to plot target correlations: {e}")

if __name__ == "__main__":
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    processed_data_path = os.path.join(project_root, 'data', 'processed', 'recycling_processed.csv')
    model_output_path = os.path.join(project_root, 'models', 'recycling_model.joblib')

    logger.info("Starting recycling model training...")
    try:
        metrics = train_recycling_model(
            processed_data_path, 
            model_output_path,
            perform_hyperparameter_tuning=False  # Set to True for hyperparameter tuning
        )
        
        print("\n=== Recycling Model Metrics ===")
        for target, vals in metrics.items():
            if target != 'cross_validation' and target != 'permutation_importance':
                print(f"\n{target}:")
                for metric_name, value in vals.items():
                    print(f"  {metric_name}: {value:.4f}")
        
        print("\n=== Cross-Validation Results ===")
        cv_metrics = metrics.get('cross_validation', {})
        for target, vals in cv_metrics.items():
            print(f"{target}: RMSE={vals['RMSE']:.4f} ± {vals['Std']:.4f}")
            
        print("\nTraining completed successfully.")
    except Exception as e:
        logger.error(f"Recycling model training failed: {e}")
        print(f"Recycling model training failed: {e}")