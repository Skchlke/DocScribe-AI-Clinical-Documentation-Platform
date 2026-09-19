import { useEffect, useState } from 'react';
import { Users, CalendarClock, CheckCircle2, Clock, Phone, ChevronRight } from 'lucide-react';
import * as api from '../api';
import { formatDate, formatDateTime } from '../utils/formatDate';
import StatusBadge from './shared/StatusBadge';

const STAT_CARDS = [
  { key: 'total_patients', label: 'Total Patients', icon: Users, color: 'text-brand-forest bg-brand-sageLight' },
  { key: 'total_appointments', label: 'Total Appointments', icon: CalendarClock, color: 'text-sky-700 bg-sky-50' },
  { key: 'scheduled_appointments', label: 'Scheduled', icon: Clock, color: 'text-amber-700 bg-amber-50' },
  { key: 'completed_appointments', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50' },
];

export default function Dashboard({ onSelectAppointment, showError }) {
  const [stats, setStats] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [statsData, followUpData, recentData] = await Promise.all([
          api.getDashboardStats(),
          api.getUpcomingFollowUps(5),
          api.listAllAppointments(),
        ]);
        if (cancelled) return;
        setStats(statsData);
        setFollowUps(followUpData);
        setRecent(recentData.slice(0, 5));
      } catch (e) {
        if (!cancelled) showError(e.message || 'Failed to load dashboard data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [showError]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-brand-charcoal">Clinic Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">A quick look at your patients and upcoming visits.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="bg-white border border-brand-sage/20 rounded-2xl p-5 shadow-sm">
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-brand-charcoal">{loading ? '—' : (stats?.[key] ?? 0)}</p>
            <p className="text-xs text-slate-500 font-semibold">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-brand-sage/20 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-extrabold text-brand-charcoal mb-4">Follow-up Alerts (next 5 days)</h2>
          {!loading && followUps.length === 0 && (
            <p className="text-sm text-slate-400 italic">No upcoming follow-ups.</p>
          )}
          <div className="space-y-2">
            {followUps.map((f) => (
              <button
                key={f.appointment_id}
                onClick={() => onSelectAppointment(f.appointment_id, f.patient_id)}
                className="w-full flex items-center justify-between text-left bg-brand-bg/60 hover:bg-brand-sageLight border border-slate-100 rounded-xl px-4 py-3 transition-colors"
              >
                <div>
                  <p className="text-sm font-bold text-brand-charcoal">{f.patient_name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> {f.phone || '—'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-brand-terracotta">{formatDate(f.follow_up_date)}</p>
                  <ChevronRight className="w-4 h-4 text-slate-300 ml-auto mt-1" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-brand-sage/20 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-extrabold text-brand-charcoal mb-4">Recent Appointments</h2>
          {!loading && recent.length === 0 && (
            <p className="text-sm text-slate-400 italic">No appointments recorded yet.</p>
          )}
          <div className="space-y-2">
            {recent.map((a) => (
              <button
                key={a.appointment_id}
                onClick={() => onSelectAppointment(a.appointment_id, a.patient_id)}
                className="w-full flex items-center justify-between text-left bg-brand-bg/60 hover:bg-brand-sageLight border border-slate-100 rounded-xl px-4 py-3 transition-colors"
              >
                <div>
                  <p className="text-sm font-bold text-brand-charcoal">{a.patient_name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{a.reason_for_visit || a.visit_type || 'Visit'}</p>
                </div>
                <div className="text-right space-y-1">
                  <StatusBadge status={a.status} />
                  <p className="text-[11px] text-slate-400">{formatDateTime(a.appointment_datetime)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
