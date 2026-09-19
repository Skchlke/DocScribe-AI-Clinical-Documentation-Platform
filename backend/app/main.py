import os
import uuid
import shutil
import logging
import datetime

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional

from .database import engine, Base, get_db, SessionLocal
from . import schemas, crud, models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

UPLOAD_ROOT = os.environ.get("UPLOAD_DIR", "uploads")
os.makedirs(os.path.join(UPLOAD_ROOT, "patients"), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_ROOT, "appointments"), exist_ok=True)

# Initialize database tables (fresh schema — see database.py: docscribe.db)
Base.metadata.create_all(bind=engine)


def _seed_demo_data():
    with SessionLocal() as db:
        if db.query(models.Patient).count() > 0:
            return

        today = datetime.date.today()

        def days_ago(n):
            return datetime.datetime.utcnow() - datetime.timedelta(days=n)

        def days_ahead(n):
            return today + datetime.timedelta(days=n)

        patients_seed = [
            {
                "first_name": "Emily", "last_name": "Thompson",
                "date_of_birth": datetime.date(1985, 4, 12), "gender": "Female",
                "phone": "555-0199", "email": "emily.thompson@example.com",
                "address": "142 Maple Street, Riverdale",
                "emergency_contact": "Mark Thompson (Husband) - 555-0198",
                "blood_group": "O+",
                "allergies": ["NKDA"],
                "existing_conditions": ["Hypertension"],
                "past_surgeries": [],
                "current_medications": ["Lisinopril 20mg"],
                "family_history": "Mother has type 2 diabetes.",
                "important_medical_notes": "Prefers morning appointments.",
                "appointments": [
                    {
                        "appointment_datetime": days_ago(30),
                        "doctor": "Dr. Patel", "visit_type": "Initial Consultation",
                        "status": "Completed", "reason_for_visit": "Blood pressure check",
                        "chief_complaint": "Occasional dizziness in the morning.",
                        "symptoms": ["Dizziness"],
                        "vital_signs": {"bp": "142/90", "pulse": "78 bpm", "temperature": "98.4 F", "weight": "68 kg"},
                        "examination_findings": "Blood pressure mildly elevated. Heart and lungs clear.",
                        "diagnosis": "Hypertension, uncontrolled",
                        "follow_up_date": days_ahead(3),
                        "follow_up_instructions": "Recheck blood pressure in clinic.",
                        "doctor_notes": "Started on Lisinopril 20mg daily.",
                        "prescriptions": [
                            {"medicine": "Lisinopril", "dosage": "20mg", "frequency": "Once daily",
                             "duration": "30 days", "instructions": "Take in the morning with water."}
                        ],
                    },
                    {
                        "appointment_datetime": days_ago(2),
                        "doctor": "Dr. Patel", "visit_type": "Follow-up",
                        "status": "Completed", "reason_for_visit": "Blood pressure follow-up",
                        "chief_complaint": "Feeling better, no dizziness.",
                        "symptoms": [],
                        "vital_signs": {"bp": "120/80", "pulse": "72 bpm"},
                        "examination_findings": "Blood pressure well controlled.",
                        "diagnosis": "Controlled hypertension",
                        "follow_up_date": days_ahead(3),
                        "follow_up_instructions": "Continue current medication, recheck in 3 days.",
                        "doctor_notes": "",
                        "prescriptions": [
                            {"medicine": "Lisinopril", "dosage": "20mg", "frequency": "Once daily",
                             "duration": "30 days", "instructions": "Continue as before."}
                        ],
                    },
                ],
            },
            {
                "first_name": "David", "last_name": "Miller",
                "date_of_birth": datetime.date(1978, 9, 3), "gender": "Male",
                "phone": "555-0142", "email": "david.miller@example.com",
                "address": "88 Oak Avenue, Riverdale",
                "emergency_contact": "Susan Miller (Wife) - 555-0143",
                "blood_group": "A+",
                "allergies": ["Penicillin"],
                "existing_conditions": [],
                "past_surgeries": ["Appendectomy (2023)"],
                "current_medications": ["Tylenol 500mg as needed"],
                "family_history": "No significant family history reported.",
                "important_medical_notes": "",
                "appointments": [
                    {
                        "appointment_datetime": days_ago(10),
                        "doctor": "Dr. Nguyen", "visit_type": "Post-Op Check",
                        "status": "Completed", "reason_for_visit": "Post-appendectomy wound check",
                        "chief_complaint": "Mild discomfort at incision site.",
                        "symptoms": ["Mild discomfort"],
                        "vital_signs": {"temperature": "98.2 F", "bp": "118/76"},
                        "examination_findings": "Incision healing well, no signs of infection. Sutures removed.",
                        "diagnosis": "Normal post-operative healing",
                        "follow_up_date": days_ahead(4),
                        "follow_up_instructions": "Final wound check.",
                        "doctor_notes": "Cleared for light activity.",
                        "prescriptions": [
                            {"medicine": "Tylenol", "dosage": "500mg", "frequency": "As needed",
                             "duration": "7 days", "instructions": "For pain, do not exceed 4 doses/day."}
                        ],
                    },
                ],
            },
            {
                "first_name": "Sophia", "last_name": "Rodriguez",
                "date_of_birth": datetime.date(1992, 1, 21), "gender": "Female",
                "phone": "555-0177", "email": "sophia.rodriguez@example.com",
                "address": "27 Birchwood Lane, Riverdale",
                "emergency_contact": "Carla Rodriguez (Sister) - 555-0176",
                "blood_group": "B+",
                "allergies": ["Dust mites"],
                "existing_conditions": ["Asthma", "Seasonal allergies"],
                "past_surgeries": [],
                "current_medications": ["Albuterol HFA", "Flovent"],
                "family_history": "Father has asthma.",
                "important_medical_notes": "Carries rescue inhaler at all times.",
                "appointments": [
                    {
                        "appointment_datetime": days_ago(5),
                        "doctor": "Dr. Patel", "visit_type": "Follow-up",
                        "status": "Completed", "reason_for_visit": "Asthma flare-up follow-up",
                        "chief_complaint": "Wheezing when climbing stairs.",
                        "symptoms": ["Wheezing"],
                        "vital_signs": {"spo2": "97%", "resp_rate": "18/min", "pulse": "80 bpm"},
                        "examination_findings": "Mild expiratory wheeze bilaterally.",
                        "diagnosis": "Mild persistent asthma",
                        "follow_up_date": days_ahead(5),
                        "follow_up_instructions": "Return if symptoms worsen or inhaler use increases.",
                        "doctor_notes": "",
                        "prescriptions": [
                            {"medicine": "Albuterol HFA", "dosage": "90mcg", "frequency": "As needed",
                             "duration": "Ongoing", "instructions": "2 puffs for wheezing, max 4x/day."},
                            {"medicine": "Flovent", "dosage": "44mcg", "frequency": "Twice daily",
                             "duration": "Ongoing", "instructions": "2 puffs morning and night, rinse mouth after."},
                        ],
                    },
                    {
                        "appointment_datetime": datetime.datetime.combine(days_ahead(1), datetime.time(10, 30)),
                        "doctor": "Dr. Patel", "visit_type": "Routine Checkup",
                        "status": "Scheduled", "reason_for_visit": "Asthma control review",
                        "chief_complaint": "", "symptoms": [], "vital_signs": {},
                        "examination_findings": "", "diagnosis": "",
                        "follow_up_date": None, "follow_up_instructions": "", "doctor_notes": "",
                        "prescriptions": [],
                    },
                ],
            },
        ]

        for p in patients_seed:
            appts = p.pop("appointments")
            patient_in = schemas.PatientCreate(**p)
            created = crud.create_patient(db, patient_in)
            for a in appts:
                appt_in = schemas.AppointmentCreate(**a)
                crud.create_appointment(db, created["patient_id"], appt_in)

        logger.info("Seeded demo data: 3 patients with appointment history.")


