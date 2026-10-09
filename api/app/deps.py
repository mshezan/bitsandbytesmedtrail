from typing import Generator, Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from pydantic import ValidationError

from app.database import SessionLocal
from app.config import settings
from app.models import User, Patient
from app.auth import ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/otp/verify")

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(oauth2_scheme)]

def get_current_user(db: SessionDep, token: TokenDep) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except (JWTError, ValidationError):
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

CurrentUser = Annotated[User, Depends(get_current_user)]

def get_current_patient(user: CurrentUser, db: SessionDep) -> Patient:
    if user.role != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    patient = db.query(Patient).filter(Patient.user_id == user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return patient

CurrentPatient = Annotated[Patient, Depends(get_current_patient)]
