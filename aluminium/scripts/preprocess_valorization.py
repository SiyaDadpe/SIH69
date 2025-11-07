import os
import joblib
import logging
import numpy as np
import pandas as pd
from typing import Tuple, List, Dict, Any
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, OrdinalEncoder
from sklearn.compose import ColumnTransformer
import warnings
warnings.filterwarnings('ignore')

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def preprocess_valorization_data(input_path: str, output_path: str, save_encoders: bool = True,
                                 config: Dict[str, Any] = None) -> Tuple[pd.DataFrame, ColumnTransformer]:
    """
    Preprocess valorization data for LCA modeling with enhanced handling of waste types and valorization methods.

    Args:
        input_path (str): Path to raw dataset CSV file
        output_path (str): Path to save processed CSV
        save_encoders (bool): Whether to save preprocessing artifacts
        config (Dict[str, Any]): Optional configuration dictionary

    Returns:
        Tuple[pd.DataFrame, ColumnTransformer]: Processed DataFrame and pipeline
    """
    try:
        logger.info(f"Loading valorization data from {input_path}...")
        df = pd.read_csv(input_path)

        if config:
            logger.info("Custom configuration provided")

        # --- Normalise common column-name variants so the static expected lists below match the CSV ---
        # Map occurrences of 'Spent_Pot_Lining' -> 'SPL' and 'REE_Extraction' -> 'Rare_Earth_Extraction'
        rename_map = {}
        for col in df.columns:
            # Spent_Pot_Lining -> SPL (covers toxicity_, groundwater_risk_, waste_utilization_ and waste_type_ variants)
            if 'Spent_Pot_Lining' in col:
                new = col.replace('Spent_Pot_Lining', 'SPL')
                rename_map[col] = new

            # Some datasets use 'REE_Extraction' or 'valorization_method_REE_Extraction' instead of 'Rare_Earth_Extraction'
            if 'REE_Extraction' in col:
                new = col.replace('REE_Extraction', 'Rare_Earth_Extraction')
                rename_map[col] = new

        if rename_map:
            logger.info(f"Normalizing {len(rename_map)} column names: {list(rename_map.values())}")
            df = df.rename(columns=rename_map)

        # Define target columns
        target_cols = [
            'valorization_emission_reduction_kgCO2e_per_t_waste',
            'valorization_recovery_efficiency_%'
        ]

        # Waste type binary columns
        waste_type_cols = [
            'waste_type_Red_Mud',
            'waste_type_SPL',
            'waste_type_Dross',
            'waste_type_Fluoride_Gases',
            'waste_type_Slag',
            'waste_type_Other'
        ]

        # Waste utilization percentage columns
        waste_utilization_cols = [
            'waste_utilization_Red_Mud_%',
            'waste_utilization_SPL_%',
            'waste_utilization_Dross_%',
            'waste_utilization_Fluoride_Gases_%',
            'waste_utilization_Slag_%',
            'waste_utilization_Other_%'
        ]

        # Valorization method binary columns
        valorization_method_cols = [
            'valorization_method_Cement_Additive',
            'valorization_method_Soil_Stabilization',
            'valorization_method_Iron_Extraction',
            'valorization_method_Rare_Earth_Extraction',
            'valorization_method_SPL_Encapsulation',
            'valorization_method_Dross_Recovery',
            'valorization_method_Fluoride_Capture',
            'valorization_method_Other'
        ]

        # Toxicity level categorical columns
        toxicity_cols = [
            'toxicity_Red_Mud',
            'toxicity_SPL',
            'toxicity_Dross',
            'toxicity_Fluoride_Gases',
            'toxicity_Slag',
            'toxicity_Other'
        ]

        # Groundwater risk categorical columns
        risk_cols = [
            'groundwater_risk_Red_Mud',
            'groundwater_risk_SPL',
            'groundwater_risk_Dross',
            'groundwater_risk_Fluoride_Gases',
            'groundwater_risk_Slag',
            'groundwater_risk_Other'
        ]

        # Economic viability categorical columns
        economic_cols = [
            'economic_viability_Cement_Additive',
            'economic_viability_Soil_Stabilization',
            'economic_viability_Iron_Extraction',
            'economic_viability_Rare_Earth_Extraction',
            'economic_viability_SPL_Encapsulation',
            'economic_viability_Dross_Recovery',
            'economic_viability_Fluoride_Capture'
        ]

        # Additional numeric columns
        additional_numeric_cols = [
            'emission_reduction_kgCO2e_per_t_waste',
            'recovery_efficiency_%'
        ]

        # Validate existing columns
        existing_target_cols = [col for col in target_cols if col in df.columns]
        existing_waste_type_cols = [col for col in waste_type_cols if col in df.columns]
        existing_waste_utilization_cols = [col for col in waste_utilization_cols if col in df.columns]
        existing_valorization_method_cols = [col for col in valorization_method_cols if col in df.columns]
        existing_toxicity_cols = [col for col in toxicity_cols if col in df.columns]
        existing_risk_cols = [col for col in risk_cols if col in df.columns]
        existing_economic_cols = [col for col in economic_cols if col in df.columns]
        existing_additional_numeric_cols = [col for col in additional_numeric_cols if col in df.columns]

        logger.info(f"Found {len(existing_target_cols)} target columns")
        logger.info(f"Found {len(existing_waste_type_cols)} waste type columns")
        logger.info(f"Found {len(existing_waste_utilization_cols)} waste utilization columns")
        logger.info(f"Found {len(existing_valorization_method_cols)} valorization method columns")
        logger.info(f"Found {len(existing_toxicity_cols)} toxicity columns")
        logger.info(f"Found {len(existing_risk_cols)} risk columns")
        logger.info(f"Found {len(existing_economic_cols)} economic viability columns")
        logger.info(f"Found {len(existing_additional_numeric_cols)} additional numeric columns")

        # Prepare features and targets
        feature_cols = (existing_waste_type_cols + existing_waste_utilization_cols + 
                       existing_valorization_method_cols + existing_toxicity_cols + 
                       existing_risk_cols + existing_economic_cols + existing_additional_numeric_cols)
        
        # Ensure we don't include targets as features
        feature_cols = [col for col in feature_cols if col not in target_cols]
        
        X = df[feature_cols].copy()
        y = df[existing_target_cols].copy()

        # Convert binary columns to integers
        binary_cols = existing_waste_type_cols + existing_valorization_method_cols
        for col in binary_cols:
            if col in X.columns:
                X[col] = X[col].fillna(0)
                if X[col].dtype == object:
                    X[col] = X[col].astype(str).str.strip().str.lower().map({
                        '1': 1, '0': 0, 'true': 1, 'false': 0,
                        'yes': 1, 'no': 0, 'on': 1, 'off': 0,
                        'enabled': 1, 'disabled': 0, 'present': 1, 'absent': 0,
                        'y': 1, 'n': 0, 't': 1, 'f': 0
                    }).fillna(0)
                X[col] = pd.to_numeric(X[col], errors='coerce').fillna(0).astype(int)

        # Define ordinal categories for toxicity, risk, and economic viability
        ordinal_categories = [['Low', 'Moderate', 'High', 'Not Applicable']]
        
        # Define imputation strategies
        numeric_imputer = SimpleImputer(strategy='median')
        categorical_imputer = SimpleImputer(strategy='most_frequent')
        binary_imputer = SimpleImputer(strategy='most_frequent')
        ordinal_imputer = SimpleImputer(strategy='constant', fill_value='Not Applicable')

        # Create pipelines
        numeric_pipeline = Pipeline([
            ('imputer', numeric_imputer),
            ('scaler', StandardScaler())
        ])

        categorical_pipeline = Pipeline([
            ('imputer', categorical_imputer),
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])

        ordinal_pipeline = Pipeline([
            ('imputer', ordinal_imputer),
            ('ordinal', OrdinalEncoder(categories=ordinal_categories * 
                                     (len(existing_toxicity_cols) + len(existing_risk_cols) + len(existing_economic_cols)),
                                     handle_unknown='use_encoded_value', unknown_value=-1))
        ])

        binary_pipeline = Pipeline([
            ('imputer', binary_imputer)
        ])

        # Build transformers
        transformers = []
        
        # Numeric columns (waste utilization percentages and additional numeric)
        numeric_columns = existing_waste_utilization_cols + existing_additional_numeric_cols
        if numeric_columns:
            transformers.append(('num', numeric_pipeline, numeric_columns))
        
        # Binary columns (waste types and valorization methods)
        if binary_cols:
            transformers.append(('bin', binary_pipeline, binary_cols))
        
        # Ordinal columns (toxicity, risk, economic viability)
        ordinal_columns = existing_toxicity_cols + existing_risk_cols + existing_economic_cols
        if ordinal_columns:
            transformers.append(('ord', ordinal_pipeline, ordinal_columns))

        preprocessor = ColumnTransformer(
            transformers=transformers,
            remainder='passthrough',
            verbose_feature_names_out=False
        )

        logger.info("Fitting and transforming data...")
        X_processed = preprocessor.fit_transform(X)

        # Generate feature names
        feature_names = []
        
        if numeric_columns:
            feature_names.extend(numeric_columns)
            
        if binary_cols:
            feature_names.extend(binary_cols)
            
        if ordinal_columns:
            feature_names.extend(ordinal_columns)

        # Handle any remainder features
        remainder_features = [col for col in X.columns if col not in numeric_columns + binary_cols + ordinal_columns]
        feature_names.extend(remainder_features)

        processed_df = pd.DataFrame(X_processed, columns=feature_names)
        
        # Add target columns
        for col in existing_target_cols:
            processed_df[col] = y[col].values

        # Add metadata about the preprocessing
        processed_df.attrs['preprocessing_info'] = {
            'target_columns': existing_target_cols,
            'feature_columns': feature_names,
            'binary_columns_processed': binary_cols,
            'numeric_columns_processed': numeric_columns,
            'ordinal_columns_processed': ordinal_columns
        }

        logger.info(f"Saving processed data to {output_path}...")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        processed_df.to_csv(output_path, index=False)

        if save_encoders:
            project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
            encoder_dir = os.path.join(project_root, 'preprocessing')
            os.makedirs(encoder_dir, exist_ok=True)
            
            joblib.dump(preprocessor, os.path.join(encoder_dir, 'valorization_preprocessor.joblib'))
            joblib.dump(feature_names, os.path.join(encoder_dir, 'valorization_feature_names.joblib'))
            joblib.dump(existing_target_cols, os.path.join(encoder_dir, 'valorization_target_names.joblib'))
            
            # Save additional metadata
            preprocessing_metadata = {
                'binary_columns': binary_cols,
                'numeric_columns': numeric_columns,
                'ordinal_columns': ordinal_columns,
                'target_columns': existing_target_cols
            }
            joblib.dump(preprocessing_metadata, os.path.join(encoder_dir, 'valorization_metadata.joblib'))

            logger.info("Saved preprocessor and metadata.")

        logger.info("Valorization preprocessing completed successfully.")
        return processed_df, preprocessor

    except Exception as e:
        logger.error(f"Error during valorization preprocessing: {e}")
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
            logger.error(f"Too few columns in processed data: {processed.shape[1]}")
            return False

        # Check for NaN values
        nan_count = processed.isna().sum().sum()
        if nan_count > 0:
            logger.warning(f"Found {nan_count} NaN values in processed data")
            
        # Check for infinite values
        inf_count = np.isinf(processed.select_dtypes(include=[np.number])).sum().sum()
        if inf_count > 0:
            logger.warning(f"Found {inf_count} infinite values in processed data")
            
        # Check for negative values where not expected
        percentage_cols = [col for col in processed.columns if '%' in col]
        for col in percentage_cols:
            if col in processed.columns:
                negative_count = (processed[col] < 0).sum()
                if negative_count > 0:
                    logger.warning(f"Column {col} has {negative_count} negative values")

        logger.info("Validation passed")
        return True
    except Exception as e:
        logger.error(f"Validation failed: {e}")
        return False

