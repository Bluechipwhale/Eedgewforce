import React, { useState, useEffect } from 'react';
import Shell from './components/layout/Shell';
import LoginPage from './pages/LoginPage';
import FirstLoginPasswordModal from './components/employee/FirstLoginPasswordModal';
import GlobalAlertBanner from './components/layout/GlobalAlertBanner';

// Role & Feature Dashboards
import CommandCenterDashboard from './dashboards/CommandCenterDashboard';
import CustomerDirectoryDashboard from './dashboards/CustomerDirectoryDashboard';
import InventoryDashboard from './dashboards/InventoryDashboard';
import DeliveryDashboard from './dashboards/DeliveryDashboard';
import AlertCenterDashboard from './dashboards/AlertCenterDashboard';
import ReportsCenterDashboard from './dashboards/ReportsCenterDashboard';
import SupervisorDashboard from './dashboards/SupervisorDashboard';
import SalesDashboard from './dashboards/SalesDashboard';
import FieldDashboard from './dashboards/FieldDashboard';
import AccountingDashboard from './dashboards/AccountingDashboard';
import ExecutiveDashboard from './dashboards/ExecutiveDashboard';
import ITAdminDashboard from './dashboards/ITAdminDashboard';
import HRDashboard from './dashboards/HRDashboard';
import EmployeeDashboard from './dashboards/EmployeeDashboard';
import EmployeeProfileView from './components/employee/EmployeeProfileView';
import AgentSOSView from './components/field/AgentSOSView';

import { api } from './lib/api';
import { supabase, getSupabaseSession, signOutSupabase } from './lib/supabase';

