import os
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, OneHotEncoder, OrdinalEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
import joblib

def preprocess_mining_data(input_path, output_path, save_encoders=True):
    """
    Preprocess mining data for LCA modeling.

    Parameters:
    input_path (str): Path to the raw dataset CSV file.
    output_path (str): Path where the processed dataset will be saved.
    save_encoders (bool): Whether to save preprocessing objects for inference.

    Returns:
    pd.DataFrame: The processed mining dataset.
    ColumnTransformer: The fitted preprocessing pipeline.
    """
    print("Loading raw dataset...")
    df = pd.read_csv(input_path)
    
    # Define mining-specific features
    mining_features = [
        'mining_method', 'mining_equipment_type', 'mining_ore_grade_percent',
        'mining_overburden_ratio', 'mining_water_m3_per_t_ore', 
        'mining_land_use_impact', 
        'location', 'year'  # Contextual features
    ]
    
    # Define target variables for mining
    mining_targets = [
        'mining_energy_MJ_per_t_ore', 'mining_co2_kg_per_t_ore',
        'mining_sox_kg_per_t_ore', 'mining_nox_kg_per_t_ore',
        'mining_pm_kg_per_t_ore'
    ]
    
    print("Selecting relevant columns...")
    mining_df = df[mining_features + mining_targets].copy()
    
    # Imputation strategies
    numeric_imputer = SimpleImputer(strategy='median')
    categorical_imputer = SimpleImputer(strategy='most_frequent')
    
    # Feature definitions
    numeric_features = ['mining_ore_grade_percent', 'mining_overburden_ratio', 
                        'mining_water_m3_per_t_ore']
    categorical_features = ['mining_method', 'mining_equipment_type', 'location']
    ordinal_features = ['mining_land_use_impact']
    
    # Ordinal categories mapping
    land_use_mapping = [['Low', 'Moderate', 'High']]
    
    print("Creating transformers for numeric, categorical, and ordinal features...")
    numeric_transformer = Pipeline(steps=[
        ('imputer', numeric_imputer),
        ('scaler', StandardScaler())])
    
    categorical_transformer = Pipeline(steps=[
        ('imputer', categorical_imputer),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))])
    
    ordinal_transformer = Pipeline(steps=[
        ('imputer', categorical_imputer),
        ('ordinal', OrdinalEncoder(categories=land_use_mapping))])
    
    print("Combining transformers into ColumnTransformer...")
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features),
            ('ord', ordinal_transformer, ordinal_features)],
        remainder='passthrough')  # Keep 'year' column as is
    
    print("Preparing features and target...")
    feature_names = numeric_features + categorical_features + ordinal_features + ['year']
    X = mining_df[feature_names]
    y = mining_df[mining_targets]
    
    print("Applying preprocessing pipeline...")
    X_processed = preprocessor.fit_transform(X)
    
    print("Extracting feature names...")
    cat_features_names = preprocessor.named_transformers_['cat'].named_steps['onehot'].get_feature_names_out(categorical_features)
    all_feature_names = numeric_features + list(cat_features_names) + ordinal_features + ['year']
    
    print("Creating final processed DataFrame...")
    processed_df = pd.DataFrame(X_processed, columns=all_feature_names)
    for i, target in enumerate(mining_targets):
        processed_df[target] = y.iloc[:, i].values
    
    print(f"Saving processed data to {output_path}...")
    processed_df.to_csv(output_path, index=False)
    
    if save_encoders:
        # Always save to preprocessing folder in project root
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        preprocessor_dir = os.path.join(project_root, 'preprocessing')
        os.makedirs(preprocessor_dir, exist_ok=True)

        preprocessor_path = os.path.join(preprocessor_dir, 'mining_preprocessor.joblib')
        feature_names_path = os.path.join(preprocessor_dir, 'mining_feature_names.joblib')

        print(f"Saving preprocessor pipeline to {preprocessor_path}...")
        joblib.dump(preprocessor, preprocessor_path)

        print(f"Saving feature names to {feature_names_path}...")
        joblib.dump(all_feature_names, feature_names_path)
    
    print("Preprocessing complete.")
    return processed_df, preprocessor

if __name__ == "__main__":
    raw_path = '../data/raw/comprehensive_aluminium_lca_dataset_INDIA.csv'
    processed_path = '../data/processed/mining_processed.csv'
    preprocess_mining_data(raw_path, processed_path)
