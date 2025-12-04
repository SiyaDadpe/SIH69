import os
import joblib
import logging
import numpy as np
import pandas as pd
from typing import Tuple, List, Dict, Any
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
import warnings
warnings.filterwarnings('ignore')

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def preprocess_recycling_data(input_path: str, output_path: str, save_encoders: bool = True, 
                             config: Dict[str, Any] = None) -> Tuple[pd.DataFrame, ColumnTransformer]:
    """
    Preprocess recycling data for LCA modeling with enhanced handling of recycling-specific features.

    Args:
        input_path (str): Path to raw dataset CSV file.
        output_path (str): Path to save processed CSV.
        save_encoders (bool): Whether to save preprocessing artifacts.
        config (Dict[str, Any]): Configuration for customizing preprocessing.

    Returns:
        Tuple[pd.DataFrame, ColumnTransformer]: Processed DataFrame and fitted preprocessor.
    """
    try:
        logger.info(f"Loading recycling data from {input_path}...")
        df = pd.read_csv(input_path)
        
        # Apply configuration if provided
        if config:
            logger.info("Applying custom configuration")
            # You can add configuration options here as needed

        # Define targets - these should not be used as features
        target_cols = [
            'recycling_scrap_input_%',
            'recycling_recovery_yield_%',
            'recycling_energy_kWh_per_t_Al',
            'recycling_emission_savings_kgCO2e_per_t_Al',
            'valorization_recovery_efficiency_%',
            'recycling_collection_rate_%',
            'recycling_closed_loop_%',
            'recycling_open_loop_%'
        ]

        # Detect process flag columns dynamically (handles names like recycling_process_Casting_New)
        process_cols = [col for col in df.columns if col.startswith('recycling_process_')]

        # Sorting method may be a single categorical column 'recycling_sorting_method'
        # or already one-hot encoded columns like 'recycling_sorting_method_Manual'
        sorting_method_col = 'recycling_sorting_method'
        existing_sorting_onehot = [col for col in df.columns if col.startswith('recycling_sorting_method_')]
        if sorting_method_col in df.columns:
            has_sorting_method_column = True
            existing_sorting_cols = []
        else:
            has_sorting_method_column = False
            existing_sorting_cols = existing_sorting_onehot

        variant_cols = [
            'recycling_variant_Closed_loop',
            'recycling_variant_Open_loop',
            'recycling_variant_Secondary',
            'recycling_variant_Other'
        ]

        # Additional features that might be present
        additional_categorical_cols = [
            'recycling_collection_method',  # manual, automated
            'recycling_furnace_type'        # could be various furnace types
        ]

        # Validate existing columns
        existing_target_cols = [col for col in target_cols if col in df.columns]
        existing_process_cols = [col for col in process_cols if col in df.columns]
        existing_variant_cols = [col for col in variant_cols if col in df.columns]
        existing_categorical_cols = [col for col in additional_categorical_cols if col in df.columns]

        # If there's a sorting_method categorical column, add it to categorical cols; else keep detected one-hot cols
        if has_sorting_method_column:
            existing_categorical_cols.append(sorting_method_col)
        else:
            # existing_sorting_cols already set earlier
            pass
        
        # Check for any other binary columns that might be relevant
        # Exclude known feature groups to avoid misclassifying categorical/numeric metrics as binary
        exclude = set(target_cols) | set(process_cols) | set(existing_sorting_cols) | set(variant_cols) | set(additional_categorical_cols)
        # Start with an empty list; we will add only true 0/1 columns after robust checks below
        potential_binary_cols: List[str] = []
        
        # Identify numeric columns that are not targets (safer detection)
        from pandas.api.types import is_numeric_dtype
        numeric_cols = []
        for col in df.columns:
            try:
                if (col not in target_cols and col not in process_cols and 
                    col not in existing_sorting_cols and col not in variant_cols and
                    col not in additional_categorical_cols and
                    is_numeric_dtype(df[col])):
                    numeric_cols.append(col)
            except Exception as ex:
                logger.warning(f"Skipping column {col} during numeric detection due to: {ex}")

        logger.info(f"Found {len(existing_target_cols)} target columns")
        logger.info(f"Found {len(existing_process_cols)} process columns")
        logger.info(f"Found {len(existing_sorting_cols)} sorting method columns")
        logger.info(f"Found {len(existing_variant_cols)} variant columns")
        logger.info(f"Found {len(existing_categorical_cols)} additional categorical columns")
        logger.info(f"Found {len(potential_binary_cols)} potential binary columns")
        logger.info(f"Found {len(numeric_cols)} numeric feature columns")

        # Determine true binary columns by inspecting values after coercion
        # Start from known flag groups; we'll add additional columns only if their values are strictly {0,1}
        binary_cols = existing_process_cols + existing_sorting_cols + existing_variant_cols

        # Robust binary detection for other candidates (avoid misclassifying numeric metrics)
        for col in df.columns:
            if col in exclude:
                continue
            if col in binary_cols:
                continue
            # Only consider non-target columns that look categorical/binary by dtype or small unique set
            try:
                series = df[col].copy()
                # Normalize common textual binary encodings
                if series.dtype == object:
                    series = series.astype(str).str.strip().str.lower().map({
                        '1': 1, '0': 0, 'true': 1, 'false': 0,
                        'yes': 1, 'no': 0, 'on': 1, 'off': 0,
                        'enabled': 1, 'disabled': 0, 'present': 1, 'absent': 0,
                        'y': 1, 'n': 0, 't': 1, 'f': 0
                    })
                series = pd.to_numeric(series, errors='coerce')
                # Consider binary if all non-null values are subset of {0,1}
                uniq = set(series.dropna().unique().tolist())
                if len(uniq) > 0 and uniq.issubset({0, 1}):
                    potential_binary_cols.append(col)
            except Exception as ex:
                logger.debug(f"Skipping binary detection for column {col} due to: {ex}")

        # Finalize binary columns (dedupe and avoid overlaps with numeric/categorical)
        binary_cols = list(dict.fromkeys(binary_cols + potential_binary_cols))
        binary_cols = [c for c in binary_cols if c not in numeric_cols and c not in existing_categorical_cols]

        # Separate features and targets
        feature_cols = (numeric_cols + existing_categorical_cols + binary_cols)

        # Ensure we don't include targets as features and preserve order & uniqueness
        feature_cols = [col for col in feature_cols if col not in target_cols and col in df.columns]
        # preserve order and remove duplicates
        feature_cols = list(dict.fromkeys(feature_cols))

        # Use .loc to avoid ambiguous selection if dataframe had duplicate labels
        X = df.loc[:, feature_cols].copy()
        y = df[existing_target_cols].copy()

        # Convert binary columns to integers robustly
        for col in binary_cols:
            if col in X.columns:
                try:
                    X[col] = X[col].fillna(0)
                    # Defensive: if the column is a DataFrame-like object, log and skip
                    if hasattr(X[col], 'dtype') and X[col].dtype == object:
                        X[col] = X[col].astype(str).str.strip().str.lower().map({
                            '1': 1, '0': 0, 'true': 1, 'false': 0,
                            'yes': 1, 'no': 0, 'on': 1, 'off': 0,
                            'enabled': 1, 'disabled': 0, 'present': 1, 'absent': 0,
                            'y': 1, 'n': 0, 't': 1, 'f': 0
                        }).fillna(0)
                    X[col] = pd.to_numeric(X[col], errors='coerce').fillna(0).astype(int)
                except Exception as ex:
                    logger.warning(f"Skipping binary coercion for column {col} due to error: {ex}")

        # Define imputation and scaling strategies
        numeric_imputer = SimpleImputer(strategy='median')
        categorical_imputer = SimpleImputer(strategy='most_frequent')
        binary_imputer = SimpleImputer(strategy='most_frequent')

        numeric_pipeline = Pipeline([
            ('imputer', numeric_imputer),
            ('scaler', StandardScaler())
        ])

        categorical_pipeline = Pipeline([
            ('imputer', categorical_imputer),
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])

        binary_pipeline = Pipeline([
            ('imputer', binary_imputer)
        ])

        # Build transformers
        transformers = []
        
        if numeric_cols:
            transformers.append(('num', numeric_pipeline, numeric_cols))
            
        if existing_categorical_cols:
            transformers.append(('cat', categorical_pipeline, existing_categorical_cols))
            
        if binary_cols:
            transformers.append(('bin', binary_pipeline, binary_cols))

        # Drop remainder to avoid accidental passthrough duplicates
        preprocessor = ColumnTransformer(
            transformers=transformers, 
            remainder='drop',
            verbose_feature_names_out=False
        )

        logger.info("Fitting and transforming the data...")
        X_processed = preprocessor.fit_transform(X)

        # Generate feature names
        feature_names = []
        
        if numeric_cols:
            feature_names.extend(numeric_cols)
            
        if existing_categorical_cols and 'cat' in preprocessor.named_transformers_:
            onehot = preprocessor.named_transformers_['cat'].named_steps['onehot']
            cat_names = onehot.get_feature_names_out(existing_categorical_cols)
            feature_names.extend(list(cat_names))
            
        if binary_cols:
            feature_names.extend(binary_cols)

        # No remainder features since remainder='drop'

        processed_df = pd.DataFrame(X_processed, columns=feature_names)
        
        # Add target columns
        for col in existing_target_cols:
            processed_df[col] = y[col].values

        # Add metadata about the preprocessing
        processed_df.attrs['preprocessing_info'] = {
            'target_columns': existing_target_cols,
            'feature_columns': feature_names,
            'binary_columns_processed': binary_cols,
            'numeric_columns_processed': numeric_cols,
            'categorical_columns_processed': existing_categorical_cols
        }

        logger.info(f"Saving processed data to {output_path}...")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        processed_df.to_csv(output_path, index=False)

        if save_encoders:
            project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
            encoder_dir = os.path.join(project_root, 'preprocessing')
            os.makedirs(encoder_dir, exist_ok=True)

            joblib.dump(preprocessor, os.path.join(encoder_dir, 'recycling_preprocessor.joblib'))
            joblib.dump(feature_names, os.path.join(encoder_dir, 'recycling_feature_names.joblib'))
            joblib.dump(existing_target_cols, os.path.join(encoder_dir, 'recycling_target_names.joblib'))
            
            # Save additional metadata
            preprocessing_metadata = {
                'binary_columns': binary_cols,
                'numeric_columns': numeric_cols,
                'categorical_columns': existing_categorical_cols,
                'target_columns': existing_target_cols
            }
            joblib.dump(preprocessing_metadata, os.path.join(encoder_dir, 'recycling_metadata.joblib'))

            logger.info("Saved preprocessor and metadata")

        logger.info("Recycling preprocessing completed successfully.")
        return processed_df, preprocessor

    except Exception as e:
        logger.error(f"Error during recycling preprocessing: {e}")
        raise