try:
    _seed_demo_data()
except Exception as e:
    logger.error(f"Error seeding database: {e}")

app = FastAPI(
    title="DocScribe API",
    description="Backend API for DocScribe — patient records and appointment history for local clinics",
    version="2.0.0"
)

_cors_origins_env = os.environ.get("CORS_ORIGINS", "*").strip()
_allow_origins = ["*"] if _cors_origins_env == "*" else [o.strip() for o in _cors_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_ROOT), name="uploads")


def _save_upload(upload_file: UploadFile, dest_dir: str) -> tuple[str, str, str]:
    """Saves an UploadFile to dest_dir with a unique name. Returns (stored_filename, file_path, content_type)."""
    os.makedirs(dest_dir, exist_ok=True)
    ext = os.path.splitext(upload_file.filename or "")[1]
    stored_filename = f"{uuid.uuid4().hex}{ext}"
    disk_path = os.path.join(dest_dir, stored_filename)
    with open(disk_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    # Normalize to a forward-slash URL path served under /uploads
    url_path = "/" + os.path.relpath(disk_path).replace("\\", "/")
    return stored_filename, url_path, upload_file.content_type or ""


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


# ─── Patients ─────────────────────────────────────────────────────

@app.get("/api/patients", response_model=List[schemas.PatientResponse])
def list_patients(search: Optional[str] = None, db: Session = Depends(get_db)):
    return crud.get_patients(db, search=search)


@app.post("/api/patients", response_model=schemas.PatientResponse)
def create_patient(patient: schemas.PatientCreate, db: Session = Depends(get_db)):
    return crud.create_patient(db, patient)


@app.get("/api/patients/{patient_id}", response_model=schemas.PatientDetailResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = crud.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Patient {patient_id} not found.")
    return patient


@app.put("/api/patients/{patient_id}", response_model=schemas.PatientResponse)
def update_patient(patient_id: int, patient: schemas.PatientUpdate, db: Session = Depends(get_db)):
    updated = crud.update_patient(db, patient_id, patient)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Patient {patient_id} not found.")
    return updated


@app.delete("/api/patients/{patient_id}")
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_patient(db, patient_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Patient {patient_id} not found.")
    return {"success": True}


@app.post("/api/patients/{patient_id}/photo", response_model=schemas.PatientResponse)
def upload_patient_photo(patient_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not crud.get_patient(db, patient_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Patient {patient_id} not found.")
    dest_dir = os.path.join(UPLOAD_ROOT, "patients", str(patient_id))
    _, url_path, _ = _save_upload(file, dest_dir)
    updated = crud.set_patient_photo(db, patient_id, url_path)
    return updated


# ─── Appointments ─────────────────────────────────────────────────

@app.get("/api/patients/{patient_id}/appointments", response_model=List[schemas.AppointmentResponse])
def list_patient_appointments(patient_id: int, db: Session = Depends(get_db)):
    if not crud.get_patient(db, patient_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Patient {patient_id} not found.")
    return crud.get_appointments_for_patient(db, patient_id)


@app.post("/api/patients/{patient_id}/appointments", response_model=schemas.AppointmentResponse)
def create_appointment(patient_id: int, appointment: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    created = crud.create_appointment(db, patient_id, appointment)
    if not created:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Patient {patient_id} not found.")
    return created


@app.get("/api/appointments", response_model=List[schemas.AppointmentSummary])
def list_appointments(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    date: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return crud.list_appointments(db, search=search, status=status_filter, date_str=date)


@app.get("/api/appointments/upcoming-followups")
def upcoming_followups(days: int = 5, db: Session = Depends(get_db)):
    return crud.get_upcoming_followups(db, days=days)


@app.get("/api/appointments/{appointment_id}", response_model=schemas.AppointmentResponse)
def get_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appt = crud.get_appointment(db, appointment_id)
    if not appt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Appointment {appointment_id} not found.")
    return appt


@app.put("/api/appointments/{appointment_id}", response_model=schemas.AppointmentResponse)
def update_appointment(appointment_id: int, appointment: schemas.AppointmentUpdate, db: Session = Depends(get_db)):
    updated = crud.update_appointment(db, appointment_id, appointment)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Appointment {appointment_id} not found.")
    return updated


@app.delete("/api/appointments/{appointment_id}")
def delete_appointment(appointment_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_appointment(db, appointment_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Appointment {appointment_id} not found.")
    return {"success": True}


# ─── Documents ────────────────────────────────────────────────────

@app.post("/api/appointments/{appointment_id}/documents", response_model=schemas.AppointmentDocumentResponse)
def upload_appointment_document(
    appointment_id: int,
    category: str = Form("Other"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not crud.get_appointment_orm(db, appointment_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Appointment {appointment_id} not found.")

    dest_dir = os.path.join(UPLOAD_ROOT, "appointments", str(appointment_id))
    stored_filename, url_path, content_type = _save_upload(file, dest_dir)

    file_size = None
    try:
        file_size = os.path.getsize(os.path.join(dest_dir, stored_filename))
    except OSError:
        pass

    doc = crud.add_document(db, appointment_id, {
        "category": category,
        "original_filename": file.filename or stored_filename,
        "stored_filename": stored_filename,
        "file_path": url_path,
        "content_type": content_type,
        "file_size": file_size,
    })
    return doc


@app.delete("/api/documents/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    file_path = crud.delete_document(db, document_id)
    if file_path is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Document {document_id} not found.")
    # Best-effort remove the file from disk
    try:
        disk_path = file_path.lstrip("/")
        if os.path.exists(disk_path):
            os.remove(disk_path)
    except OSError as e:
        logger.warning(f"Could not remove file for document {document_id}: {e}")
    return {"success": True}


# ─── Dashboard ────────────────────────────────────────────────────

@app.get("/api/dashboard/stats", response_model=schemas.DashboardStats)
def dashboard_stats(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db)
