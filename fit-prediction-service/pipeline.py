"""
Fit prediction: preprocessing + classifier, persisted with joblib.
"""
from __future__ import annotations

import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

# Column groups (must match training CSV and API)
NUMERIC_FEATURES = [
    "height",
    "weight",
    "productChest",
    "productWaist",
    "productShoulder",
]
CATEGORICAL_FEATURES = [
    "bodyShape",
    "shoulderType",
    "fitPreference",
    "stretchLevel",
    "size",
]
TARGET_COL = "good_fit"
REQUIRED_COLS = NUMERIC_FEATURES + CATEGORICAL_FEATURES + [TARGET_COL]

DEFAULT_DATA_DIR = Path(__file__).resolve().parent / "data"
DEFAULT_CSV = DEFAULT_DATA_DIR / "training_data.csv"
ARTIFACTS_DIR = Path(__file__).resolve().parent / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "fit_model.joblib"

RANDOM_STATE = 42


def _build_pipeline() -> Pipeline:
    numeric_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    categorical_transformer = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(strategy="most_frequent"),
            ),
            (
                "onehot",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
            ),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, NUMERIC_FEATURES),
            ("cat", categorical_transformer, CATEGORICAL_FEATURES),
        ]
    )

    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )

    return Pipeline(
        steps=[
            ("preprocess", preprocessor),
            ("classifier", clf),
        ]
    )


def load_training_frame(csv_path: Path) -> pd.DataFrame:
    if not csv_path.is_file():
        raise FileNotFoundError(f"Training CSV not found: {csv_path}")
    df = pd.read_csv(csv_path)
    missing = set(REQUIRED_COLS) - set(df.columns)
    if missing:
        raise ValueError(f"CSV missing columns: {sorted(missing)}")
    df = df.dropna(subset=[TARGET_COL])
    df[TARGET_COL] = df[TARGET_COL].astype(int)
    if not set(df[TARGET_COL].unique()).issubset({0, 1}):
        raise ValueError(f"{TARGET_COL} must be 0 or 1")
    if df[TARGET_COL].nunique() < 2:
        raise ValueError("Need both good_fit=0 and good_fit=1 rows to train a binary classifier.")
    return df


def _stratify_if_possible(y: pd.Series):
    if len(y) < 4 or y.nunique() < 2:
        return None
    counts = y.value_counts()
    if counts.min() < 2:
        return None
    return y


def _normalize_training_df(df: pd.DataFrame) -> pd.DataFrame:
    missing = set(REQUIRED_COLS) - set(df.columns)
    if missing:
        raise ValueError(f"DataFrame missing columns: {sorted(missing)}")
    out = df.dropna(subset=[TARGET_COL]).copy()
    out[TARGET_COL] = out[TARGET_COL].astype(int)
    if not set(out[TARGET_COL].unique()).issubset({0, 1}):
        raise ValueError(f"{TARGET_COL} must be 0 or 1")
    if out[TARGET_COL].nunique() < 2:
        raise ValueError("Need both good_fit=0 and good_fit=1 rows to train a binary classifier.")
    return out


def train_and_save(
    csv_path: Path | None = None,
    df: pd.DataFrame | None = None,
    rows: list[dict] | None = None,
) -> tuple[float, str, int, int]:
    if rows is not None:
        if not rows:
            raise ValueError("rows is empty")
        df = pd.DataFrame(rows)
        df = _normalize_training_df(df)
    elif df is None:
        csv_path = csv_path or DEFAULT_CSV
        df = load_training_frame(Path(csv_path))
    else:
        df = _normalize_training_df(df)

    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df[TARGET_COL]

    strat = _stratify_if_possible(y)
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=RANDOM_STATE,
        stratify=strat,
    )

    pipe = _build_pipeline()
    pipe.fit(X_train, y_train)

    y_pred = pipe.predict(X_test)
    acc = float(accuracy_score(y_test, y_pred))
    print(f"[train] Test accuracy: {acc:.4f}")
    print(f"[train] Train rows: {len(X_train)}, Test rows: {len(X_test)}")

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipe, MODEL_PATH)
    print(f"[train] Model saved to {MODEL_PATH}")

    return acc, str(MODEL_PATH), len(X_train), len(X_test)


def load_model() -> Pipeline:
    if not MODEL_PATH.is_file():
        raise FileNotFoundError(
            f"No trained model at {MODEL_PATH}. Call POST /train-model first."
        )
    return joblib.load(MODEL_PATH)


def predict_good_fit_probability(features: dict) -> float:
    pipe = load_model()
    row = pd.DataFrame([features])
    for c in NUMERIC_FEATURES + CATEGORICAL_FEATURES:
        if c not in row.columns:
            raise ValueError(f"Missing feature: {c}")
    for c in CATEGORICAL_FEATURES:
        v = row.at[0, c]
        if pd.isna(v):
            row.at[0, c] = "UNKNOWN"
        else:
            row.at[0, c] = str(v).strip().upper() or "UNKNOWN"
    X = row[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    if not hasattr(pipe.named_steps["classifier"], "predict_proba"):
        raise RuntimeError("Classifier does not support predict_proba")
    proba = pipe.predict_proba(X)[0]
    # Binary: index 1 = positive class GOOD FIT
    classes = list(pipe.named_steps["classifier"].classes_)
    if 1 in classes:
        idx = classes.index(1)
    else:
        # fallback: last class is positive
        idx = -1
    p = float(np.clip(proba[idx], 0.0, 1.0))
    return p
