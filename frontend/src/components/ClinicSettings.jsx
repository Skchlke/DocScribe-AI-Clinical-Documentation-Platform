import { useEffect, useState } from 'react';
import { Building2, Stethoscope } from 'lucide-react';
import * as api from '../api';

const BLANK = {
  clinic_name: '', clinic_address: '', clinic_phone: '', clinic_email: '',
  doctor_name: '', doctor_qualifications: '', doctor_registration_number: '',
};

export default function ClinicSettings({ showError, showSuccess }) {
  const [form, setForm] = useState(BLANK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await api.getClinicSettings();
        if (!cancelled) setForm({ ...BLANK, ...data });
      } catch (e) {
        if (!cancelled) showError(e.message || 'Failed to load clinic settings.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [showError]);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await api.updateClinicSettings(form);
      setForm({ ...BLANK, ...saved });
      showSuccess('Clinic settings saved.');
    } catch (e) {
      showError(e.message || 'Failed to save clinic settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-400 animate-fade-in">Loading settings...</p>;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-brand-charcoal">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          This clinic and doctor information appears on every printed prescription.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-brand-sage/20 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wide text-brand-sage mb-3 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Clinic Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Clinic Name" value={form.clinic_name} onChange={(v) => set('clinic_name', v)} className="sm:col-span-2" />
            <Field label="Address" value={form.clinic_address} onChange={(v) => set('clinic_address', v)} className="sm:col-span-2" textarea />
            <Field label="Contact Number" value={form.clinic_phone} onChange={(v) => set('clinic_phone', v)} />
            <Field label="Email" type="email" value={form.clinic_email} onChange={(v) => set('clinic_email', v)} />
          </div>
        </div>

        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wide text-brand-sage mb-3 flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5" /> Doctor Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Doctor's Name" value={form.doctor_name} onChange={(v) => set('doctor_name', v)} className="sm:col-span-2" />
            <Field label="Qualifications" value={form.doctor_qualifications} onChange={(v) => set('doctor_qualifications', v)}
              placeholder="e.g. MBBS, MD" />
            <Field label="Registration Number" value={form.doctor_registration_number} onChange={(v) => set('doctor_registration_number', v)}
              placeholder="Required legally for prescriptions" />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={saving}
            className="px-4 py-2 text-sm font-extrabold text-white bg-brand-forest rounded-xl hover:bg-brand-forestHover disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
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
