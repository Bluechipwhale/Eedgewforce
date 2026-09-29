import React, { useState, useEffect } from 'react';
import { Search, Filter, Users, Mail, Phone, MapPin, Building, Briefcase, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';

export default function PublicStaffDirectoryView() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  const loadEmployees = () => {
    setLoading(true);
    api.get('/hr/employees')
      .then(res => {
        const list = Array.isArray(res) ? res : (res.employees || res.data || []);
        setEmployees(list);
        setLoadError('');
      })
      .catch(error => setLoadError(error.message || 'Staff directory could not be loaded.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const departments = ['ALL', ...new Set(employees.map(e => e.department).filter(Boolean))];

  const filteredEmployees = employees.filter(e => {
    const term = search.toLowerCase().trim();
    const name = (e.full_name || `${e.first_name || ''} ${e.last_name || ''}`).toLowerCase();
    const pos = String(e.position || '').toLowerCase();
    const dept = String(e.department || '').toLowerCase();
    const email = String(e.work_email || e.personal_email || e.email || '').toLowerCase();
    const staffId = String(e.staff_id || e.employee_code || '').toLowerCase();
    const location = String(e.work_location || '').toLowerCase();

    const matchesSearch = !term || name.includes(term) || pos.includes(term) || dept.includes(term) || email.includes(term) || staffId.includes(term) || location.includes(term);
    const matchesDept = deptFilter === 'ALL' || e.department === deptFilter;

    return matchesSearch && matchesDept;
  });

  return (
    <div className="surface-card rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 space-y-5 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Users size={18} className="text-orange-500" />
            <span>Colleague Directory ({filteredEmployees.length} Staff)</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Connect with team members across departments, locations, and roles.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name, role, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs w-64 outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs outline-none focus:ring-2 focus:ring-orange-500"
          >
            {departments.map(d => (
              <option key={d} value={d}>{d === 'ALL' ? 'All Departments' : d}</option>
            ))}
          </select>
        </div>
      </div>

      {loadError && !loading && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
          <span>Staff directory unavailable: {loadError}</span>
          <button type="button" onClick={loadEmployees} className="inline-flex items-center gap-1 font-bold shrink-0" title="Retry loading staff">
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {/* Directory Grid */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-2 text-zinc-400">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Loading directory...</span>
        </div>
      ) : loadError ? null : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredEmployees.map(emp => (
            <div
              key={emp.id}
              className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 surface-card-subtle flex flex-col justify-between hover:border-orange-500/40 transition-all shadow-xs"
            >
              <div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {emp.first_name?.[0] || emp.full_name?.[0] || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                        {emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim()}
                      </h4>
                      {emp.staff_id && (
                        <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400">
                          {emp.staff_id}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{emp.position || 'Staff Member'}</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 space-y-1.5 text-[11px] text-zinc-600 dark:text-zinc-300">
                  <div className="flex items-center gap-2">
                    <Building size={12} className="text-zinc-400 shrink-0" />
                    <span className="truncate">{emp.department || 'Operations'}</span>
                  </div>
                  {emp.work_location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="text-zinc-400 shrink-0" />
                      <span className="truncate">{emp.work_location}</span>
                    </div>
                  )}
                  {(emp.work_email || emp.email) && (
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="text-zinc-400 shrink-0" />
                      <span className="truncate text-orange-600 dark:text-orange-400">{emp.work_email || emp.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredEmployees.length === 0 && (
            <div className="col-span-full py-12 text-center text-xs text-zinc-400">
              No colleagues match your search criteria.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
