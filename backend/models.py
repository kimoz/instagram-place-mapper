from sqlalchemy import Column, Integer, String, Float
from database import Base

class Place(Base):
    __tablename__ = "places"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_name = Column(String, index=True)
    region = Column(String, index=True)
    country = Column(String)
    insta_summary = Column(String)
    
    # 지도 및 추가 정보
    address = Column(String)
    category = Column(String)
    rating_info = Column(String)
    source = Column(String)
    lat = Column(Float)
    lng = Column(Float)
