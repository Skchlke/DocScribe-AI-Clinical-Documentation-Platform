import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


class Patient(Base):
    __tablename__ = "patients"

    patient_id = Column(Integer, primary_key=True, index=True)
    unique_patient_number = Column(String, unique=True, index=True, nullable=True)

    # Personal Information
    first_name = Column(String, nullable=False, index=True)
    last_name = Column(String, nullable=False, index=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String, nullable=True)
    phone = Column(String, index=True, nullable=True)
    email = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    emergency_contact = Column(String, nullable=True)
    profile_photo_path = Column(String, nullable=True)

    # Medical Background
    blood_group = Column(String, nullable=True)
    allergies = Column(Text, nullable=True)  # JSON list
    existing_conditions = Column(Text, nullable=True)  # JSON list
    past_surgeries = Column(Text, nullable=True)  # JSON list
    current_medications = Column(Text, nullable=True)  # JSON list
    family_history = Column(Text, nullable=True)
    important_medical_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    appointments = relationship(
        "Appointment", back_populates="patient", cascade="all, delete-orphan",
        order_by="desc(Appointment.appointment_datetime)"
    )


class Appointment(Base):
    __tablename__ = "appointments"

    appointment_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=False, index=True)

    # Appointment Information
    appointment_datetime = Column(DateTime, nullable=False)
    doctor = Column(String, nullable=True)
    visit_type = Column(String, nullable=True)
    status = Column(String, default="Scheduled")
    reason_for_visit = Column(Text, nullable=True)

    # Clinical Assessment
    chief_complaint = Column(Text, nullable=True)
    symptoms = Column(Text, nullable=True)  # JSON list
    vital_signs = Column(Text, nullable=True)  # JSON object
    examination_findings = Column(Text, nullable=True)
    diagnosis = Column(Text, nullable=True)

    # Treatment plan (beyond the prescription table)
    advice = Column(Text, nullable=True)
    investigations_ordered = Column(Text, nullable=True)  # JSON list

    # Follow-up
    follow_up_date = Column(Date, nullable=True, index=True)
    follow_up_instructions = Column(Text, nullable=True)
    doctor_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="appointments")
    prescriptions = relationship(
        "PrescriptionItem", back_populates="appointment", cascade="all, delete-orphan"
    )
    documents = relationship(
        "AppointmentDocument", back_populates="appointment", cascade="all, delete-orphan"
    )


class PrescriptionItem(Base):
    __tablename__ = "prescription_items"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.appointment_id"), nullable=False, index=True)
    medicine = Column(String, nullable=False)
    brand_name = Column(String, nullable=True)
    form = Column(String, nullable=True)  # Tablet | Capsule | Syrup | Injection | Drops | Ointment | Other
    dosage = Column(String, nullable=True)
    frequency = Column(String, nullable=True)
    timing = Column(String, nullable=True)  # Before Food | After Food | With Food | Anytime
    duration = Column(String, nullable=True)
    instructions = Column(String, nullable=True)

    appointment = relationship("Appointment", back_populates="prescriptions")


class AppointmentDocument(Base):
    __tablename__ = "appointment_documents"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.appointment_id"), nullable=False, index=True)
    category = Column(String, nullable=True)  # "Lab Report" | "X-Ray" | "Scan" | "Other"
    original_filename = Column(String, nullable=False)
    stored_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)  # URL path served via /uploads
    content_type = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    upload_date = Column(DateTime, default=datetime.datetime.utcnow)

    appointment = relationship("Appointment", back_populates="documents")


class ClinicSettings(Base):
    """Singleton row (id is always 1) holding the clinic's identity and the doctor's
    legal credentials, used to head every printed prescription."""
    __tablename__ = "clinic_settings"

    id = Column(Integer, primary_key=True, index=True)
    clinic_name = Column(String, nullable=True)
    clinic_address = Column(Text, nullable=True)
    clinic_phone = Column(String, nullable=True)
    clinic_email = Column(String, nullable=True)
    doctor_name = Column(String, nullable=True)
    doctor_qualifications = Column(String, nullable=True)
    doctor_registration_number = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
