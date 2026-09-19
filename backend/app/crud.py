import json
import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from . import models, schemas


# ─── JSON <-> Text helpers ────────────────────────────────────────

def _loads_list(text: Optional[str]) -> List[str]:
    if not text:
        return []
    try:
        value = json.loads(text)
        return value if isinstance(value, list) else []
    except (ValueError, TypeError):
        return []


def _loads_dict(text: Optional[str]) -> Dict[str, Any]:
    if not text:
        return {}
    try:
        value = json.loads(text)
        return value if isinstance(value, dict) else {}
    except (ValueError, TypeError):
        return {}


def _dumps(value) -> str:
    return json.dumps(value if value is not None else [])


# ─── Formatting (ORM -> plain dict for response schemas) ─────────

def _format_prescription(item: models.PrescriptionItem) -> dict:
    return {
        "id": item.id,
        "medicine": item.medicine,
        "brand_name": item.brand_name or "",
        "form": item.form or "",
        "dosage": item.dosage or "",
        "frequency": item.frequency or "",
        "timing": item.timing or "",
        "duration": item.duration or "",
        "instructions": item.instructions or "",
    }


def _format_document(doc: models.AppointmentDocument) -> dict:
    return {
        "id": doc.id,
        "category": doc.category or "",
        "original_filename": doc.original_filename,
        "file_path": doc.file_path,
        "content_type": doc.content_type or "",
        "file_size": doc.file_size,
        "upload_date": doc.upload_date,
    }


def _format_appointment(appt: models.Appointment) -> dict:
    return {
        "appointment_id": appt.appointment_id,
        "patient_id": appt.patient_id,
        "appointment_datetime": appt.appointment_datetime,
        "doctor": appt.doctor or "",
        "visit_type": appt.visit_type or "",
        "status": appt.status or "Scheduled",
        "reason_for_visit": appt.reason_for_visit or "",
        "chief_complaint": appt.chief_complaint or "",
        "symptoms": _loads_list(appt.symptoms),
        "vital_signs": _loads_dict(appt.vital_signs),
        "examination_findings": appt.examination_findings or "",
        "diagnosis": appt.diagnosis or "",
        "advice": appt.advice or "",
        "investigations_ordered": _loads_list(appt.investigations_ordered),
        "follow_up_date": appt.follow_up_date,
        "follow_up_instructions": appt.follow_up_instructions or "",
        "doctor_notes": appt.doctor_notes or "",
        "created_at": appt.created_at,
        "updated_at": appt.updated_at,
        "prescriptions": [_format_prescription(p) for p in appt.prescriptions],
        "documents": [_format_document(d) for d in appt.documents],
    }


def _format_patient(patient: models.Patient) -> dict:
    return {
        "patient_id": patient.patient_id,
        "unique_patient_number": patient.unique_patient_number or "",
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "date_of_birth": patient.date_of_birth,
        "gender": patient.gender or "",
        "phone": patient.phone or "",
        "email": patient.email or "",
        "address": patient.address or "",
        "emergency_contact": patient.emergency_contact or "",
        "profile_photo_path": patient.profile_photo_path or "",
        "blood_group": patient.blood_group or "",
        "allergies": _loads_list(patient.allergies),
        "existing_conditions": _loads_list(patient.existing_conditions),
        "past_surgeries": _loads_list(patient.past_surgeries),
        "current_medications": _loads_list(patient.current_medications),
        "family_history": patient.family_history or "",
        "important_medical_notes": patient.important_medical_notes or "",
        "created_at": patient.created_at,
        "updated_at": patient.updated_at,
    }


def _format_patient_detail(patient: models.Patient) -> dict:
    data = _format_patient(patient)
    data["appointments"] = [_format_appointment(a) for a in patient.appointments]
    return data


# ─── Patients ─────────────────────────────────────────────────────