export default function App() {
  const [recoveryMode, setRecoveryMode] = useState(() =>
    window.location.hash.includes('type=recovery') || window.location.hash.includes('reset-password')
  );
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ewf_user');
      const token = localStorage.getItem('ewf_token') || localStorage.getItem('ewf_supabase_auth');
      return (saved && token) ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem('ewf_token') || localStorage.getItem('ewf_supabase_auth');
    const saved = localStorage.getItem('ewf_user');
    // If cached session exists, render immediately without blocking full screen
    return Boolean(token && !saved);
  });
  const [currentTab, setCurrentTab] = useState(() => {
    return localStorage.getItem('ewf_current_tab') || 'dashboard';
  });
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('ewf_theme');
    return saved ? saved === 'dark' : true;
  });

  // Check first-time login password change requirement
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const handleToggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('ewf_theme', next ? 'dark' : 'light');
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  const getDefaultTabForUser = (u) => {
    if (!u) return 'dashboard';
    const role = u.role_code;
    const rank = u.rank?.code;
    if (role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'IT_ADMIN' || rank === 'IT_ADMIN' || u.email === 'admin@edgewforce.com') {
      return 'command_center';
    }
    if (role === 'SUPERVISOR') return 'supervisor_dashboard';
    if (['FIELD_AGENT', 'SALES_AGENT', 'BRAND_AMBASSADOR', 'PROMOTER'].includes(role)) {
      return 'manifest'; // Defaults directly to Field Routes & Geofencing
    }
    if (['CEO', 'CTO'].includes(role) || ['CEO', 'CTO'].includes(rank)) return 'command_center';
    if (['ACCOUNTANT', 'SENIOR_ACCOUNTANT'].includes(role)) return 'financials';
    if (role === 'HR' || role === 'HR_MANAGER' || rank === 'HR') return 'people';
    return 'dashboard';
  };

  const handleSelectTab = (tab) => {
    setCurrentTab(tab);
    if (tab) {
      localStorage.setItem('ewf_current_tab', tab);
    }
  };

  // Load user session on mount and listen to unauthorized & Supabase events
  useEffect(() => {
    const handleUnauthorized = () => {
      signOutSupabase().catch(() => {});
      setUser(null);
    };
    window.addEventListener('ewf_unauthorized', handleUnauthorized);

    const checkSessionAndFetchMe = async () => {
      try {
        let token = localStorage.getItem('ewf_token');
        if (!token && supabase) {
          const sbSession = await getSupabaseSession();
          if (sbSession?.access_token) {
            token = sbSession.access_token;
            localStorage.setItem('ewf_token', token);
          }
        }

        if (token) {
          const res = await api.get('/auth/me');
          const userData = (res && (res.id || res.role_code || res.email)) ? res : (res?.user || res?.data || null);
          if (userData && (userData.id || userData.email)) {
            setUser(userData);
            localStorage.setItem('ewf_user', JSON.stringify(userData));
            setCurrentTab((prevTab) => {
              const savedTab = localStorage.getItem('ewf_current_tab');
              if (savedTab && savedTab !== 'dashboard') return savedTab;
              return (prevTab && prevTab !== 'dashboard') ? prevTab : getDefaultTabForUser(userData);
            });
          } else {
            signOutSupabase().catch(() => {});
            setUser(null);
          }
        } else {
          localStorage.removeItem('ewf_user');
          setUser(null);
        }
      } catch (err) {
        if (err?.status === 401 || err?.code === 'TOKEN_EXPIRED' || err?.code === 'USER_INACTIVE' || err?.code === 'INVALID_TOKEN') {
          signOutSupabase().catch(() => {});
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    checkSessionAndFetchMe();

    // Subscribe to Supabase Auth state changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
        if (['SIGNED_IN', 'TOKEN_REFRESHED'].includes(event) && session?.access_token) {
          localStorage.setItem('ewf_token', session.access_token);
          api.get('/auth/me')
            .then((res) => {
              const userData = (res && (res.id || res.role_code || res.email)) ? res : (res?.user || res?.data || null);
              if (userData) {
                setUser(userData);
                localStorage.setItem('ewf_user', JSON.stringify(userData));
              }
            })
            .catch(() => {});
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('ewf_token');
          localStorage.removeItem('ewf_user');
          localStorage.removeItem('ewf_current_tab');
          localStorage.removeItem('ewf_supabase_auth');
          setUser(null);
        }
      });
      return () => {
        subscription?.unsubscribe();
        window.removeEventListener('ewf_unauthorized', handleUnauthorized);
      };
    }

    return () => window.removeEventListener('ewf_unauthorized', handleUnauthorized);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('ewf_user', JSON.stringify(userData));
    }
    const defaultTab = getDefaultTabForUser(userData);
    setCurrentTab(defaultTab);
    localStorage.setItem('ewf_current_tab', defaultTab);
    if (userData?.requires_password_change) {
      setMustChangePassword(true);
    }
  };

  const handleLogout = async () => {
    setUser(null);
    setMustChangePassword(false);
    void signOutSupabase();
  };

  const handleRecoveryComplete = async () => {
    setRecoveryMode(false);
    setUser(null);
    setMustChangePassword(false);
    await signOutSupabase();
  };

  if (loading && !recoveryMode) {
    return (
      <div className="min-h-screen flex items-center justify-center surface-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-zinc-500">Initializing EdgeWForce Enterprise...</span>
        </div>
      </div>
    );
  }

  // Public/Auth Flows
  if (recoveryMode || !user) {
    return <LoginPage onLogin={handleLoginSuccess} onRecoveryComplete={handleRecoveryComplete} />;
  }

  // Render Role & Feature Dashboards with Strict Least-Privilege Routing Guards
  const renderDashboard = () => {
    const role = user?.role_code;
    const isAgent = ['FIELD_AGENT', 'SALES_AGENT', 'BRAND_AMBASSADOR', 'PROMOTER'].includes(role);

    // Field Force & Operational Agents: Full access to the new 8-module Field Interface
    if (isAgent) {
      return <FieldDashboard user={user} initialTab={currentTab} onSelectTab={setCurrentTab} />;
    }

    // Standard Non-Agent Workspaces (Management, HR, Staff, Supervisor)
    switch (currentTab) {
      case 'command_center':
        return <CommandCenterDashboard user={user} onNavigate={handleSelectTab} />;
      case 'customers':
      case 'directory':
        return <CustomerDirectoryDashboard user={user} />;
      case 'inventory':
        return <InventoryDashboard user={user} />;
      case 'delivery':
      case 'fleet':
        return <DeliveryDashboard user={user} />;
      case 'alerts':
        return <AlertCenterDashboard user={user} />;
      case 'reports':
        return <ReportsCenterDashboard user={user} />;
      case 'supervisor_dashboard':
        return <SupervisorDashboard user={user} />;
      case 'team_schedules':
        return <SupervisorDashboard user={user} initialTab="schedules" />;
      case 'sales':
      case 'orders':
      case 'catalog':
      case 'intel':
      case 'settlement':
      case 'payments':
        return <SalesDashboard user={user} />;
      case 'manifest':
      case 'shift':
      case 'audits':
        return <FieldDashboard user={user} />;
      case 'financials':
      case 'collections':
      case 'payroll':
        return <AccountingDashboard user={user} />;
      case 'executive':
        return <ExecutiveDashboard user={user} onNavigate={handleSelectTab} />;
      case 'it_admin':
        return <ITAdminDashboard user={user} onSelectTab={handleSelectTab} />;
      case 'overview':
      case 'people':
      case 'staff':
      case 'leave':
      case 'idle':
      case 'org':
      case 'organization':
      case 'announcements':
      case 'birthdays':
      case 'locations':
        return <HRDashboard user={user} initialTab={currentTab === 'staff' ? 'people' : currentTab === 'org' ? 'organization' : currentTab} />;
      case 'hr_schedules':
        return <HRDashboard user={user} initialTab="schedules" />;
      case 'schedule':
      case 'schedules':
        return <EmployeeDashboard user={user} initialTab="schedule" />;
      case 'staff_directory':
        return <EmployeeDashboard user={user} initialTab="directory" />;
      case 'profile':
        return <EmployeeProfileView user={user} />;
      case 'safety':
      case 'sos':
        return <HRDashboard user={user} initialTab="safety" />;
      default:
        return <EmployeeDashboard user={user} initialTab={currentTab} />;
    }
  };

  return (
    <>
      <Shell
        user={user}
        dark={dark}
        onToggleTheme={handleToggleTheme}
        onLogout={handleLogout}
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
      >
        <GlobalAlertBanner />
        {renderDashboard()}
      </Shell>

      {/* Force Password Change on First-Time Access */}
      {mustChangePassword && (
        <FirstLoginPasswordModal
          user={user}
          isOpen={mustChangePassword}
          onPasswordChanged={(updatedUser) => {
            setMustChangePassword(false);
            const nextUser = updatedUser || { ...user, requires_password_change: false };
            setUser(nextUser);
            localStorage.setItem('ewf_user', JSON.stringify(nextUser));
          }}
          onSuccess={() => {
            setMustChangePassword(false);
            const nextUser = { ...user, requires_password_change: false };
            setUser(nextUser);
            localStorage.setItem('ewf_user', JSON.stringify(nextUser));
          }}
        />
      )}
    </>
  );
}
