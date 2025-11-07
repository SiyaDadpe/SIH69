import os
import joblib
import logging
import numpy as np
import pandas as pd
from typing import Tuple, List
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, OrdinalEncoder
from sklearn.compose import ColumnTransformer

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def preprocess_manufacturing_data(input_path: str, output_path: str, save_encoders: bool = True) -> Tuple[pd.DataFrame, ColumnTransformer]:
    """
    Preprocess manufacturing & use phase data for LCA modeling.

    Args:
        input_path (str): Path to raw dataset CSV file
        output_path (str): Path to save processed dataset CSV file
        save_encoders (bool): Whether to save the encoders

    Returns:
        Tuple[pd.DataFrame, ColumnTransformer]: Processed DataFrame and pipeline object
    """
    try:
        logger.info(f"Loading manufacturing data from {input_path}...")
        df = pd.read_csv(input_path)
        
        # Check if the dataset has the expected structure
        if df.empty:
            logger.error("Input dataset is empty")
            raise ValueError("Input dataset is empty")

        # Target columns
        target_cols = [
            'manufacturing_energy_MJ_per_t_product',
            'manufacturing_scrap_rate_%',
            'manufacturing_recycled_content_%',
            'manufacturing_transport_emissions_kgCO2e_per_t'
        ]

        # Features
        binary_cols = [
            'manufacturing_process_Casting',
            'manufacturing_process_Rolling',
            'manufacturing_process_Extrusion',
            'manufacturing_process_Forging',
            'manufacturing_process_Surface_Treatment',
            'manufacturing_process_Joining',
            'manufacturing_process_Design_for_Recycling'
        ]

        categorical_cols = [
            'manufacturing_transport_mode'
        ]

        ordinal_cols = [
            'use_phase_corrosion_impact'
        ]

        numeric_cols = [
            'manufacturing_transport_distance_km'
        ]

        # Include sector as categorical (one-hot encode)
        sector_col = 'use_phase_sector'
        if sector_col in df.columns:
            categorical_cols.append(sector_col)

        # Validate columns exist in the dataset
        existing_target_cols = [col for col in target_cols if col in df.columns]
        existing_binary_cols = [col for col in binary_cols if col in df.columns]
        existing_categorical_cols = [col for col in categorical_cols if col in df.columns]
        existing_ordinal_cols = [col for col in ordinal_cols if col in df.columns]
        existing_numeric_cols = [col for col in numeric_cols if col in df.columns]

        logger.info(f"Found {len(existing_target_cols)} target columns")
        logger.info(f"Found {len(existing_binary_cols)} binary columns")
        logger.info(f"Found {len(existing_categorical_cols)} categorical columns")
        logger.info(f"Found {len(existing_ordinal_cols)} ordinal columns")
        logger.info(f"Found {len(existing_numeric_cols)} numeric columns")

        # Check if we have enough data to proceed
        if not existing_target_cols:
            logger.error("No target columns found in dataset")
            raise ValueError("No target columns found in dataset")
            
        if not (existing_binary_cols or existing_categorical_cols or existing_ordinal_cols or existing_numeric_cols):
            logger.error("No feature columns found in dataset")
            raise ValueError("No feature columns found in dataset")

        # Separate features and target
        feature_cols = existing_binary_cols + existing_categorical_cols + existing_ordinal_cols + existing_numeric_cols
        X = df[feature_cols].copy()
        y = df[existing_target_cols].copy()

        # Convert binary columns to integers with robust handling
        for col in existing_binary_cols:
            X[col] = X[col].fillna(0)
            if X[col].dtype == object:
                X[col] = X[col].astype(str).str.strip().str.lower().map({
                    '1': 1, '0': 0, 'true': 1, 'false': 0, 'yes': 1, 'no': 0,
                    'y': 1, 'n': 0, 'on': 1, 'off': 0, 'enabled': 1, 'disabled': 0
                }).fillna(0)
            X[col] = pd.to_numeric(X[col], errors='coerce').fillna(0).astype(int)

        # Imputation strategies
        numeric_imputer = SimpleImputer(strategy='median')
        categorical_imputer = SimpleImputer(strategy='most_frequent')

        # Ordinal categories for corrosion impact
        ordinal_categories = [['Minimal', 'Moderate', 'Severe']]

        # Pipelines
        numeric_pipeline = Pipeline([
            ('imputer', numeric_imputer),
            ('scaler', StandardScaler())
        ])

        categorical_pipeline = Pipeline([
            ('imputer', categorical_imputer),
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])

        ordinal_pipeline = Pipeline([
            ('imputer', categorical_imputer),
            ('ordinal', OrdinalEncoder(categories=ordinal_categories))
        ])

        binary_pipeline = Pipeline([
            ('imputer', SimpleImputer(strategy='most_frequent'))
        ])

        # Build ColumnTransformer
        transformers = []
        if existing_numeric_cols:
            transformers.append(('num', numeric_pipeline, existing_numeric_cols))
        if existing_categorical_cols:
            transformers.append(('cat', categorical_pipeline, existing_categorical_cols))
        if existing_ordinal_cols:
            transformers.append(('ord', ordinal_pipeline, existing_ordinal_cols))
        if existing_binary_cols:
            transformers.append(('bin', binary_pipeline, existing_binary_cols))

        preprocessor = ColumnTransformer(
            transformers=transformers, 
            remainder='passthrough',
            verbose_feature_names_out=False
        )

        # Fit and transform
        logger.info("Fitting and transforming the data...")
        X_processed = preprocessor.fit_transform(X)

        # Get feature names
        feature_names = []
        
        if existing_numeric_cols:
            feature_names.extend(existing_numeric_cols)
            
        if existing_categorical_cols and 'cat' in preprocessor.named_transformers_:
            onehot = preprocessor.named_transformers_['cat'].named_steps['onehot']
            cat_names = onehot.get_feature_names_out(existing_categorical_cols)
            feature_names.extend(list(cat_names))
            
        if existing_ordinal_cols:
            feature_names.extend(existing_ordinal_cols)
            
        if existing_binary_cols:
            feature_names.extend(existing_binary_cols)

        # Handle any remainder features
        remainder_features = [col for col in X.columns if col not in existing_numeric_cols + 
                             existing_categorical_cols + existing_ordinal_cols + existing_binary_cols]
        feature_names.extend(remainder_features)

        # Create DataFrame
        processed_df = pd.DataFrame(X_processed, columns=feature_names)
        
        # Add target columns
        for col in existing_target_cols:
            processed_df[col] = y[col].values

        # Save output
        logger.info(f"Saving processed data to {output_path}...")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        processed_df.to_csv(output_path, index=False)

        # Save artifacts
        if save_encoders:
            project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
            encoder_dir = os.path.join(project_root, 'preprocessing')
            os.makedirs(encoder_dir, exist_ok=True)
            
            joblib.dump(preprocessor, os.path.join(encoder_dir, 'manufacturing_preprocessor.joblib'))
            joblib.dump(feature_names, os.path.join(encoder_dir, 'manufacturing_feature_names.joblib'))
            joblib.dump(existing_target_cols, os.path.join(encoder_dir, 'manufacturing_target_names.joblib'))
            
            # Save lightweight preprocessing metadata for APIs and frontends
            metadata = {
                'numeric_columns': existing_numeric_cols,
                'categorical_columns': existing_categorical_cols,
                'ordinal_columns': existing_ordinal_cols,
                'binary_columns': existing_binary_cols,
                'numeric_medians': {}
            }

            # compute medians for numeric columns from original X
            for col in existing_numeric_cols:
                try:
                    metadata['numeric_medians'][col] = float(X[col].median())
                except Exception:
                    metadata['numeric_medians'][col] = 0.0

            # optional ranges for categorical columns
            metadata['ranges'] = {}
            for col in existing_categorical_cols + existing_ordinal_cols:
                try:
                    metadata['ranges'][col] = list(X[col].dropna().unique()[:100])
                except Exception:
                    metadata['ranges'][col] = []

            joblib.dump(metadata, os.path.join(encoder_dir, 'manufacturing_metadata.joblib'))
            logger.info("Saved preprocessor and metadata.")

        logger.info("Manufacturing preprocessing completed successfully.")
        return processed_df, preprocessor

    except Exception as e:
        logger.error(f"Error during manufacturing preprocessing: {e}")
        raise