def create_patient(db: Session, patient_in: schemas.PatientCreate) -> dict:
    db_patient = models.Patient(
        first_name=patient_in.first_name,
        last_name=patient_in.last_name,
        date_of_birth=patient_in.date_of_birth,
        gender=patient_in.gender,
        phone=patient_in.phone,
        email=patient_in.email,
        address=patient_in.address,
        emergency_contact=patient_in.emergency_contact,
        blood_group=patient_in.blood_group,
        allergies=_dumps(patient_in.allergies),
        existing_conditions=_dumps(patient_in.existing_conditions),
        past_surgeries=_dumps(patient_in.past_surgeries),
        current_medications=_dumps(patient_in.current_medications),
        family_history=patient_in.family_history,
        important_medical_notes=patient_in.important_medical_notes,
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)

    db_patient.unique_patient_number = f"DS-{db_patient.patient_id:04d}"
    db.commit()
    db.refresh(db_patient)
    return _format_patient(db_patient)


def get_patients(db: Session, search: Optional[str] = None) -> List[dict]:
    query = db.query(models.Patient)
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                models.Patient.first_name.ilike(like),
                models.Patient.last_name.ilike(like),
                models.Patient.phone.ilike(like),
                models.Patient.unique_patient_number.ilike(like),
            )
        )
    patients = query.order_by(models.Patient.first_name, models.Patient.last_name).all()
    return [_format_patient(p) for p in patients]


def get_patient(db: Session, patient_id: int) -> Optional[dict]:
    patient = (
        db.query(models.Patient)
        .options(
            joinedload(models.Patient.appointments).joinedload(models.Appointment.prescriptions),
            joinedload(models.Patient.appointments).joinedload(models.Appointment.documents),
        )
        .filter(models.Patient.patient_id == patient_id)
        .first()
    )
    if not patient:
        return None
    return _format_patient_detail(patient)


def update_patient(db: Session, patient_id: int, patient_in: schemas.PatientUpdate) -> Optional[dict]:
    db_patient = db.query(models.Patient).filter(models.Patient.patient_id == patient_id).first()
    if not db_patient:
        return None

    db_patient.first_name = patient_in.first_name
    db_patient.last_name = patient_in.last_name
    db_patient.date_of_birth = patient_in.date_of_birth
    db_patient.gender = patient_in.gender
    db_patient.phone = patient_in.phone
    db_patient.email = patient_in.email
    db_patient.address = patient_in.address
    db_patient.emergency_contact = patient_in.emergency_contact
    db_patient.blood_group = patient_in.blood_group
    db_patient.allergies = _dumps(patient_in.allergies)
    db_patient.existing_conditions = _dumps(patient_in.existing_conditions)
    db_patient.past_surgeries = _dumps(patient_in.past_surgeries)
    db_patient.current_medications = _dumps(patient_in.current_medications)
    db_patient.family_history = patient_in.family_history
    db_patient.important_medical_notes = patient_in.important_medical_notes
    db_patient.updated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(db_patient)
    return _format_patient(db_patient)


def delete_patient(db: Session, patient_id: int) -> bool:
    db_patient = db.query(models.Patient).filter(models.Patient.patient_id == patient_id).first()
    if not db_patient:
        return False
    db.delete(db_patient)
    db.commit()
    return True


def set_patient_photo(db: Session, patient_id: int, file_path: str) -> Optional[dict]:
    db_patient = db.query(models.Patient).filter(models.Patient.patient_id == patient_id).first()
    if not db_patient:
        return None
    db_patient.profile_photo_path = file_path
    db.commit()
    db.refresh(db_patient)
    return _format_patient(db_patient)


# ─── Appointments ─────────────────────────────────────────────────

def _apply_prescriptions(db: Session, appointment: models.Appointment, prescriptions):
    appointment.prescriptions.clear()
    for item in prescriptions or []:
        appointment.prescriptions.append(
            models.PrescriptionItem(
                medicine=item.medicine,
                brand_name=item.brand_name,
                form=item.form,
                dosage=item.dosage,
                frequency=item.frequency,
                timing=item.timing,
                duration=item.duration,
                instructions=item.instructions,
            )
        )


