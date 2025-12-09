#!/usr/bin/env python
"""
Enhanced preprocessing for mining stage data for copper LCA.
Includes ALL parameters from the mining stage requirements.
"""

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler, OrdinalEncoder


def get_project_root() -> Path:
    return Path(__file__).resolve().parents[1]


def main():
    root = get_project_root()

    raw_path = root / "data" / "raw" / "comprehensive_copper_lca_dataset_INDIA_realistic.csv"
    processed_dir = root / "data" / "processed"
    artifacts_dir = root / "preprocessing"

    processed_dir.mkdir(parents=True, exist_ok=True)
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    print(f"Project root:       {root}")
    print(f"Raw data path:      {raw_path}")

    # ---------- 1. Load raw data ----------
    if not raw_path.exists():
        raise FileNotFoundError(f"Raw data file not found at: {raw_path}")

    df = pd.read_csv(raw_path)
    print(f"Raw dataset shape: {df.shape}")

    # ---------- 2. Define ALL mining parameters ----------
    # These are ALL the mining columns - any could be missing and need prediction

    # Core input features (users most likely to have these)
    core_input_cols = [
        "location_state",                        # Region
        "year",                                  # Year
        "grid_carbon_intensity_kgCO2_per_kWh",   # Grid carbon intensity
        "mining_method",                         # Mining method
        "mining_ore_type",                       # Ore type
        "mining_ore_grade_%Cu",                  # Ore grade
        "mining_equipment_type",                 # Equipment type
        "mining_mine_production_t_per_day",      # Production capacity
        "mining_water_source",                   # Water source
        "mining_amd_risk",                       # AMD risk
    ]

    # Parameters that users might be missing (targets for prediction)
    predictable_outputs = [
        "mining_overburden_waste_rock_ratio_m3_per_t_ore",
        "mining_average_haul_distance_km",
        "mining_water_consumption_m3_per_t_ore",
        "mining_fuel_consumption_L_diesel_per_t_ore",
        "mining_electricity_consumption_kWh_per_t_ore",
        "mining_dust_emissions_PM10_kg_per_t_ore",
        "mining_land_disturbed_m2_per_t_ore",
        "mining_explosives_used_kg_ANFO_per_t_ore",
        "mining_tailings_and_waste_t_per_t_Cu",
        "mining_ghg_kgCO2e_per_t_ore",
        "mining_ghg_kgCO2e_per_t_ore_min",
        "mining_ghg_kgCO2e_per_t_ore_max",
        "mining_ghg_confidence",
    ]

    # All mining columns
    all_mining_cols = core_input_cols + predictable_outputs

    # Check which columns exist in the dataset
    existing_cols = [col for col in all_mining_cols if col in df.columns]
    missing_cols = [col for col in all_mining_cols if col not in df.columns]

    print(f"\n=== COLUMN AVAILABILITY ===")
    print(f"Found {len(existing_cols)}/{len(all_mining_cols)} mining columns in dataset")
    if missing_cols:
        print(f"Missing columns: {missing_cols}")

    # Filter to existing columns
    core_input_cols = [col for col in core_input_cols if col in df.columns]
    predictable_outputs = [col for col in predictable_outputs if col in df.columns]

    print(f"\nCore inputs: {len(core_input_cols)}")
    print(f"Predictable outputs: {len(predictable_outputs)}")

    # Keep all data - don't drop rows with missing values
    X = df[existing_cols].copy()

    print(f"\nTotal samples: {X.shape[0]}")
    print(f"Total mining parameters: {X.shape[1]}")

    # ---------- 3. Identify column types ----------

    # Categorical columns (nominal - no inherent order)
    nominal_categorical = [
        "location_state",
        "mining_method",
        "mining_ore_type",
        "mining_equipment_type",
        "mining_water_source",
    ]

    # Ordinal columns (have inherent order)
    ordinal_categorical = [
        "mining_amd_risk",  # Low < Medium < High
    ]

    # Remove any that don't exist in X
    nominal_categorical = [c for c in nominal_categorical if c in X.columns]
    ordinal_categorical = [c for c in ordinal_categorical if c in X.columns]

    # All categorical columns
    categorical_cols = nominal_categorical + ordinal_categorical

    # Numeric columns (everything else)
    numeric_cols = [c for c in existing_cols if c not in categorical_cols]

    print(f"Nominal categorical features ({len(nominal_categorical)}): {nominal_categorical}")
    print(f"Ordinal categorical features ({len(ordinal_categorical)}): {ordinal_categorical}")
    print(f"Numeric features ({len(numeric_cols)}): {numeric_cols}")

    # ---------- 4. Build preprocessing pipeline ----------
    # This pipeline will handle encoding/scaling for ALL columns

    # Define order for ordinal features
    ordinal_mappings = {}
    if "mining_amd_risk" in X.columns:
        ordinal_mappings["mining_amd_risk"] = ["Low", "Medium", "High"]

    # ---------- 5. Build preprocessing transformers ----------

    # Numeric pipeline: median imputation + standard scaling
    numeric_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    # Nominal categorical pipeline: most_frequent imputation + one-hot encoding
    nominal_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )

    # Ordinal categorical pipeline: most_frequent imputation + ordinal encoding
    if ordinal_categorical:
        ordinal_transformer = Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="most_frequent")),
                ("ordinal", OrdinalEncoder(
                    categories=[ordinal_mappings.get(col, sorted(X[col].dropna().unique()))
                               for col in ordinal_categorical],
                    handle_unknown="use_encoded_value",
                    unknown_value=-1,
                )),
            ]
        )
    else:
        ordinal_transformer = None

    # Combine all transformers
    transformers = [("num", numeric_transformer, numeric_cols)]

    if nominal_categorical:
        transformers.append(("nominal", nominal_transformer, nominal_categorical))

    if ordinal_categorical and ordinal_transformer:
        transformers.append(("ordinal", ordinal_transformer, ordinal_categorical))

    preprocessor = ColumnTransformer(
        transformers=transformers,
        remainder="drop",
    )

    full_pipeline = Pipeline(steps=[("preprocessor", preprocessor)])

    # ---------- 6. Fit & transform ----------

    print("\n" + "=" * 60)
    print("Fitting preprocessing pipeline on ALL mining parameters...")
    print("=" * 60)

    X_processed = full_pipeline.fit_transform(X)
    print(f"Processed feature matrix shape: {X_processed.shape}")

    # Get feature names after transformation
    preproc_step = full_pipeline.named_steps["preprocessor"]
    try:
        out_feature_names = preproc_step.get_feature_names_out()
    except AttributeError:
        # Fallback for older sklearn
        feature_names = list(numeric_cols)

        if nominal_categorical:
            cat_ohe = preproc_step.named_transformers_["nominal"].named_steps["onehot"]
            cat_names = cat_ohe.get_feature_names_out(nominal_categorical)
            feature_names.extend(cat_names)

        if ordinal_categorical:
            feature_names.extend(ordinal_categorical)

        out_feature_names = np.array(feature_names)

    # Create DataFrame with processed features
    mining_preprocessed = pd.DataFrame(X_processed, columns=out_feature_names, index=df.index)

    # Add plant_id for tracking if available
    if "plant_id" in df.columns:
        mining_preprocessed.insert(0, "plant_id", df["plant_id"].values)

    print(f"Final preprocessed dataset shape: {mining_preprocessed.shape}")

    # ---------- 7. Data quality report ----------

    print("\n" + "=" * 60)
    print("DATA QUALITY REPORT")
    print("=" * 60)

    print("\nMissing values in ORIGINAL data:")
    missing_counts = X.isnull().sum()
    missing_pct = (missing_counts / len(X) * 100).round(2)
    missing_df = pd.DataFrame({
        "Column": missing_counts.index,
        "Missing Count": missing_counts.values,
        "Missing %": missing_pct.values,
    })
    missing_df = missing_df[missing_df["Missing Count"] > 0].sort_values(
        "Missing Count", ascending=False
    )

    if len(missing_df) > 0:
        print(missing_df.to_string(index=False))
        print(f"\nColumns with missing values: {len(missing_df)}/{len(X.columns)}")
    else:
        print("  ✅ No missing values found")

    print("\nCategorical feature distributions:")
    for cat_feat in categorical_cols:
        if cat_feat in X.columns:
            print(f"\n  {cat_feat}:")
            value_counts = X[cat_feat].value_counts()
            for val, count in value_counts.items():
                pct = (count / len(X) * 100)
                print(f"    - {val}: {count} ({pct:.1f}%)")

    # ---------- 8. Save outputs ----------

    print("\n" + "=" * 60)
    print("SAVING ARTIFACTS")
    print("=" * 60)

    preprocessed_csv_path = processed_dir / "mining_preprocessed.csv"
    mining_preprocessed.to_csv(preprocessed_csv_path, index=False)
    print(f"✅ Saved preprocessed data to:\n   {preprocessed_csv_path}")

    preprocessor_path = artifacts_dir / "mining_preprocessor.joblib"
    joblib.dump(full_pipeline, preprocessor_path)
    print(f"✅ Saved preprocessor pipeline to:\n   {preprocessor_path}")

    # Save comprehensive metadata
    metadata = {
        "description": "Mining stage preprocessing for copper LCA - predicting missing parameters",
        "approach": "All mining parameters can be inputs OR outputs depending on what user provides",
        "core_input_features": core_input_cols,
        "predictable_outputs": predictable_outputs,
        "all_mining_columns": existing_cols,
        "feature_types": {
            "numeric": numeric_cols,
            "nominal_categorical": nominal_categorical,
            "ordinal_categorical": ordinal_categorical,
        },
        "ordinal_mappings": ordinal_mappings,
        "processed_feature_names": list(out_feature_names),
        "n_samples": int(X.shape[0]),
        "n_original_features": len(existing_cols),
        "n_processed_features": len(out_feature_names),
        "categorical_encodings": {},
    }

    # Store categorical mappings
    if nominal_categorical:
        cat_transformer = full_pipeline.named_steps["preprocessor"].named_transformers_["nominal"]
        cat_encoder = cat_transformer.named_steps["onehot"]
        for i, cat_feat in enumerate(nominal_categorical):
            categories = cat_encoder.categories_[i].tolist()
            metadata["categorical_encodings"][cat_feat] = categories

    if ordinal_categorical:
        for col, mapping in ordinal_mappings.items():
            metadata["categorical_encodings"][col] = mapping

    metadata_path = artifacts_dir / "mining_preprocessing_metadata.json"
    with metadata_path.open("w") as f:
        json.dump(metadata, f, indent=2)
    print(f"✅ Saved metadata to:\n   {metadata_path}")

    # ---------- 9. Summary ----------

    print("\n" + "=" * 60)
    print("PREPROCESSING SUMMARY")
    print("=" * 60)
    print(f"✅ Preprocessed {X.shape[0]} mining records")
    print(f"✅ Original features: {len(existing_cols)}")
    print(f"✅ Processed features: {len(out_feature_names)} (after encoding)")
    print(f"✅ Core inputs (user typically provides): {len(core_input_cols)}")
    print(f"✅ Predictable outputs (can be estimated): {len(predictable_outputs)}")
    print("\n📊 Next steps:")
    print("  1. Train multi-output models to predict ANY missing parameter")
    print("  2. Use core inputs as features when available")
    print("  3. Predict missing outputs (fuel, electricity, GHG, water, etc.)")
    print("  4. Handle partial data from users flexibly")
    print("\n" + "=" * 60)
    print("✅ Mining preprocessing completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()
