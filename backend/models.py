import uuid
from sqlalchemy import Column, String, Float, DateTime, Text, Integer, UniqueConstraint, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from database import Base


class Place(Base):
    __tablename__ = "places"
    __table_args__ = (UniqueConstraint("restaurant_name", "region", name="uq_place_region"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_name = Column(String(200), nullable=False, index=True)
    region = Column(String(100), index=True)
    country = Column(String(2))
    category = Column(String(50))
    address = Column(Text)
    lat = Column(Float)
    lng = Column(Float)
    insta_summary = Column(Text)
    instagram_url = Column(Text)
    thumbnail_url = Column(Text)
    rating_info = Column(String(100))
    source = Column(String(50), default="Instagram")
    crawled_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firebase_uid = Column(String, unique=True, nullable=False)
    email = Column(String(200))
    display_name = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Bookmark(Base):
    __tablename__ = "bookmarks"
    __table_args__ = (UniqueConstraint("user_id", "place_id", name="uq_bookmark"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    place_id = Column(UUID(as_uuid=True), ForeignKey("places.id", ondelete="CASCADE"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CrawlLog(Base):
    __tablename__ = "crawl_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    started_at = Column(DateTime(timezone=True))
    finished_at = Column(DateTime(timezone=True))
    places_added = Column(Integer, default=0)
    status = Column(String(20))
    error_message = Column(Text)
