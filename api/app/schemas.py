from datetime import date
from pydantic import BaseModel, ConfigDict
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

    model_config = ConfigDict(from_attributes=True)

class MeResponse(BaseModel):
    user: UserResponse
    patient: PatientResponse | None