def create_appointment(db: Session, patient_id: int, appt_in: schemas.AppointmentCreate) -> Optional[dict]:
    patient = db.query(models.Patient).filter(models.Patient.patient_id == patient_id).first()
    if not patient:
        return None

    db_appt = models.Appointment(
        patient_id=patient_id,
        appointment_datetime=appt_in.appointment_datetime,
        doctor=appt_in.doctor,
        visit_type=appt_in.visit_type,
        status=appt_in.status or "Scheduled",
        reason_for_visit=appt_in.reason_for_visit,
        chief_complaint=appt_in.chief_complaint,
        symptoms=_dumps(appt_in.symptoms),
        vital_signs=json.dumps(appt_in.vital_signs or {}),
        examination_findings=appt_in.examination_findings,
        diagnosis=appt_in.diagnosis,
        advice=appt_in.advice,
        investigations_ordered=_dumps(appt_in.investigations_ordered),
        follow_up_date=appt_in.follow_up_date,
        follow_up_instructions=appt_in.follow_up_instructions,
        doctor_notes=appt_in.doctor_notes,
    )
    _apply_prescriptions(db, db_appt, appt_in.prescriptions)

    db.add(db_appt)
    db.commit()
    db.refresh(db_appt)
    return _format_appointment(db_appt)


def get_appointments_for_patient(db: Session, patient_id: int) -> List[dict]:
    appts = (
        db.query(models.Appointment)
        .filter(models.Appointment.patient_id == patient_id)
        .order_by(models.Appointment.appointment_datetime.desc())
        .all()
    )
    return [_format_appointment(a) for a in appts]


def get_appointment(db: Session, appointment_id: int) -> Optional[dict]:
    appt = (
        db.query(models.Appointment)
        .filter(models.Appointment.appointment_id == appointment_id)
        .first()
    )
    if not appt:
        return None
    return _format_appointment(appt)


def get_appointment_orm(db: Session, appointment_id: int) -> Optional[models.Appointment]:
    return db.query(models.Appointment).filter(models.Appointment.appointment_id == appointment_id).first()


def update_appointment(db: Session, appointment_id: int, appt_in: schemas.AppointmentUpdate) -> Optional[dict]:
    db_appt = db.query(models.Appointment).filter(models.Appointment.appointment_id == appointment_id).first()
    if not db_appt:
        return None

    db_appt.appointment_datetime = appt_in.appointment_datetime
    db_appt.doctor = appt_in.doctor
    db_appt.visit_type = appt_in.visit_type
    db_appt.status = appt_in.status or "Scheduled"
    db_appt.reason_for_visit = appt_in.reason_for_visit
    db_appt.chief_complaint = appt_in.chief_complaint
    db_appt.symptoms = _dumps(appt_in.symptoms)
    db_appt.vital_signs = json.dumps(appt_in.vital_signs or {})
    db_appt.examination_findings = appt_in.examination_findings
    db_appt.diagnosis = appt_in.diagnosis
    db_appt.advice = appt_in.advice
    db_appt.investigations_ordered = _dumps(appt_in.investigations_ordered)
    db_appt.follow_up_date = appt_in.follow_up_date
    db_appt.follow_up_instructions = appt_in.follow_up_instructions
    db_appt.doctor_notes = appt_in.doctor_notes
    db_appt.updated_at = datetime.datetime.utcnow()
    _apply_prescriptions(db, db_appt, appt_in.prescriptions)

    db.commit()
    db.refresh(db_appt)
    return _format_appointment(db_appt)


def delete_appointment(db: Session, appointment_id: int) -> bool:
    db_appt = db.query(models.Appointment).filter(models.Appointment.appointment_id == appointment_id).first()
    if not db_appt:
        return False
    db.delete(db_appt)
    db.commit()
    return True


def list_appointments(
    db: Session,
    search: Optional[str] = None,
    status: Optional[str] = None,
    date_str: Optional[str] = None,
) -> List[dict]:
    query = db.query(models.Appointment).join(models.Patient)

    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                models.Patient.first_name.ilike(like),
                models.Patient.last_name.ilike(like),
                models.Appointment.reason_for_visit.ilike(like),
                models.Appointment.diagnosis.ilike(like),
            )
        )
    if status and status != "All":
        query = query.filter(models.Appointment.status == status)
    if date_str:
        try:
            target_date = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
            query = query.filter(func.date(models.Appointment.appointment_datetime) == target_date)
        except ValueError:
            pass

    appts = query.order_by(models.Appointment.appointment_datetime.desc()).all()
    return [
        {
            "appointment_id": a.appointment_id,
            "patient_id": a.patient_id,
            "patient_name": f"{a.patient.first_name} {a.patient.last_name}",
            "appointment_datetime": a.appointment_datetime,
            "doctor": a.doctor or "",
            "visit_type": a.visit_type or "",
            "status": a.status or "Scheduled",
            "reason_for_visit": a.reason_for_visit or "",
            "follow_up_date": a.follow_up_date,
        }
        for a in appts
    ]


