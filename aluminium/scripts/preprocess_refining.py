import os
import joblib
import pandas as pd
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, OrdinalEncoder
from sklearn.compose import ColumnTransformer
import logging
from typing import Tuple, List

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def preprocess_refining_data(input_path: str, output_path: str, save_encoders: bool = True) -> Tuple[pd.DataFrame, ColumnTransformer]:
    """
    Preprocess refining data for LCA modeling with error handling and proper feature engineering.

    Parameters:
    input_path (str): Path to raw dataset CSV file
    output_path (str): Path to save processed dataset CSV file
    save_encoders (bool): Whether to save preprocessing objects for inference

    Returns:
    pd.DataFrame: Processed dataset ready for modeling
    ColumnTransformer: The preprocessing pipeline object
    """
    try:
        logger.info(f"Loading raw refining data from {input_path}...")
        df = pd.read_csv(input_path)
        
        # Define target columns that should be predicted (not used as features)
        target_cols = [
            'refining_energy_MJ_per_t_alumina',
            'refining_water_m3_per_t_alumina',
            'refining_red_mud_kg_per_t_alumina',
            'refining_caustic_soda_kg_per_t_alumina',
            'refining_lime_kg_per_t_alumina',
            'refining_so2_kg_per_t_alumina',
            'refining_nox_kg_per_t_alumina',
            'refining_dust_kg_per_t_alumina'
        ]

        # Define feature columns
        process_cols = [
            'refining_process_Crushing',
            'refining_process_Digestion',
            'refining_process_Clarification',
            'refining_process_Precipitation',
            'refining_process_Calcination'
        ]
        
        variant_cols = [
            'refining_variant_High_pressure_digestion',
            'refining_variant_Multi_stage_clarification',
            'refining_variant_Heat_recovery_loops',
            'refining_variant_Green_additives',
            'refining_variant_Automation_sensors'
        ]
        
        # Other numeric features (not targets)
        other_numeric_cols = [
            'refining_digestion_temperature_C',
            'refining_digestion_pressure_bar',
            'refining_caustic_concentration_gL',
            'refining_process_intensity_factor',
            'refining_tech_improvement_factor',
            'refining_operational_variability'
        ]
        
        categorical_cols = ['location']
        ordinal_cols = ['toxicity_Red_Mud']
        
        # Combine all feature columns
        feature_cols = process_cols + variant_cols + other_numeric_cols + categorical_cols + ordinal_cols
        
        # Keep only existing columns
        existing_feature_cols = [col for col in feature_cols if col in df.columns]
        existing_target_cols = [col for col in target_cols if col in df.columns]
        
        # Separate features and targets
        X = df[existing_feature_cols].copy()
        y = df[existing_target_cols].copy() if existing_target_cols else None
        
        logger.info(f"Processing {len(existing_feature_cols)} feature columns")
        logger.info(f"Processing {len(existing_target_cols)} target columns")

        # Ensure binary columns are integers (robust to NaN and common string values)
        binary_cols = [col for col in process_cols + variant_cols if col in X.columns]
        for col in binary_cols:
            # fill missing with 0, map common string values, then coerce to numeric and int
            X[col] = X[col].fillna(0)
            if X[col].dtype == object:
                X[col] = X[col].astype(str).str.strip().str.lower().map({
                    '1': 1, '0': 0, 'true': 1, 'false': 0, 'yes': 1, 'no': 0, 'y': 1, 'n': 0
                }).fillna(X[col])
            X[col] = pd.to_numeric(X[col], errors='coerce').fillna(0).astype(int)

        # Imputation strategies
        numeric_imputer = SimpleImputer(strategy='median')
        categorical_imputer = SimpleImputer(strategy='most_frequent')

        # Ordinal categories for toxicity
        ordinal_categories = [['Low', 'Moderate', 'High']]

        # Pipelines
        numeric_transformer = Pipeline([
            ('imputer', numeric_imputer),
            ('scaler', StandardScaler())
        ])

        categorical_transformer = Pipeline([
            ('imputer', categorical_imputer),
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])

        ordinal_transformer = Pipeline([
            ('imputer', categorical_imputer),
            ('ordinal', OrdinalEncoder(categories=ordinal_categories))
        ])

        binary_transformer = Pipeline([
            ('imputer', SimpleImputer(strategy='most_frequent'))
        ])

        logger.info("Combining transformers...")
        transformers = []
        
        # Add transformers only if the corresponding columns exist
        numeric_features = [col for col in other_numeric_cols if col in existing_feature_cols]
        if numeric_features:
            transformers.append(('num', numeric_transformer, numeric_features))
            
        categorical_features = [col for col in categorical_cols if col in existing_feature_cols]
        if categorical_features:
            transformers.append(('cat', categorical_transformer, categorical_features))
            
        ordinal_features = [col for col in ordinal_cols if col in existing_feature_cols]
        if ordinal_features:
            transformers.append(('ord', ordinal_transformer, ordinal_features))
            
        binary_features = [col for col in binary_cols if col in existing_feature_cols]
        if binary_features:
            transformers.append(('binary', binary_transformer, binary_features))

        preprocessor = ColumnTransformer(
            transformers=transformers, 
            remainder='passthrough'
        )

        logger.info("Fitting and transforming data...")
        X_processed = preprocessor.fit_transform(X)

        # sanity: ensure X_processed is 2D
        if X_processed.ndim == 1:
            X_processed = X_processed.reshape(-1, 1)

        # Get feature names
        all_feature_names = []

        # Add numeric feature names
        if numeric_features:
            all_feature_names.extend(numeric_features)
            
        # Add categorical feature names (one-hot encoded)
        if categorical_features and 'cat' in preprocessor.named_transformers_:
            cat_features_out = preprocessor.named_transformers_['cat'].named_steps['onehot'].get_feature_names_out(categorical_features)
            all_feature_names.extend(list(cat_features_out))
            
        # Add ordinal feature names
        if ordinal_features:
            all_feature_names.extend(ordinal_features)
            
        # Add binary feature names
        if binary_features:
            all_feature_names.extend(binary_features)
            
        # Add remainder features (if any)
        remainder_features = [col for col in X.columns if col not in numeric_features + categorical_features + ordinal_features + binary_features]
        all_feature_names.extend(remainder_features)

        # Create processed DataFrame (safe construction with shape check)
        try:
            processed_df = pd.DataFrame(X_processed, columns=all_feature_names)
        except Exception as e:
            logger.error(f"Shape mismatch when constructing processed DataFrame: {e}")
            logger.error(f"X_processed.shape={getattr(X_processed, 'shape', None)}, len(all_feature_names)={len(all_feature_names)}")
            raise
        
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
            
            joblib.dump(preprocessor, os.path.join(encoder_dir, 'refining_preprocessor.joblib'))
            joblib.dump(all_feature_names, os.path.join(encoder_dir, 'refining_feature_names.joblib'))
            joblib.dump(existing_target_cols, os.path.join(encoder_dir, 'refining_target_names.joblib'))
            
            logger.info("Saved preprocessor, feature names, and target names.")

        logger.info("Preprocessing complete.")
        return processed_df, preprocessor

    except Exception as e:
        logger.error(f"Error in preprocessing: {str(e)}")
        raise

