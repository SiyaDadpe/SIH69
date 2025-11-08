import os
import joblib
import pandas as pd
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, OrdinalEncoder
from sklearn.compose import ColumnTransformer
import logging
from typing import Tuple

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def preprocess_beneficiation_data(input_path: str, output_path: str, save_encoders: bool = True) -> Tuple[pd.DataFrame, ColumnTransformer]:
    """
    Preprocess beneficiation data for LCA modeling.
    Automatically separates features and targets, handles missing input values.
    """
    try:
        logger.info(f"Loading raw beneficiation data from {input_path}...")
        df = pd.read_csv(input_path)

        # Define possible features and targets
        possible_feature_cols = [
            'beneficiation_process_Crushing', 'beneficiation_process_Grinding', 'beneficiation_process_Washing_Screening',
            'beneficiation_process_Magnetic_Separation', 'beneficiation_process_Gravity_Separation', 'beneficiation_process_Dry_Separation',
            'beneficiation_chem_Flocculants', 'beneficiation_chem_Dispersants', 'beneficiation_chem_Coagulants',
            'beneficiation_water_m3_per_t_ore', 'beneficiation_electricity_kWh_per_t_ore',
            'beneficiation_tailings_management', 'beneficiation_noise_pollution', 'beneficiation_dust_pollution',
            'location', 'year', 'beneficiation_efficiency'
        ]
        possible_target_cols = [
            'beneficiation_water_m3_per_t_ore', 'beneficiation_electricity_kWh_per_t_ore',
            'beneficiation_tailings_management', 'beneficiation_noise_pollution', 'beneficiation_dust_pollution'
        ]

        # Keep only existing columns
        feature_cols = [col for col in possible_feature_cols if col in df.columns]
        target_cols = [col for col in possible_target_cols if col in df.columns]

        # Remove targets from features to avoid duplicates
        feature_cols = [col for col in feature_cols if col not in target_cols]

        # Separate features and targets
        X = df[feature_cols].copy()
        y = df[target_cols].copy() if target_cols else None
        logger.info(f"Feature columns: {feature_cols}")
        logger.info(f"Target columns: {target_cols}")
        logger.info(f"Dataset shape: {df.shape}")

        # Dynamically select feature types from columns
        process_features = [col for col in X.columns if col.startswith('beneficiation_process_')]
        chem_features = [col for col in X.columns if col.startswith('beneficiation_chem_')]
        binary_features = process_features + chem_features
        
        # Numeric features
        numeric_features = [col for col in X.columns if col in ['beneficiation_efficiency', 
                                                               'beneficiation_water_m3_per_t_ore', 
                                                               'beneficiation_electricity_kWh_per_t_ore']]
        
        # Categorical features (need one-hot encoding)
        categorical_features = [col for col in X.columns if col in ['location', 'beneficiation_tailings_management']]
        
        # Ordinal features
        ordinal_features = [col for col in X.columns if col in ['beneficiation_noise_pollution', 'beneficiation_dust_pollution']]
        
        # Remainder features (will be passed through as-is)
        # Only include columns that were not transformed (i.e., not numeric, categorical, ordinal, or binary)
        remainder_features = [col for col in X.columns if col not in numeric_features + categorical_features + ordinal_features + binary_features]
        # Remove original categorical columns from remainder_features (since they are replaced by one-hot columns)
        for cat_col in categorical_features:
            if cat_col in remainder_features:
                remainder_features.remove(cat_col)

        # Ensure binary features are integers
        for col in binary_features:
            X[col] = X[col].astype(int)

        # Ordinal mappings
        ordinal_categories = [['Low', 'Moderate', 'High'], ['Low', 'Moderate', 'High']][:len(ordinal_features)]

        # Define pipelines
        numeric_transformer = Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])

        categorical_transformer = Pipeline([
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])

        ordinal_transformer = Pipeline([
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('ordinal', OrdinalEncoder(categories=ordinal_categories))
        ])

        binary_transformer = Pipeline([
            ('imputer', SimpleImputer(strategy='most_frequent'))
        ])

        # Combine transformers
        logger.info("Combining transformers...")
        transformers = []
        
        if numeric_features:
            transformers.append(('num', numeric_transformer, numeric_features))
        if categorical_features:
            transformers.append(('cat', categorical_transformer, categorical_features))
        if ordinal_features:
            transformers.append(('ord', ordinal_transformer, ordinal_features))
        if binary_features:
            transformers.append(('binary', binary_transformer, binary_features))

        preprocessor = ColumnTransformer(
            transformers=transformers,
            remainder='passthrough'  # Keep year or other columns as-is
        )

        # Fit and transform features
        logger.info("Fitting and transforming the data...")
        X_processed = preprocessor.fit_transform(X)

        # Construct column names
        all_feature_names = []
        
        if numeric_features:
            all_feature_names.extend(numeric_features)
        if categorical_features:
            cat_features_out = preprocessor.named_transformers_['cat'].named_steps['onehot'].get_feature_names_out(categorical_features)
            all_feature_names.extend(list(cat_features_out))
        if ordinal_features:
            all_feature_names.extend(ordinal_features)
        if binary_features:
            all_feature_names.extend(binary_features)
        
        # Add remainder features
        all_feature_names.extend(remainder_features)

        # Create processed DataFrame
        processed_df = pd.DataFrame(X_processed, columns=all_feature_names)

        # Add targets back
        if y is not None:
            for col in y.columns:
                processed_df[col] = y[col].values

        # Save processed data
        logger.info(f"Saving processed data to {output_path}...")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        processed_df.to_csv(output_path, index=False)

        # Save encoders/preprocessor
        if save_encoders:
            project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
            preprocessor_dir = os.path.join(project_root, 'preprocessing')
            os.makedirs(preprocessor_dir, exist_ok=True)

            joblib.dump(preprocessor, os.path.join(preprocessor_dir, 'beneficiation_preprocessor.joblib'))
            joblib.dump(all_feature_names, os.path.join(preprocessor_dir, 'beneficiation_feature_names.joblib'))
            joblib.dump(target_cols, os.path.join(preprocessor_dir, 'beneficiation_target_names.joblib'))
            # Save lightweight preprocessing metadata for APIs/frontend
            metadata = {
                'numeric_columns': numeric_features,
                'categorical_columns': categorical_features,
                'ordinal_columns': ordinal_features,
                'binary_columns': binary_features,
                'numeric_medians': {}
            }
            for col in numeric_features:
                try:
                    metadata['numeric_medians'][col] = float(X[col].median())
                except Exception:
                    metadata['numeric_medians'][col] = 0.0

            metadata['ranges'] = {}
            for col in categorical_features + ordinal_features:
                try:
                    metadata['ranges'][col] = list(X[col].dropna().unique()[:100])
                except Exception:
                    metadata['ranges'][col] = []

            joblib.dump(metadata, os.path.join(preprocessor_dir, 'beneficiation_metadata.joblib'))
            logger.info("Saved preprocessor and feature/target names.")

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
        
        # Check if we have the expected number of columns
        expected_min_cols = 10  # Adjust based on your expectations
        if len(processed_df.columns) < expected_min_cols:
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
    processed_path = os.path.join(project_root, 'data', 'processed', 'beneficiation_processed.csv')

    print("Script started.")
    try:
        processed_df, preprocessor = preprocess_beneficiation_data(raw_path, processed_path)
        if validate_preprocessing(raw_path, processed_path):
            logger.info("Beneficiation preprocessing completed successfully")
        else:
            logger.warning("Beneficiation preprocessing completed with warnings")
    except Exception as e:
        logger.error(f"Beneficiation preprocessing failed: {str(e)}")
    print("Script finished running.")