import { useEffect, useState, useRef } from 'react';
import { Search, Plus, User, Phone, ChevronRight } from 'lucide-react';
import * as api from '../api';
import { formatDate, calculateAge } from '../utils/formatDate';

export default function PatientList({ onSelectPatient, onAddPatient, showError }) {
  const [patients, setPatients] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const isFirstRun = useRef(true);

  useEffect(() => {
    let cancelled = false;
    const delay = isFirstRun.current ? 0 : 300;
    isFirstRun.current = false;

    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.listPatients(query || undefined);
        if (!cancelled) setPatients(data);
      } catch (e) {
        if (!cancelled) showError(e.message || 'Failed to load patients.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, delay);

    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-charcoal">Patients</h1>
          <p className="text-sm text-slate-500 mt-1">{patients.length} patient{patients.length === 1 ? '' : 's'} on record</p>
        </div>
        <button
          onClick={onAddPatient}
          className="inline-flex items-center gap-2 bg-brand-forest hover:bg-brand-forestHover text-white font-extrabold rounded-xl shadow-md px-4 py-2.5 text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Patient
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, phone, or patient number..."
          className="w-full text-sm border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-brand-sage bg-white"
        />
      </div>

      {loading && <p className="text-sm text-slate-400">Loading patients...</p>}

      {!loading && patients.length === 0 && (
        <div className="bg-white border border-brand-sage/20 rounded-2xl p-10 text-center text-slate-400">
          No patients found.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.map((p) => {
          const age = calculateAge(p.date_of_birth);
          return (
            <button
              key={p.patient_id}
              onClick={() => onSelectPatient(p.patient_id)}
              className="bg-white border border-brand-sage/20 rounded-2xl p-5 shadow-sm text-left hover:border-brand-sage hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-brand-sageLight flex items-center justify-center overflow-hidden shrink-0">
                  {p.profile_photo_path ? (
                    <img src={`${api.API_BASE_URL}${p.profile_photo_path}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-brand-forest" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-brand-charcoal truncate">{p.first_name} {p.last_name}</p>
                  <p className="text-xs text-slate-400 font-semibold">{p.unique_patient_number}{age !== null ? ` · ${age} yrs` : ''}{p.gender ? ` · ${p.gender}` : ''}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 mt-1 shrink-0" />
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> {p.phone || 'No phone on file'}
                </p>
                <p className="text-xs text-slate-400">DOB: {formatDate(p.date_of_birth)}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
