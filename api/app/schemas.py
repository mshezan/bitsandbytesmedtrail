from datetime import date
from pydantic import BaseModel, ConfigDict, Field
import uuid

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    code: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: uuid.UUID
    role: str
    name: str
    phone: str
    email: str | None

    model_config = ConfigDict(from_attributes=True)

class PatientResponse(BaseModel):
    id: uuid.UUID
    dob: date
    sex: str
    blood_group: str | None
    emergency_contact: str | None
    abha_number: str | None = None
    abha_address: str | None = None
    insurance: str | None = None
    phone: str | None = None
    city: str | None = None
    state: str | None = None
    language: str | None = None
    address: str | None = None
    preferred_hospital: str | None = None
    notification_preferences: dict
    privacy_preferences: dict
    profile_photo_url: str | None = None

    model_config = ConfigDict(from_attributes=True)

class MeResponse(BaseModel):
    user: UserResponse
    patient: PatientResponse | None
