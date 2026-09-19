import { useState } from 'react';
import { User } from 'lucide-react';
import * as api from '../api';
import TagListEditor from './shared/TagListEditor';
import FileUpload from './shared/FileUpload';

const BLANK = {
  first_name: '', last_name: '', date_of_birth: '', gender: '', phone: '', email: '',
  address: '', emergency_contact: '',
  blood_group: '', allergies: [], existing_conditions: [], past_surgeries: [],
  current_medications: [], family_history: '', important_medical_notes: '',
};

export default function PatientForm({ patient, onSaved, onCancel, showError, showSuccess }) {
  const isEdit = Boolean(patient);
  const [form, setForm] = useState(() => (patient ? { ...BLANK, ...patient } : { ...BLANK }));
  const [saving, setSaving] = useState(false);
  const [photoPath, setPhotoPath] = useState(patient?.profile_photo_path || '');

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      showError('First and last name are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        date_of_birth: form.date_of_birth || null,
      };
      const saved = isEdit
        ? await api.updatePatient(patient.patient_id, payload)
        : await api.createPatient(payload);
      showSuccess(isEdit ? 'Patient updated.' : 'Patient added.');
      onSaved(saved);
    } catch (e) {
      showError(e.message || 'Failed to save patient.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (file) => {
    if (!isEdit) return;
    try {
      const updated = await api.uploadPatientPhoto(patient.patient_id, file);
      setPhotoPath(updated.profile_photo_path);
      showSuccess('Photo uploaded.');
    } catch (e) {
      showError(e.message || 'Failed to upload photo.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isEdit && (
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-sageLight flex items-center justify-center overflow-hidden shrink-0">
            {photoPath ? (
              <img src={`${api.API_BASE_URL}${photoPath}`} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-7 h-7 text-brand-forest" />
            )}
          </div>
          <FileUpload accept="image/*" buttonLabel="Upload Photo" onUpload={handlePhotoUpload} />
        </div>
      )}

      <div>
        <h4 className="text-xs font-extrabold uppercase tracking-wide text-brand-sage mb-3">Personal Information</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="First Name *" value={form.first_name} onChange={(v) => set('first_name', v)} />
          <Field label="Last Name *" value={form.last_name} onChange={(v) => set('last_name', v)} />
          <Field label="Date of Birth" type="date" value={form.date_of_birth || ''} onChange={(v) => set('date_of_birth', v)} />
          <SelectField label="Gender" value={form.gender} onChange={(v) => set('gender', v)}
            options={['', 'Male', 'Female', 'Other']} />
          <Field label="Phone" value={form.phone} onChange={(v) => set('phone', v)} />
          <Field label="Email" type="email" value={form.email} onChange={(v) => set('email', v)} />
          <Field label="Emergency Contact" value={form.emergency_contact} onChange={(v) => set('emergency_contact', v)}
            placeholder="Name - Relation - Phone" className="sm:col-span-2" />
          <Field label="Address" value={form.address} onChange={(v) => set('address', v)} className="sm:col-span-2" textarea />
        </div>
      </div>

      <div>
        <h4 className="text-xs font-extrabold uppercase tracking-wide text-brand-sage mb-3">Medical Background</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <SelectField label="Blood Group" value={form.blood_group} onChange={(v) => set('blood_group', v)}
            options={['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
          <TagListEditor label="Allergies" values={form.allergies} onChange={(v) => set('allergies', v)} />
          <TagListEditor label="Existing Conditions" values={form.existing_conditions} onChange={(v) => set('existing_conditions', v)} />
          <TagListEditor label="Past Surgeries" values={form.past_surgeries} onChange={(v) => set('past_surgeries', v)} />
          <TagListEditor label="Current Medications" values={form.current_medications} onChange={(v) => set('current_medications', v)} />
        </div>
        <div className="grid grid-cols-1 gap-3">
          <Field label="Family History" value={form.family_history} onChange={(v) => set('family_history', v)} textarea />
          <Field label="Important Medical Notes" value={form.important_medical_notes} onChange={(v) => set('important_medical_notes', v)} textarea />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="px-4 py-2 text-sm font-extrabold text-white bg-brand-forest rounded-xl hover:bg-brand-forestHover disabled:opacity-50">
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Patient'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, className = '', textarea = false }) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-slate-500 mb-1.5">{label}</label>
      {textarea ? (
        <textarea
          value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={2}
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-sage resize-none"
        />
      ) : (
        <input
          type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
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
        {options.map((o) => <option key={o} value={o}>{o || '—'}</option>)}
      </select>
    </div>
  );
}
