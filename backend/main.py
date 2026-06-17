import os
from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware

from database import engine, SessionLocal, Base
import models
from sqlalchemy.orm import Session

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Instagram Place Mapper API")

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/api/places/search")
def search_places(
    region: str = Query(default="성수동", max_length=100),
    db: Session = Depends(get_db),
):
    places = db.query(models.Place).filter(
        models.Place.region.contains(region, autoescape=True)
    ).all()
    
    results = []
    for p in places:
        results.append({
            "id": str(p.id),
            "restaurant_name": p.restaurant_name,
            "region": p.region,
            "country": p.country,
            "insta_summary": p.insta_summary,
            "map_data": {
                "address": p.address,
                "category": p.category,
                "rating_info": p.rating_info,
                "source": p.source,
                "lat": p.lat,
                "lng": p.lng
            }
        })
    
    return {
        "success": True,
        "region": region,
        "data": results
    }

@app.get("/")
def read_root():
    return {"message": "Welcome to Instagram Discovery API with SQLite"}
