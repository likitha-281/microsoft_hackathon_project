from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.db.database import get_db
from backend.app.schemas.agent import PatternItem
from backend.app.services.pattern_service import pattern_service

router = APIRouter(prefix="/patterns", tags=["Patterns"])

@router.get("", response_model=List[PatternItem])
def get_patterns(db: Session = Depends(get_db)):
    """
    Answers: 'What keeps going wrong?'
    Shows patterns dynamically discovered from stored incident experiences.
    Includes exact incident counts, common signals, common failed actions, and common successful actions.
    """
    return pattern_service.get_patterns(db)
