import React, { useState, useEffect, useRef } from 'react';
import TopHeader from './TopHeader';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import GlobalAlertBanner from './GlobalAlertBanner';
import NotificationCenter from './NotificationCenter';
import Modal from '../common/Modal';
import CommandPalette from '../common/CommandPalette';
import CompanyOnboardingWizard from '../admin/CompanyOnboardingWizard';
import Customer360Modal from '../customers/Customer360Modal';
import OperationalInsightsDrawer from '../ai/OperationalInsightsDrawer';
import { Activity, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';
import { playNotificationChime } from '../../lib/sound';
import { flushOfflineQueue, getOfflineQueue } from '../../lib/offline';

export default function Shell({
  user,
  dark,
  onToggleTheme,
  onLogout,
  currentTab,
  onSelectTab,
  children
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [onboardingWizardOpen, setOnboardingWizardOpen] = useState(false);
  const [customer360Id, setCustomer360Id] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [activeGlobalAlert, setActiveGlobalAlert] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [queuedCount, setQueuedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState('');
  const [insightsOpen, setInsightsOpen] = useState(false);


  // Inactivity 10-Minute Idle Monitor State
  const [idleModalOpen, setIdleModalOpen] = useState(false);
  const [idleReason, setIdleReason] = useState('Break');
  const [idleExplanation, setIdleExplanation] = useState('');
  const [idleStartTime, setIdleStartTime] = useState(null);
  const lastActivityRef = useRef(Date.now());

  // Load notifications & check SOS alerts
  const loadNotifications = async () => {
    try {
      const list = await api.get('/notifications');
      setNotifications(list || []);

      // Check if there are active SOS emergency alerts
      if (['CEO', 'CTO', 'HR', 'MANAGER', 'IT_ADMIN', 'SUPERVISOR', 'SUPER_ADMIN'].includes(user?.role_code) || ['CEO', 'CTO', 'HR'].includes(user?.rank?.code)) {
        const sos = await api.get('/hr/sos').catch(() => []);
        const activeSOS = (Array.isArray(sos) ? sos : (sos?.sos || sos?.data || [])).find(s => s.status === 'active');
        if (activeSOS) {
          setActiveGlobalAlert({
            type: 'SOS',
            title: `CRITICAL FIELD EMERGENCY: ${activeSOS.agent?.first_name || 'Field Agent'}`,
            message: activeSOS.message,
            actionText: 'View SOS Queue',
            actionTab: 'hr',
            sosId: activeSOS.id
          });
        } else {
          setActiveGlobalAlert(null);
        }
      }
    } catch {
      // Ignore network errors
    }
  };

  const handleResolveSOSAlert = async (alert) => {
    if (!alert?.sosId) return;
    try {
      await api.put(`/hr/sos/${alert.sosId}/resolve`, {
        resolution_notes: 'Emergency confirmed safe and stopped by Administrator via Global Alert Banner.'
      });
      setActiveGlobalAlert(null);
      setSyncSuccessToast('SOS Emergency beacon successfully stopped and marked safe.');
      setTimeout(() => setSyncSuccessToast(''), 5000);
      loadNotifications();
    } catch (err) {
      console.warn('SOS resolve error:', err.message);
    }
  };

  const runSync = async () => {
    if (!navigator.onLine || syncing) return;
    setSyncing(true);
    try {
      const res = await flushOfflineQueue(api);
      const q = await getOfflineQueue();
      setQueuedCount(q.length);
      if (res.synced > 0) {
        setSyncSuccessToast(`All ${res.synced} offline actions synchronized successfully with server!`);
        playNotificationChime();
        setTimeout(() => setSyncSuccessToast(''), 5000);
      }
      loadNotifications();
    } catch (err) {
      console.warn('Sync attempt:', err.message);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const notifInterval = setInterval(loadNotifications, 30000);
    return () => clearInterval(notifInterval);
  }, [user]);

  // Online / Offline live synchronization listeners
  useEffect(() => {
    const handleOnline = async () => {
      setOnline(true);
      await runSync();
    };

    const handleOffline = async () => {
      setOnline(false);
      const q = await getOfflineQueue();
      setQueuedCount(q.length);
    };

    const handleQueueUpdated = async () => {
      const q = await getOfflineQueue();
      setQueuedCount(q.length);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('ewf_queue_updated', handleQueueUpdated);

    getOfflineQueue().then(q => setQueuedCount(q.length));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('ewf_queue_updated', handleQueueUpdated);
    };
  }, []);

  // Inactivity & Minimized Workstation Tracking: 10 minutes of no user interaction / minimized window
  useEffect(() => {
    const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes (600,000 ms)
    let isMinimized = document.visibilityState === 'hidden';

    const resetIdleTimer = () => {
      lastActivityRef.current = Date.now();
    };

    const handleVisibilityChange = () => {
      isMinimized = document.visibilityState === 'hidden';
      if (!isMinimized) {
        lastActivityRef.current = Date.now();
      }
    };

    const activityEvents = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(evt => window.addEventListener(evt, resetIdleTimer, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', () => { isMinimized = true; });
    window.addEventListener('focus', () => { isMinimized = false; resetIdleTimer(); });

    const checkIdleInterval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= IDLE_TIMEOUT_MS && !idleModalOpen) {
        const startIso = new Date(lastActivityRef.current).toISOString();
        setIdleStartTime(startIso);
        setIdleModalOpen(true);
        playNotificationChime();

        const workstationReport = {
          started_at: startIso,
          duration_seconds: Math.round(elapsed / 1000),
          reason: isMinimized ? 'Workstation Minimized / Background Inactivity (10m+)' : 'Workstation Idle Timeout (10m+)',
          explanation: `Automated Workstation Telemetry Log - Staff: ${user?.full_name || 'Staff Member'} (${user?.employee_code || user?.email || 'ID:' + user?.id}) | Role: ${user?.role_code || 'Employee'} | Window State: ${isMinimized ? 'Minimized / Hidden' : 'Active Tab Inactive'} | Display: ${window.screen?.width || 0}x${window.screen?.height || 0}`,
          workstation_snapshot: {
            employee_name: user?.full_name,
            employee_code: user?.employee_code,
            email: user?.email,
            role: user?.role_code,
            window_state: isMinimized ? 'MINIMIZED_BACKGROUND' : 'TAB_INACTIVE',
            screen_resolution: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
            current_tab: currentTab,
            user_agent: navigator.userAgent
          }
        };

        // Automatically log idle telemetry report to IT and HR queue
        api.post('/employee/idle-event', workstationReport).catch(() => {});
      }
    }, 15000);

    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, resetIdleTimer));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(checkIdleInterval);
    };
  }, [idleModalOpen, user, currentTab]);

  const handleSubmitIdleReason = async () => {
    try {
      const durationSec = idleStartTime ? Math.round((Date.now() - new Date(idleStartTime).getTime()) / 1000) : 600;
      await api.post('/employee/idle-event', {
        started_at: idleStartTime || new Date(Date.now() - 600000).toISOString(),
        duration_seconds: durationSec,
        reason: idleReason,
        explanation: idleExplanation
      });
    } catch {
      // Fallback
    } finally {
      setIdleModalOpen(false);
      setIdleExplanation('');
      lastActivityRef.current = Date.now();
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`, {});
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read', {});
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#F8F8F6] dark:bg-[#0E0E11] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
      <TopHeader
        user={user}
        dark={dark}
        onToggleTheme={onToggleTheme}
        online={online}
        queuedCount={queuedCount}
        unreadNotificationsCount={unreadCount}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onManualSync={runSync}
        syncing={syncing}
        onLogout={onLogout}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        onOpenInsights={() => setInsightsOpen(true)}
      />


      {/* Sync Success Toast Banner */}
      {syncSuccessToast && (
        <div className="bg-emerald-600 text-white text-xs font-bold py-2 px-4 flex items-center justify-between shadow-md animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{syncSuccessToast}</span>
          </div>
          <button onClick={() => setSyncSuccessToast('')} className="text-white/80 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Global Alert Banner */}
      <GlobalAlertBanner
        alert={activeGlobalAlert}
        onAction={(alert) => {
          if (alert.actionTab) onSelectTab(alert.actionTab);
        }}
        onResolveSOS={handleResolveSOSAlert}
        onDismiss={() => setActiveGlobalAlert(null)}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar
            user={user}
            currentTab={currentTab}
            onSelectTab={onSelectTab}
          />
        </div>

        {/* Mobile Slide-out Drawer Sidebar */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 max-w-xs w-full shadow-2xl">
              <Sidebar
                user={user}
                currentTab={currentTab}
                onSelectTab={onSelectTab}
                isMobile={true}
                onCloseMobile={() => setMobileMenuOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 lg:pb-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        user={user}
        currentTab={currentTab}
        onSelectTab={onSelectTab}
      />

      {/* Notification Center Drawer */}
      <NotificationCenter
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotificationRead}
        onMarkAllRead={handleMarkAllNotificationsRead}
      />

      {/* Inactivity Telemetry 10-Minute Idle Prompt Modal */}
      <Modal
        title="Workstation Inactivity Check"
        subtitle="10 Minutes of inactivity detected on EdgeWForce"
        isOpen={idleModalOpen}
        onClose={() => {}}
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-xl surface-card-subtle border border-orange-500/30 flex items-start gap-2.5">
            <Activity size={18} className="text-orange-500 mt-0.5 flex-shrink-0" />
            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
              We noticed you have been inactive for approximately 10 minutes. In accordance with Experiential Edge's transparent workforce telemetry policy, please choose the activity for this period.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1.5">
              Activity Category *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Break', 'Meeting', 'Field Work', 'Reading/Research', 'System Issue', 'Other'].map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setIdleReason(opt)}
                  className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition ${
                    idleReason === opt
                      ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold'
                      : 'surface-card border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Brief Explanation (Optional)
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Discussing Q3 sales order with retail manager Alhaji Bello..."
              className="form-input"
              value={idleExplanation}
              onChange={(e) => setIdleExplanation(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={handleSubmitIdleReason}
            className="btn-primary w-full py-2.5"
          >
            Submit & Resume Workspace
          </button>
        </div>
      </Modal>

      {/* Global Command Palette (Ctrl + K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={(val) => {
          if (val === false) setCommandPaletteOpen(true);
          else setCommandPaletteOpen(false);
        }}
        onNavigate={(tab) => {
          setCommandPaletteOpen(false);
          onSelectTab(tab);
        }}
        onOpenCustomer360={(id) => {
          setCommandPaletteOpen(false);
          setCustomer360Id(id);
        }}
        onOpenOnboarding={() => {
          setCommandPaletteOpen(false);
          setOnboardingWizardOpen(true);
        }}
      />

      {/* Global Company Onboarding Wizard */}
      <CompanyOnboardingWizard
        isOpen={onboardingWizardOpen}
        onClose={() => setOnboardingWizardOpen(false)}
        onSuccess={() => {
          setOnboardingWizardOpen(false);
          onSelectTab('command_center');
        }}
      />

      {/* Global Customer 360 View */}
      {customer360Id && (
        <Customer360Modal
          customerId={customer360Id}
          isOpen={true}
          onClose={() => setCustomer360Id(null)}
        />
      )}
      <OperationalInsightsDrawer isOpen={insightsOpen} onClose={() => setInsightsOpen(false)} />
    </div>
  );
}

