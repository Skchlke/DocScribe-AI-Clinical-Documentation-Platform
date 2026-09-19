import { useEffect, useState, useRef } from 'react';
import { Search } from 'lucide-react';
import * as api from '../api';
import { formatDate, formatDateTime } from '../utils/formatDate';
import StatusBadge from './shared/StatusBadge';

const STATUS_OPTIONS = ['All', 'Scheduled', 'Completed', 'Cancelled', 'No-show'];

export default function AllAppointments({ onSelectAppointment, showError }) {
  const [appointments, setAppointments] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const isFirstRun = useRef(true);

  useEffect(() => {
    let cancelled = false;
    const delay = isFirstRun.current ? 0 : 300;
    isFirstRun.current = false;

    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.listAllAppointments({
          search: query || undefined,
          status: status !== 'All' ? status : undefined,
          date: date || undefined,
        });
        if (!cancelled) setAppointments(data);
      } catch (e) {
        if (!cancelled) showError(e.message || 'Failed to load appointments.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, delay);

    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, status, date]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-brand-charcoal">All Appointments</h1>
        <p className="text-sm text-slate-500 mt-1">{appointments.length} appointment{appointments.length === 1 ? '' : 's'}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by patient name or reason..."
            className="w-full text-sm border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-brand-sage bg-white"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand-sage bg-white">
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand-sage bg-white" />
      </div>

      <div className="bg-white border border-brand-sage/20 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 font-bold bg-brand-bg/60 border-b border-slate-100">
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Date &amp; Time</th>
              <th className="px-4 py-3">Visit Type</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Follow-up</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.appointment_id} onClick={() => onSelectAppointment(a.appointment_id)}
                  className="border-b border-slate-50 last:border-0 hover:bg-brand-sageLight/40 cursor-pointer">
                <td className="px-4 py-3 font-semibold text-brand-charcoal">{a.patient_name}</td>
                <td className="px-4 py-3 text-slate-600">{formatDateTime(a.appointment_datetime)}</td>
                <td className="px-4 py-3 text-slate-600">{a.visit_type || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{a.reason_for_visit || '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-3 text-slate-600">{a.follow_up_date ? formatDate(a.follow_up_date) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && appointments.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-10">No appointments found.</p>
        )}
      </div>
    </div>
  );
}
