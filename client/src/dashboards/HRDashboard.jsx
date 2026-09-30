import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  Activity,
  Calendar,
  ClipboardList,
  ShieldAlert,
  Network,
  Award,
  CheckCircle2,
  XCircle,
  Plus,
  AlertTriangle,
  FileText,
  Megaphone,
  Cake,
  Gift,
  Sparkles,
  Send,
  Trash2,
  Edit3,
  Pin,
  PartyPopper,
  UserPlus,
  Eye,
  EyeOff,
  Lock,
  Building2,
  MapPin,
  Search,
  Filter,
  ShieldCheck,
  CalendarCheck,
  RefreshCw
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import Modal from '../components/common/Modal';
import OrgChartTree from '../components/hr/OrgChartTree';
import IdleReviewModal from '../components/hr/IdleReviewModal';
import TaskAssignModal from '../components/hr/TaskAssignModal';
import StateCitySelect from '../components/common/StateCitySelect';
import LocationAssignmentDashboard from '../components/hr/LocationAssignmentDashboard';
import StaffProfileDrawer from '../components/hr/StaffProfileDrawer';
import StaffEditModal from '../components/hr/StaffEditModal';
import HRScheduleCenter from '../components/schedule/HRScheduleCenter';
import { TodayTaskCenter } from '../components/tasks/TodayTaskCenter';
import { TaskCreateModal } from '../components/tasks/TaskCreateModal';
import { formatMoney, formatDate, formatTime } from '../lib/formatters';
import { api } from '../lib/api';


