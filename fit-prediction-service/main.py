"""
FastAPI microservice: fit (GOOD FIT) probability via scikit-learn + joblib.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException

from data_loader import load_from_database
from pipeline import DEFAULT_CSV, MODEL_PATH, predict_good_fit_probability, train_and_save
from schemas import (
    FitPredictRequest,
    FitPredictResponse,
    ProductFeaturesIn,
    TrainModelRequest,
    TrainModelResponse,
    UserFeaturesIn,
)

app = FastAPI(
    title="Fit Prediction Service",
    version="1.1.0",
    description="Classifies likelihood of GOOD FIT from body + garment features.",
)


def _norm_cat(value: str | None, default: str = "UNKNOWN") -> str:
    t = (value or "").strip().upper()
    return t if t else default


def flatten_predict_request(body: FitPredictRequest) -> dict[str, Any]:
    u: UserFeaturesIn = body.userFeatures or UserFeaturesIn()
    p: ProductFeaturesIn = body.productFeatures or ProductFeaturesIn()
    return {
        "height": u.height,
        "weight": u.weight,
        "bodyShape": _norm_cat(u.bodyShape),
        "shoulderType": _norm_cat(u.shoulderType),
        "fitPreference": _norm_cat(u.fitPreference, "REGULAR"),
        "productChest": p.chest,
        "productWaist": p.waist,
        "productShoulder": p.shoulder,
        "stretchLevel": _norm_cat(p.stretchLevel, "MEDIUM"),
        "size": body.size.strip().upper(),
    }


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": Path(MODEL_PATH).is_file()}


@app.post("/predict-fit", response_model=FitPredictResponse)
def predict_fit(body: FitPredictRequest):
    try:
        features = flatten_predict_request(body)
        p = predict_good_fit_probability(features)
        return FitPredictResponse(probability=round(p, 4))
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@app.post("/train-model", response_model=TrainModelResponse)
def train_model(body: TrainModelRequest | None = None):
    body = body or TrainModelRequest()
    try:
        if body.rows is not None:
            if len(body.rows) == 0:
                raise HTTPException(status_code=400, detail="rows is empty")
            acc, path, n_train, n_test = train_and_save(rows=body.rows)
        elif body.database_url and body.sql_query:
            df = load_from_database(body.database_url, body.sql_query)
            acc, path, n_train, n_test = train_and_save(df=df)
        else:
            csv_path = Path(body.csv_path) if body.csv_path else DEFAULT_CSV
            acc, path, n_train, n_test = train_and_save(csv_path=csv_path)
        return TrainModelResponse(
            message="Training completed",
            accuracy=round(acc, 4),
            model_path=path,
            n_train=n_train,
            n_test=n_test,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
