import { useState, useEffect } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import * as api from '../api';
import { toDateTimeLocalValue } from '../utils/formatDate';
import TagListEditor from './shared/TagListEditor';
import VitalsInput from './shared/VitalsInput';
import PrescriptionEditor from './shared/PrescriptionEditor';
import FileUpload from './shared/FileUpload';

const DOCUMENT_CATEGORIES = ['Lab Report', 'X-Ray', 'Scan', 'Other'];
const VISIT_TYPES = ['New Consultation', 'Follow-up', 'Routine Checkup', 'Post-Op Check', 'Emergency'];
const STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'No-show'];

function buildForm(appointment) {
  if (!appointment) {
    return {
      appointment_datetime: toDateTimeLocalValue(new Date()),
      doctor: '', visit_type: 'New Consultation', status: 'Scheduled', reason_for_visit: '',
      chief_complaint: '', symptoms: [], vital_signs: {}, examination_findings: '', diagnosis: '',
      advice: '', investigations_ordered: [],
      follow_up_date: '', follow_up_instructions: '', doctor_notes: '', prescriptions: [],
    };
  }
  return {
    ...appointment,
    appointment_datetime: toDateTimeLocalValue(appointment.appointment_datetime),
    follow_up_date: appointment.follow_up_date || '',
    prescriptions: appointment.prescriptions.map(
      ({ medicine, brand_name, form, dosage, frequency, timing, duration, instructions }) =>
        ({ medicine, brand_name, form, dosage, frequency, timing, duration, instructions })
    ),
  };
}

