export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: options.body instanceof FormData
      ? options.headers
      : { 'Content-Type': 'application/json', ...options.headers },
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {
      // ignore body parse failure, use default detail
    }
    throw new Error(detail);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ─── Health ─────────────────────────────────────────────────────

export const checkHealth = () => request('/api/health');

// ─── Patients ───────────────────────────────────────────────────

export const listPatients = (search) =>
  request(`/api/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`);

export const getPatient = (id) => request(`/api/patients/${id}`);

export const createPatient = (payload) =>
  request('/api/patients', { method: 'POST', body: JSON.stringify(payload) });

export const updatePatient = (id, payload) =>
  request(`/api/patients/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

export const deletePatient = (id) =>
  request(`/api/patients/${id}`, { method: 'DELETE' });

export const uploadPatientPhoto = (id, file) => {
  const form = new FormData();
  form.append('file', file);
  return request(`/api/patients/${id}/photo`, { method: 'POST', body: form });
};

// ─── Appointments ───────────────────────────────────────────────

export const listPatientAppointments = (patientId) =>
  request(`/api/patients/${patientId}/appointments`);

export const createAppointment = (patientId, payload) =>
  request(`/api/patients/${patientId}/appointments`, { method: 'POST', body: JSON.stringify(payload) });

export const getAppointment = (id) => request(`/api/appointments/${id}`);

export const updateAppointment = (id, payload) =>
  request(`/api/appointments/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

export const deleteAppointment = (id) =>
  request(`/api/appointments/${id}`, { method: 'DELETE' });

export const listAllAppointments = ({ search, status, date } = {}) => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status) params.set('status_filter', status);
  if (date) params.set('date', date);
  const qs = params.toString();
  return request(`/api/appointments${qs ? `?${qs}` : ''}`);
};

export const getUpcomingFollowUps = (days = 5) =>
  request(`/api/appointments/upcoming-followups?days=${days}`);

// ─── Documents ──────────────────────────────────────────────────

export const uploadAppointmentDocument = (appointmentId, file, category) => {
  const form = new FormData();
  form.append('file', file);
  form.append('category', category || 'Other');
  return request(`/api/appointments/${appointmentId}/documents`, { method: 'POST', body: form });
};

export const deleteDocument = (id) =>
  request(`/api/documents/${id}`, { method: 'DELETE' });

// ─── Dashboard ──────────────────────────────────────────────────

export const getDashboardStats = () => request('/api/dashboard/stats');
