"""
Link data models
"""
from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

class LinkBase(BaseModel):
    url: HttpUrl
    title: Optional[str] = None
    description: Optional[str] = None
    tags: List[str] = []

class LinkCreate(LinkBase):
    pass

class LinkUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None

class Link(LinkBase):
    id: str = Field(alias="_id")
    userId: str
    content: str
    contentSize: int
    createdAt: datetime
    updatedAt: datetime
    metadata: dict = {}
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class LinkListResponse(BaseModel):
    links: List[Link]
    total: int
    page: int
    limit: int
