import os
import joblib
import pandas as pd
import numpy as np
from typing import Tuple, List
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, OrdinalEncoder
from sklearn.compose import ColumnTransformer
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def preprocess_smelting_data(input_path: str, output_path: str, save_encoders: bool = True) -> Tuple[pd.DataFrame, ColumnTransformer]:
    """
    Preprocess smelting data for LCA modeling with proper feature/target separation.

    Args:
        input_path (str): Path to raw dataset CSV file
        output_path (str): Path to save processed dataset CSV file
        save_encoders (bool): Whether to save preprocessing objects

    Returns:
        Tuple[pd.DataFrame, ColumnTransformer]: Processed DataFrame and fitted preprocessor
    """
    try:
        logger.info(f"Loading raw smelting data from {input_path}...")
        df = pd.read_csv(input_path)

        # Define target columns (aligned with CSV header)
        target_cols = [
            'smelting_energy_kWh_per_t_al',
            'smelting_energy_MJ_per_t_al',
            'smelting_co2_kg_per_t_al',
            'smelting_pfc_kg_per_t_al',
            'smelting_so2_kg_per_t_al',
            'smelting_nox_kg_per_t_al',
            'smelting_fluoride_recovery_%',
            'smelting_thermal_recovery_%'
        ]

        # Use variant columns as binary features
        variant_cols = [
            'smelting_variant_Pre_baked_anodes',
            'smelting_variant_Soderberg_anodes',
            'smelting_variant_Inert_anodes_exp',
            'smelting_variant_Renewable_powered',
            'smelting_variant_Dynamic_load_mgmt'
        ]

        other_feature_cols = ['location', 'year']

        feature_cols = variant_cols + other_feature_cols

        # Keep only existing columns
        existing_feature_cols = [col for col in feature_cols if col in df.columns]
        existing_target_cols = [col for col in target_cols if col in df.columns]

        # Separate features and targets
        X = df[existing_feature_cols].copy()
        y = df[existing_target_cols].copy() if existing_target_cols else None

        logger.info(f"Processing {len(existing_feature_cols)} feature columns")
        logger.info(f"Processing {len(existing_target_cols)} target columns")

        # Process binary variant columns
        binary_cols = [col for col in variant_cols if col in X.columns]
        for col in binary_cols:
            X[col] = X[col].fillna(0)
            if X[col].dtype == object:
                X[col] = X[col].astype(str).str.strip().str.lower().map({
                    '1': 1, '0': 0, 'true': 1, 'false': 0, 'yes': 1, 'no': 0, 'y': 1, 'n': 0,
                    'on': 1, 'off': 0, 'enabled': 1, 'disabled': 0
                }).fillna(0)
            X[col] = pd.to_numeric(X[col], errors='coerce').fillna(0).astype(int)

        # Categorize feature types for preprocessing
        numeric_features = [col for col in X.columns if col == 'year']
        categorical_features = [col for col in X.columns if col == 'location']
        binary_features = [col for col in binary_cols if col in X.columns]

        remainder_features = [col for col in X.columns if col not in numeric_features + categorical_features + binary_features]
        if remainder_features:
            logger.warning(f"Uncategorized features found: {remainder_features}")

        # Imputation strategies
        numeric_imputer = SimpleImputer(strategy='median')
        categorical_imputer = SimpleImputer(strategy='most_frequent')

        # Define transformers
        numeric_transformer = Pipeline([
            ('imputer', numeric_imputer),
            ('scaler', StandardScaler())
        ])

        categorical_transformer = Pipeline([
            ('imputer', categorical_imputer),
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])

        binary_transformer = Pipeline([
            ('imputer', SimpleImputer(strategy='most_frequent'))
        ])

        # Build transformers list
        transformers = []
        if numeric_features:
            transformers.append(('num', numeric_transformer, numeric_features))
        if categorical_features:
            transformers.append(('cat', categorical_transformer, categorical_features))
        if binary_features:
            transformers.append(('binary', binary_transformer, binary_features))

        preprocessor = ColumnTransformer(
            transformers=transformers,
            remainder='passthrough'
        )

        logger.info("Fitting and transforming data...")
        X_processed = preprocessor.fit_transform(X)

        # Get feature names
        all_feature_names: List[str] = []
        if numeric_features:
            all_feature_names.extend(numeric_features)
        if categorical_features:
            onehot = preprocessor.named_transformers_.get('cat')
            if onehot is not None:
                cat_names = onehot.named_steps['onehot'].get_feature_names_out(categorical_features)
                all_feature_names.extend(list(cat_names))
        if binary_features:
            all_feature_names.extend(binary_features)

        # Add remainder features if any
        all_feature_names.extend(remainder_features)

        # Create processed DataFrame
        processed_df = pd.DataFrame(X_processed, columns=all_feature_names)

        # Add target columns if they exist
        if y is not None:
            for col in y.columns:
                processed_df[col] = y[col].values

        logger.info(f"Saving processed data to {output_path}...")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        processed_df.to_csv(output_path, index=False)

        if save_encoders:
            project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
            encoder_dir = os.path.join(project_root, 'preprocessing')
            os.makedirs(encoder_dir, exist_ok=True)

            joblib.dump(preprocessor, os.path.join(encoder_dir, 'smelting_preprocessor.joblib'))
            joblib.dump(all_feature_names, os.path.join(encoder_dir, 'smelting_feature_names.joblib'))
            joblib.dump(existing_target_cols, os.path.join(encoder_dir, 'smelting_target_names.joblib'))

            logger.info("Saved preprocessor and feature/target names.")

        logger.info("Smelting preprocessing complete.")
        return processed_df, preprocessor

    except Exception as e:
        logger.error(f"Error in smelting preprocessing: {e}")
        raise

def validate_preprocessing(input_path: str, processed_path: str) -> bool:
    """
    Validate that preprocessing was successful.
    """
    try:
        original_df = pd.read_csv(input_path)
        processed_df = pd.read_csv(processed_path)
        
        # Check row count consistency
        if len(original_df) != len(processed_df):
            logger.error(f"Row count mismatch: original={len(original_df)}, processed={len(processed_df)}")
            return False
            
        # Check column count is reasonable
        if len(processed_df.columns) < 5:
            logger.error(f"Too few columns in processed data: {len(processed_df.columns)}")
            return False
            
        # Check for NaN values in processed data
        nan_count = processed_df.isna().sum().sum()
        if nan_count > 0:
            logger.warning(f"Found {nan_count} NaN values in processed data")
            
        logger.info("Validation passed")
        return True
        
    except Exception as e:
        logger.error(f"Validation failed: {e}")
        return False

if __name__ == "__main__":
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    raw_path = os.path.join(project_root, 'data', 'raw', 'comprehensive_aluminium_lca_dataset_INDIA.csv')
    processed_path = os.path.join(project_root, 'data', 'processed', 'smelting_processed.csv')

    logger.info("Starting smelting preprocessing...")
    try:
        processed_df, preprocessor = preprocess_smelting_data(raw_path, processed_path)
        
        if validate_preprocessing(raw_path, processed_path):
            logger.info("Smelting preprocessing completed successfully.")
        else:
            logger.warning("Smelting preprocessing completed with warnings.")
            
    except Exception as e:
        logger.error(f"Smelting preprocessing failed: {e}")