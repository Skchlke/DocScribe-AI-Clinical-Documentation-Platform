import { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Users, CalendarClock, Settings as SettingsIcon, Stethoscope, CheckCircle, AlertCircle } from 'lucide-react';
import * as api from './api';
import { useToast } from './hooks/useToast';

import Dashboard from './components/Dashboard';
import PatientList from './components/PatientList';
import PatientDetail from './components/PatientDetail';
import AppointmentDetail from './components/AppointmentDetail';
import AllAppointments from './components/AllAppointments';
import ClinicSettings from './components/ClinicSettings';
import PatientForm from './components/PatientForm';
import AppointmentForm from './components/AppointmentForm';
import Modal from './components/shared/Modal';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'patients', label: 'Patients', icon: Users },
  { key: 'appointments', label: 'All Appointments', icon: CalendarClock },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
];

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [patientModal, setPatientModal] = useState(null); // { mode: 'create' } | { mode: 'edit', patient }
  const [appointmentModal, setAppointmentModal] = useState(null); // { mode: 'create', patientId } | { mode: 'edit', appointment }

  const [backendConnected, setBackendConnected] = useState(false);
  const { error, success, showError, showSuccess } = useToast();

  useEffect(() => {
    let cancelled = false;
    const ping = async () => {
      try {
        await api.checkHealth();
        if (!cancelled) setBackendConnected(true);
      } catch {
        if (!cancelled) setBackendConnected(false);
      }
    };
    ping();
    const interval = setInterval(ping, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const goToSection = (section) => {
    setActiveSection(section);
    setSelectedPatientId(null);
    setSelectedAppointmentId(null);
  };

  const handleSelectPatient = (patientId) => {
    setSelectedPatientId(patientId);
    setSelectedAppointmentId(null);
  };

  const handleSelectAppointment = useCallback((appointmentId) => {
    setSelectedAppointmentId(appointmentId);
  }, []);

  const bumpRefresh = () => setRefreshKey((k) => k + 1);

  const handlePatientSaved = (saved) => {
    setPatientModal(null);
    if (patientModal?.mode === 'create') {
      setActiveSection('patients');
      setSelectedPatientId(saved.patient_id);
    } else {
      bumpRefresh();
    }
  };

  const handleAppointmentSaved = (saved) => {
    setAppointmentModal(null);
    setSelectedAppointmentId(saved.appointment_id);
    bumpRefresh();
  };

  const handlePatientDeleted = () => {
    setSelectedPatientId(null);
  };

  const handleAppointmentDeleted = (patientId) => {
    setSelectedAppointmentId(null);
    if (activeSection === 'patients' && patientId) {
      setSelectedPatientId(patientId);
      bumpRefresh();
    }
  };

  const renderMain = () => {
    if (selectedAppointmentId) {
      return (
        <AppointmentDetail
          key={`appt-${selectedAppointmentId}-${refreshKey}`}
          appointmentId={selectedAppointmentId}
          onBack={() => setSelectedAppointmentId(null)}
          onEdit={(appointment) => setAppointmentModal({ mode: 'edit', appointment })}
          onDeleted={handleAppointmentDeleted}
          showError={showError}
          showSuccess={showSuccess}
        />
      );
    }

    if (activeSection === 'dashboard') {
      return (
        <Dashboard
          onSelectAppointment={handleSelectAppointment}
          showError={showError}
        />
      );
    }

    if (activeSection === 'appointments') {
      return <AllAppointments onSelectAppointment={handleSelectAppointment} showError={showError} />;
    }

    if (activeSection === 'settings') {
      return <ClinicSettings showError={showError} showSuccess={showSuccess} />;
    }

    // activeSection === 'patients'
    if (selectedPatientId) {
      return (
        <PatientDetail
          key={`patient-${selectedPatientId}-${refreshKey}`}
          patientId={selectedPatientId}
          onBack={() => setSelectedPatientId(null)}
          onEditPatient={(patient) => setPatientModal({ mode: 'edit', patient })}
          onNewAppointment={(patientId) => setAppointmentModal({ mode: 'create', patientId })}
          onSelectAppointment={handleSelectAppointment}
          onPatientDeleted={handlePatientDeleted}
          showError={showError}
          showSuccess={showSuccess}
        />
      );
    }
    return (
      <PatientList
        onSelectPatient={handleSelectPatient}
        onAddPatient={() => setPatientModal({ mode: 'create' })}
        showError={showError}
      />
    );
  };

  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-forest rounded-lg flex items-center justify-center">
              <Stethoscope className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-brand-charcoal">DocScribe</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className={`relative flex h-2 w-2`}>
              <span className={`absolute inline-flex h-full w-full rounded-full ${backendConnected ? 'bg-emerald-400 animate-status-ping' : 'bg-rose-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${backendConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span className={backendConnected ? 'text-emerald-600' : 'text-rose-500'}>
              {backendConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-6">
        <aside className="hidden lg:block w-52 shrink-0 py-6 no-print">
          <nav className="space-y-1 sticky top-20">
            {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => goToSection(key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeSection === key && !selectedAppointmentId
                    ? 'nav-active bg-brand-sageLight text-brand-forest'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 py-6">
          {renderMain()}
        </main>
      </div>

      {(error || success) && (
        <div className="fixed bottom-4 right-4 z-50 space-y-2 no-print">
          {error && (
            <div className="flex items-center gap-2 bg-rose-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg animate-slide-up">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-brand-forest text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg animate-slide-up">
              <CheckCircle className="w-4 h-4 shrink-0" /> {success}
            </div>
          )}
        </div>
      )}

      {patientModal && (
        <Modal title={patientModal.mode === 'edit' ? 'Edit Patient' : 'Add Patient'} onClose={() => setPatientModal(null)}>
          <PatientForm
            patient={patientModal.mode === 'edit' ? patientModal.patient : null}
            onSaved={handlePatientSaved}
            onCancel={() => setPatientModal(null)}
            showError={showError}
            showSuccess={showSuccess}
          />
        </Modal>
      )}

      {appointmentModal && (
        <Modal title={appointmentModal.mode === 'edit' ? 'Edit Appointment' : 'New Appointment'} onClose={() => setAppointmentModal(null)} maxWidth="max-w-3xl">
          <AppointmentForm
            patientId={appointmentModal.mode === 'create' ? appointmentModal.patientId : appointmentModal.appointment.patient_id}
            appointment={appointmentModal.mode === 'edit' ? appointmentModal.appointment : null}
            onSaved={handleAppointmentSaved}
            onCancel={() => setAppointmentModal(null)}
            showError={showError}
            showSuccess={showSuccess}
          />
        </Modal>
      )}
    </div>
  );
}

export default App;
