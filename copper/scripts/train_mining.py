#!/usr/bin/env python
"""
Train multi-output regression models for mining stage parameter prediction.

This script trains models to predict ANY missing mining parameters based on
the available inputs provided by users. It uses the preprocessed mining data
and metadata created by `preprocess_mining.py`.

Folders:
- data/raw        : original CSV
- data/processed  : mining_preprocessed.csv
- preprocessing   : mining_preprocessor.joblib + metadata
- models          : trained model + metadata
"""

import json
import warnings
from pathlib import Path
from typing import Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.multioutput import MultiOutputRegressor

warnings.filterwarnings("ignore")


# ---------------------------------------------------------------------
# utility
# ---------------------------------------------------------------------
def get_project_root() -> Path:
    """Get project root directory (parent of scripts/)."""
    return Path(__file__).resolve().parents[1]


def load_preprocessed_data(root: Path) -> Tuple[pd.DataFrame, Dict]:
    """Load preprocessed data and preprocessing metadata."""
    processed_path = root / "data" / "processed" / "mining_preprocessed.csv"
    metadata_path = root / "preprocessing" / "mining_preprocessing_metadata.json"

    if not processed_path.exists():
        raise FileNotFoundError(f"Preprocessed data not found at: {processed_path}")

    if not metadata_path.exists():
        raise FileNotFoundError(f"Metadata not found at: {metadata_path}")

    df = pd.read_csv(processed_path)

    with metadata_path.open("r") as f:
        metadata = json.load(f)

    print(f"Loaded preprocessed mining data: {df.shape[0]} samples, {df.shape[1]} columns")
    return df, metadata


# ---------------------------------------------------------------------
# data preparation
# ---------------------------------------------------------------------
def map_core_inputs_to_processed(
    df: pd.DataFrame,
    metadata: Dict,
) -> Tuple[List[str], List[str]]:
    """
    Build the list of processed feature columns (X) and target columns (y)
    based on the original core inputs & predictable outputs.

    We rely on the naming convention from ColumnTransformer.get_feature_names_out():

    - numeric   -> "num__<original_col>"
    - nominal   -> "nominal__<original_col>_<category>"
    - ordinal   -> "ordinal__<original_col>"
    """
    processed_features = metadata["processed_feature_names"]
    core_inputs: List[str] = metadata["core_input_features"]
    predictable_outputs: List[str] = metadata["predictable_outputs"]
    feature_types: Dict[str, List[str]] = metadata.get("feature_types", {})

    numeric_cols = set(feature_types.get("numeric", []))
    nominal_cols = set(feature_types.get("nominal_categorical", []))
    ordinal_cols = set(feature_types.get("ordinal_categorical", []))

    feature_cols: List[str] = []
    target_cols: List[str] = []

    # ---------- X: features derived from core input columns ----------
    for core in core_inputs:
        if core in numeric_cols:
            col_name = f"num__{core}"
            if col_name in df.columns:
                feature_cols.append(col_name)

        if core in nominal_cols:
            prefix = f"nominal__{core}_"
            cat_cols = [c for c in df.columns if c.startswith(prefix)]
            feature_cols.extend(cat_cols)

        if core in ordinal_cols:
            col_name = f"ordinal__{core}"
            if col_name in df.columns:
                feature_cols.append(col_name)

    # Remove duplicates while preserving order
    feature_cols = list(dict.fromkeys(feature_cols))

    # ---------- y: targets (numeric mining outputs to be predicted) ----------
    for target in predictable_outputs:
        col_name = f"num__{target}"
        if col_name in df.columns:
            target_cols.append(col_name)

    return feature_cols, target_cols