def validate_preprocessing(input_path: str, processed_path: str) -> bool:
    """Validate that preprocessing was successful with enhanced checks."""
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
            
        # Check for infinite values
        inf_count = np.isinf(processed.select_dtypes(include=[np.number])).sum().sum()
        if inf_count > 0:
            logger.warning(f"Processed data contains {inf_count} infinite values")
            
        # Check for negative values where not expected
        percentage_cols = [col for col in processed.columns if '%' in col]
        for col in percentage_cols:
            if col in processed.columns:
                negative_count = (processed[col] < 0).sum()
                if negative_count > 0:
                    logger.warning(f"Column {col} has {negative_count} negative values")

        logger.info("Validation passed.")
        return True
    except Exception as e:
        logger.error(f"Validation failed: {e}")
        return False

def create_recycling_template(output_path: str):
    """Create a template CSV with all expected columns for recycling data."""
    template_data = {
        # Process columns
        'recycling_process_Collection': [0],
        'recycling_process_Sorting': [0],
        'recycling_process_Cleaning': [0],
        'recycling_process_Remelting': [0],
        'recycling_process_Re_alloying': [0],
        'recycling_process_Casting': [0],
        'recycling_process_Other': [0],
        
        # Sorting method columns
        'recycling_sorting_method_Manual': [0],
        'recycling_sorting_method_Optical': [0],
        'recycling_sorting_method_Other': [0],
        
        # Variant columns
        'recycling_variant_Closed_loop': [0],
        'recycling_variant_Open_loop': [0],
        'recycling_variant_Secondary': [0],
        'recycling_variant_Other': [0],
        
        # Additional categorical columns
        'recycling_collection_method': ['manual'],  # manual, automated
        'recycling_furnace_type': ['reverberatory'],  # reverberatory, rotary, etc.
        
        # Target columns
        'recycling_scrap_input_%': [50.0],
        'recycling_recovery_yield_%': [85.0],
        'recycling_energy_kWh_per_t_Al': [1000.0],
        'recycling_emission_savings_kgCO2e_per_t_Al': [5000.0],
        'valorization_recovery_efficiency_%': [75.0],
        'recycling_collection_rate_%': [60.0],
        'recycling_closed_loop_%': [30.0],
        'recycling_open_loop_%': [70.0]
    }
    
    template_df = pd.DataFrame(template_data)
    template_df.to_csv(output_path, index=False)
    logger.info(f"Template created at {output_path}")

if __name__ == "__main__":
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    raw_file = os.path.join(project_root, 'data', 'raw', 'comprehensive_aluminium_lca_dataset_INDIA.csv')
    processed_file = os.path.join(project_root, 'data', 'processed', 'recycling_processed.csv')
    
    # Create template if needed
    template_path = os.path.join(project_root, 'data', 'templates', 'recycling_template.csv')
    os.makedirs(os.path.dirname(template_path), exist_ok=True)
    create_recycling_template(template_path)

    logger.info("Starting recycling preprocessing...")
    try:
        df, preprocessor = preprocess_recycling_data(raw_file, processed_file)
        if validate_preprocessing(raw_file, processed_file):
            logger.info("Recycling preprocessing completed successfully.")
        else:
            logger.warning("Recycling preprocessing completed with warnings.")
    except Exception as e:
        logger.error(f"Recycling preprocessing failed: {e}")