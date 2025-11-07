import os
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.multioutput import MultiOutputRegressor, MultiOutputClassifier
from sklearn.ensemble import GradientBoostingRegressor, RandomForestClassifier
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score, accuracy_score
from sklearn.model_selection import train_test_split, cross_val_score
import json
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def train_beneficiation_model(processed_data_path, model_output_dir, test_size=0.2, random_state=42):
    """
    Train separate regression and classification models for beneficiation stage.

    Parameters:
    processed_data_path (str): Path to the processed dataset
    model_output_dir (str): Directory to save models and metadata
    test_size (float): Test data proportion
    random_state (int): Random seed

    Returns:
    dict: Combined metrics for regression and classification
    """
    try:
        logger.info("Loading preprocessed beneficiation data...")
        df = pd.read_csv(processed_data_path)

        # Load feature and target names
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        feature_names_path = os.path.join(project_root, 'preprocessing', 'beneficiation_feature_names.joblib')
        target_names_path = os.path.join(project_root, 'preprocessing', 'beneficiation_target_names.joblib')

        feature_names = joblib.load(feature_names_path)
        target_names = joblib.load(target_names_path)
        
        logger.info(f"Loaded {len(feature_names)} features and {len(target_names)} targets")

        # Define regression and classification targets
        regression_targets = [t for t in target_names if t in ['beneficiation_water_m3_per_t_ore', 'beneficiation_electricity_kWh_per_t_ore']]
        classification_targets = [t for t in target_names if t not in regression_targets]

        logger.info(f"Regression targets: {regression_targets}")
        logger.info(f"Classification targets: {classification_targets}")

        # Prepare X, y
        X = df[feature_names].values
        y_reg = df[regression_targets].values if regression_targets else None
        y_clf = df[classification_targets].values if classification_targets else None

        # Split
        X_train, X_test = train_test_split(X, test_size=test_size, random_state=random_state)
        y_reg_train, y_reg_test = (None, None)
        y_clf_train, y_clf_test = (None, None)

        if regression_targets:
            y_reg_train, y_reg_test = train_test_split(y_reg, test_size=test_size, random_state=random_state)
        
        if classification_targets:
            y_clf_train, y_clf_test = train_test_split(y_clf, test_size=test_size, random_state=random_state)

        metrics = {}

        # ======= REGRESSION MODEL =======
        if regression_targets:
            logger.info("Training regression model...")
            reg_model = MultiOutputRegressor(GradientBoostingRegressor(
                n_estimators=150,
                learning_rate=0.1,
                max_depth=5,
                random_state=random_state,
                subsample=0.8,
                min_samples_split=5
            ))
            reg_model.fit(X_train, y_reg_train)
            y_reg_pred = reg_model.predict(X_test)

            metrics['regression'] = {}
            for i, target in enumerate(regression_targets):
                rmse = mean_squared_error(y_reg_test[:, i], y_reg_pred[:, i], squared=False)
                mae = mean_absolute_error(y_reg_test[:, i], y_reg_pred[:, i])
                r2 = r2_score(y_reg_test[:, i], y_reg_pred[:, i])
                metrics['regression'][target] = {
                    'RMSE': float(rmse),
                    'MAE': float(mae),
                    'R2': float(r2)
                }
                logger.info(f"Regression - {target}: RMSE={rmse:.3f}, MAE={mae:.3f}, R²={r2:.3f}")
            
            # Save regression model
            reg_model_path = os.path.join(model_output_dir, 'beneficiation_regressor.joblib')
            os.makedirs(model_output_dir, exist_ok=True)
            joblib.dump(reg_model, reg_model_path)
            logger.info(f"Saved regression model to {reg_model_path}")

        # ======= CLASSIFICATION MODEL =======
        if classification_targets:
            logger.info("Training classification model...")
            clf_model = MultiOutputClassifier(RandomForestClassifier(
                n_estimators=100,
                random_state=random_state
            ))
            clf_model.fit(X_train, y_clf_train)
            y_clf_pred = clf_model.predict(X_test)

            metrics['classification'] = {}
            for i, target in enumerate(classification_targets):
                acc = accuracy_score(y_clf_test[:, i], y_clf_pred[:, i])
                metrics['classification'][target] = {
                    'accuracy': float(acc)
                }
                logger.info(f"Classification - {target}: Accuracy={acc:.3f}")
            
            # Save classification model
            clf_model_path = os.path.join(model_output_dir, 'beneficiation_classifier.joblib')
            joblib.dump(clf_model, clf_model_path)
            logger.info(f"Saved classification model to {clf_model_path}")

        # ======= METADATA =======
        metadata = {
            'training_date': datetime.now().isoformat(),
            'regression_targets': regression_targets,
            'classification_targets': classification_targets,
            'dataset_size': len(df),
            'test_size': test_size,
            'random_state': random_state
        }
        metadata_path = os.path.join(model_output_dir, 'beneficiation_model_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=4)
        logger.info(f"Saved metadata to {metadata_path}")

        logger.info("Beneficiation model training completed successfully.")
        return metrics

    except Exception as e:
        logger.error(f"Model training error: {e}")
        raise

if __name__ == "__main__":
    print("Starting beneficiation model training...")
    try:
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        processed_data_path = os.path.join(project_root, 'data', 'processed', 'beneficiation_processed.csv')
        model_output_dir = os.path.join(project_root, 'models')
        metrics = train_beneficiation_model(processed_data_path, model_output_dir)
        
        print("\n=== BENEFICIATION MODEL TRAINING SUMMARY ===")
        for category, results in metrics.items():
            print(f"\n{category.upper()}:")
            for target, metric_values in results.items():
                print(f"\n  {target}:")
                for metric, value in metric_values.items():
                    print(f"    {metric}: {value:.4f}")
        
        print("\nModel training finished.")
    except Exception as e:
        print(f"ERROR: {e}")
        logger.error(f"Training failed: {e}")
        raise
