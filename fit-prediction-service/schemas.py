from typing import Any

from pydantic import BaseModel, Field


class UserFeaturesIn(BaseModel):
    height: float | None = None
    weight: float | None = None
    bodyShape: str | None = None
    shoulderType: str | None = None
    fitPreference: str | None = None


class ProductFeaturesIn(BaseModel):
    chest: float | None = None
    waist: float | None = None
    shoulder: float | None = None
    stretchLevel: str | None = None


class FitPredictRequest(BaseModel):
    """Spring sends nested userFeatures + productFeatures + size."""

    userFeatures: UserFeaturesIn | None = None
    productFeatures: ProductFeaturesIn | None = None
    size: str = Field(..., min_length=1)


class FitPredictResponse(BaseModel):
    probability: float = Field(..., ge=0.0, le=1.0, description="P(GOOD FIT)")


class TrainModelRequest(BaseModel):
    """Either `rows` from Spring Boot export, legacy CSV, or database."""

    rows: list[dict[str, Any]] | None = None
    csv_path: str | None = Field(
        default=None,
        description="Path to training CSV; defaults to data/training_data.csv",
    )
    database_url: str | None = Field(
        default=None,
        description="If set with sql_query, load training rows via SQLAlchemy",
    )
    sql_query: str | None = Field(
        default=None,
        description="SELECT must return training columns + good_fit",
    )


class TrainModelResponse(BaseModel):
    message: str
    accuracy: float
    model_path: str
    n_train: int
    n_test: int
