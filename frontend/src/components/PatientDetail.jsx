import { useEffect, useState } from 'react';
import { ChevronLeft, User, Phone, Mail, MapPin, Edit3, Plus, Trash2, HeartPulse, Stethoscope } from 'lucide-react';
import * as api from '../api';
import { formatDate, formatDateTime, calculateAge } from '../utils/formatDate';
import StatusBadge from './shared/StatusBadge';

export default function PatientDetail({ patientId, onBack, onEditPatient, onNewAppointment, onSelectAppointment, onPatientDeleted, showError, showSuccess }) {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await api.getPatient(patientId);
        if (!cancelled) setPatient(data);
      } catch (e) {
        if (!cancelled) showError(e.message || 'Failed to load patient.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [patientId, showError]);

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${patient.first_name} ${patient.last_name} and all their appointment history? This cannot be undone.`)) return;
    try {
      await api.deletePatient(patientId);
      showSuccess('Patient deleted.');
      onPatientDeleted();
    } catch (e) {
      showError(e.message || 'Failed to delete patient.');
    }
  };

  if (loading) return <p className="text-sm text-slate-400 animate-fade-in">Loading patient...</p>;
  if (!patient) return null;

  const age = calculateAge(patient.date_of_birth);
  const medicalRows = [
    ['Blood Group', patient.blood_group || '—'],
    ['Allergies', patient.allergies.length ? patient.allergies.join(', ') : 'None reported'],
    ['Existing Conditions', patient.existing_conditions.length ? patient.existing_conditions.join(', ') : 'None reported'],
    ['Past Surgeries', patient.past_surgeries.length ? patient.past_surgeries.join(', ') : 'None reported'],
    ['Current Medications', patient.current_medications.length ? patient.current_medications.join(', ') : 'None reported'],
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-brand-forest">
        <ChevronLeft className="w-4 h-4" /> Back to Patients
      </button>

      <div className="bg-white border border-brand-sage/20 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-sageLight flex items-center justify-center overflow-hidden shrink-0">
              {patient.profile_photo_path ? (
                <img src={`${api.API_BASE_URL}${patient.profile_photo_path}`} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-brand-forest" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-brand-charcoal">{patient.first_name} {patient.last_name}</h1>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                {patient.unique_patient_number}{age !== null ? ` · ${age} yrs` : ''}{patient.gender ? ` · ${patient.gender}` : ''} · DOB {formatDate(patient.date_of_birth)}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {patient.phone || '—'}</span>
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {patient.email || '—'}</span>
                {patient.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {patient.address}</span>}
              </div>
              {patient.emergency_contact && (
                <p className="text-xs text-brand-terracotta font-semibold mt-1.5">Emergency: {patient.emergency_contact}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => onEditPatient(patient)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={handleDelete}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 border border-rose-200 rounded-lg px-3 py-1.5 hover:bg-rose-50">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-slate-100">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-brand-sage mb-3 flex items-center gap-1.5">
            <HeartPulse className="w-3.5 h-3.5" /> Medical Background
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {medicalRows.map(([label, value]) => (
              <div key={label} className="text-sm">
                <span className="text-slate-400 font-semibold">{label}: </span>
                <span className="text-brand-charcoal">{value}</span>
              </div>
            ))}
          </div>
          {(patient.family_history || patient.important_medical_notes) && (
            <div className="mt-3 space-y-1.5 text-sm">
              {patient.family_history && <p><span className="text-slate-400 font-semibold">Family History: </span>{patient.family_history}</p>}
              {patient.important_medical_notes && <p><span className="text-slate-400 font-semibold">Notes: </span>{patient.important_medical_notes}</p>}
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold text-brand-charcoal flex items-center gap-1.5">
            <Stethoscope className="w-4 h-4" /> Appointment History ({patient.appointments.length})
          </h2>
          <button onClick={() => onNewAppointment(patient.patient_id)}
            className="inline-flex items-center gap-1.5 bg-brand-forest hover:bg-brand-forestHover text-white font-extrabold rounded-xl shadow-md px-3.5 py-2 text-xs transition-colors">
            <Plus className="w-3.5 h-3.5" /> New Appointment
          </button>
        </div>

        {patient.appointments.length === 0 && (
          <div className="bg-white border border-brand-sage/20 rounded-2xl p-8 text-center text-slate-400 text-sm">
            No appointments recorded yet.
          </div>
        )}

        <div className="space-y-3">
          {patient.appointments.map((a) => (
            <button
              key={a.appointment_id}
              onClick={() => onSelectAppointment(a.appointment_id)}
              className="w-full text-left bg-white border border-brand-sage/20 rounded-2xl p-4 shadow-sm hover:border-brand-sage hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-brand-charcoal">{a.visit_type || 'Visit'} — {a.reason_for_visit || 'No reason specified'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{formatDateTime(a.appointment_datetime)}{a.doctor ? ` · ${a.doctor}` : ''}</p>
                  {a.diagnosis && <p className="text-xs text-slate-400 mt-1">Diagnosis: {a.diagnosis}</p>}
                </div>
                <StatusBadge status={a.status} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
