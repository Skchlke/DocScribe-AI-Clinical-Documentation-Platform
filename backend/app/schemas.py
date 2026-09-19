from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date


# ─── Prescriptions ────────────────────────────────────────────────

class PrescriptionItemCreate(BaseModel):
    medicine: str
    brand_name: Optional[str] = ""
    form: Optional[str] = ""
    dosage: Optional[str] = ""
    frequency: Optional[str] = ""
    timing: Optional[str] = ""
    duration: Optional[str] = ""
    instructions: Optional[str] = ""


class PrescriptionItemResponse(PrescriptionItemCreate):
    id: int

    class Config:
        from_attributes = True


# ─── Documents ────────────────────────────────────────────────────

class AppointmentDocumentResponse(BaseModel):
    id: int
    category: Optional[str] = ""
    original_filename: str
    file_path: str
    content_type: Optional[str] = ""
    file_size: Optional[int] = None
    upload_date: datetime

    class Config:
        from_attributes = True


# ─── Appointments ─────────────────────────────────────────────────

class AppointmentCreate(BaseModel):
    appointment_datetime: datetime
    doctor: Optional[str] = ""
    visit_type: Optional[str] = ""
    status: Optional[str] = "Scheduled"
    reason_for_visit: Optional[str] = ""

    chief_complaint: Optional[str] = ""
    symptoms: Optional[List[str]] = []
    vital_signs: Optional[Dict[str, Any]] = {}
    examination_findings: Optional[str] = ""
    diagnosis: Optional[str] = ""

    advice: Optional[str] = ""
    investigations_ordered: Optional[List[str]] = []

    follow_up_date: Optional[date] = None
    follow_up_instructions: Optional[str] = ""
    doctor_notes: Optional[str] = ""

    prescriptions: Optional[List[PrescriptionItemCreate]] = []


class AppointmentUpdate(AppointmentCreate):
    pass


class AppointmentResponse(BaseModel):
    appointment_id: int
    patient_id: int
    appointment_datetime: datetime
    doctor: Optional[str] = ""
    visit_type: Optional[str] = ""
    status: Optional[str] = "Scheduled"
    reason_for_visit: Optional[str] = ""

    chief_complaint: Optional[str] = ""
    symptoms: List[str] = []
    vital_signs: Dict[str, Any] = {}
    examination_findings: Optional[str] = ""
    diagnosis: Optional[str] = ""

    advice: Optional[str] = ""
    investigations_ordered: List[str] = []

    follow_up_date: Optional[date] = None
    follow_up_instructions: Optional[str] = ""
    doctor_notes: Optional[str] = ""

    created_at: datetime
    updated_at: datetime

    prescriptions: List[PrescriptionItemResponse] = []
    documents: List[AppointmentDocumentResponse] = []

    class Config:
        from_attributes = True


class AppointmentSummary(BaseModel):
    """Lightweight shape used in flat/cross-patient appointment listings."""
    appointment_id: int
    patient_id: int
    patient_name: str
    appointment_datetime: datetime
    doctor: Optional[str] = ""
    visit_type: Optional[str] = ""
    status: Optional[str] = "Scheduled"
    reason_for_visit: Optional[str] = ""
    follow_up_date: Optional[date] = None


# ─── Patients ─────────────────────────────────────────────────────

class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    address: Optional[str] = ""
    emergency_contact: Optional[str] = ""

    blood_group: Optional[str] = ""
    allergies: Optional[List[str]] = []
    existing_conditions: Optional[List[str]] = []
    past_surgeries: Optional[List[str]] = []
    current_medications: Optional[List[str]] = []
    family_history: Optional[str] = ""
    important_medical_notes: Optional[str] = ""


class PatientUpdate(PatientCreate):
    pass


class PatientResponse(BaseModel):
    patient_id: int
    unique_patient_number: Optional[str] = ""
    first_name: str
    last_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    address: Optional[str] = ""
    emergency_contact: Optional[str] = ""
    profile_photo_path: Optional[str] = ""

    blood_group: Optional[str] = ""
    allergies: List[str] = []
    existing_conditions: List[str] = []
    past_surgeries: List[str] = []
    current_medications: List[str] = []
    family_history: Optional[str] = ""
    important_medical_notes: Optional[str] = ""

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PatientDetailResponse(PatientResponse):
    appointments: List[AppointmentResponse] = []


# ─── Clinic Settings ────────────────────────────────────────────────

class ClinicSettingsUpdate(BaseModel):
    clinic_name: Optional[str] = ""
    clinic_address: Optional[str] = ""
    clinic_phone: Optional[str] = ""
    clinic_email: Optional[str] = ""
    doctor_name: Optional[str] = ""
    doctor_qualifications: Optional[str] = ""
    doctor_registration_number: Optional[str] = ""


class ClinicSettingsResponse(ClinicSettingsUpdate):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── Misc ─────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_patients: int
    total_appointments: int
    scheduled_appointments: int
    completed_appointments: int
    upcoming_followups: int
