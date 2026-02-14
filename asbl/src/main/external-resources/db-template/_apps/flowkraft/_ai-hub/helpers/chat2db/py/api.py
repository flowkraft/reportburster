"""
Chat2DB FastAPI Backend

Wraps the Chat2DB engine in a lightweight HTTP API.
All SQL execution and visualization rendering happens here (Python + JDBC).
The Next.js frontend calls these endpoints and renders results natively.
"""

import math
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from chat2db import Chat2DB


# ---------------------------------------------------------------------------
# Lifespan: init / cleanup
# ---------------------------------------------------------------------------

chat: Optional[Chat2DB] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global chat
    chat = Chat2DB()
    yield
    if chat:
        chat.close()
        chat = None


app = FastAPI(title="Chat2DB Fast", lifespan=lifespan)


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class ConnectRequest(BaseModel):
    connection_code: str


class AskRequest(BaseModel):
    question: str
    send_schema: bool = True


class SqlRequest(BaseModel):
    query: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _sanitize_for_json(value):
    """Replace NaN/Infinity with None for JSON serialization."""
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    return value


def _df_to_records(df):
    """Convert DataFrame to JSON-safe list of dicts."""
    records = df.to_dict(orient="records")
    return [
        {k: _sanitize_for_json(v) for k, v in row.items()}
        for row in records
    ]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health():
    connected = chat is not None and chat._connection is not None
    return {
        "status": "ok",
        "connected": connected,
        "connection": chat._connection_config.code if connected and chat._connection_config else None,
    }


@app.get("/api/connections")
def list_connections():
    connections = chat.list_connections()
    return [
        {
            "code": c.code,
            "name": c.name,
            "db_type": c.db_type,
            "is_default": c.default_connection,
        }
        for c in connections
    ]


@app.post("/api/connect")
def connect(req: ConnectRequest):
    try:
        chat.connect(req.connection_code)
        return {
            "connected": True,
            "connection_code": req.connection_code,
            "schema": chat.schema(),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/ask")
def ask(req: AskRequest):
    if not chat._connection:
        raise HTTPException(status_code=400, detail="Not connected to a database. Call /api/connect first.")

    try:
        result = chat.ask(req.question, send_schema=req.send_schema)
        return {
            "question": result.question,
            "sql": result.sql or None,
            "data": _df_to_records(result.df) if len(result.df) > 0 else [],
            "row_count": result.row_count,
            "execution_time_ms": result.execution_time_ms,
            "explanation": result.explanation,
            "viz_image": result.viz_image,
            "text_response": result.text_response,
            "plantuml_code": result.plantuml_code,
            "mermaid_code": result.mermaid_code,
            "html_content": result.html_content,
            "content_segments": result.content_segments,
            "error": result.error,
            "raw_content": result.raw_content,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/sql")
def raw_sql(req: SqlRequest):
    if not chat._connection:
        raise HTTPException(status_code=400, detail="Not connected to a database. Call /api/connect first.")

    try:
        df = chat.sql(req.query)
        return {
            "data": _df_to_records(df),
            "row_count": len(df),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
