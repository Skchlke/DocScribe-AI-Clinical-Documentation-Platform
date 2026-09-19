import { Plus, Trash2, Pill } from 'lucide-react';

const EMPTY_ROW = {
  medicine: '', brand_name: '', form: '', dosage: '',
  frequency: '', timing: '', duration: '', instructions: '',
};

const FORMS = ['', 'Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Ointment', 'Other'];
const TIMINGS = ['', 'Before Food', 'After Food', 'With Food', 'Anytime'];

const inputClass = 'text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-sage bg-white';

export default function PrescriptionEditor({ items, onChange }) {
  const updateRow = (index, field, value) => {
    onChange(items.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const addRow = () => onChange([...items, { ...EMPTY_ROW }]);
  const removeRow = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-xs text-slate-400 italic">No medicines added yet.</p>
      )}

      {items.map((row, i) => (
        <div key={i} className="bg-brand-bg/60 border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <input
              type="text" placeholder="Drug name (generic)" value={row.medicine}
              onChange={(e) => updateRow(i, 'medicine', e.target.value)}
              className={`${inputClass} col-span-2 sm:col-span-1`}
            />
            <input
              type="text" placeholder="Brand name" value={row.brand_name}
              onChange={(e) => updateRow(i, 'brand_name', e.target.value)}
              className={inputClass}
            />
            <select value={row.form} onChange={(e) => updateRow(i, 'form', e.target.value)} className={inputClass}>
              {FORMS.map((f) => <option key={f} value={f}>{f || 'Form'}</option>)}
            </select>
            <input
              type="text" placeholder="Dosage (e.g. 500mg)" value={row.dosage}
              onChange={(e) => updateRow(i, 'dosage', e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-center">
            <input
              type="text" placeholder="Frequency (e.g. 1-0-1)" value={row.frequency}
              onChange={(e) => updateRow(i, 'frequency', e.target.value)}
              className={inputClass}
            />
            <select value={row.timing} onChange={(e) => updateRow(i, 'timing', e.target.value)} className={inputClass}>
              {TIMINGS.map((t) => <option key={t} value={t}>{t || 'Timing'}</option>)}
            </select>
            <input
              type="text" placeholder="Duration (e.g. 5 days)" value={row.duration}
              onChange={(e) => updateRow(i, 'duration', e.target.value)}
              className={inputClass}
            />
            <input
              type="text" placeholder="Additional instructions" value={row.instructions}
              onChange={(e) => updateRow(i, 'instructions', e.target.value)}
              className={`${inputClass} col-span-2 sm:col-span-1`}
            />
            <button
              type="button" onClick={() => removeRow(i)}
              className="inline-flex items-center justify-center gap-1 text-rose-500 hover:text-rose-700 text-xs font-bold"
              title="Remove medicine"
            >
              <Trash2 className="w-4 h-4" /> Remove
            </button>
          </div>
        </div>
      ))}

      <button
        type="button" onClick={addRow}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-forest hover:text-brand-forestHover"
      >
        <Plus className="w-4 h-4" /> <Pill className="w-4 h-4" /> Add medicine
      </button>
    </div>
  );
}