def create_valorization_template(output_path: str):
    """Create a template CSV with all expected columns for valorization data."""
    template_data = {
        # Waste type columns
        'waste_type_Red_Mud': [1],
        'waste_type_SPL': [0],
        'waste_type_Dross': [1],
        'waste_type_Fluoride_Gases': [0],
        'waste_type_Slag': [1],
        'waste_type_Other': [0],
        
        # Waste utilization columns
        'waste_utilization_Red_Mud_%': [30.0],
        'waste_utilization_SPL_%': [0.0],
        'waste_utilization_Dross_%': [45.0],
        'waste_utilization_Fluoride_Gases_%': [0.0],
        'waste_utilization_Slag_%': [25.0],
        'waste_utilization_Other_%': [0.0],
        
        # Valorization method columns
        'valorization_method_Cement_Additive': [1],
        'valorization_method_Soil_Stabilization': [0],
        'valorization_method_Iron_Extraction': [1],
        'valorization_method_Rare_Earth_Extraction': [0],
        'valorization_method_SPL_Encapsulation': [0],
        'valorization_method_Dross_Recovery': [1],
        'valorization_method_Fluoride_Capture': [0],
        'valorization_method_Other': [0],
        
        # Toxicity columns
        'toxicity_Red_Mud': ['Moderate'],
        'toxicity_SPL': ['High'],
        'toxicity_Dross': ['Low'],
        'toxicity_Fluoride_Gases': ['High'],
        'toxicity_Slag': ['Moderate'],
        'toxicity_Other': ['Not Applicable'],
        
        # Risk columns
        'groundwater_risk_Red_Mud': ['Moderate'],
        'groundwater_risk_SPL': ['High'],
        'groundwater_risk_Dross': ['Low'],
        'groundwater_risk_Fluoride_Gases': ['High'],
        'groundwater_risk_Slag': ['Moderate'],
        'groundwater_risk_Other': ['Not Applicable'],
        
        # Economic viability columns
        'economic_viability_Cement_Additive': ['Moderate'],
        'economic_viability_Soil_Stabilization': ['Low'],
        'economic_viability_Iron_Extraction': ['High'],
        'economic_viability_Rare_Earth_Extraction': ['Moderate'],
        'economic_viability_SPL_Encapsulation': ['Low'],
        'economic_viability_Dross_Recovery': ['High'],
        'economic_viability_Fluoride_Capture': ['Moderate'],
        
        # Additional numeric columns
        'emission_reduction_kgCO2e_per_t_waste': [250.0],
        'recovery_efficiency_%': [75.0],
        
        # Target columns
        'valorization_emission_reduction_kgCO2e_per_t_waste': [500.0],
        'valorization_recovery_efficiency_%': [80.0]
    }
    
    template_df = pd.DataFrame(template_data)
    template_df.to_csv(output_path, index=False)
    logger.info(f"Template created at {output_path}")

if __name__ == "__main__":
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    raw_file = os.path.join(project_root, 'data', 'raw', 'comprehensive_aluminium_lca_dataset_INDIA.csv')
    processed_file = os.path.join(project_root, 'data', 'processed', 'valorization_processed.csv')
    
    # Create template if needed
    template_path = os.path.join(project_root, 'data', 'templates', 'valorization_template.csv')
    os.makedirs(os.path.dirname(template_path), exist_ok=True)
    create_valorization_template(template_path)

    logger.info("Starting valorization preprocessing...")
    try:
        df, preprocessor = preprocess_valorization_data(raw_file, processed_file)
        if validate_preprocessing(raw_file, processed_file):
            logger.info("Valorization preprocessing completed successfully.")
        else:
            logger.warning("Valorization preprocessing completed with warnings.")
    except Exception as e:
        logger.error(f"Valorization preprocessing failed: {e}")