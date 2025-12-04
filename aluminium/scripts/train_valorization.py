import os
import joblib
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import logging
from datetime import datetime
from typing import Dict, List, Tuple, Any
from sklearn.multioutput import MultiOutputRegressor
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score, mean_absolute_percentage_error
from sklearn.pipeline import Pipeline
import warnings
warnings.filterwarnings('ignore')

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def load_preprocessing_artifacts(project_root: str) -> Tuple[Any, List[str], List[str], Dict]:
    """Load preprocessing objects safely with enhanced error handling.

    Returns (preprocessor, feature_names, target_names, metadata)
    """
    try:
        preprocessing_dir = os.path.join(project_root, 'preprocessing')

        preprocessor_path = os.path.join(preprocessing_dir, 'valorization_preprocessor.joblib')
        feature_names_path = os.path.join(preprocessing_dir, 'valorization_feature_names.joblib')
        target_names_path = os.path.join(preprocessing_dir, 'valorization_target_names.joblib')
        metadata_path = os.path.join(preprocessing_dir, 'valorization_metadata.joblib')

        if not all(os.path.exists(path) for path in [preprocessor_path, feature_names_path, target_names_path]):
            raise FileNotFoundError("Preprocessing artifacts not found. Run preprocessing first.")

        preprocessor = joblib.load(preprocessor_path)
        feature_names = joblib.load(feature_names_path)
        target_names = joblib.load(target_names_path)

        # Load metadata if available
        metadata = {}
        if os.path.exists(metadata_path):
            metadata = joblib.load(metadata_path)

        logger.info(f"Loaded {len(feature_names)} features and {len(target_names)} targets")
        return preprocessor, feature_names, target_names, metadata

    except Exception as e:
        logger.error(f"Error loading preprocessing artifacts: {e}")
        raise


def align_features(df: pd.DataFrame, feature_names: List[str], target_names: List[str],
                   metadata: Dict = None) -> pd.DataFrame:
    """Ensure DataFrame has expected feature columns with intelligent handling.

    If `metadata` is provided (saved preprocessing metadata), use it to choose safer
    defaults for missing features (binary vs numeric vs ordinal).
    """
    # Check for missing features
    missing_features = [f for f in feature_names if f not in df.columns]
    extra_features = [f for f in df.columns if f not in feature_names + target_names]

    if missing_features:
        logger.warning(f"Missing {len(missing_features)} features: {missing_features}")
        # Use metadata to choose defaults where possible
        bin_set = set(metadata.get('binary_columns', [])) if metadata else set()
        num_set = set(metadata.get('numeric_columns', [])) if metadata else set()
        ord_set = set(metadata.get('ordinal_columns', [])) if metadata else set()

        for feature in missing_features:
            if feature in bin_set:
                df[feature] = 0
            elif feature in ord_set:
                df[feature] = 'Not Applicable'
            elif feature in num_set:
                # No per-column median saved in metadata currently; use 0 as conservative fallback
                df[feature] = 0.0
            else:
                # Unknown type: default to 0
                df[feature] = 0

    if extra_features:
        logger.info(f"Dropping {len(extra_features)} extra columns: {extra_features}")
        df = df.drop(columns=extra_features)

    # Ensure correct order of features
    present_features = [f for f in feature_names if f in df.columns]
    present_targets = [t for t in target_names if t in df.columns]

    if not present_features:
        raise ValueError("No valid features found in dataset")

    return df[present_features + present_targets]