def validate_preprocessing(input_path: str, processed_path: str) -> bool:
    """Validate preprocessing by comparing row counts and ensuring data integrity."""
    try:
        original = pd.read_csv(input_path)
        processed = pd.read_csv(processed_path)

        if len(original) != len(processed):
            logger.error(f"Row count mismatch: original={len(original)}, processed={len(processed)}")
            return False

        if processed.shape[1] < 5:
            logger.error(f"Processed data has too few columns: {processed.shape[1]}")
            return False
            
        # Check for NaN values
        nan_count = processed.isna().sum().sum()
        if nan_count > 0:
            logger.warning(f"Processed data contains {nan_count} NaN values")

        logger.info("Preprocessing validation passed.")
        return True
        
    except Exception as e:
        logger.error(f"Validation failed: {e}")
        return False


if __name__ == "__main__":
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    raw_file = os.path.join(project_root, 'data', 'raw', 'comprehensive_aluminium_lca_dataset_INDIA.csv')
    processed_file = os.path.join(project_root, 'data', 'processed', 'manufacturing_processed.csv')

    logger.info("Starting manufacturing preprocessing...")
    try:
        df, preprocessor = preprocess_manufacturing_data(raw_file, processed_file)
        
        if validate_preprocessing(raw_file, processed_file):
            logger.info("Manufacturing preprocessing completed successfully.")
        else:
            logger.warning("Manufacturing preprocessing completed with warnings.")
            
    except Exception as e:
        logger.error(f"Manufacturing preprocessing failed: {e}")