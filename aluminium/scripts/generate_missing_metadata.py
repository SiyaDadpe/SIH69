"""Generate missing preprocessing metadata joblib files for stages: mining, refining, smelting.
This script reads feature name joblib artifacts and the raw CSV, computes simple metadata
(numeric/categorical/binary lists, numeric medians, sample ranges) and saves them as
preprocessing/{prefix}_metadata.joblib so APIs can use them without re-running preprocessors.
"""
import os
import joblib
import pandas as pd
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
RAW_CSV = os.path.join(PROJECT_ROOT, 'data', 'raw', 'comprehensive_aluminium_lca_dataset_INDIA.csv')
PREPROC_DIR = os.path.join(PROJECT_ROOT, 'preprocessing')
os.makedirs(PREPROC_DIR, exist_ok=True)

prefixes = ['mining', 'refining', 'smelting']

if not os.path.exists(RAW_CSV):
    print('Raw CSV not found at', RAW_CSV)
    sys.exit(1)

print('Loading raw CSV from', RAW_CSV)
raw = pd.read_csv(RAW_CSV)

for prefix in prefixes:
    feat_path = os.path.join(PREPROC_DIR, f'{prefix}_feature_names.joblib')
    out_path = os.path.join(PREPROC_DIR, f'{prefix}_metadata.joblib')
    if not os.path.exists(feat_path):
        print(f'Feature names for {prefix} not found at {feat_path}; skipping')
        continue
    try:
        fn = joblib.load(feat_path)
        # ensure list
        if hasattr(fn, 'tolist'):
            try:
                fn = fn.tolist()
            except Exception:
                fn = list(fn)
        else:
            fn = list(fn)
    except Exception as e:
        print('Failed to load feature names for', prefix, e)
        continue

    numeric_cols = []
    categorical_cols = []
    binary_cols = []
    ordinal_cols = []
    medians = {}
    ranges = {}

    for c in fn:
        if c in raw.columns:
            ser = raw[c]
            # try numeric
            if pd.api.types.is_numeric_dtype(ser):
                numeric_cols.append(c)
                try:
                    medians[c] = float(ser.median()) if not ser.dropna().empty else 0.0
                except Exception:
                    medians[c] = 0.0
            else:
                categorical_cols.append(c)
                try:
                    ranges[c] = list(ser.dropna().unique()[:100])
                except Exception:
                    ranges[c] = []
            # detect binary-like
            uniques = set([str(x).strip().lower() for x in ser.dropna().unique()])
            if uniques.issubset({'0','1','true','false','yes','no','y','n'}):
                if c not in binary_cols:
                    binary_cols.append(c)
        else:
            # If the feature name looks like one-hot (col_prefix_val), try to infer base column
            if '_' in c:
                base = c.split('_')[0]
                if base in raw.columns:
                    ser = raw[base]
                    if pd.api.types.is_numeric_dtype(ser):
                        if base not in numeric_cols:
                            numeric_cols.append(base)
                            try:
                                medians[base] = float(ser.median()) if not ser.dropna().empty else 0.0
                            except Exception:
                                medians[base] = 0.0
                    else:
                        if base not in categorical_cols:
                            categorical_cols.append(base)
                            try:
                                ranges[base] = list(ser.dropna().unique()[:100])
                            except Exception:
                                ranges[base] = []

    metadata = {
        'numeric_columns': list(sorted(set(numeric_cols))),
        'categorical_columns': list(sorted(set(categorical_cols))),
        'ordinal_columns': list(sorted(set(ordinal_cols))),
        'binary_columns': list(sorted(set(binary_cols))),
        'numeric_medians': medians,
        'ranges': ranges
    }

    try:
        joblib.dump(metadata, out_path)
        print('Wrote metadata for', prefix, 'to', out_path)
    except Exception as e:
        print('Failed to write metadata for', prefix, e)

print('Done')
