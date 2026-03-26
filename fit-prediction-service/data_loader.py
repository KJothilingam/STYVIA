"""Load training data from CSV or SQL database."""
from __future__ import annotations

from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine


def load_from_database(database_url: str, query: str) -> pd.DataFrame:
    engine = create_engine(database_url)
    with engine.connect() as conn:
        return pd.read_sql(query, conn)
