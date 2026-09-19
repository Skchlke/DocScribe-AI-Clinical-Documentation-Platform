# DocScribe - Patient Records & Appointment History

DocScribe is a patient data management app built for local clinics that currently rely on paper records. Every patient has one durable record — personal information and medical background — that accumulates appointments over time. Each appointment carries its own clinical assessment, prescription, documents (lab reports, X-rays, scans), and follow-up notes, so a patient's full history is never lost.

```
PATIENT
├── Personal Information (ID, name, DOB, gender, phone, email, address, emergency contact, photo)
├── Medical Background (blood group, allergies, conditions, surgeries, medications, family history, notes)
└── Appointments (repeating)
    ├── Appointment Info (date/time, doctor, visit type, status, reason)
    ├── Clinical Assessment (chief complaint, symptoms, vital signs, findings, diagnosis)
    ├── Prescription (medicine / dosage / frequency / duration / instructions)
    ├── Documents (lab reports, X-rays, scans, other files)
    └── Follow-up (date, instructions, doctor notes)
```

---

## Getting Started (Local Development)

- **React Frontend**: http://localhost:5173/
- **FastAPI Swagger Docs**: http://127.0.0.1:8000/docs
- **FastAPI Backend Base**: http://127.0.0.1:8000

### Restart Backend

From `E:\DocScribe\backend`:

```powershell
.\.venv\Scripts\python -m uvicorn app.main:app --reload
```

### Restart Frontend

From `E:\DocScribe\frontend`:

```bash
npm run dev
```

---

## Project Structure

```
E:\DocScribe/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI endpoints, CORS, static file uploads, demo seed data
│   │   ├── database.py        # SQLAlchemy engine (docscribe.db)
│   │   ├── models.py          # Patient, Appointment, PrescriptionItem, AppointmentDocument
│   │   ├── schemas.py         # Pydantic request/response schemas
│   │   └── crud.py            # Database operations
│   ├── uploads/                # Uploaded profile photos & appointment documents
│   ├── requirements.txt
│   └── docscribe.db            # Local SQLite database (auto-generated)
├── frontend/
│   ├── src/
│   │   ├── api.js              # All backend API calls
│   │   ├── App.jsx             # App shell: header, nav, toasts, modals
│   │   ├── components/         # Dashboard, PatientList/Detail/Form, AppointmentForm/Detail, AllAppointments
│   │   │   └── shared/         # StatusBadge, TagListEditor, PrescriptionEditor, FileUpload, VitalsInput, Modal
│   │   ├── hooks/useToast.js
│   │   └── utils/               # formatDate, listField helpers
│   └── package.json
└── README.md
```

---

## Tech Stack & Features

### Backend (FastAPI & SQLite)

- **FastAPI** REST API on `http://127.0.0.1:8000`, all routes under `/api`.
- **SQLAlchemy ORM** over a local `docscribe.db` SQLite file.
- File uploads (profile photos, appointment documents) stored under `backend/uploads/` and served via `/uploads`.
- Key endpoints: patients (CRUD + search), appointments (CRUD, nested prescriptions), document upload/delete, upcoming follow-ups, dashboard stats.

### Frontend (React + Tailwind v3)

- **Dashboard** — patient/appointment stats, upcoming follow-up alerts, recent appointments.
- **Patients** — searchable directory, add/edit patient (personal info + medical background as tag lists), profile photo upload.
- **Patient Detail** — full demographic + medical background summary and complete appointment history.
- **Appointments** — structured forms for clinical assessment, vital signs, a dynamic prescription table, document uploads by category, and follow-up scheduling. Printable appointment view.
- **All Appointments** — cross-patient searchable/filterable table.
