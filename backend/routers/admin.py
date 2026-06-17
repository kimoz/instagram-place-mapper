import os
from fastapi import APIRouter, Header, HTTPException
from database import SessionLocal
import models

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _verify_admin(x_admin_secret: str = Header(None)):
    expected = os.environ.get("ADMIN_SECRET")
    if not expected or x_admin_secret != expected:
        raise HTTPException(status_code=403, detail="Forbidden")


@router.post("/pipeline/run")
def trigger_pipeline(x_admin_secret: str = Header(None)):
    _verify_admin(x_admin_secret)
    import threading
    from pipeline.runner import run_pipeline
    result_holder: dict = {}

    def _run():
        result_holder.update(run_pipeline())

    t = threading.Thread(target=_run, daemon=False)
    t.start()
    return {"message": "Pipeline started in background"}


@router.get("/pipeline/logs")
def get_pipeline_logs(x_admin_secret: str = Header(None)):
    _verify_admin(x_admin_secret)
    db = SessionLocal()
    try:
        logs = (
            db.query(models.CrawlLog)
            .order_by(models.CrawlLog.started_at.desc())
            .limit(20)
            .all()
        )
        return {
            "logs": [
                {
                    "id": str(log.id),
                    "started_at": log.started_at.isoformat() if log.started_at else None,
                    "finished_at": log.finished_at.isoformat() if log.finished_at else None,
                    "places_added": log.places_added,
                    "status": log.status,
                    "error_message": log.error_message,
                }
                for log in logs
            ]
        }
    finally:
        db.close()