def prepare_training_data(
    df: pd.DataFrame,
    metadata: Dict,
) -> Tuple[pd.DataFrame, pd.DataFrame, List[str], List[str]]:
    """
    Prepare features (X) and targets (y) for training.

    Strategy:
    - Use processed features derived from core inputs as X
    - Use processed numeric versions of predictable outputs as y
    """
    print("\n=== PREPARING TRAINING DATA ===")

    # Drop plant_id if present (it's just an identifier)
    if "plant_id" in df.columns:
        df = df.drop(columns=["plant_id"])

    feature_cols, target_cols = map_core_inputs_to_processed(df, metadata)

    print(f"Core inputs (original):  {len(metadata['core_input_features'])}")
    print(f"Predictable outputs (original): {len(metadata['predictable_outputs'])}")
    print(f"Processed feature columns (X):  {len(feature_cols)}")
    print(f"Processed target columns (y):   {len(target_cols)}")

    if not feature_cols:
        raise ValueError(
            "No feature columns were mapped. "
            "Check that your preprocess_mining.py metadata has correct "
            "numeric/nominal/ordinal feature lists and that the column "
            "prefixes (num__/nominal__/ordinal__) match this script."
        )

    if not target_cols:
        raise ValueError(
            "No target columns were mapped. "
            "Make sure 'predictable_outputs' in metadata are numeric "
            "and that their processed names (num__<col>) exist in the "
            "preprocessed CSV."
        )

    # Ensure columns exist
    missing_features = [c for c in feature_cols if c not in df.columns]
    missing_targets = [c for c in target_cols if c not in df.columns]

    if missing_features:
        print(f"⚠️ Warning: some feature columns missing in preprocessed data: {missing_features}")
        feature_cols = [c for c in feature_cols if c in df.columns]

    if missing_targets:
        print(f"⚠️ Warning: some target columns missing in preprocessed data: {missing_targets}")
        target_cols = [c for c in target_cols if c in df.columns]

    X = df[feature_cols].copy()
    y = df[target_cols].copy()

    print("\nFinal shapes:")
    print(f"  X (features): {X.shape}")
    print(f"  y (targets):  {y.shape}")

    return X, y, feature_cols, target_cols


# ---------------------------------------------------------------------
# evaluation
# ---------------------------------------------------------------------
def evaluate_model(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    target_names: List[str],
) -> Dict:
    """Evaluate model performance with multiple metrics."""
    metrics: Dict = {}

    metrics["overall"] = {
        "mae": float(mean_absolute_error(y_true, y_pred)),
        "rmse": float(np.sqrt(mean_squared_error(y_true, y_pred))),
        "r2": float(r2_score(y_true, y_pred)),
    }

    metrics["per_target"] = {}
    for i, target in enumerate(target_names):
        metrics["per_target"][target] = {
            "mae": float(mean_absolute_error(y_true[:, i], y_pred[:, i])),
            "rmse": float(np.sqrt(mean_squared_error(y_true[:, i], y_pred[:, i])),
                         ),
            "r2": float(r2_score(y_true[:, i], y_pred[:, i])),
        }

    return metrics


# ---------------------------------------------------------------------
# model training
# ---------------------------------------------------------------------
def train_models(
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
    y_train: pd.DataFrame,
    y_test: pd.DataFrame,
    target_names: List[str],
) -> Dict:
    """Train multiple models and compare performance."""
    results: Dict = {}

    print("\n" + "=" * 60)
    print("TRAINING MODELS")
    print("=" * 60)

    # ----- Model 1: RandomForest -----
    print("\n1. Training Random Forest Regressor...")
    rf_model = MultiOutputRegressor(
        RandomForestRegressor(
            n_estimators=200,
            max_depth=None,
            min_samples_split=4,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        )
    )
    rf_model.fit(X_train, y_train)
    rf_pred = rf_model.predict(X_test)
    rf_metrics = evaluate_model(y_test.values, rf_pred, target_names)

    results["random_forest"] = {"model": rf_model, "metrics": rf_metrics}
    print(
        f"   ✅ Random Forest - R²: {rf_metrics['overall']['r2']:.4f}, "
        f"RMSE: {rf_metrics['overall']['rmse']:.4f}"
    )

    # ----- Model 2: Gradient Boosting -----
    print("\n2. Training Gradient Boosting Regressor...")
    gb_model = MultiOutputRegressor(
        GradientBoostingRegressor(
            n_estimators=200,
            max_depth=3,
            learning_rate=0.05,
            min_samples_split=4,
            min_samples_leaf=2,
            random_state=42,
        )
    )
    gb_model.fit(X_train, y_train)
    gb_pred = gb_model.predict(X_test)
    gb_metrics = evaluate_model(y_test.values, gb_pred, target_names)

    results["gradient_boosting"] = {"model": gb_model, "metrics": gb_metrics}
    print(
        f"   ✅ Gradient Boosting - R²: {gb_metrics['overall']['r2']:.4f}, "
        f"RMSE: {gb_metrics['overall']['rmse']:.4f}"
    )

    return results


