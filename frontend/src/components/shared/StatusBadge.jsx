const STYLES = {
  Scheduled: 'bg-brand-sageLight text-brand-forest border-brand-sage/30',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  'No-show': 'bg-orange-50 text-orange-700 border-orange-200',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full font-extrabold border ${style}`}>
      {status || 'Unknown'}
    </span>
  );
}
