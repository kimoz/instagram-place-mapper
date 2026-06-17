import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
from routers.places import router as places_router
from routers.admin import router as admin_router
from dependencies import get_db  # noqa: F401 — exposed for test dependency override

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Instagram Place Mapper API")

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)

app.include_router(places_router)
app.include_router(admin_router)


@app.get("/")
def read_root():
    return {"message": "Instagram Place Mapper API"}
