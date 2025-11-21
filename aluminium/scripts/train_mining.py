import os
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.multioutput import MultiOutputRegressor
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split, cross_val_score
import json
from datetime import datetime

def train_mining_model(processed_data_path, model_output_path, test_size=0.2, random_state=42):
    """
    Train the mining model using preprocessed data with enhanced evaluation and logging.

    Parameters:
    processed_data_path (str): Path to the processed mining dataset CSV.
    model_output_path (str): Path to save the trained model.
    test_size (float): Fraction of data to use as test set.
    random_state (int): Random seed for reproducibility.

    Returns:
    dict: Dictionary containing performance metrics
    """
    print("Loading processed mining data...")
    df = pd.read_csv(processed_data_path)

    # Load feature names
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    feature_names_path = os.path.join(project_root, 'preprocessing', 'mining_feature_names.joblib')
    all_feature_names = joblib.load(feature_names_path)

    # Identify target columns (last 5 columns)
    target_cols = df.columns[-5:].tolist()
    feature_cols = all_feature_names

    print("Preparing feature matrix X and target matrix y...")
    X = df[feature_cols].values
    y = df[target_cols].values

    print("Splitting data into training and test sets...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state
    )

    print("Initializing GradientBoostingRegressor with optimized parameters...")
    # Using slightly tuned parameters for better performance
    base_model = GradientBoostingRegressor(
        n_estimators=150,
        learning_rate=0.1,
        max_depth=5,
        random_state=random_state,
        subsample=0.8
    )
    model = MultiOutputRegressor(base_model)

    print("Training the model...")
    model.fit(X_train, y_train)

    print("Making predictions on test set...")
    y_pred = model.predict(X_test)

    print("Evaluating model performance...")
    metrics = {}
    
    for i, target in enumerate(target_cols):
        rmse = mean_squared_error(y_test[:, i], y_pred[:, i], squared=False)
        mae = mean_absolute_error(y_test[:, i], y_pred[:, i])
        r2 = r2_score(y_test[:, i], y_pred[:, i])
        
        metrics[target] = {
            'RMSE': float(rmse),
            'MAE': float(mae),
            'R2': float(r2)
        }
        
        print(f"Target: {target}")
        print(f" - RMSE: {rmse:.3f}")
        print(f" - MAE: {mae:.3f}")
        print(f" - R²: {r2:.3f}\n")

    # Add cross-validation for more robust evaluation
    print("Performing cross-validation...")
    cv_scores = {}
    for i, target in enumerate(target_cols):
        scores = cross_val_score(
            model.estimators_[i], X, y[:, i], 
            cv=5, scoring='neg_mean_squared_error'
        )
        cv_rmse = np.sqrt(-scores.mean())
        cv_scores[target] = float(cv_rmse)
        print(f"Target: {target} - CV RMSE: {cv_rmse:.3f}")
    
    metrics['cross_validation'] = cv_scores

    # Plot feature importance for the first target (energy)
    plot_feature_importance(model.estimators_[0], feature_cols, target_cols[0], model_output_path)

    print(f"Saving trained model to {model_output_path}...")
    os.makedirs(os.path.dirname(model_output_path), exist_ok=True)
    joblib.dump(model, model_output_path)

    # Save performance metrics
    metrics_path = os.path.join(os.path.dirname(model_output_path), 'mining_model_metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=4)
    
    # Save training metadata
    metadata = {
        'training_date': datetime.now().isoformat(),
        'model_type': 'GradientBoostingRegressor',
        'feature_names': feature_cols,
        'target_names': target_cols,
        'dataset_size': len(df),
        'test_size': test_size,
        'random_state': random_state
    }
    
    metadata_path = os.path.join(os.path.dirname(model_output_path), 'mining_model_metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=4)

    print("Model training complete. Model, metrics, and metadata saved successfully.")
    return metrics

def plot_feature_importance(model, feature_names, target_name, model_output_path):
    """Plot and save feature importance visualization"""
    importance = model.feature_importances_
    indices = np.argsort(importance)[::-1]
    
    plt.figure(figsize=(12, 8))
    plt.title(f"Feature Importance for {target_name}", fontsize=16)
    bars = plt.bar(range(len(importance)), importance[indices])
    plt.xticks(range(len(importance)), [feature_names[i] for i in indices], rotation=45, ha='right')
    plt.ylabel('Importance', fontsize=12)
    plt.tight_layout()
    
    # Save the plot
    plots_dir = os.path.join(os.path.dirname(model_output_path), 'plots')
    os.makedirs(plots_dir, exist_ok=True)
    plot_path = os.path.join(plots_dir, f'feature_importance_{target_name}.png')
    plt.savefig(plot_path)
    plt.close()
    
    print(f"Feature importance plot saved to {plot_path}")

if __name__ == "__main__":
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    processed_data_path = os.path.join(project_root, 'data', 'processed', 'mining_processed.csv')
    model_output_path = os.path.join(project_root, 'models', 'mining_model.joblib')
    
    metrics = train_mining_model(processed_data_path, model_output_path)