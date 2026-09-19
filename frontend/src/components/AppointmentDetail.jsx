import { useEffect, useState } from 'react';
import { ChevronLeft, Edit3, Trash2, Printer, FileText, User } from 'lucide-react';
import * as api from '../api';
import { formatDate, formatDateTime, calculateAge } from '../utils/formatDate';
import StatusBadge from './shared/StatusBadge';

export default function AppointmentDetail({ appointmentId, onBack, onEdit, onDeleted, showError, showSuccess }) {
  const [appointment, setAppointment] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const appt = await api.getAppointment(appointmentId);
        const pat = await api.getPatient(appt.patient_id);
        if (!cancelled) {
          setAppointment(appt);
          setPatient(pat);
        }
      } catch (e) {
        if (!cancelled) showError(e.message || 'Failed to load appointment.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [appointmentId, showError]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this appointment? This cannot be undone.')) return;
    try {
      await api.deleteAppointment(appointmentId);
      showSuccess('Appointment deleted.');
      onDeleted(appointment.patient_id);
    } catch (e) {
      showError(e.message || 'Failed to delete appointment.');
    }
  };

  if (loading) return <p className="text-sm text-slate-400 animate-fade-in">Loading appointment...</p>;
  if (!appointment || !patient) return null;

  const age = calculateAge(patient.date_of_birth);
  const vitalsEntries = Object.entries(appointment.vital_signs || {}).filter(([, v]) => v);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between no-print">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-brand-forest">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex gap-2">
          <button onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button onClick={() => onEdit(appointment)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
          <button onClick={handleDelete}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 border border-rose-200 rounded-lg px-3 py-1.5 hover:bg-rose-50">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      <div className="bg-white border border-brand-sage/20 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-brand-sageLight flex items-center justify-center overflow-hidden shrink-0">
              {patient.profile_photo_path ? (
                <img src={`${api.API_BASE_URL}${patient.profile_photo_path}`} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-brand-forest" />
              )}
            </div>
            <div>
              <p className="font-bold text-brand-charcoal">{patient.first_name} {patient.last_name}</p>
              <p className="text-xs text-slate-400 font-semibold">
                {patient.unique_patient_number}{age !== null ? ` · ${age} yrs` : ''}{patient.gender ? ` · ${patient.gender}` : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            <StatusBadge status={appointment.status} />
            <p className="text-xs text-slate-500 mt-1.5">{formatDateTime(appointment.appointment_datetime)}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <Info label="Doctor" value={appointment.doctor} />
          <Info label="Visit Type" value={appointment.visit_type} />
          <Info label="Reason for Visit" value={appointment.reason_for_visit} />
        </div>
      </div>

      <Section title="Clinical Assessment">
        <Info label="Chief Complaint" value={appointment.chief_complaint} block />
        {appointment.symptoms.length > 0 && (
          <div className="mb-2">
            <p className="text-xs font-bold text-slate-500 mb-1">Symptoms</p>
            <div className="flex flex-wrap gap-1.5">
              {appointment.symptoms.map((s) => (
                <span key={s} className="text-xs bg-brand-sageLight text-brand-forest px-2.5 py-0.5 rounded-full font-semibold">{s}</span>
              ))}
            </div>
          </div>
        )}
        {vitalsEntries.length > 0 && (
          <div className="mb-2">
            <p className="text-xs font-bold text-slate-500 mb-1">Vital Signs</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {vitalsEntries.map(([k, v]) => (
                <div key={k} className="text-xs bg-brand-bg/60 rounded-lg px-2.5 py-1.5">
                  <span className="text-slate-400 uppercase">{k.replace('_', ' ')}: </span>
                  <span className="font-bold text-brand-charcoal">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <Info label="Examination Findings" value={appointment.examination_findings} block />
        <Info label="Diagnosis" value={appointment.diagnosis} block />
      </Section>

      {appointment.prescriptions.length > 0 && (
        <Section title="Prescription">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 font-bold border-b border-slate-100">
                <th className="pb-2 pr-2">Medicine</th>
                <th className="pb-2 pr-2">Dosage</th>
                <th className="pb-2 pr-2">Frequency</th>
                <th className="pb-2 pr-2">Duration</th>
                <th className="pb-2">Instructions</th>
              </tr>
            </thead>
            <tbody>
              {appointment.prescriptions.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-1.5 pr-2 font-semibold text-brand-charcoal">{p.medicine}</td>
                  <td className="py-1.5 pr-2 text-slate-600">{p.dosage}</td>
                  <td className="py-1.5 pr-2 text-slate-600">{p.frequency}</td>
                  <td className="py-1.5 pr-2 text-slate-600">{p.duration}</td>
                  <td className="py-1.5 text-slate-600">{p.instructions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {appointment.documents.length > 0 && (
        <Section title="Documents">
          <ul className="space-y-1.5">
            {appointment.documents.map((d) => (
              <li key={d.id}>
                <a href={`${api.API_BASE_URL}${d.file_path}`} target="_blank" rel="noreferrer"
                   className="flex items-center gap-2 text-sm text-brand-forest hover:underline">
                  <FileText className="w-4 h-4" /> {d.original_filename}
                  <span className="text-slate-400 text-xs">({d.category})</span>
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {(appointment.follow_up_date || appointment.follow_up_instructions || appointment.doctor_notes) && (
        <Section title="Follow-up">
          {appointment.follow_up_date && <Info label="Follow-up Date" value={formatDate(appointment.follow_up_date)} />}
          <Info label="Instructions" value={appointment.follow_up_instructions} block />
          <Info label="Doctor Notes" value={appointment.doctor_notes} block />
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white border border-brand-sage/20 rounded-2xl p-6 shadow-sm">
      <h3 className="text-xs font-extrabold uppercase tracking-wide text-brand-sage mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Info({ label, value, block = false }) {
  if (!value) return null;
  return (
    <div className={block ? 'mb-2' : ''}>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="text-sm text-brand-charcoal">{value}</p>
    </div>
  );
}
