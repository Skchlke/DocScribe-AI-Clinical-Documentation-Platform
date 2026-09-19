import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { addItem, removeItem } from '../../utils/listField';

/** A chip-style editor for a list of short strings (allergies, symptoms, conditions, etc). */
export default function TagListEditor({ label, values, onChange, placeholder = 'Add and press Enter' }) {
  const [draft, setDraft] = useState('');

  const commit = () => {
    if (!draft.trim()) return;
    onChange(addItem(values, draft));
    setDraft('');
  };

  return (
    <div>
      {label && <label className="block text-xs font-bold text-slate-500 mb-1.5">{label}</label>}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((v, i) => (
          <span
            key={`${v}-${i}`}
            className="inline-flex items-center gap-1 bg-brand-sageLight text-brand-forest text-xs font-semibold px-2.5 py-1 rounded-full border border-brand-sage/20"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(removeItem(values, i))}
              className="text-brand-forest/60 hover:text-brand-terracotta"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {values.length === 0 && <span className="text-xs text-slate-400 italic">None added</span>}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            }
          }}
          placeholder={placeholder}
          className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-sage"
        />
        <button
          type="button"
          onClick={commit}
          className="px-3 py-1.5 bg-brand-sageLight text-brand-forest rounded-lg hover:bg-brand-sage hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
