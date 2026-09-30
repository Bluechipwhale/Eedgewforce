import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Layers,
  Users,
  Sliders,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  Trash2,
  Shield,
  Clock,
  DollarSign
} from 'lucide-react';
import { api } from '../../lib/api';
import StateCitySelect from '../common/StateCitySelect';

export default function CompanyOnboardingWizard({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1: Company Information
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    business_type: 'FMCG Wholesale & Retail Distribution',
    industry: 'Consumer Goods & Retail',
    registration_number: '',
    email: '',
    phone: '',
    address: '',
    country: 'Nigeria',
    state: 'Lagos',
    city: 'Ikeja'
  });

  // Step 2: Structure
  const [regions, setRegions] = useState([
    { name: 'South-West Hub', code: 'SW-HUB', territories: [{ name: 'Lagos Mainland', code: 'LAG-MAIN' }] }
  ]);

  // Step 3: Modules
  const [modules, setModules] = useState({
    workforce: true,
    attendance: true,
    field: true,
    sales: true,
    crm: true,
    payments: true,
    inventory: true,
    delivery: true,
    reports: true,
    tracking: true
  });

  // Step 4: Admin User
  const [adminUser, setAdminUser] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: ''
  });

  // Step 5: Operational Settings
  const [operationalSettings, setOperationalSettings] = useState({
    working_hours_start: '08:00',
    working_hours_end: '17:00',
    geofence_radius: 150,
    currency: 'NGN',
    timezone: 'Africa/Lagos'
  });

  if (!isOpen) return null;

  const handleAddRegion = () => {
    setRegions([
      ...regions,
      { name: `Region ${regions.length + 1}`, code: `REG-${regions.length + 1}`, territories: [{ name: 'Territory 1', code: 'TERR-1' }] }
    ]);
  };

  const handleRemoveRegion = (index) => {
    setRegions(regions.filter((_, i) => i !== index));
  };

  const handleAddTerritory = (regionIndex) => {
    const updated = [...regions];
    updated[regionIndex].territories.push({
      name: `Territory ${updated[regionIndex].territories.length + 1}`,
      code: `TERR-${updated[regionIndex].territories.length + 1}`
    });
    setRegions(updated);
  };

  const handleSubmit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminUser.email.trim()) || adminUser.password.trim().length < 8 || adminUser.password.trim() === 'ChangeMe123!') {
      setErrorMsg('Enter an administrator email and a unique password of at least 8 characters.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        companyInfo,
        structure: { regions },
        modules,
        adminUser: adminUser.email ? adminUser : null,
        operationalSettings
      };

      const res = await api.post('/admin/onboard', payload);
      if (res && (res.success || res.data)) {
        if (onSuccess) onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to complete company onboarding.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Building2 size={18} className="text-orange-500" />
              Step 1: Company Profile & Registration
            </h3>
            <p className="text-xs text-zinc-500">Provide legal incorporation and operational details for the new tenant entity.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                  placeholder="e.g. Sterling Consumer Brands Ltd."
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Business Type</label>
                <input
                  type="text"
                  value={companyInfo.business_type}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, business_type: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Industry</label>
                <input
                  type="text"
                  value={companyInfo.industry}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, industry: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">CAC Registration No.</label>
                <input
                  type="text"
                  value={companyInfo.registration_number}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, registration_number: e.target.value })}
                  placeholder="e.g. RC-1928401"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Official Email *</label>
                <input
                  type="email"
                  required
                  value={companyInfo.email}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                  placeholder="operations@company.ng"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={companyInfo.phone}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                  placeholder="+2348000000000"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Head Office Address</label>
                <input
                  type="text"
                  value={companyInfo.address}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                  placeholder="e.g. Plot 10, Commercial Avenue, Ikeja"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <StateCitySelect
                  selectedState={companyInfo.state}
                  selectedCity={companyInfo.city}
                  onStateChange={(state) => setCompanyInfo(prev => ({ ...prev, state }))}
                  onCityChange={(city) => setCompanyInfo(prev => ({ ...prev, city }))}
                  stateLabel="Headquarters State (36 States & FCT) *"
                  cityLabel="Headquarters City / Town *"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <MapPin size={18} className="text-orange-500" />
                  Step 2: Regions & Territory Hierarchy
                </h3>
                <p className="text-xs text-zinc-500">Configure regional branches and field coverage zones.</p>
              </div>
              <button
                type="button"
                onClick={handleAddRegion}
                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Plus size={14} /> Add Region
              </button>
            </div>

            <div className="space-y-3 pt-2 max-h-72 overflow-y-auto pr-1">
              {regions.map((reg, rIdx) => (
                <div key={rIdx} className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700/60 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <input
                        type="text"
                        value={reg.name}
                        onChange={(e) => {
                          const updated = [...regions];
                          updated[rIdx].name = e.target.value;
                          setRegions(updated);
                        }}
                        placeholder="Region Name"
                        className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold"
                      />
                      <input
                        type="text"
                        value={reg.code}
                        onChange={(e) => {
                          const updated = [...regions];
                          updated[rIdx].code = e.target.value;
                          setRegions(updated);
                        }}
                        placeholder="Code (e.g. SW-1)"
                        className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                      />
                    </div>
                    {regions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRegion(rIdx)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Territories list */}
                  <div className="pl-3 border-l-2 border-orange-500/40 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500">
                      <span>Assigned Territories</span>
                      <button
                        type="button"
                        onClick={() => handleAddTerritory(rIdx)}
                        className="text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                      >
                        <Plus size={11} /> Add Territory
                      </button>
                    </div>
                    {reg.territories.map((terr, tIdx) => (
                      <div key={tIdx} className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={terr.name}
                          onChange={(e) => {
                            const updated = [...regions];
                            updated[rIdx].territories[tIdx].name = e.target.value;
                            setRegions(updated);
                          }}
                          placeholder="Territory Name"
                          className="px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-xs"
                        />
                        <input
                          type="text"
                          value={terr.code}
                          onChange={(e) => {
                            const updated = [...regions];
                            updated[rIdx].territories[tIdx].code = e.target.value;
                            setRegions(updated);
                          }}
                          placeholder="Code"
                          className="px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Layers size={18} className="text-orange-500" />
              Step 3: Enterprise Modules Activation
            </h3>
            <p className="text-xs text-zinc-500">Select the functional suites enabled for this organization's subscription.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {Object.entries(modules).map(([key, enabled]) => (
                <label
                  key={key}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                    enabled
                      ? 'bg-orange-500/5 dark:bg-orange-500/10 border-orange-500/30'
                      : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700/50 opacity-70'
                  }`}
                >
                  <span className="text-xs font-bold capitalize text-zinc-800 dark:text-zinc-200">
                    {key.replace('_', ' ')} Module
                  </span>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setModules({ ...modules, [key]: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-zinc-300"
                  />
                </label>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Users size={18} className="text-orange-500" />
              Step 4: Primary Administrator Setup
            </h3>
            <p className="text-xs text-zinc-500">Create the primary tenant admin account with full management control.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Admin Full Name *</label>
                <input
                  type="text"
                  value={adminUser.full_name}
                  onChange={(e) => setAdminUser({ ...adminUser, full_name: e.target.value })}
                  placeholder="e.g. Babatunde Raji"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Admin Email *</label>
                <input
                  type="email"
                  value={adminUser.email}
                  onChange={(e) => setAdminUser({ ...adminUser, email: e.target.value })}
                  placeholder="admin@tenantcompany.ng"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={adminUser.phone}
                  onChange={(e) => setAdminUser({ ...adminUser, phone: e.target.value })}
                  placeholder="+2348000000000"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Initial Password</label>
                <input
                  type="password"
                  value={adminUser.password}
                  onChange={(e) => setAdminUser({ ...adminUser, password: e.target.value })}
                  minLength={8}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-mono"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sliders size={18} className="text-orange-500" />
              Step 5: Operational Policies & Rules
            </h3>
            <p className="text-xs text-zinc-500">Configure geofencing radius, shift boundaries, and currency defaults.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Shift Start Time</label>
                <input
                  type="time"
                  value={operationalSettings.working_hours_start}
                  onChange={(e) => setOperationalSettings({ ...operationalSettings, working_hours_start: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Shift End Time</label>
                <input
                  type="time"
                  value={operationalSettings.working_hours_end}
                  onChange={(e) => setOperationalSettings({ ...operationalSettings, working_hours_end: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Geofence Radius (Meters)</label>
                <input
                  type="number"
                  value={operationalSettings.geofence_radius}
                  onChange={(e) => setOperationalSettings({ ...operationalSettings, geofence_radius: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Currency</label>
                <input
                  type="text"
                  disabled
                  value="NGN (₦ Nigerian Naira)"
                  className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-500 font-semibold"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
              Enterprise Tenant Setup
            </span>
            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
              Company Onboarding Wizard
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-5 py-3 bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`flex items-center gap-1.5 ${
                step === s
                  ? 'text-orange-600 dark:text-orange-400 font-bold'
                  : step > s
                  ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                  : 'text-zinc-400 font-medium'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step === s
                    ? 'bg-orange-500 text-white font-bold'
                    : step > s
                    ? 'bg-emerald-500 text-white font-bold'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                }`}
              >
                {step > s ? '✓' : s}
              </div>
              <span className="hidden sm:inline">
                {s === 1 ? 'Company' : s === 2 ? 'Structure' : s === 3 ? 'Modules' : s === 4 ? 'Admin' : 'Settings'}
              </span>
            </div>
          ))}
        </div>

        {/* Step Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300">
              {errorMsg}
            </div>
          )}
          {renderStepContent()}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 sm:p-5 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <button
            type="button"
            disabled={step === 1 || submitting}
            onClick={() => setStep(step - 1)}
            className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 transition"
          >
            <ChevronLeft size={14} /> Back
          </button>

          {step < 5 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !companyInfo.name) {
                  setErrorMsg('Please enter the Company Name before continuing.');
                  return;
                }
                setErrorMsg('');
                setStep(step + 1);
              }}
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
            >
              Continue <ChevronRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition"
            >
              {submitting ? 'Creating Company...' : 'Finish & Activate Company'}
              <CheckCircle2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
