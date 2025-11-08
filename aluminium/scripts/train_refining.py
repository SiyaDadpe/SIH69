import os
import joblib
import numpy as np
import pandas as pd
import json
import logging
import matplotlib.pyplot as plt
from datetime import datetime
from sklearn.multioutput import MultiOutputRegressor
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split, cross_val_score
from typing import Dict

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def train_refining_model(processed_data_path: str, model_output_path: str, test_size=0.2, random_state=42) -> Dict:
    """
    Train the refining model using preprocessed data with logging and saving artifacts.

    Args:
        processed_data_path (str): Path to the processed dataset CSV.
        model_output_path (str): Path to save the trained model.
        test_size (float): Fraction of data for testing.
        random_state (int): Random seed.

    Returns:
        dict: Metrics for evaluation.
    """
    try:
        logger.info("Loading processed refining data...")
        df = pd.read_csv(processed_data_path)

        # Load feature and target names
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        feature_names_path = os.path.join(project_root, 'preprocessing', 'refining_feature_names.joblib')
        target_names_path = os.path.join(project_root, 'preprocessing', 'refining_target_names.joblib')

        # Check if files exist before loading
        if not os.path.exists(feature_names_path) or not os.path.exists(target_names_path):
            logger.error("Preprocessing files not found. Please run preprocessing first.")
            raise FileNotFoundError("Preprocessing files not found")
            
        feature_names = joblib.load(feature_names_path)
        target_names = joblib.load(target_names_path)

        logger.info(f"Loaded {len(feature_names)} feature names and {len(target_names)} target names")
        
        # Check if all features and targets exist in the DataFrame
        missing_features = [f for f in feature_names if f not in df.columns]
        missing_targets = [t for t in target_names if t not in df.columns]
        
        if missing_features:
            logger.warning(f"Missing features in data: {missing_features}")
            feature_names = [f for f in feature_names if f in df.columns]
            
        if missing_targets:
            logger.warning(f"Missing targets in data: {missing_targets}")
            target_names = [t for t in target_names if t in df.columns]
            
        if not feature_names or not target_names:
            logger.error("No valid features or targets found after filtering")
            raise ValueError("No valid features or targets available")

        # Prepare feature matrix and target matrix
        X = df[feature_names].values
        y = df[target_names].values

        logger.info("Splitting data into training and test sets...")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )

        logger.info("Initializing GradientBoostingRegressor...")
        # Using early stopping to prevent overfitting
        base_model = GradientBoostingRegressor(
            n_estimators=500,  # Set high, early stopping will determine optimal
            learning_rate=0.1,
            max_depth=5,
            subsample=0.8,
            random_state=random_state,
            min_samples_split=5,
            validation_fraction=0.1,  # Use 10% for early stopping
            n_iter_no_change=10,      # Stop if no improvement after 10 iterations
            tol=1e-4                  # Tolerance for early stopping
        )
        model = MultiOutputRegressor(base_model)

        logger.info("Training the model...")
        model.fit(X_train, y_train)

        logger.info("Evaluating the model...")
        y_pred = model.predict(X_test)
        metrics = {}
        for i, target in enumerate(target_names):
            rmse = mean_squared_error(y_test[:, i], y_pred[:, i], squared=False)
            mae = mean_absolute_error(y_test[:, i], y_pred[:, i])
            r2 = r2_score(y_test[:, i], y_pred[:, i])
            metrics[target] = {
                'RMSE': float(rmse),
                'MAE': float(mae),
                'R2': float(r2)
            }
            logger.info(f"Target: {target}")
            logger.info(f"  RMSE: {rmse:.4f}")
            logger.info(f"  MAE: {mae:.4f}")
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
        
        # Plot feature importance for the first target
        plot_feature_importance(model.estimators_[0], feature_names, target_names[0], model_output_path)

        logger.info(f"Saving model to {model_output_path}...")
        os.makedirs(os.path.dirname(model_output_path), exist_ok=True)
        joblib.dump(model, model_output_path)

        # Save metrics
        metrics_path = os.path.join(os.path.dirname(model_output_path), 'refining_model_metrics.json')
        with open(metrics_path, 'w') as f:
            json.dump(metrics, f, indent=4)

        # Save metadata
        metadata = {
            'training_date': datetime.now().isoformat(),
            'model_type': 'GradientBoostingRegressor',
            'feature_names': feature_names,
            'target_names': target_names,
            'dataset_size': len(df),
            'test_size': test_size,
            'random_state': random_state
        }
        metadata_path = os.path.join(os.path.dirname(model_output_path), 'refining_model_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=4)

        logger.info("Training completed successfully.")
        return metrics

    except Exception as e:
        logger.error(f"Error during model training: {str(e)}")
        raise

def plot_feature_importance(model, feature_names, target_name, model_output_path):
    """Plot and save feature importance visualization"""
    try:
        importance = model.feature_importances_
        indices = np.argsort(importance)[::-1]
        
        # Only show top 20 features if there are many
        if len(importance) > 20:
            indices = indices[:20]
            importance = importance[indices]
            feature_names = [feature_names[i] for i in indices]
        
        plt.figure(figsize=(12, 8))
        plt.title(f"Feature Importance for {target_name}", fontsize=16)
        bars = plt.bar(range(len(importance)), importance)
        plt.xticks(range(len(importance)), feature_names, rotation=45, ha='right')
        plt.ylabel('Importance', fontsize=12)
        plt.tight_layout()
        
        # Save the plot
        plots_dir = os.path.join(os.path.dirname(model_output_path), 'plots')
        os.makedirs(plots_dir, exist_ok=True)
        plot_path = os.path.join(plots_dir, f'feature_importance_{target_name}.png')
        plt.savefig(plot_path)
        plt.close()
        
        logger.info(f"Feature importance plot saved to {plot_path}")
    except Exception as e:
        logger.error(f"Error creating feature importance plot: {e}")

# Optional: Hyperparameter tuning function
def tune_hyperparameters(X, y, target_names):
    """
    Optional function for hyperparameter tuning using GridSearchCV
    """
    from sklearn.model_selection import GridSearchCV
    
    logger.info("Performing hyperparameter tuning...")
    
    param_grid = {
        'n_estimators': [100, 150, 200],
        'learning_rate': [0.05, 0.1, 0.2],
        'max_depth': [3, 5, 7],
        'subsample': [0.8, 0.9, 1.0]
    }
    
    best_models = {}
    
    for i, target in enumerate(target_names):
        logger.info(f"Tuning hyperparameters for {target}...")
        
        gb = GradientBoostingRegressor(random_state=42)
        grid_search = GridSearchCV(
            gb, param_grid, cv=3, scoring='neg_mean_squared_error', n_jobs=-1, verbose=1
        )
        grid_search.fit(X, y[:, i])
        
        best_models[target] = grid_search.best_estimator_
        logger.info(f"Best parameters for {target}: {grid_search.best_params_}")
    
    return best_models

if __name__ == "__main__":
    print("Starting refining model training...")
    try:
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        processed_data_path = os.path.join(project_root, 'data', 'processed', 'refining_processed.csv')
        model_output_path = os.path.join(project_root, 'models', 'refining_model.joblib')
        metrics = train_refining_model(processed_data_path, model_output_path)
        logger.info("Refining model training completed.")
        print("\n=== REFINING MODEL TRAINING SUMMARY ===")
        for target, vals in metrics.items():
            if target != 'cross_validation':
                print(f"\n{target}:")
                for metric_name, metric_value in vals.items():
                    print(f"  {metric_name}: {metric_value:.4f}")
        print("Training process finished successfully.")
    except Exception as e:
        logger.error(f"Training failed: {str(e)}")
        print(f"Training failed: {e}")

import os
import joblib
import numpy as np
import pandas as pd
import json
import logging
import matplotlib.pyplot as plt
from datetime import datetime
from sklearn.multioutput import MultiOutputRegressor
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split, cross_val_score
from typing import Dict

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def train_refining_model(processed_data_path: str, model_output_path: str, test_size=0.2, random_state=42) -> Dict:
    """
    Train the refining model using preprocessed data with logging and saving artifacts.

    Args:
        processed_data_path (str): Path to the processed dataset CSV.
        model_output_path (str): Path to save the trained model.
        test_size (float): Fraction of data for testing.
        random_state (int): Random seed.

    Returns:
        dict: Metrics for evaluation.
    """
    try:
        logger.info("Loading processed refining data...")
        df = pd.read_csv(processed_data_path)

        # Load feature and target names
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        feature_names_path = os.path.join(project_root, 'preprocessing', 'refining_feature_names.joblib')
        target_names_path = os.path.join(project_root, 'preprocessing', 'refining_target_names.joblib')

        # Check if files exist before loading
        if not os.path.exists(feature_names_path) or not os.path.exists(target_names_path):
            logger.error("Preprocessing files not found. Please run preprocessing first.")
            raise FileNotFoundError("Preprocessing files not found")
            
        feature_names = joblib.load(feature_names_path)
        target_names = joblib.load(target_names_path)

        logger.info(f"Loaded {len(feature_names)} feature names and {len(target_names)} target names")
        
        # Check if all features and targets exist in the DataFrame
        missing_features = [f for f in feature_names if f not in df.columns]
        missing_targets = [t for t in target_names if t not in df.columns]
        
        if missing_features:
            logger.warning(f"Missing features in data: {missing_features}")
            feature_names = [f for f in feature_names if f in df.columns]
            
        if missing_targets:
            logger.warning(f"Missing targets in data: {missing_targets}")
            target_names = [t for t in target_names if t in df.columns]
            
        if not feature_names or not target_names:
            logger.error("No valid features or targets found after filtering")
            raise ValueError("No valid features or targets available")

        # Prepare feature matrix and target matrix
        X = df[feature_names].values
        y = df[target_names].values

        logger.info("Splitting data into training and test sets...")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )

        logger.info("Initializing GradientBoostingRegressor...")
        # Using early stopping to prevent overfitting
        base_model = GradientBoostingRegressor(
            n_estimators=500,  # Set high, early stopping will determine optimal
            learning_rate=0.1,
            max_depth=5,
            subsample=0.8,
            random_state=random_state,
            min_samples_split=5,
            validation_fraction=0.1,  # Use 10% for early stopping
            n_iter_no_change=10,      # Stop if no improvement after 10 iterations
            tol=1e-4                  # Tolerance for early stopping
        )
        model = MultiOutputRegressor(base_model)

        logger.info("Training the model...")
        model.fit(X_train, y_train)

        logger.info("Evaluating the model...")
        y_pred = model.predict(X_test)
        metrics = {}
        for i, target in enumerate(target_names):
            rmse = mean_squared_error(y_test[:, i], y_pred[:, i], squared=False)
            mae = mean_absolute_error(y_test[:, i], y_pred[:, i])
            r2 = r2_score(y_test[:, i], y_pred[:, i])
            metrics[target] = {
                'RMSE': float(rmse),
                'MAE': float(mae),
                'R2': float(r2)
            }
            logger.info(f"Target: {target}")
            logger.info(f"  RMSE: {rmse:.4f}")
            logger.info(f"  MAE: {mae:.4f}")
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
        
        # Plot feature importance for the first target
        plot_feature_importance(model.estimators_[0], feature_names, target_names[0], model_output_path)

        logger.info(f"Saving model to {model_output_path}...")
        os.makedirs(os.path.dirname(model_output_path), exist_ok=True)
        joblib.dump(model, model_output_path)

        # Save metrics
        metrics_path = os.path.join(os.path.dirname(model_output_path), 'refining_model_metrics.json')
        with open(metrics_path, 'w') as f:
            json.dump(metrics, f, indent=4)

        # Save metadata
        metadata = {
            'training_date': datetime.now().isoformat(),
            'model_type': 'GradientBoostingRegressor',
            'feature_names': feature_names,
            'target_names': target_names,
            'dataset_size': len(df),
            'test_size': test_size,
            'random_state': random_state
        }
        metadata_path = os.path.join(os.path.dirname(model_output_path), 'refining_model_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=4)

        logger.info("Training completed successfully.")
        return metrics

    except Exception as e:
        logger.error(f"Error during model training: {str(e)}")
        raise

def plot_feature_importance(model, feature_names, target_name, model_output_path):
    """Plot and save feature importance visualization"""
    try:
        importance = model.feature_importances_
        indices = np.argsort(importance)[::-1]
        
        # Only show top 20 features if there are many
        if len(importance) > 20:
            indices = indices[:20]
            importance = importance[indices]
            feature_names = [feature_names[i] for i in indices]
        
        plt.figure(figsize=(12, 8))
        plt.title(f"Feature Importance for {target_name}", fontsize=16)
        bars = plt.bar(range(len(importance)), importance)
        plt.xticks(range(len(importance)), feature_names, rotation=45, ha='right')
        plt.ylabel('Importance', fontsize=12)
        plt.tight_layout()
        
        # Save the plot
        plots_dir = os.path.join(os.path.dirname(model_output_path), 'plots')
        os.makedirs(plots_dir, exist_ok=True)
        plot_path = os.path.join(plots_dir, f'feature_importance_{target_name}.png')
        plt.savefig(plot_path)
        plt.close()
        
        logger.info(f"Feature importance plot saved to {plot_path}")
    except Exception as e:
        logger.error(f"Error creating feature importance plot: {e}")

# Optional: Hyperparameter tuning function
def tune_hyperparameters(X, y, target_names):
    """
    Optional function for hyperparameter tuning using GridSearchCV
    """
    from sklearn.model_selection import GridSearchCV
    
    logger.info("Performing hyperparameter tuning...")
    
    param_grid = {
        'n_estimators': [100, 150, 200],
        'learning_rate': [0.05, 0.1, 0.2],
        'max_depth': [3, 5, 7],
        'subsample': [0.8, 0.9, 1.0]
    }
    
    best_models = {}
    
    for i, target in enumerate(target_names):
        logger.info(f"Tuning hyperparameters for {target}...")
        
        gb = GradientBoostingRegressor(random_state=42)
        grid_search = GridSearchCV(
            gb, param_grid, cv=3, scoring='neg_mean_squared_error', n_jobs=-1, verbose=1
        )
        grid_search.fit(X, y[:, i])
        
        best_models[target] = grid_search.best_estimator_
        logger.info(f"Best parameters for {target}: {grid_search.best_params_}")
    
    return best_models

if __name__ == "__main__":
    print("Starting refining model training...")
    try:
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        processed_data_path = os.path.join(project_root, 'data', 'processed', 'refining_processed.csv')
        model_output_path = os.path.join(project_root, 'models', 'refining_model.joblib')
        metrics = train_refining_model(processed_data_path, model_output_path)
        logger.info("Refining model training completed.")
        print("\n=== REFINING MODEL TRAINING SUMMARY ===")
        for target, vals in metrics.items():
            if target != 'cross_validation':
                print(f"\n{target}:")
                for metric_name, metric_value in vals.items():
                    print(f"  {metric_name}: {metric_value:.4f}")
        print("Training process finished successfully.")
    except Exception as e:
        logger.error(f"Training failed: {str(e)}")
        print(f"Training failed: {e}")