def train_valorization_model(processed_data_path: str, model_output_path: str,
                             test_size=0.2, random_state=42, use_grid_search=False) -> Dict:
    """Train the valorization model with enhanced capabilities."""
    try:
        logger.info("Loading processed data...")
        df = pd.read_csv(processed_data_path)

        # Check if data has targets
        if df.shape[0] < 10:
            logger.warning("Very small dataset - consider collecting more data")

        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        preprocessor, feature_names, target_names, metadata = load_preprocessing_artifacts(project_root)

        # Align features using metadata-aware defaults
        df = align_features(df, feature_names, target_names, metadata)

        X = df[feature_names].values
        y = df[target_names].values

        logger.info(f"Dataset shape: {X.shape}, Targets shape: {y.shape}")

        # Check for NaN or infinite values
        if np.isnan(X).any() or np.isinf(X).any():
            logger.warning("Data contains NaN or infinite values. Imputing...")
            X = np.nan_to_num(X)

        if np.isnan(y).any() or np.isinf(y).any():
            logger.warning("Targets contain NaN or infinite values. Imputing...")
            y = np.nan_to_num(y)

        logger.info("Splitting into train and test sets...")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, shuffle=True
        )

        logger.info("Initializing and training model...")

        # Base model configuration
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

        # Optional hyperparameter tuning
        if use_grid_search and X_train.shape[0] > 50:  # Only if enough data
            logger.info("Performing hyperparameter tuning...")
            param_grid = {
                'n_estimators': [100, 200],
                'learning_rate': [0.05, 0.1],
                'max_depth': [3, 4, 5],
                'subsample': [0.8, 0.9]
            }

            grid_search = GridSearchCV(
                base_model, param_grid, cv=min(3, X_train.shape[0]//10),
                scoring='neg_mean_squared_error', n_jobs=-1
            )

            # Train one target at a time for grid search
            tuned_estimators = []
            for i in range(y_train.shape[1]):
                logger.info(f"Tuning hyperparameters for target {i+1}/{y_train.shape[1]}")
                grid_search.fit(X_train, y_train[:, i])
                tuned_estimators.append(grid_search.best_estimator_)
                logger.info(f"Best params for {target_names[i]}: {grid_search.best_params_}")

            model = MultiOutputRegressor(Pipeline([('model', base_model)]))  # Wrap in pipeline
            model.estimators_ = tuned_estimators
        else:
            model = MultiOutputRegressor(base_model)
            model.fit(X_train, y_train)

        logger.info("Evaluating model...")
        y_pred = model.predict(X_test)
        metrics = {}

        for i, target in enumerate(target_names):
            # Compute RMSE without using the unsupported 'squared' argument for older sklearn
            rmse = np.sqrt(mean_squared_error(y_test[:, i], y_pred[:, i]))
            mae = mean_absolute_error(y_test[:, i], y_pred[:, i])
            r2 = r2_score(y_test[:, i], y_pred[:, i])

            # Handle MAPE carefully to avoid division by zero
            if np.all(y_test[:, i] != 0):
                mape = mean_absolute_percentage_error(y_test[:, i], y_pred[:, i])
            else:
                mape = float('nan')
                logger.warning(f"MAPE not calculable for {target} due to zero values")

            metrics[target] = {
                "RMSE": float(rmse),
                "MAE": float(mae),
                "R2": float(r2),
                "MAPE": float(mape) if not np.isnan(mape) else "N/A"
            }
            # Format MAPE safely because it may be NaN
            mape_str = f"{mape:.4f}" if not np.isnan(mape) else 'N/A'
            logger.info(f"{target}: RMSE={rmse:.4f}, MAE={mae:.4f}, R2={r2:.4f}, MAPE={mape_str}")

        logger.info("Running cross-validation...")
        cv_scores = {}
        for i, target in enumerate(target_names):
            try:
                scores = cross_val_score(
                    model.estimators_[i], X, y[:, i],
                    cv=min(5, X.shape[0]//5),  # Adaptive CV folds
                    scoring='neg_mean_squared_error',
                    n_jobs=-1
                )
                cv_rmse = np.sqrt(-scores.mean())
                cv_scores[target] = {
                    "RMSE": float(cv_rmse),
                    "Std": float(np.std(np.sqrt(-scores))),
                    "Scores": [float(np.sqrt(-score)) for score in scores]
                }
                logger.info(f"Cross-validated RMSE for {target}: {cv_rmse:.4f} ± {cv_scores[target]['Std']:.4f}")
            except Exception as e:
                logger.warning(f"CV failed for {target}: {e}")
                cv_scores[target] = {"RMSE": "N/A", "Std": "N/A", "Scores": []}

        metrics["cross_validation"] = cv_scores

        # Feature importance analysis
        feature_importance = {}
        for i, target in enumerate(target_names):
            if hasattr(model.estimators_[i], 'feature_importances_'):
                importance = model.estimators_[i].feature_importances_
                feature_importance[target] = {
                    feature: float(imp)
                    for feature, imp in zip(feature_names, importance)
                }

        # Save the model and artifacts
        logger.info(f"Saving model to {model_output_path}...")
        os.makedirs(os.path.dirname(model_output_path), exist_ok=True)

        # Create a bundle with model and feature names
        model_bundle = {
            'model': model,
            'feature_names': feature_names,
            'target_names': target_names,
            'preprocessor_metadata': metadata
        }

        joblib.dump(model_bundle, model_output_path, compress=('zlib', 3))

        # Save metrics
        metrics_path = os.path.join(os.path.dirname(model_output_path), "valorization_model_metrics.json")
        with open(metrics_path, 'w') as f:
            json.dump(metrics, f, indent=4)

        # Save feature importance
        if feature_importance:
            importance_path = os.path.join(os.path.dirname(model_output_path), "feature_importance.json")
            with open(importance_path, 'w') as f:
                json.dump(feature_importance, f, indent=4)

        # Save metadata
        metadata = {
            "training_date": datetime.now().isoformat(),
            "model_type": "GradientBoostingRegressor",
            "features": feature_names,
            "targets": target_names,
            "dataset_size": len(df),
            "test_size": test_size,
            "random_state": random_state,
            "preprocessing_metadata": metadata
        }

        metadata_path = os.path.join(os.path.dirname(model_output_path), "valorization_model_metadata.json")
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=4)

        # Create diagnostic plots
        try:
            plot_path = os.path.join(os.path.dirname(model_output_path), "diagnostic_plots")
            os.makedirs(plot_path, exist_ok=True)

            # Actual vs Predicted plots for each target
            for i, target in enumerate(target_names):
                plt.figure(figsize=(10, 6))
                plt.scatter(y_test[:, i], y_pred[:, i], alpha=0.5)
                plt.plot([y_test[:, i].min(), y_test[:, i].max()],
                         [y_test[:, i].min(), y_test[:, i].max()], 'r--')
                plt.xlabel('Actual')
                plt.ylabel('Predicted')
                plt.title(f'Actual vs Predicted: {target}')
                plt.savefig(os.path.join(plot_path, f'actual_vs_predicted_{target}.png'))
                plt.close()

            # Feature importance plots
            if feature_importance:
                for target, importance_dict in feature_importance.items():
                    plt.figure(figsize=(12, 8))
                    names = list(importance_dict.keys())
                    values = list(importance_dict.values())
                    # Show top 15 features only
                    indices = np.argsort(values)[-15:]
                    plt.barh(range(len(indices)), [values[i] for i in indices])
                    plt.yticks(range(len(indices)), [names[i] for i in indices])
                    plt.title(f'Feature Importance: {target}')
                    plt.tight_layout()
                    plt.savefig(os.path.join(plot_path, f'feature_importance_{target}.png'))
                    plt.close()

        except Exception as e:
            logger.warning(f"Could not create diagnostic plots: {e}")

        logger.info("Valorization model training completed successfully.")
        return metrics

    except Exception as e:
        logger.error(f"Training failed: {e}")
        raise


def predict_with_model(new_data: pd.DataFrame, model_path: str) -> pd.DataFrame:
    """Make predictions using a trained model."""
    try:
        # Load model bundle
        model_bundle = joblib.load(model_path)
        model = model_bundle['model']
        feature_names = model_bundle['feature_names']
        target_names = model_bundle['target_names']
        preproc_metadata = model_bundle.get('preprocessor_metadata', {}) or {}

        # Try to use the saved preprocessor if available for consistent transformation
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        preprocessor_path = os.path.join(project_root, 'preprocessing', 'valorization_preprocessor.joblib')
        if os.path.exists(preprocessor_path):
            try:
                preprocessor = joblib.load(preprocessor_path)
                # Build expected raw input order from metadata if present
                input_order = (preproc_metadata.get('numeric_columns', []) +
                               preproc_metadata.get('binary_columns', []) +
                               preproc_metadata.get('ordinal_columns', []))
                # Ensure input_order columns exist in new_data (fill sensible defaults)
                raw = new_data.copy()
                for col in input_order:
                    if col not in raw.columns:
                        if col in preproc_metadata.get('binary_columns', []):
                            raw[col] = 0
                        elif col in preproc_metadata.get('ordinal_columns', []):
                            raw[col] = 'Not Applicable'
                        else:
                            raw[col] = 0.0
                # Transform with the preprocessor (ColumnTransformer accepts DataFrame column names)
                X_proc = preprocessor.transform(raw[input_order])
                predictions = model.predict(X_proc)
            except Exception:
                logger.warning("Saved preprocessor could not be used, falling back to feature alignment")
                aligned_data = align_features(new_data, feature_names, [], preproc_metadata)
                predictions = model.predict(aligned_data.values)
        else:
            # Fallback: align to post-processed feature names and predict
            aligned_data = align_features(new_data, feature_names, [], preproc_metadata)
            predictions = model.predict(aligned_data.values)

        # Create result dataframe
        result_df = pd.DataFrame(predictions, columns=target_names)
        return result_df

    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise


if __name__ == "__main__":
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    processed_data_path = os.path.join(project_root, "data", "processed", "valorization_processed.csv")
    model_output_path = os.path.join(project_root, "models", "valorization_model.joblib")

    logger.info("Starting valorization model training...")
    try:
        metrics = train_valorization_model(
            processed_data_path,
            model_output_path,
            use_grid_search=True  # Enable hyperparameter tuning
        )

        print("\n=== Valorization Model Metrics ===")
        for target, vals in metrics.items():
            if target != "cross_validation":
                print(f"\n{target}:")
                for metric_name, value in vals.items():
                    if metric_name == "MAPE" and value == "N/A":
                        print(f"  {metric_name}: {value}")
                    else:
                        print(f"  {metric_name}: {value:.4f}")

        print("\nCross-validation results:")
        for target, vals in metrics.get("cross_validation", {}).items():
            if vals["RMSE"] != "N/A":
                print(f"{target}: RMSE={vals['RMSE']:.4f} ± {vals['Std']:.4f}")
            else:
                print(f"{target}: RMSE={vals['RMSE']}")

        print("\nTraining completed successfully.")

    except Exception as e:
        logger.error(f"Valorization model training failed: {e}")
        print(f"Valorization model training failed: {e}")