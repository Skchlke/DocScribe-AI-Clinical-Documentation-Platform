const FIELDS = [
  { key: 'bp', label: 'Blood Pressure', placeholder: 'e.g. 120/80' },
  { key: 'temperature', label: 'Temperature', placeholder: 'e.g. 98.6 F' },
  { key: 'pulse', label: 'Pulse', placeholder: 'e.g. 72 bpm' },
  { key: 'resp_rate', label: 'Resp. Rate', placeholder: 'e.g. 16/min' },
  { key: 'spo2', label: 'SpO2', placeholder: 'e.g. 98%' },
  { key: 'weight', label: 'Weight', placeholder: 'e.g. 70 kg' },
  { key: 'height', label: 'Height', placeholder: 'e.g. 170 cm' },
];

export default function VitalsInput({ values, onChange }) {
  const update = (key, value) => onChange({ ...values, [key]: value });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {FIELDS.map((f) => (
        <div key={f.key}>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">{f.label}</label>
          <input
            type="text"
            value={values[f.key] || ''}
            onChange={(e) => update(f.key, e.target.value)}
            placeholder={f.placeholder}
            className="w-full text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-sage"
          />
        </div>
      ))}
    </div>
  );
}
