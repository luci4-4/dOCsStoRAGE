from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import scrape, logs, export, ingest

app = FastAPI(title="DocStorage Scraper", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scrape.router, prefix="/scrape", tags=["scrape"])
app.include_router(logs.router, prefix="/logs", tags=["logs"])
app.include_router(export.router, prefix="/export", tags=["export"])
app.include_router(ingest.router, prefix="/ingest", tags=["ingest"])


@app.get("/health")
def health():
    return {"status": "ok"}