export default function HRDashboard({ user, initialTab = 'overview' }) {
  const [tab, setTab] = useState(initialTab || 'overview');

  const userRole = String(user?.role_code || user?.role || '').toUpperCase();
  const isHrOrCeo = ['HR', 'HR_MANAGER', 'CEO', 'SUPER_ADMIN', 'ADMIN', 'IT_ADMIN'].includes(userRole);

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);

  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffLoadError, setStaffLoadError] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [idleEvents, setIdleEvents] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [sosEvents, setSOSEvents] = useState([]);
  const [orgTree, setOrgTree] = useState(null);
  const [ranks, setRanks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [birthdaysData, setBirthdaysData] = useState({ all: [], thisMonth: [], upcoming: [] });
  const [auditLogs, setAuditLogs] = useState([]);

  // Staff Search & Filtering State
  const [staffSearch, setStaffSearch] = useState('');
  const [staffDeptFilter, setStaffDeptFilter] = useState('ALL');
  const [staffStatusFilter, setStaffStatusFilter] = useState('ALL'); // ALL, active, suspended, flagged
  const [selectedStaffForView, setSelectedStaffForView] = useState(null);
  const [selectedStaffForEdit, setSelectedStaffForEdit] = useState(null);

  // Modals
  const [activeIdleAlert, setActiveIdleAlert] = useState(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const [availableLocations, setAvailableLocations] = useState([]);

  // Register Staff Modal State
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    department: 'Commercial Sales',
    department_id: 1,
    position: 'Operations Officer',
    state: 'Lagos',
    city: 'Ikeja',
    territory: 'Lagos - Ikeja',
    rank_code: 'STAFF',
    assigned_location_id: '',
    base_salary: '350000',
    housing_allowance: '150000',
    transport_allowance: '75000',
    other_allowance: '25000',
    date_of_birth: '1995-05-15',
    address: '15 Atiba Osborne, Mende, Maryland, Lagos'
  });

  // Announcement modal state
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    id: null,
    title: '',
    message: '',
    category: 'General',
    priority: 'NORMAL',
    target_audience: 'ALL',
    pinned: false
  });

  // Birthday modal state
  const [birthdayModalOpen, setBirthdayModalOpen] = useState(false);
  const [birthdayForm, setBirthdayForm] = useState({
    employee_id: '',
    date_of_birth: '',
    hire_date: ''
  });

  // Broadcast celebration modal state
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    employee_id: '',
    employee_name: '',
    custom_wish: ''
  });

  const loadData = async () => {
    setStaffLoading(true);
    try {
      const [st, , att, idl, lv, tsk, sos, org, rnk, ann, bdays, locs, audits] = await Promise.all([
        api.get('/hr/dashboard').catch(() => null),
        api.get('/hr/employees').then(emp => {
          setEmployees(Array.isArray(emp) ? emp : (emp?.employees || emp?.data || []));
          setStaffLoadError('');
        }).catch(error => {
          setStaffLoadError(error.message || 'Staff could not be loaded. Please try again.');
        }).finally(() => setStaffLoading(false)),
        api.get('/hr/attendance').catch(() => []),
        api.get('/hr/idle-events').catch(() => []),
        api.get('/hr/leave').catch(() => []),
        api.get('/hr/tasks').catch(() => []),
        api.get('/hr/sos').catch(() => []),
        api.get('/hr/organization').catch(() => null),
        api.get('/hr/ranks').catch(() => []),
        api.get('/hr/announcements').catch(() => ({ data: [] })),
        api.get('/hr/birthdays').catch(() => ({ all: [], thisMonth: [], upcoming: [] })),
        api.get('/locations?status=active').catch(() => ({ data: [] })),
        api.get('/hr/audit-logs').catch(() => ({ data: [] }))
      ]);

      if (st) setStats(st);
      setAttendance(Array.isArray(att) ? att : (att?.records || att?.data || []));
      setIdleEvents(Array.isArray(idl) ? idl : (idl?.records || idl?.data || []));
      setLeaveRequests(Array.isArray(lv) ? lv : (lv?.requests || lv?.data || []));
      setTasks(Array.isArray(tsk) ? tsk : (tsk?.tasks || tsk?.data || []));
      setSOSEvents(sos || []);
      setOrgTree(org);
      setRanks(rnk || []);
      setAnnouncements(Array.isArray(ann) ? ann : (ann?.data || ann?.announcements || []));
      setBirthdaysData(bdays?.data || bdays || { all: [], thisMonth: [], upcoming: [] });
      setAvailableLocations(Array.isArray(locs) ? locs : (locs?.data || locs?.locations || []));
      setAuditLogs(Array.isArray(audits) ? audits : (audits?.audit_logs || audits?.data || []));
    } catch {
      // Graceful offline fallback
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveLeave = async (id) => {
    try {
      await api.put(`/hr/leave/${id}/approve`, {});
      setStatusMsg('Leave request approved and balance deducted.');
      loadData();
    } catch (err) {
      setStatusMsg(`Approval failed: ${err.message}`);
    }
  };

  const handleRejectLeave = async (id) => {
    try {
      await api.put(`/hr/leave/${id}/reject`, { reason: 'Operational requirements' });
      setStatusMsg('Leave request rejected.');
      loadData();
    } catch (err) {
      setStatusMsg(`Rejection failed: ${err.message}`);
    }
  };

  const handleResolveSOS = async (id, notes = 'Emergency team dispatched & confirmed safe.') => {
    try {
      await api.put(`/hr/sos/${id}/resolve`, { resolution_notes: notes });
      setStatusMsg('✓ SOS Panic Beacon resolved & stopped successfully.');
      loadData();
    } catch (err) {
      setStatusMsg(`Resolution failed: ${err.message}`);
    }
  };

  const handleAcknowledgeSOS = async (id) => {
    try {
      await api.put(`/hr/sos/${id}/acknowledge`);
      setStatusMsg('✓ SOS Emergency beacon acknowledged.');
      loadData();
    } catch (err) {
      setStatusMsg(`Acknowledgement failed: ${err.message}`);
    }
  };

  const handleUpdateStaffStatus = async (emp, status) => {
    try {
      await api.put(`/hr/employees/${emp.id}/status`, { status });
      setStatusMsg(`Staff status updated to ${status}.`);
      loadData();
      if (selectedStaffForView?.id === emp.id) {
        setSelectedStaffForView(prev => ({ ...prev, status }));
      }
    } catch (err) {
      setStatusMsg(`Status update failed: ${err.message}`);
    }
  };

  const handleDeleteStaff = async (emp) => {
    const name = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
    if (!window.confirm(`Remove ${name} from active staff access? Their records and audit history will be preserved.`)) return;

    try {
      await api.delete(`/hr/employees/${emp.id}`);
      setStatusMsg(`${name} was removed from active staff access.`);
      setSelectedStaffForView(null);
      loadData();
    } catch (err) {
      setStatusMsg(`Staff removal failed: ${err.message}`);
    }
  };

  const handleResendInvitation = async (emp) => {
    try {
      const res = await api.post(`/hr/employees/${emp.id}/resend-invitation`, {});
      setStatusMsg(res.message || 'Onboarding invitation resent.');
      loadData();
    } catch (err) {
      setStatusMsg(`Failed to resend invitation: ${err.message}`);
    }
  };

  const handleSaveEditedEmployee = (updated) => {
    setStatusMsg('Staff record updated successfully.');
    loadData();
    if (selectedStaffForView?.id === updated?.id) {
      setSelectedStaffForView(updated);
    }
  };

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.message) {
      setStatusMsg('Title and announcement message are required.');
      return;
    }

    try {
      if (announcementForm.id) {
        await api.put(`/hr/announcements/${announcementForm.id}`, announcementForm);
        setStatusMsg('Announcement updated successfully.');
      } else {
        await api.post('/hr/announcements', announcementForm);
        setStatusMsg('Announcement published to Staff Portal & Dashboards.');
      }
      setAnnouncementModalOpen(false);
      setAnnouncementForm({
        id: null,
        title: '',
        message: '',
        category: 'General',
        priority: 'NORMAL',
        target_audience: 'ALL',
        pinned: false
      });
      loadData();
    } catch (err) {
      setStatusMsg(`Announcement error: ${err.message}`);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.delete(`/hr/announcements/${id}`);
      setStatusMsg('Announcement removed.');
      loadData();
    } catch (err) {
      setStatusMsg(`Delete error: ${err.message}`);
    }
  };

  const handleSaveBirthday = async (e) => {
    e.preventDefault();
    if (!birthdayForm.employee_id || !birthdayForm.date_of_birth) {
      setStatusMsg('Please select a staff member and specify date of birth.');
      return;
    }

    try {
      await api.put(`/hr/employees/${birthdayForm.employee_id}/birthday`, {
        date_of_birth: birthdayForm.date_of_birth,
        hire_date: birthdayForm.hire_date
      });
      setStatusMsg('Staff birthday record updated successfully.');
      setBirthdayModalOpen(false);
      loadData();
    } catch (err) {
      setStatusMsg(`Birthday save error: ${err.message}`);
    }
  };

  const handleBroadcastBirthday = async (e) => {
    e.preventDefault();
    if (!broadcastForm.employee_id) return;

    try {
      await api.post('/hr/birthdays/broadcast', {
        employee_id: broadcastForm.employee_id,
        custom_wish: broadcastForm.custom_wish
      });
      setStatusMsg(`🎉 Birthday celebration card broadcasted to all staff portals!`);
      setBroadcastModalOpen(false);
      loadData();
    } catch (err) {
      setStatusMsg(`Broadcast error: ${err.message}`);
    }
  };

  const handleRegisterStaff = async (e) => {
    e.preventDefault();
    if (!registerForm.first_name || !registerForm.last_name) {
      setStatusMsg('First name and last name are required.');
      return;
    }
    if (!registerForm.email) {
      setStatusMsg('A corporate email address is required.');
      return;
    }
    if (registerForm.password.trim().length < 8 || registerForm.password === 'ChangeMe123!') {
      setStatusMsg('Set a unique password of at least 8 characters.');
      return;
    }

    setRegisterLoading(true);
    setStatusMsg('');
    try {
      await api.post('/hr/employees/register', registerForm);
      const idUsed = registerForm.email || registerForm.phone;
      setStatusMsg(`Staff member ${registerForm.first_name} ${registerForm.last_name} registered successfully. Login: ${idUsed}`);
      setRegisterModalOpen(false);
      setRegisterForm({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        phone: '',
        department: 'Commercial Sales',
        department_id: 1,
        position: 'Operations Officer',
        territory: 'Lagos Mainland',
        rank_code: 'STAFF',
        base_salary: '350000',
        housing_allowance: '150000',
        transport_allowance: '75000',
        other_allowance: '25000',
        date_of_birth: '1995-05-15',
        address: '15 Atiba Osborne, Mende, Maryland, Lagos'
      });
      loadData();
    } catch (err) {
      setStatusMsg(`Registration failed: ${err.message}`);
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <span>HR Command Center</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400">
              Workforce Intelligence
            </span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time workforce monitoring, company broadcasts, staff birthdays, leave approvals & organization chart.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setRegisterModalOpen(true)}
            className="btn-primary flex items-center gap-1.5 text-xs py-2 px-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-bold shadow-sm"
          >
            <UserPlus size={14} />
            <span>Register Staff</span>
          </button>
          <button
            onClick={() => {
              setAnnouncementForm({ id: null, title: '', message: '', category: 'General', priority: 'NORMAL', target_audience: 'ALL', pinned: false });
              setAnnouncementModalOpen(true);
            }}
            className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-3 border border-orange-500/30 text-orange-600 dark:text-orange-400 rounded-lg font-bold hover:bg-orange-500/5"
          >
            <Megaphone size={14} />
            <span>Post Announcement</span>
          </button>
          <button
            onClick={() => {
              setBirthdayForm({ employee_id: employees[0]?.id || '', date_of_birth: '', hire_date: '' });
              setBirthdayModalOpen(true);
            }}
            className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-3 border border-pink-500/30 text-pink-600 dark:text-pink-400 rounded-lg font-bold hover:bg-pink-500/5"
          >
            <Cake size={14} />
            <span>Set Birthday</span>
          </button>
          <button
            onClick={() => setTaskModalOpen(true)}
            className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg font-medium"
          >
            <ClipboardList size={14} />
            <span>Assign Task</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-300 text-xs font-semibold flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg('')} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">×</button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'schedules', label: 'Daily Schedules Roster', icon: CalendarCheck },
          { id: 'safety', label: `Field SOS & Safety (${sosEvents.filter(s => s.status === 'active').length ? '🚨 ' + sosEvents.filter(s => s.status === 'active').length + ' ACTIVE' : sosEvents.length})`, icon: ShieldAlert },
          { id: 'locations', label: 'Work Locations & Geofence', icon: Building2 },
          { id: 'people', label: staffLoading ? 'Staff Directory (Loading...)' : `Staff Directory (${employees.length})`, icon: Users },
          { id: 'announcements', label: `Announcements (${announcements.length})`, icon: Megaphone },
          { id: 'birthdays', label: `Birthdays & Celebrations (${birthdaysData.all?.length || 0})`, icon: Cake },
          { id: 'organization', label: 'Organization Chart', icon: Network },
          { id: 'attendance', label: 'Live Attendance', icon: Clock },
          { id: 'leave', label: `Leave Management (${leaveRequests.length})`, icon: Calendar },
          { id: 'tasks', label: `Task Assignments (${tasks.length})`, icon: ClipboardList }
        ].map((t) => {

          const Icon = t.icon;
          const isSafetyActive = t.id === 'safety' && sosEvents.some(s => s.status === 'active');
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                tab === t.id
                  ? (isSafetyActive ? 'bg-red-600 text-white shadow-sm' : 'bg-orange-500 text-white shadow-sm')
                  : (isSafetyActive ? 'bg-red-500/15 text-red-600 dark:text-red-400 font-black animate-pulse border border-red-500/30' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800')
              }`}
            >
              <Icon size={14} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Active Critical SOS Panic Beacon Callout */}
          {sosEvents.filter(s => s.status === 'active').map((sos) => (
            <div key={sos.id} className="p-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border-2 border-red-400 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-white/20 text-white shrink-0">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white text-red-700 tracking-wider">
                      CRITICAL FIELD EMERGENCY
                    </span>
                    <span className="text-[11px] opacity-80 font-mono">
                      {formatDate(sos.created_at)}
                    </span>
                  </div>
                  <h4 className="text-sm font-black mt-1">
                    {sos.agent?.first_name || 'Godfrey'} {sos.agent?.last_name || 'Okorie'}: {sos.message}
                  </h4>
                  <p className="text-xs opacity-90 mt-0.5">
                    GPS Coordinates: {sos.latitude?.toFixed(5)}, {sos.longitude?.toFixed(5)} (±{Math.round(sos.accuracy || 0)}m)
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`https://maps.google.com/?q=${sos.latitude},${sos.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <MapPin size={13} />
                  <span>Live Map</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleResolveSOS(sos.id)}
                  className="px-4 py-2 rounded-lg bg-white text-red-700 hover:bg-emerald-50 hover:text-emerald-700 text-xs font-black shadow-lg transition flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <span>Stop SOS Beacon & Mark Safe</span>
                </button>
              </div>
            </div>
          ))}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Workforce"
              value={stats?.total_employees || employees.length}
              icon={Users}
              subtitle="Registered Personnel"
            />
            <StatCard
              title="Today's Attendance"
              value={`${stats?.attendance_rate || 0}%`}
              icon={Clock}
              subtitle={`${stats?.present_today || 0} Clocked In`}
            />
            <StatCard
              title="Pending Leave"
              value={stats?.pending_leave || 0}
              icon={Calendar}
              subtitle="Awaiting Approval"
            />
            <StatCard
              title="Active Tasks"
              value={stats?.active_tasks || tasks.length}
              icon={ClipboardList}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            {/* Pending Leave Approvals Card */}
            <div className="surface-card rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Calendar size={16} className="text-orange-500" />
                <span>Pending Leave Requests</span>
              </h3>
              <div className="space-y-2.5">
                {(stats?.pending_leaves || []).map((lv) => (
                  <div key={lv.id} className="p-3 rounded-xl surface-card-subtle flex items-center justify-between text-xs border border-zinc-200 dark:border-zinc-800">
                    <div>
                      <b className="text-zinc-900 dark:text-zinc-100">
                        {lv.employee?.first_name} {lv.employee?.last_name}
                      </b>
                      <div className="text-[10px] text-zinc-400">
                        {lv.leave_type} • {lv.days} days ({formatDate(lv.start_date)} → {formatDate(lv.end_date)})
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleApproveLeave(lv.id)} className="btn-primary text-xs py-1 px-2.5 bg-emerald-500 text-white rounded">
                        Approve
                      </button>
                      <button onClick={() => handleRejectLeave(lv.id)} className="btn-secondary text-xs py-1 px-2.5 text-rose-500 border border-rose-200 rounded">
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
                {(!stats?.pending_leaves || stats.pending_leaves.length === 0) && (
                  <div className="p-4 text-center text-xs text-zinc-400">No pending leave requests.</div>
                )}
              </div>
            </div>

            {/* Inactivity Telemetry Alerts */}
            <div className="surface-card rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Activity size={16} className="text-orange-500" />
                <span>Recent Workstation Inactivity</span>
              </h3>
              <div className="space-y-2.5">
                {(stats?.idle_records || []).map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => setActiveIdleAlert(alert)}
                    className="p-3 rounded-xl surface-card-subtle flex items-center justify-between text-xs cursor-pointer hover:border-orange-500/50 border border-zinc-200 dark:border-zinc-800"
                  >
                    <div>
                      <b className="text-zinc-900 dark:text-zinc-100">
                        {alert.employee?.first_name} {alert.employee?.last_name}
                      </b>
                      <div className="text-[10px] text-zinc-400">
                        Reason: {alert.reason || 'Break'} • Duration: {Math.round(alert.duration_seconds / 60)} mins
                      </div>
                    </div>
                    <button className="text-xs font-semibold text-orange-500 hover:underline">
                      Review
                    </button>
                  </div>
                ))}
                {(!stats?.idle_records || stats.idle_records.length === 0) && (
                  <div className="p-4 text-center text-xs text-zinc-400">No recent inactivity alerts detected.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF DIRECTORY & WORKFORCE MANAGEMENT */}
      {tab === 'people' && (
        <div className="space-y-4 animate-in fade-in duration-200">

          {(staffLoading || staffLoadError) && (
            <div className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-between gap-3 ${
              staffLoadError
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                : 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300'
            }`}>
              <span>{staffLoadError ? `Staff directory unavailable: ${staffLoadError}` : 'Loading staff directory...'}</span>
              {staffLoadError && (
                <button onClick={loadData} className="underline underline-offset-2 shrink-0">Retry</button>
              )}
            </div>
          )}
          
          {/* Top Summary & Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div 
              onClick={() => setStaffStatusFilter('ALL')}
              className={`p-4 rounded-xl border cursor-pointer transition ${
                staffStatusFilter === 'ALL' ? 'border-orange-500 bg-orange-500/5 dark:bg-orange-500/10' : 'border-zinc-200 dark:border-zinc-800 surface-card'
              }`}
            >
              <div className="text-[10px] font-bold uppercase text-zinc-400">Total Staff Headcount</div>
              <div className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-1">{employees.length}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">Authoritative records</div>
            </div>

            <div 
              onClick={() => setStaffStatusFilter('flagged')}
              className={`p-4 rounded-xl border cursor-pointer transition ${
                staffStatusFilter === 'flagged' ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-200 dark:border-zinc-800 surface-card'
              }`}
            >
              <div className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle size={12} />
                <span>Flagged for HR Review</span>
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {employees.filter(e => e.flagged_for_review).length}
              </div>
              <div className="text-[11px] text-amber-600/80 mt-0.5">Click to filter missing IDs/data</div>
            </div>

            <div 
              onClick={() => setStaffStatusFilter('active')}
              className={`p-4 rounded-xl border cursor-pointer transition ${
                staffStatusFilter === 'active' ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-200 dark:border-zinc-800 surface-card'
              }`}
            >
              <div className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Active Accounts</div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {employees.filter(e => (e.status || 'active').toLowerCase() === 'active').length}
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">Provisioned & operational</div>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 surface-card">
              <div className="text-[10px] font-bold uppercase text-zinc-400">Pending Onboarding</div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {employees.filter(e => !e.first_login_at).length}
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">Awaiting first sign-in</div>
            </div>
          </div>

          {/* Search, Filter Toolbar & Actions */}
          <div className="surface-card rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[240px]">
                <Search size={14} className="absolute left-3 top-3 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search by Name, Staff ID (e.g. 019), Email, Position, Supervisor..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Department Filter */}
              <select
                value={staffDeptFilter}
                onChange={(e) => setStaffDeptFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs outline-none focus:ring-2 focus:ring-orange-500 font-medium"
              >
                <option value="ALL">All Departments ({employees.length})</option>
                {[...new Set(employees.map(e => e.department).filter(Boolean))].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={staffStatusFilter}
                onChange={(e) => setStaffStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs outline-none focus:ring-2 focus:ring-orange-500 font-medium"
              >
                <option value="ALL">All Account Statuses</option>
                <option value="active">Active Only</option>
                <option value="flagged">Flagged for Review Only</option>
                <option value="suspended">Suspended Only</option>
              </select>

              {(staffSearch || staffDeptFilter !== 'ALL' || staffStatusFilter !== 'ALL') && (
                <button
                  onClick={() => { setStaffSearch(''); setStaffDeptFilter('ALL'); setStaffStatusFilter('ALL'); }}
                  className="px-2.5 py-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 font-bold"
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={loadData}
                title="Refresh Directory"
                className="p-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
              >
                <RefreshCw size={14} />
              </button>
              <button
                onClick={() => setRegisterModalOpen(true)}
                className="btn-primary flex items-center gap-1.5 text-xs py-2 px-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-md shadow-orange-500/20"
              >
                <UserPlus size={14} />
                <span>Register Staff</span>
              </button>
            </div>
          </div>

          {/* Directory Table View */}
          <div className="surface-card rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Staff ID</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Role & Department</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">Location & Supervisor</th>
                    <th className="py-3 px-4">Status & Review</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {!staffLoading && !staffLoadError && employees.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 px-4 text-center text-zinc-500">No staff records are registered yet.</td>
                    </tr>
                  )}
                  {employees
                    .filter(emp => {
                      const term = staffSearch.toLowerCase().trim();
                      const name = (emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`).toLowerCase();
                      const staffId = String(emp.staff_id || emp.employee_code || '').toLowerCase();
                      const position = String(emp.position || '').toLowerCase();
                      const dept = String(emp.department || '').toLowerCase();
                      const email = String(emp.work_email || emp.personal_email || emp.email || '').toLowerCase();
                      const phone = String(emp.phone || '').toLowerCase();
                      const supervisor = String(emp.supervisor_name || '').toLowerCase();
                      const location = String(emp.work_location || '').toLowerCase();

                      const matchesSearch = !term ||
                        name.includes(term) ||
                        staffId.includes(term) ||
                        position.includes(term) ||
                        dept.includes(term) ||
                        email.includes(term) ||
                        phone.includes(term) ||
                        supervisor.includes(term) ||
                        location.includes(term);

                      const matchesDept = staffDeptFilter === 'ALL' || emp.department === staffDeptFilter;
                      const empStatus = (emp.status || 'active').toLowerCase();
                      const matchesStatus =
                        staffStatusFilter === 'ALL' ||
                        (staffStatusFilter === 'flagged' && emp.flagged_for_review) ||
                        (staffStatusFilter === 'active' && empStatus === 'active') ||
                        (staffStatusFilter === 'suspended' && empStatus === 'suspended');

                      return matchesSearch && matchesDept && matchesStatus;
                    })
                    .map((emp) => (
                      <tr key={emp.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition">
                        
                        {/* Staff ID */}
                        <td className="py-3.5 px-4 font-mono">
                          {emp.staff_id ? (
                            <span className="px-2 py-1 rounded font-bold text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                              {emp.staff_id}
                            </span>
                          ) : (
                            <span className="text-zinc-400 text-[11px] italic font-mono">
                              {emp.employee_code}
                            </span>
                          )}
                        </td>

                        {/* Employee Name & Code */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                              {emp.first_name?.[0] || emp.full_name?.[0] || 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                <span>{emp.full_name || `${emp.first_name} ${emp.last_name}`}</span>
                                {emp.flagged_for_review && (
                                  <AlertTriangle size={12} className="text-amber-500" title="Flagged for HR Review" />
                                )}
                              </div>
                              <div className="text-[10px] font-mono text-zinc-400">
                                {emp.employee_code}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role & Department */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-zinc-800 dark:text-zinc-200">{emp.position || 'Staff Member'}</div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{emp.department || 'Operations'}</div>
                        </td>

                        {/* Contact */}
                        <td className="py-3.5 px-4">
                          <div className="text-zinc-900 dark:text-zinc-100 truncate max-w-[180px]" title={emp.work_email || emp.personal_email}>
                            {emp.work_email || emp.personal_email || emp.email || '—'}
                          </div>
                          <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                            {emp.phone || '—'}
                          </div>
                        </td>

                        {/* Location & Supervisor */}
                        <td className="py-3.5 px-4">
                          <div className="text-zinc-800 dark:text-zinc-200 truncate max-w-[140px]" title={emp.work_location}>
                            {emp.work_location || 'Headquarters'}
                          </div>
                          <div className="text-[10px] text-zinc-400 truncate max-w-[140px]" title={emp.supervisor_name}>
                            Mgr: {emp.supervisor_name || 'MD'}
                          </div>
                        </td>

                        {/* Status & Review */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] w-fit ${
                              emp.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                            }`}>
                              {emp.status?.toUpperCase() || 'ACTIVE'}
                            </span>
                            {emp.flagged_for_review && (
                              <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded w-fit">
                                Review Flagged
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedStaffForView(emp)}
                              className="px-2.5 py-1.5 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:text-orange-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                            >
                              View Profile
                            </button>
                            <button
                              onClick={() => setSelectedStaffForEdit(emp)}
                              className="p-1.5 text-zinc-400 hover:text-orange-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                              title="Edit Staff Record"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(emp)}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition"
                              title="Remove staff access"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: ANNOUNCEMENTS */}
      {tab === 'announcements' && (
        <div className="surface-card rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                Corporate Announcements & Noticeboard
              </h3>
              <p className="text-xs text-zinc-500">Official company announcements displayed on all staff dashboards</p>
            </div>
            <button
              onClick={() => {
                setAnnouncementForm({ id: null, title: '', message: '', category: 'General', priority: 'NORMAL', target_audience: 'ALL', pinned: false });
                setAnnouncementModalOpen(true);
              }}
              className="btn-primary flex items-center gap-1 text-xs py-1.5 px-3 bg-orange-500 text-white rounded-lg font-bold"
            >
              <Plus size={13} />
              <span>+ New Announcement</span>
            </button>
          </div>

          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 surface-card-subtle flex flex-col md:flex-row md:items-start justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    {ann.pinned && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 flex items-center gap-1">
                        <Pin size={10} /> Pinned
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400">
                      {ann.category || 'General'}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {formatDate(ann.created_at)} • By {ann.author_name || 'HR Team'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">{ann.title}</h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">{ann.message}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setAnnouncementForm(ann);
                      setAnnouncementModalOpen(true);
                    }}
                    className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500"
                    title="Edit"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteAnnouncement(ann.id)}
                    className="p-1.5 rounded hover:bg-rose-500/10 text-rose-500"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
            {announcements.length === 0 && (
              <div className="p-8 text-center text-xs text-zinc-400">No corporate announcements published yet.</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: BIRTHDAYS & CELEBRATIONS */}
      {tab === 'birthdays' && (
        <div className="surface-card rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Cake size={18} className="text-pink-500" />
                <span>Staff Birthdays & Milestones</span>
              </h3>
              <p className="text-xs text-zinc-500">Manage birth dates and broadcast celebration cards to the workforce</p>
            </div>
            <button
              onClick={() => {
                setBirthdayForm({ employee_id: employees[0]?.id || '', date_of_birth: '', hire_date: '' });
                setBirthdayModalOpen(true);
              }}
              className="btn-primary flex items-center gap-1 text-xs py-1.5 px-3 bg-pink-600 text-white rounded-lg font-bold"
            >
              <Plus size={13} />
              <span>+ Set Staff Birthday</span>
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(birthdaysData.all || []).map((emp) => (
              <div
                key={emp.id}
                className={`p-4 rounded-xl border transition-all ${
                  emp.isToday
                    ? 'border-pink-500/50 bg-pink-500/5 ring-2 ring-pink-500/20'
                    : 'border-zinc-200 dark:border-zinc-800 surface-card-subtle'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <span>{emp.full_name}</span>
                      {emp.isToday && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-500 text-white animate-pulse">
                          🎉 TODAY!
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-zinc-500">{emp.position} • {emp.department}</p>
                    <div className="mt-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      🎂 Birthday: {emp.date_of_birth ? formatDate(emp.date_of_birth) : <span className="text-zinc-400 italic">Not set</span>}
                    </div>
                    {emp.daysUntilBirthday < 999 && !emp.isToday && (
                      <div className="text-[10px] font-bold text-orange-500 mt-0.5">
                        In {emp.daysUntilBirthday} day{emp.daysUntilBirthday === 1 ? '' : 's'}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setBroadcastForm({
                        employee_id: emp.id,
                        employee_name: emp.full_name,
                        custom_wish: `Happy Birthday to ${emp.full_name} (${emp.position}, ${emp.department})! Wishing you health, happiness, and incredible accomplishments with EdgeWForce! 🎉🎂`
                      });
                      setBroadcastModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 flex items-center gap-1 text-[11px] font-bold"
                    title="Broadcast Birthday Card"
                  >
                    <PartyPopper size={13} />
                    <span>Celebrate</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ORGANIZATION CHART */}
      {tab === 'organization' && (
        <div className="surface-card rounded-xl p-5 space-y-4">
          <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Network size={18} className="text-orange-500" />
            <span>Corporate Organizational Structure</span>
          </h3>
          <OrgChartTree orgTree={orgTree} user={user} onRefresh={loadData} />
        </div>
      )}

      {/* TAB 6: ATTENDANCE */}
      {tab === 'attendance' && (
        <div className="surface-card rounded-xl p-5 space-y-4">
          <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
            Workforce Attendance Timesheet Records
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-bold uppercase text-[10px]">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Employee</th>
                  <th className="pb-2">Clock In</th>
                  <th className="pb-2">Clock Out</th>
                  <th className="pb-2">GPS Coordinates</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                {attendance.map((att) => (
                  <tr key={att.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="py-3 font-mono font-medium">{att.attendance_date || att.date}</td>
                    <td className="py-3 font-bold text-zinc-900 dark:text-zinc-100">
                      {att.employee?.first_name} {att.employee?.last_name}
                    </td>
                    <td className="py-3 font-mono text-zinc-600 dark:text-zinc-400">
                      {att.clock_in ? formatTime(att.clock_in) : (att.clock_in_time ? formatTime(att.clock_in_time) : '—')}
                    </td>
                    <td className="py-3 font-mono text-zinc-600 dark:text-zinc-400">
                      {att.clock_out ? formatTime(att.clock_out) : (att.clock_out_time ? formatTime(att.clock_out_time) : '—')}
                    </td>
                    <td className="py-3 text-[11px] text-zinc-500 font-mono">
                      {att.clock_in_latitude ? `${Number(att.clock_in_latitude).toFixed(4)}, ${Number(att.clock_in_longitude).toFixed(4)}` : 'Store GPS Verified'}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        att.status === 'present' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        {att.status || 'present'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: LEAVE MANAGEMENT */}
      {tab === 'leave' && (
        <div className="surface-card rounded-xl p-5 space-y-4">
          <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
            Workforce Leave & Time-Off Management
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-bold uppercase text-[10px]">
                  <th className="pb-2">Employee</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Duration</th>
                  <th className="pb-2">Dates</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                {leaveRequests.map((lv) => (
                  <tr key={lv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="py-3 font-bold text-zinc-900 dark:text-zinc-100">
                      {lv.employee?.first_name} {lv.employee?.last_name}
                    </td>
                    <td className="py-3">{lv.leave_type}</td>
                    <td className="py-3 font-semibold">{lv.days} Days</td>
                    <td className="py-3 text-[11px] text-zinc-500">
                      {formatDate(lv.start_date)} → {formatDate(lv.end_date)}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        lv.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' :
                        lv.status === 'rejected' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {lv.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {lv.status === 'pending' && (
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => handleApproveLeave(lv.id)} className="btn-primary text-xs py-1 px-2.5 bg-emerald-500 text-white rounded">
                            Approve
                          </button>
                          <button onClick={() => handleRejectLeave(lv.id)} className="btn-secondary text-xs py-1 px-2.5 text-rose-500 border border-rose-200 rounded">
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: TASKS & TASK INTELLIGENCE */}
      {tab === 'tasks' && (
        <TodayTaskCenter
          onOpenCreateModal={() => setTaskModalOpen(true)}
          isSupervisor={true}
        />
      )}

      {/* TAB 9: WORK LOCATIONS & GEOFENCE CONTROL */}
      {tab === 'locations' && (
        <LocationAssignmentDashboard />
      )}

      {/* TAB 10: FIELD SOS & SAFETY CONTROL */}
      {tab === 'safety' && (
        <div className="surface-card rounded-xl p-5 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <ShieldAlert size={22} className="text-red-600 animate-pulse" />
                <span>Field SOS Emergency Command & Panic Center</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Real-time incident response, live GPS distress broadcasts, and field operative safety logs.
              </p>
            </div>
            <button
              onClick={() => loadData()}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Activity size={14} />
              <span>Refresh Queue</span>
            </button>
          </div>

          {/* Active Emergencies Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-red-600 flex items-center gap-1.5">
              <AlertTriangle size={14} />
              <span>Active Field Distress Beacons ({sosEvents.filter(s => s.status === 'active').length})</span>
            </h4>

            {sosEvents.filter(s => s.status === 'active').map((sos) => (
              <div
                key={sos.id}
                className="p-5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-xl border-2 border-red-400 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white text-red-700">
                        ACTIVE PANIC BEACON
                      </span>
                      <span className="text-xs opacity-90 font-mono">
                        Triggered: {formatDate(sos.created_at)}
                      </span>
                    </div>
                    <h3 className="text-base font-black mt-1">
                      {sos.agent?.first_name || 'Godfrey'} {sos.agent?.last_name || 'Okorie'} ({sos.agent?.employee_code || 'EMP-1002'})
                    </h3>
                    <p className="text-xs font-semibold opacity-95 mt-0.5">
                      "{sos.message}"
                    </p>
                  </div>

                  <div className="text-right text-xs opacity-90 font-mono">
                    <div>GPS: {sos.latitude?.toFixed(5)}, {sos.longitude?.toFixed(5)}</div>
                    <div>Accuracy: ±{Math.round(sos.accuracy || 0)} meters</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/20 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2">
                    <a
                      href={`https://maps.google.com/?q=${sos.latitude},${sos.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <MapPin size={14} />
                      <span>Open Live GPS Satellite Map</span>
                    </a>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAcknowledgeSOS(sos.id)}
                      className="px-3.5 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition"
                    >
                      Acknowledge Beacon
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolveSOS(sos.id, 'Confirmed safe with operative. Incident resolved.')}
                      className="px-4 py-2 rounded-lg bg-white text-red-700 hover:bg-emerald-50 hover:text-emerald-700 text-xs font-black shadow-lg transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={15} className="text-emerald-600" />
                      <span>Stop SOS Beacon & Confirm Safe</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {sosEvents.filter(s => s.status === 'active').length === 0 && (
              <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>Zero active field distress beacons. All field operatives are currently safe and operating normally.</span>
              </div>
            )}
          </div>

          {/* Historical SOS Log */}
          <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <h4 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
              Historical Distress & Safety Audit Log
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-bold uppercase text-[10px]">
                    <th className="pb-2">Trigger Date</th>
                    <th className="pb-2">Operative</th>
                    <th className="pb-2">Distress Message</th>
                    <th className="pb-2">Coordinates</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Resolution Notes</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                  {sosEvents.map((sos) => (
                    <tr key={sos.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="py-3 font-mono text-[11px]">{formatDate(sos.created_at)}</td>
                      <td className="py-3 font-bold text-zinc-900 dark:text-zinc-100">
                        {sos.agent?.first_name || 'Operative'} {sos.agent?.last_name || ''}
                      </td>
                      <td className="py-3 max-w-xs truncate">{sos.message}</td>
                      <td className="py-3 font-mono text-[10px] text-zinc-400">
                        {sos.latitude?.toFixed(4)}, {sos.longitude?.toFixed(4)}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          sos.status === 'active'
                            ? 'bg-red-500/10 text-red-600 font-black animate-pulse'
                            : 'bg-emerald-500/10 text-emerald-600'
                        }`}>
                          {sos.status}
                        </span>
                      </td>
                      <td className="py-3 text-[11px] text-zinc-500 max-w-xs truncate">
                        {sos.resolution_notes || '—'}
                      </td>
                      <td className="py-3 text-right">
                        {sos.status === 'active' ? (
                          <button
                            onClick={() => handleResolveSOS(sos.id)}
                            className="btn-primary text-xs py-1 px-2.5 bg-red-600 text-white rounded font-bold"
                          >
                            Stop & Resolve
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-semibold">✓ Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {sosEvents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-zinc-400">
                        No SOS incident records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: DAILY WORKFORCE SCHEDULES & ROSTER */}
      {tab === 'schedules' && (
        <HRScheduleCenter user={user} />
      )}

      {/* MODAL: REGISTER NEW STAFF WITH PASSWORD FIELD */}
      <Modal
        title="Register & Onboard New Staff Member"
        subtitle="Create staff account, set custom login password, salary, allowances, and departmental rank"
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
      >
        <form onSubmit={handleRegisterStaff} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Babatunde"
                className="form-input"
                value={registerForm.first_name}
                onChange={(e) => setRegisterForm({ ...registerForm, first_name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Adeleke"
                className="form-input"
                value={registerForm.last_name}
                onChange={(e) => setRegisterForm({ ...registerForm, last_name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Official Email (Optional if Phone provided)
              </label>
              <input
                type="email"
                placeholder="e.g. name@edgewforce.com"
                className="form-input"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1 flex items-center justify-between">
                <span>Account Login Password *</span>
              </label>
              <div className="relative">
                <input
                  type={showRegisterPassword ? 'text' : 'password'}
                  placeholder="Unique password (8 characters minimum)"
                  className="form-input pr-9 font-mono"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  tabIndex={-1}
                >
                  {showRegisterPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">
                Staff must change this password on first login.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+234 800 000 0000"
                className="form-input"
                value={registerForm.phone}
                onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Department *
              </label>
              <select
                className="form-input"
                value={registerForm.department}
                onChange={(e) => setRegisterForm({ ...registerForm, department: e.target.value })}
              >
                <option value="Commercial Sales">Commercial Sales</option>
                <option value="Field Operations">Field Operations</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance & Accounts">Finance & Accounts</option>
                <option value="Technology & IT">Technology & IT</option>
                <option value="Corporate Operations">Corporate Operations</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Designation / Position *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Commercial Sales Agent"
                className="form-input"
                value={registerForm.position}
                onChange={(e) => setRegisterForm({ ...registerForm, position: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Rank Level *
              </label>
              <select
                className="form-input"
                value={registerForm.rank_code}
                onChange={(e) => setRegisterForm({ ...registerForm, rank_code: e.target.value })}
              >
                <option value="STAFF">Operations Staff (Level 8)</option>
                <option value="SUPERVISOR">Supervisor (Level 7)</option>
                <option value="MANAGER">Regional Manager (Level 6)</option>
                <option value="ACCOUNTANT">Accountant (Level 5)</option>
                <option value="HR">Head of HR (Level 3)</option>
                <option value="IT_ADMIN">IT Super Admin (Level 2)</option>
                <option value="CEO">CEO (Level 1)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <StateCitySelect
                selectedState={registerForm.state}
                selectedCity={registerForm.city}
                onStateChange={(state) => setRegisterForm(prev => ({ ...prev, state, territory: `${state} - ${prev.city || ''}` }))}
                onCityChange={(city) => setRegisterForm(prev => ({ ...prev, city, territory: `${prev.state || ''} - ${city}` }))}
                stateLabel="Assigned State (36 States & FCT) *"
                cityLabel="Assigned City / Operating Territory *"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Building2 size={13} className="text-orange-500" />
                  <span>Assigned Work Location / Geofence Workplace</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-normal">Optional (assign now or later)</span>
              </label>
              <select
                className="form-input"
                value={registerForm.assigned_location_id || ''}
                onChange={(e) => setRegisterForm({ ...registerForm, assigned_location_id: e.target.value })}
              >
                <option value="">-- Leave Unassigned (Review Required) --</option>
                {availableLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.location_type || 'Office'} • {loc.state} • Radius: {loc.geofence_radius || loc.geofence_radius_meters || 150}m)
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 block">
                Assign an office, market depot, supermarket, or warehouse across Nigeria. Employees without an assigned location cannot check in until configured.
              </span>
            </div>


            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Base Monthly Salary (₦) *
              </label>
              <input
                type="number"
                required
                className="form-input"
                value={registerForm.base_salary}
                onChange={(e) => setRegisterForm({ ...registerForm, base_salary: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Housing Allowance (₦)
              </label>
              <input
                type="number"
                className="form-input"
                value={registerForm.housing_allowance}
                onChange={(e) => setRegisterForm({ ...registerForm, housing_allowance: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Transport Allowance (₦)
              </label>
              <input
                type="number"
                className="form-input"
                value={registerForm.transport_allowance}
                onChange={(e) => setRegisterForm({ ...registerForm, transport_allowance: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                className="form-input"
                value={registerForm.date_of_birth}
                onChange={(e) => setRegisterForm({ ...registerForm, date_of_birth: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Residential / Work Address
              </label>
              <input
                type="text"
                className="form-input"
                value={registerForm.address}
                onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setRegisterModalOpen(false)}
              className="btn-secondary text-xs py-2 px-4 border border-zinc-300 dark:border-zinc-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={registerLoading}
              className="btn-primary text-xs py-2 px-4 bg-orange-500 text-white rounded-lg font-bold flex items-center gap-1.5"
            >
              {registerLoading ? <span className="animate-spin">⏳</span> : <UserPlus size={14} />}
              <span>{registerLoading ? 'Registering Staff...' : 'Create & Onboard Staff'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: POST ANNOUNCEMENT */}
      <Modal
        title={announcementForm.id ? "Edit Announcement" : "Create New Corporate Announcement"}
        subtitle="Publish notices to staff portals, field agents and corporate dashboards"
        isOpen={announcementModalOpen}
        onClose={() => setAnnouncementModalOpen(false)}
      >
        <form onSubmit={handleSaveAnnouncement} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Announcement Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Q3 Sales Strategy & Incentive Program"
              className="form-input"
              value={announcementForm.title}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Category
              </label>
              <select
                className="form-input"
                value={announcementForm.category}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, category: e.target.value })}
              >
                <option value="General">General Notice</option>
                <option value="Operational">Field Operations</option>
                <option value="Policy">HR & Policy</option>
                <option value="Celebration">Celebration</option>
                <option value="Urgent">Urgent Security</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Priority
              </label>
              <select
                className="form-input"
                value={announcementForm.priority}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value })}
              >
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical Alert</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Target Audience
              </label>
              <select
                className="form-input"
                value={announcementForm.target_audience}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, target_audience: e.target.value })}
              >
                <option value="ALL">All Workforce</option>
                <option value="FIELD_SALES">Field & Sales Force</option>
                <option value="MANAGERS">Supervisors & Managers</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Message Content *
            </label>
            <textarea
              required
              rows={5}
              placeholder="Write the full announcement text here..."
              className="form-input"
              value={announcementForm.message}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pinnedAnn"
              checked={announcementForm.pinned}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, pinned: e.target.checked })}
              className="rounded text-orange-500 focus:ring-orange-500"
            />
            <label htmlFor="pinnedAnn" className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer">
              Pin to top of Staff Portal & Dashboards
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setAnnouncementModalOpen(false)}
              className="btn-secondary text-xs py-2 px-4 border border-zinc-300 dark:border-zinc-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs py-2 px-4 bg-orange-500 text-white rounded-lg font-bold flex items-center gap-1.5"
            >
              <Send size={14} />
              <span>{announcementForm.id ? "Update Announcement" : "Publish Announcement"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: SET BIRTHDAY */}
      <Modal
        title="Set Staff Birthday & Milestones"
        subtitle="Add employee birthday to appear on upcoming celebrations list"
        isOpen={birthdayModalOpen}
        onClose={() => setBirthdayModalOpen(false)}
      >
        <form onSubmit={handleSaveBirthday} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Select Staff Member *
            </label>
            <select
              required
              className="form-input"
              value={birthdayForm.employee_id}
              onChange={(e) => setBirthdayForm({ ...birthdayForm, employee_id: e.target.value })}
            >
              <option value="">-- Choose Employee --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_code}) - {emp.position}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Date of Birth *
            </label>
            <input
              type="date"
              required
              className="form-input"
              value={birthdayForm.date_of_birth}
              onChange={(e) => setBirthdayForm({ ...birthdayForm, date_of_birth: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Work Hire Date (Optional)
            </label>
            <input
              type="date"
              className="form-input"
              value={birthdayForm.hire_date}
              onChange={(e) => setBirthdayForm({ ...birthdayForm, hire_date: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setBirthdayModalOpen(false)}
              className="btn-secondary text-xs py-2 px-4 border border-zinc-300 dark:border-zinc-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs py-2 px-4 bg-pink-600 text-white rounded-lg font-bold flex items-center gap-1.5"
            >
              <Cake size={14} />
              <span>Save Birthday Record</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: BROADCAST BIRTHDAY CELEBRATION */}
      <Modal
        title="Broadcast Birthday Celebration Card"
        subtitle={`Publish an official birthday celebration notice for ${broadcastForm.employee_name}`}
        isOpen={broadcastModalOpen}
        onClose={() => setBroadcastModalOpen(false)}
      >
        <form onSubmit={handleBroadcastBirthday} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Celebration Wish Message *
            </label>
            <textarea
              required
              rows={4}
              className="form-input"
              value={broadcastForm.custom_wish}
              onChange={(e) => setBroadcastForm({ ...broadcastForm, custom_wish: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setBroadcastModalOpen(false)}
              className="btn-secondary text-xs py-2 px-4 border border-zinc-300 dark:border-zinc-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs py-2 px-4 bg-pink-600 text-white rounded-lg font-bold flex items-center gap-1.5"
            >
              <PartyPopper size={14} />
              <span>Broadcast to Staff Portal</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Idle Review Modal */}
      {activeIdleAlert && (
        <IdleReviewModal
          alert={activeIdleAlert}
          isOpen={Boolean(activeIdleAlert)}
          onClose={() => setActiveIdleAlert(null)}
          onResolve={loadData}
        />
      )}

      {/* Task Creation & Multi-Channel Reminder Modal */}
      <TaskCreateModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onCreated={loadData}
      />

      {/* Staff 8-Section Profile Drawer */}
      <StaffProfileDrawer
        employee={selectedStaffForView}
        isOpen={Boolean(selectedStaffForView)}
        onClose={() => setSelectedStaffForView(null)}
        onEdit={(emp) => {
          setSelectedStaffForView(null);
          setSelectedStaffForEdit(emp);
        }}
        onStatusChange={handleUpdateStaffStatus}
        onResendInvitation={handleResendInvitation}
        auditLogs={auditLogs}
      />

      {/* Staff Edit Modal */}
      <StaffEditModal
        employee={selectedStaffForEdit}
        isOpen={Boolean(selectedStaffForEdit)}
        onClose={() => setSelectedStaffForEdit(null)}
        onSaved={handleSaveEditedEmployee}
        ranks={ranks}
        departments={[...new Set(employees.map(e => e.department).filter(Boolean))]}
      />
    </div>
  );
}
