import { Plus, Trash2, Pill } from 'lucide-react';

const EMPTY_ROW = { medicine: '', dosage: '', frequency: '', duration: '', instructions: '' };

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
        <div key={i} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-start bg-brand-bg/60 border border-slate-200 rounded-xl p-3">
          <input
            type="text" placeholder="Medicine" value={row.medicine}
            onChange={(e) => updateRow(i, 'medicine', e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-sage sm:col-span-1"
          />
          <input
            type="text" placeholder="Dosage" value={row.dosage}
            onChange={(e) => updateRow(i, 'dosage', e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-sage"
          />
          <input
            type="text" placeholder="Frequency" value={row.frequency}
            onChange={(e) => updateRow(i, 'frequency', e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-sage"
          />
          <input
            type="text" placeholder="Duration" value={row.duration}
            onChange={(e) => updateRow(i, 'duration', e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-sage"
          />
          <div className="flex gap-2 sm:col-span-1">
            <input
              type="text" placeholder="Instructions" value={row.instructions}
              onChange={(e) => updateRow(i, 'instructions', e.target.value)}
              className="flex-1 text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-sage"
            />
            <button
              type="button" onClick={() => removeRow(i)}
              className="text-rose-500 hover:text-rose-700 shrink-0"
              title="Remove medicine"
            >
              <Trash2 className="w-4 h-4" />
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
