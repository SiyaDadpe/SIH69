import os
import joblib
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import logging
from datetime import datetime
from typing import Dict, List
from sklearn.multioutput import MultiOutputRegressor
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def load_preprocessing_artifacts(project_root: str) -> tuple:
    """Load preprocessing artifacts with error handling."""
    try:
        preprocessor_path = os.path.join(project_root, 'preprocessing', 'manufacturing_preprocessor.joblib')
        feature_names_path = os.path.join(project_root, 'preprocessing', 'manufacturing_feature_names.joblib')
        target_names_path = os.path.join(project_root, 'preprocessing', 'manufacturing_target_names.joblib')
        
        preprocessor = joblib.load(preprocessor_path)
        feature_names = joblib.load(feature_names_path)
        target_names = joblib.load(target_names_path)
        
        return preprocessor, feature_names, target_names
    except Exception as e:
        logger.error(f"Error loading preprocessing artifacts: {e}")
        raise

def align_features(df: pd.DataFrame, feature_names: List[str], target_names: List[str]) -> pd.DataFrame:
    """Ensure the DataFrame has the expected features after preprocessing."""
    # Check for missing features
    missing_features = set(feature_names) - set(df.columns)
    if missing_features:
        logger.warning(f"Missing features in processed data: {missing_features}")

    # Check for extra features
    extra_features = set(df.columns) - set(feature_names + target_names)
    if extra_features:
        logger.warning(f"Extra features in processed data: {extra_features}")

    # Ensure correct column order and only include expected features
    expected_features = [f for f in feature_names if f in df.columns]
    return df[expected_features + [t for t in target_names if t in df.columns]]

def train_manufacturing_model(processed_data_path: str, model_output_path: str,
                              test_size=0.2, random_state=42) -> Dict:
    """
    Train the manufacturing model with preprocessed data.

    Args:
        processed_data_path (str): Path to processed data CSV.
        model_output_path (str): Path to save the model.
        test_size (float): Fraction of test data.
        random_state (int): Random seed.

    Returns:
        Dict: Evaluation metrics.
    """
    try:
        logger.info("Loading processed manufacturing data...")
        df = pd.read_csv(processed_data_path)

        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        
        # Load preprocessing artifacts
        preprocessor, feature_names, target_names = load_preprocessing_artifacts(project_root)
        logger.info(f"Loaded {len(feature_names)} features and {len(target_names)} targets")

        # Align features with expected preprocessing output
        df = align_features(df, feature_names, target_names)

        # Check if we have enough data to proceed
        if len(feature_names) == 0:
            logger.error("No features available for training")
            raise ValueError("No features available for training")

        if len(target_names) == 0:
            logger.error("No targets available for training")
            raise ValueError("No targets available for training")

        # Prepare data
        X = df[feature_names].values
        y = df[target_names].values

        logger.info("Splitting data into training and test sets...")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )

        logger.info("Initializing GradientBoostingRegressor...")
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
            mse = mean_squared_error(y_test[:, i], y_pred[:, i])
            rmse = np.sqrt(mse)
            mae = mean_absolute_error(y_test[:, i], y_pred[:, i])
            r2 = r2_score(y_test[:, i], y_pred[:, i])
            metrics[target] = {
                'RMSE': float(rmse),
                'MAE': float(mae),
                'R2': float(r2)
            }
            logger.info(f"Target: {target} → RMSE: {rmse:.4f}, MAE: {mae:.4f}, R²: {r2:.4f}")

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

        # Plot feature importance for all targets
        for i, target_name in enumerate(target_names):
            plot_feature_importance(model.estimators_[i], feature_names, target_name, model_output_path)

        # Save the model
        logger.info(f"Saving model to {model_output_path}...")
        os.makedirs(os.path.dirname(model_output_path), exist_ok=True)
        joblib.dump(model, model_output_path)

        # Save metrics
        metrics_path = os.path.join(os.path.dirname(model_output_path), 'manufacturing_model_metrics.json')
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
        metadata_path = os.path.join(os.path.dirname(model_output_path), 'manufacturing_model_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=4)

        logger.info("Training completed successfully.")
        return metrics

    except Exception as e:
        logger.error(f"Error during training: {e}")
        raise

def plot_feature_importance(model, feature_names, target_name, model_output_path):
    """Plot and save feature importance"""
    try:
        importance = model.feature_importances_
        indices = np.argsort(importance)[::-1]
        top_n = min(15, len(importance))
        indices = indices[:top_n]
        importance = importance[indices]
        names = [feature_names[i] for i in indices]

        plt.figure(figsize=(10, 6))
        plt.bar(range(len(importance)), importance)
        plt.xticks(range(len(importance)), names, rotation=45, ha="right")
        plt.title(f"Feature Importance for {target_name}")
        plt.tight_layout()

        plots_dir = os.path.join(os.path.dirname(model_output_path), 'plots')
        os.makedirs(plots_dir, exist_ok=True)
        plot_file = os.path.join(plots_dir, f'feature_importance_{target_name}.png')
        plt.savefig(plot_file, dpi=300)
        plt.close()
        logger.info(f"Feature importance saved to {plot_file}")
    except Exception as e:
        logger.error(f"Error plotting feature importance: {e}")

if __name__ == "__main__":
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    processed_data_path = os.path.join(project_root, 'data', 'processed', 'manufacturing_processed.csv')
    model_output_path = os.path.join(project_root, 'models', 'manufacturing_model.joblib')

    logger.info("Starting manufacturing model training...")
    try:
        metrics = train_manufacturing_model(processed_data_path, model_output_path)
        print("\n=== MANUFACTURING MODEL METRICS ===")
        for target, vals in metrics.items():
            if target != 'cross_validation':
                print(f"\n{target}:")
                for metric_name, value in vals.items():
                    print(f"  {metric_name}: {value:.4f}")
        print("\nTraining completed successfully.")
    except Exception as e:
        logger.error(f"Training failed: {e}")
        print(f"Training failed: {e}")