def select_best_model(results: Dict) -> Tuple[str, Dict]:
    """Select the best model based on R² score."""
    best_name = None
    best_r2 = -float("inf")

    for name, result in results.items():
        r2 = result["metrics"]["overall"]["r2"]
        if r2 > best_r2:
            best_r2 = r2
            best_name = name

    return best_name, results[best_name]


def save_model_artifacts(
    model,
    metrics: Dict,
    model_name: str,
    feature_names: List[str],
    target_names: List[str],
    root: Path,
):
    """Save trained model and metadata."""
    models_dir = root / "models"
    models_dir.mkdir(parents=True, exist_ok=True)

    model_path = models_dir / "mining_model.joblib"
    joblib.dump(model, model_path)
    print(f"\n✅ Saved model to: {model_path}")

    model_metadata = {
        "model_type": model_name,
        "feature_names": feature_names,
        "target_names": target_names,
        "n_features": len(feature_names),
        "n_targets": len(target_names),
        "metrics": metrics,
        "training_info": {
            "description": "Multi-output regression model for mining parameter prediction",
            "approach": (
                "Predicts missing mining outputs from core input features. "
                "Trained on preprocessed (scaled/encoded) features."
            ),
        },
    }

    metadata_path = models_dir / "mining_model_metadata.json"
    with metadata_path.open("w") as f:
        json.dump(model_metadata, f, indent=2)
    print(f"✅ Saved model metadata to: {metadata_path}")


def print_detailed_metrics(metrics: Dict, target_names: List[str]):
    """Nicely print detailed performance metrics."""
    print("\n" + "=" * 60)
    print("DETAILED PERFORMANCE METRICS")
    print("=" * 60)

    print("\nOverall Performance:")
    print(f"  R² Score:  {metrics['overall']['r2']:.4f}")
    print(f"  RMSE:      {metrics['overall']['rmse']:.4f}")
    print(f"  MAE:       {metrics['overall']['mae']:.4f}")

    print("\nPer-Target Performance:")
    print("-" * 60)
    print(f"{'Target (raw column)':<55} {'R²':>6}")
    print("-" * 60)

    for target, target_metrics in metrics["per_target"].items():
        # target is like "num__mining_ghg_kgCO2e_per_t_ore"
        raw_name = target.replace("num__", "")
        short_name = raw_name
        if len(short_name) > 52:
            short_name = short_name[:49] + "..."
        print(f"{short_name:<55} {target_metrics['r2']:>6.4f}")

    print("-" * 60)


# ---------------------------------------------------------------------
# main
# ---------------------------------------------------------------------
def main():
    root = get_project_root()

    print("=" * 60)
    print("MINING STAGE MODEL TRAINING")
    print("=" * 60)
    print(f"Project root: {root}")

    # 1) Load data
    print("\n1. Loading preprocessed data & metadata...")
    df, metadata = load_preprocessed_data(root)

    # 2) Prepare training data
    print("\n2. Preparing training data...")
    X, y, feature_names, target_names = prepare_training_data(df, metadata)

    # 3) Train/test split
    print("\n3. Splitting data (80% train / 20% test)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"   Train set: {len(X_train)} samples")
    print(f"   Test set:  {len(X_test)} samples")

    # 4) Train models
    print("\n4. Training models...")
    results = train_models(X_train, X_test, y_train, y_test, target_names)

    # 5) Select best model
    print("\n5. Selecting best model...")
    best_name, best_result = select_best_model(results)
    print(f"   🏆 Best model: {best_name.replace('_', ' ').title()}")

    # 6) Detailed metrics
    print_detailed_metrics(best_result["metrics"], target_names)

    # 7) Save artifacts
    print("\n6. Saving model artifacts...")
    save_model_artifacts(
        model=best_result["model"],
        metrics=best_result["metrics"],
        model_name=best_name,
        feature_names=feature_names,
        target_names=target_names,
        root=root,
    )

    print("\n" + "=" * 60)
    print("TRAINING SUMMARY")
    print("=" * 60)
    print(f"✅ Best Model: {best_name.replace('_', ' ').title()}")
    print(f"✅ Overall R²: {best_result['metrics']['overall']['r2']:.4f}")
    print(f"✅ Overall RMSE: {best_result['metrics']['overall']['rmse']:.4f}")
    print(f"✅ Targets predicted: {len(target_names)}")
    print(f"✅ Input features:    {len(feature_names)}")
    print("\nModel is ready to be used for mining parameter inference.")
    print("=" * 60)


if __name__ == "__main__":
    main()