def get_upcoming_followups(db: Session, days: int = 5) -> List[dict]:
    today = datetime.date.today()
    end_date = today + datetime.timedelta(days=days)
    appts = (
        db.query(models.Appointment)
        .join(models.Patient)
        .filter(models.Appointment.follow_up_date.isnot(None))
        .filter(models.Appointment.follow_up_date >= today)
        .filter(models.Appointment.follow_up_date <= end_date)
        .order_by(models.Appointment.follow_up_date.asc())
        .all()
    )
    return [
        {
            "appointment_id": a.appointment_id,
            "patient_id": a.patient_id,
            "patient_name": f"{a.patient.first_name} {a.patient.last_name}",
            "phone": a.patient.phone or "",
            "follow_up_date": a.follow_up_date,
            "follow_up_instructions": a.follow_up_instructions or "",
        }
        for a in appts
    ]


def get_dashboard_stats(db: Session) -> dict:
    total_patients = db.query(models.Patient).count()
    total_appointments = db.query(models.Appointment).count()
    scheduled = db.query(models.Appointment).filter(models.Appointment.status == "Scheduled").count()
    completed = db.query(models.Appointment).filter(models.Appointment.status == "Completed").count()
    upcoming = len(get_upcoming_followups(db))
    return {
        "total_patients": total_patients,
        "total_appointments": total_appointments,
        "scheduled_appointments": scheduled,
        "completed_appointments": completed,
        "upcoming_followups": upcoming,
    }


# ─── Documents ────────────────────────────────────────────────────

def add_document(db: Session, appointment_id: int, meta: dict) -> Optional[dict]:
    appt = db.query(models.Appointment).filter(models.Appointment.appointment_id == appointment_id).first()
    if not appt:
        return None
    doc = models.AppointmentDocument(appointment_id=appointment_id, **meta)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return _format_document(doc)


def get_document(db: Session, document_id: int) -> Optional[models.AppointmentDocument]:
    return db.query(models.AppointmentDocument).filter(models.AppointmentDocument.id == document_id).first()


def delete_document(db: Session, document_id: int) -> Optional[str]:
    """Deletes the document row and returns its file_path (captured before commit,
    since the ORM instance expires once the row is gone)."""
    doc = get_document(db, document_id)
    if not doc:
        return None
    file_path = doc.file_path
    db.delete(doc)
    db.commit()
    return file_path


# ─── Clinic Settings (singleton) ───────────────────────────────────

def _format_clinic_settings(settings: models.ClinicSettings) -> dict:
    return {
        "id": settings.id,
        "clinic_name": settings.clinic_name or "",
        "clinic_address": settings.clinic_address or "",
        "clinic_phone": settings.clinic_phone or "",
        "clinic_email": settings.clinic_email or "",
        "doctor_name": settings.doctor_name or "",
        "doctor_qualifications": settings.doctor_qualifications or "",
        "doctor_registration_number": settings.doctor_registration_number or "",
        "updated_at": settings.updated_at,
    }


def get_clinic_settings(db: Session) -> dict:
    settings = db.query(models.ClinicSettings).filter(models.ClinicSettings.id == 1).first()
    if not settings:
        settings = models.ClinicSettings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return _format_clinic_settings(settings)


def update_clinic_settings(db: Session, settings_in: schemas.ClinicSettingsUpdate) -> dict:
    settings = db.query(models.ClinicSettings).filter(models.ClinicSettings.id == 1).first()
    if not settings:
        settings = models.ClinicSettings(id=1)
        db.add(settings)

    settings.clinic_name = settings_in.clinic_name
    settings.clinic_address = settings_in.clinic_address
    settings.clinic_phone = settings_in.clinic_phone
    settings.clinic_email = settings_in.clinic_email
    settings.doctor_name = settings_in.doctor_name
    settings.doctor_qualifications = settings_in.doctor_qualifications
    settings.doctor_registration_number = settings_in.doctor_registration_number
    settings.updated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(settings)
    return _format_clinic_settings(settings)