export default function AppointmentForm({ patientId, appointment, onSaved, onCancel, showError, showSuccess }) {
  const isEdit = Boolean(appointment);
  const [form, setForm] = useState(() => buildForm(appointment));
  const [documents, setDocuments] = useState(appointment?.documents || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) return;
    let cancelled = false;
    (async () => {
      try {
        const settings = await api.getClinicSettings();
        if (!cancelled && settings.doctor_name) {
          setForm((prev) => (prev.doctor ? prev : { ...prev, doctor: settings.doctor_name }));
        }
      } catch {
        // Settings are optional here — silently skip the default if unavailable.
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.appointment_datetime) {
      showError('Appointment date & time is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        appointment_datetime: new Date(form.appointment_datetime).toISOString(),
        follow_up_date: form.follow_up_date || null,
        prescriptions: form.prescriptions.filter((p) => p.medicine.trim()),
      };
      const saved = isEdit
        ? await api.updateAppointment(appointment.appointment_id, payload)
        : await api.createAppointment(patientId, payload);
      showSuccess(isEdit ? 'Appointment updated.' : 'Appointment created.');
      onSaved(saved);
    } catch (e) {
      showError(e.message || 'Failed to save appointment.');
    } finally {
      setSaving(false);
    }
  };

  const handleDocUpload = async (file, category) => {
    try {
      const doc = await api.uploadAppointmentDocument(appointment.appointment_id, file, category);
      setDocuments((prev) => [...prev, doc]);
      showSuccess('Document uploaded.');
    } catch (e) {
      showError(e.message || 'Failed to upload document.');
    }
  };

  const handleDocDelete = async (docId) => {
    if (!window.confirm('Remove this document?')) return;
    try {
      await api.deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (e) {
      showError(e.message || 'Failed to delete document.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h4 className="text-xs font-extrabold uppercase tracking-wide text-brand-sage mb-3">Appointment Information</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Date & Time *" type="datetime-local" value={form.appointment_datetime} onChange={(v) => set('appointment_datetime', v)} />
          <Field label="Doctor" value={form.doctor} onChange={(v) => set('doctor', v)} />
          <SelectField label="Visit Type" value={form.visit_type} onChange={(v) => set('visit_type', v)} options={VISIT_TYPES} />
          <SelectField label="Status" value={form.status} onChange={(v) => set('status', v)} options={STATUSES} />
          <Field label="Reason for Visit" value={form.reason_for_visit} onChange={(v) => set('reason_for_visit', v)} className="sm:col-span-2" />
        </div>
      </div>

      <div>
        <h4 className="text-xs font-extrabold uppercase tracking-wide text-brand-sage mb-3">Clinical Assessment</h4>
        <div className="space-y-3">
          <Field label="Chief Complaint" value={form.chief_complaint} onChange={(v) => set('chief_complaint', v)} textarea />
          <TagListEditor label="Symptoms" values={form.symptoms} onChange={(v) => set('symptoms', v)} />
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Vital Signs</label>
            <VitalsInput values={form.vital_signs} onChange={(v) => set('vital_signs', v)} />
          </div>
          <Field label="Examination Findings" value={form.examination_findings} onChange={(v) => set('examination_findings', v)} textarea />
          <Field label="Diagnosis" value={form.diagnosis} onChange={(v) => set('diagnosis', v)} textarea />
        </div>
      </div>

      <div>
        <h4 className="text-xs font-extrabold uppercase tracking-wide text-brand-sage mb-3">Prescription</h4>
        <PrescriptionEditor items={form.prescriptions} onChange={(v) => set('prescriptions', v)} />
      </div>

      <div>
        <h4 className="text-xs font-extrabold uppercase tracking-wide text-brand-sage mb-3">Advice &amp; Next Steps</h4>
        <div className="space-y-3">
          <Field label="Advice & Instructions" value={form.advice} onChange={(v) => set('advice', v)}
            placeholder="e.g. Drink plenty of fluids, bed rest for 2 days" textarea />
          <TagListEditor label="Investigations Ordered" values={form.investigations_ordered}
            onChange={(v) => set('investigations_ordered', v)} placeholder="e.g. CBC, Chest X-ray" />
        </div>
      </div>

      <div>
        <h4 className="text-xs font-extrabold uppercase tracking-wide text-brand-sage mb-3">Documents</h4>
        {isEdit ? (
          <div className="space-y-3">
            {documents.length > 0 && (
              <ul className="space-y-1.5">
                {documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between text-sm bg-brand-bg/60 border border-slate-100 rounded-lg px-3 py-2">
                    <a href={`${api.API_BASE_URL}${d.file_path}`} target="_blank" rel="noreferrer"
                       className="flex items-center gap-2 text-brand-forest hover:underline truncate">
                      <FileText className="w-4 h-4 shrink-0" /> {d.original_filename}
                      <span className="text-slate-400 text-xs">({d.category})</span>
                    </a>
                    <button type="button" onClick={() => handleDocDelete(d.id)} className="text-rose-500 hover:text-rose-700 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <FileUpload categories={DOCUMENT_CATEGORIES} onUpload={handleDocUpload} buttonLabel="Upload Document" />
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">Save the appointment first, then add lab reports, X-rays, or scans.</p>
        )}
      </div>

      <div>
        <h4 className="text-xs font-extrabold uppercase tracking-wide text-brand-sage mb-3">Follow-up</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Follow-up Date" type="date" value={form.follow_up_date} onChange={(v) => set('follow_up_date', v)} />
          <Field label="Follow-up Instructions" value={form.follow_up_instructions} onChange={(v) => set('follow_up_instructions', v)} />
          <Field label="Doctor Notes" value={form.doctor_notes} onChange={(v) => set('doctor_notes', v)} className="sm:col-span-2" textarea />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="px-4 py-2 text-sm font-extrabold text-white bg-brand-forest rounded-xl hover:bg-brand-forestHover disabled:opacity-50">
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Appointment'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, value, onChange, type = 'text', className = '', textarea = false }) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-slate-500 mb-1.5">{label}</label>
      {textarea ? (
        <textarea
          value={value || ''} onChange={(e) => onChange(e.target.value)} rows={2}
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-sage resize-none"
        />
      ) : (
        <input
          type={type} value={value || ''} onChange={(e) => onChange(e.target.value)}
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-sage"
        />
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 mb-1.5">{label}</label>
      <select
        value={value || ''} onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-sage bg-white"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