def validate_preprocessing(input_path: str, processed_path: str) -> bool:
    """
    Validate preprocessing by checking row counts and columns.
    """
    try:
        original_df = pd.read_csv(input_path)
        processed_df = pd.read_csv(processed_path)
        
        if len(original_df) != len(processed_df):
            logger.error("Row count mismatch between original and processed data")
            return False
            
        # Check if we have a reasonable number of columns
        if len(processed_df.columns) < 5:
            logger.error(f"Processed data has too few columns: {len(processed_df.columns)}")
            return False
            
        logger.info("Preprocessing validation passed")
        return True
        
    except Exception as e:
        logger.error(f"Validation error: {str(e)}")
        return False

if __name__ == "__main__":
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    raw_path = os.path.join(project_root, 'data', 'raw', 'comprehensive_aluminium_lca_dataset_INDIA.csv')
    processed_path = os.path.join(project_root, 'data', 'processed', 'refining_processed.csv')

    logger.info("Starting refining preprocessing...")
    try:
        processed_df, preprocessor = preprocess_refining_data(raw_path, processed_path)
        
        if validate_preprocessing(raw_path, processed_path):
            logger.info("Refining preprocessing completed successfully.")
        else:
            logger.warning("Refining preprocessing completed with warnings")
            
    except Exception as e:
        logger.error(f"Refining preprocessing failed: {str(e)}")