import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  UserPlus,
  Users,
  Key,
  Server,
  Activity,
  CheckCircle2,
  AlertCircle,
  Database,
  Lock,
  RefreshCw,
  Eye,
  EyeOff,
  Sliders,
  ShieldCheck,
  Terminal,
  Globe,
  Building2,
  MapPin,
  Network,
  Boxes,
  Package,
  Printer,
  Trash2,
  Plus,
  ArrowUpDown,
  FileText,
  Truck,
  Edit3,
  Search
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import Modal from '../components/common/Modal';
import StateCitySelect from '../components/common/StateCitySelect';
import LocationAssignmentDashboard from '../components/hr/LocationAssignmentDashboard';
import OrgChartTree from '../components/hr/OrgChartTree';
import StaffProfileDrawer from '../components/hr/StaffProfileDrawer';
import { formatMoney, formatDate, formatTime } from '../lib/formatters';
import { api } from '../lib/api';

export default function ITAdminDashboard({ user, onSelectTab }) {
  const [employees, setEmployees] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [systemStats, setSystemStats] = useState(null);
  const [selectedStaffForView, setSelectedStaffForView] = useState(null);
  const [staffSearchTerm, setStaffSearchTerm] = useState('');
  const [orgTree, setOrgTree] = useState(null);
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [companySettings, setCompanySettings] = useState(null);
  const [availableLocations, setAvailableLocations] = useState([]);

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState('staff'); // 'staff' | 'inventory' | 'receipt' | 'hierarchy' | 'locations' | 'system'

  // Loading & Feedback
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [dataLoading, setDataLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState({ staff: false, inventory: false, locations: false });
  const [dataIssues, setDataIssues] = useState({});

  // Register Staff Modal
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  // Password Reset Modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedStaffForPassword, setSelectedStaffForPassword] = useState(null);
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Supply Chain & Product Modals
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: 'Beverages & Drinks',
    unit: 'carton',
    price: 15000,
    cost_price: 12000,
    stock_quantity: 100,
    reorder_level: 20,
    warehouse_name: 'Ikeja Central Depot',
    shelve_location: 'Aisle 1 - Bay A (Rack 1)'
  });

  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [savingMovement, setSavingMovement] = useState(false);
  const [movementForm, setMovementForm] = useState({
    product_id: '',
    movement_type: 'COLLECTION',
    quantity: 10,
    reference_number: '',
    notes: 'Item collection logged by administration'
  });

  // Receipt & Branding Form
  const [receiptForm, setReceiptForm] = useState({
    receipt_company_name: 'EXPERIENTIAL EDGE',
    receipt_tagline: 'Integrated Marketing & Commercial Distribution Solutions',
    receipt_title: 'EDGEWFORCE SALES RECEIPT',
    receipt_address: '15 Atiba Osborne, Mende, Maryland, Lagos',
    receipt_phone: '+2348031234567',
    receipt_footer_note: 'Thank you for your business. Verified by EdgeWForce Operating System.'
  });
  const [savingReceipt, setSavingReceipt] = useState(false);

  const loadData = () => {
    setDataLoading(true);
    setDataIssues({});

    const asList = (result, key) => {
      const list = Array.isArray(result) ? result : (result?.[key] ?? result?.data);
      if (!Array.isArray(list)) throw new Error('Unexpected response from the server.');
      return list;
    };
    const load = async (key, path, apply, timeoutMs = 15000) => {
      try {
        const result = await api.get(path, { fresh: true, signal: AbortSignal.timeout(timeoutMs) });
        apply(result);
        if (['staff', 'inventory', 'locations'].includes(key)) {
          setDataLoaded(previous => ({ ...previous, [key]: true }));
        }
      } catch (error) {
        setDataIssues(previous => ({
          ...previous,
          [key]: error.name === 'TimeoutError' ? 'Request timed out.' : (error.message || 'Request failed.')
        }));
      }
    };

    const requests = [
      load('staff', '/hr/employees', result => setEmployees(asList(result, 'employees'))),
      load('locations', '/locations?status=active', result => setAvailableLocations(asList(result, 'locations'))),
      load('inventory', '/inventory/products', result => setProducts(asList(result, 'products'))),
      load('dashboard', '/hr/dashboard', result => setAuditLogs(result?.idle_records || [])),
      load('movements', '/inventory/movements', result => setMovements(asList(result, 'movements'))),
      load('settings', '/admin/settings', result => {
        const sData = result?.data || result;
        if (!sData) return;
        setCompanySettings(sData);
        setReceiptForm({
          receipt_company_name: sData.receipt_company_name || 'EXPERIENTIAL EDGE',
          receipt_tagline: sData.receipt_tagline || 'Integrated Marketing & Commercial Distribution Solutions',
          receipt_title: sData.receipt_title || 'EDGEWFORCE SALES RECEIPT',
          receipt_address: sData.receipt_address || '15 Atiba Osborne, Mende, Maryland, Lagos',
          receipt_phone: sData.receipt_phone || '+2348031234567',
          receipt_footer_note: sData.receipt_footer_note || 'Thank you for your business. Verified by EdgeWForce Operating System.'
        });
      })
    ];
    if (activeTab === 'hierarchy') {
      requests.push(load('organization', '/hr/organization', setOrgTree, 30000));
    }
    return Promise.all(requests).finally(() => setDataLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'hierarchy' && !orgTree) loadData();
  }, [activeTab]);

  // 1. Staff Registration
  const handleRegisterStaff = async (e) => {
    e.preventDefault();
    if (!registerForm.first_name || !registerForm.last_name) {
      setErrorMsg('First name and last name are required.');
      return;
    }
    if (!registerForm.email) {
      setErrorMsg('A corporate email address is required.');
      return;
    }
    if (registerForm.password.trim().length < 8 || registerForm.password === 'ChangeMe123!') {
      setErrorMsg('Set a unique password of at least 8 characters.');
      return;
    }

    setLoading(true);
    setStatusMsg('');
    setErrorMsg('');
    try {
      const res = await api.post('/hr/employees/register', registerForm);
      const idUsed = registerForm.email || registerForm.phone;
      setStatusMsg(`Staff registered. Code: ${res.data?.employee_code || res.employee_code}. Login: ${idUsed}`);
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
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Staff Password Reset
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newStaffPassword || newStaffPassword.trim().length < 8 || newStaffPassword.trim() === 'ChangeMe123!') {
      setErrorMsg('Set a unique password of at least 8 characters.');
      return;
    }
    setSavingPassword(true);
    setErrorMsg('');
    try {
      await api.post(`/admin/employees/${selectedStaffForPassword.id}/reset-password`, {
        password: newStaffPassword.trim()
      });
      setStatusMsg(`✓ Password successfully updated for ${selectedStaffForPassword.first_name} ${selectedStaffForPassword.last_name} (${selectedStaffForPassword.employee_code}).`);
      setPasswordModalOpen(false);
      setSelectedStaffForPassword(null);
      setNewStaffPassword('');
    } catch (err) {
      setErrorMsg(`Password change failed: ${err.message}`);
    } finally {
      setSavingPassword(false);
    }
  };

  // 3. Supply Chain Product Add
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) return;
    setSavingProduct(true);
    try {
      await api.post('/inventory/products', productForm);
      setStatusMsg(`✓ Product "${productForm.name}" added to inventory successfully.`);
      setAddProductModalOpen(false);
      setProductForm({
        name: '',
        sku: '',
        category: 'Beverages & Drinks',
        unit: 'carton',
        price: 15000,
        cost_price: 12000,
        stock_quantity: 100,
        reorder_level: 20,
        warehouse_name: 'Ikeja Central Depot',
        shelve_location: 'Aisle 1 - Bay A (Rack 1)'
      });
      loadData();
    } catch (err) {
      setErrorMsg(`Failed to add product: ${err.message}`);
    } finally {
      setSavingProduct(false);
    }
  };

  // 4. Supply Chain Product Delete
  const handleDeleteProduct = async (prodId, prodName, sku) => {
    if (!window.confirm(`Are you sure you want to permanently delete product "${prodName}" (${sku})?`)) return;
    try {
      await api.delete(`/inventory/products/${prodId}`);
      setStatusMsg(`✓ Product "${prodName}" deleted successfully.`);
      loadData();
    } catch (err) {
      setErrorMsg(`Delete failed: ${err.message}`);
    }
  };

  // 5. Supply Chain Movement / Item Collection
  const handleRecordMovement = async (e) => {
    e.preventDefault();
    if (!movementForm.product_id || !movementForm.quantity) return;
    setSavingMovement(true);
    try {
      await api.post('/inventory/movements', {
        ...movementForm,
        quantity: Number(movementForm.quantity)
      });
      setStatusMsg(`✓ Stock movement recorded successfully.`);
      setMovementModalOpen(false);
      setMovementForm({
        product_id: '',
        movement_type: 'COLLECTION',
        quantity: 10,
        reference_number: '',
        notes: 'Item collection logged by administration'
      });
      loadData();
    } catch (err) {
      setErrorMsg(`Movement record failed: ${err.message}`);
    } finally {
      setSavingMovement(false);
    }
  };

  // 6. Save Receipt Customization
  const handleSaveReceiptSettings = async (e) => {
    e.preventDefault();
    setSavingReceipt(true);
    try {
      await api.put('/admin/settings', receiptForm);
      setStatusMsg('✓ Receipt & Invoice branding settings saved successfully! All printed receipts will reflect these changes.');
      loadData();
    } catch (err) {
      setErrorMsg(`Failed to save receipt settings: ${err.message}`);
    } finally {
      setSavingReceipt(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <ShieldCheck className="text-orange-500" size={24} />
            <span>IT & Platform Super Admin Center</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            System administration, workforce credentials, supply chain inventory, and receipt customization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={loadData} className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" title="Refresh admin data" aria-label="Refresh admin data">
            <RefreshCw size={16} className={dataLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setRegisterModalOpen(true)}
            className="btn-primary text-xs py-2 px-3 shadow-xs"
          >
            <UserPlus size={14} />
            <span>+ Register Staff</span>
          </button>
        </div>
      </div>

      {/* Global Status Toast */}
      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-xs">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg('')} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">×</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-between shadow-xs">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">×</button>
        </div>
      )}

      {Object.keys(dataIssues).length > 0 && (
        <div className="p-3.5 border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-3">
          <span>Unable to load {Object.entries(dataIssues).map(([section, message]) => `${section}: ${message}`).join(' | ')}</span>
          <button onClick={loadData} className="shrink-0 font-semibold underline">Retry</button>
        </div>
      )}

      {/* Super Admin Top Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Staff"
          value={dataLoaded.staff ? employees.length : '--'}
          icon={Users}
          subtitle={dataIssues.staff ? 'Load failed' : dataLoaded.staff ? 'Active Accounts' : 'Loading...'}
        />
        <StatCard
          title="Supply Chain SKUs"
          value={dataLoaded.inventory ? products.length : '--'}
          icon={Boxes}
          subtitle={dataIssues.inventory ? 'Load failed' : dataLoaded.inventory ? 'Inventory Catalog' : 'Loading...'}
        />
        <StatCard
          title="Work Locations"
          value={dataLoaded.locations ? availableLocations.length : '--'}
          icon={Building2}
          subtitle={dataIssues.locations ? 'Load failed' : dataLoaded.locations ? 'Geofenced Sites' : 'Loading...'}
        />
        <StatCard
          title="Cloud Engine"
          value="Online Infrastructure"
          icon={Server}
          subtitle="Online Infrastructure"
        />
      </div>

      {/* Super Admin Navigation Sub-Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2 sm:gap-6 text-xs font-bold overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-2.5 transition relative flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'staff'
              ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-500'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Users size={15} />
          <span>Staff Directory ({dataLoaded.staff ? employees.length : '...'})</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-2.5 transition relative flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-500'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Boxes size={15} />
          <span>Supply Chain & Logistics ({dataLoaded.inventory ? products.length : '...'})</span>
        </button>

        <button
          onClick={() => setActiveTab('receipt')}
          className={`pb-2.5 transition relative flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'receipt'
              ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-500'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Printer size={15} />
          <span>Receipt & Brand Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('hierarchy')}
          className={`pb-2.5 transition relative flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'hierarchy'
              ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-500'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Network size={15} />
          <span>Staff Hierarchy & Org Chart</span>
        </button>

        <button
          onClick={() => setActiveTab('locations')}
          className={`pb-2.5 transition relative flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'locations'
              ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-500'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Building2 size={15} />
          <span>Work Locations & Geofence</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`pb-2.5 transition relative flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'system'
              ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-500'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Server size={15} />
          <span>System Health & DB</span>
        </button>
      </div>

      {/* SUB-TAB 1: STAFF DIRECTORY & PASSWORD MANAGEMENT */}
      {activeTab === 'staff' && (
        <div className="surface-card rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Users size={18} className="text-orange-500" />
                <span>Registered Staff Accounts & Security Access</span>
              </h3>
              <p className="text-xs text-zinc-500">
                Manage credentials, department roles, view complete 23-field personnel profiles, and reset staff passwords.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search staff, code, email, role..."
                  className="form-input text-xs pl-8 py-1.5 rounded-xl"
                  value={staffSearchTerm}
                  onChange={(e) => setStaffSearchTerm(e.target.value)}
                />
              </div>

              <button
                onClick={() => setRegisterModalOpen(true)}
                className="btn-primary text-xs py-1.5 px-3 bg-orange-500 text-white rounded-xl font-bold flex items-center gap-1 shrink-0"
              >
                <UserPlus size={14} />
                <span>Register Staff</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-bold uppercase text-[10px]">
                  <th className="pb-2">Code</th>
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Department</th>
                  <th className="pb-2">Position</th>
                  <th className="pb-2">Rank</th>
                  <th className="pb-2">Contact</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                {employees
                  .filter((e) => {
                    const q = staffSearchTerm.toLowerCase();
                    if (!q) return true;
                    const name = (e.full_name || `${e.first_name || ''} ${e.last_name || ''}`).toLowerCase();
                    const code = (e.employee_code || e.staff_id || '').toLowerCase();
                    const dept = (e.department || '').toLowerCase();
                    const pos = (e.position || '').toLowerCase();
                    const email = (e.work_email || e.personal_email || e.email || '').toLowerCase();
                    const phone = (e.phone || '').toLowerCase();
                    return name.includes(q) || code.includes(q) || dept.includes(q) || pos.includes(q) || email.includes(q) || phone.includes(q);
                  })
                  .map((e) => (
                    <tr key={e.id} className="hover:bg-zinc-500/5 transition">
                      <td className="py-3 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {e.staff_id || e.employee_code}
                      </td>
                      <td className="py-3 font-bold text-zinc-900 dark:text-zinc-100">
                        {e.full_name || `${e.first_name || ''} ${e.last_name || ''}`.trim() || 'Staff Member'}
                      </td>
                      <td className="py-3 text-zinc-600 dark:text-zinc-400">
                        {e.department}
                      </td>
                      <td className="py-3 font-medium">
                        {e.position}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px]">
                          {e.rank_code || e.rank?.code || 'STAFF'}
                        </span>
                      </td>
                      <td className="py-3 text-zinc-500">
                        <div>{e.work_email || e.personal_email || e.email || '—'}</div>
                        <div className="text-[10px] text-zinc-400">{e.phone || '—'}</div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 capitalize">
                          {e.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedStaffForView(e)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-[11px] transition inline-flex items-center gap-1"
                            title="View complete 23-field personnel record"
                          >
                            <Eye size={12} />
                            <span>View Profile</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStaffForPassword(e);
                              setNewStaffPassword('');
                              setPasswordModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold text-[11px] transition inline-flex items-center gap-1"
                            title="Set custom department password"
                          >
                            <Key size={12} />
                            <span>Password</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SUPPLY CHAIN & LOGISTICS (INVENTORY & WAREHOUSES) */}
      {activeTab === 'inventory' && (
        <div className="space-y-5">
          {/* Header Banner requested by user */}
          <div className="surface-card rounded-xl p-5 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-orange-500">
                Supply Chain & Logistics
              </div>
              <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
                Inventory & Warehouses
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Monitor real-time SKU stock levels, regional fulfillment depots, item collections, and supply movements.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setAddProductModalOpen(true)}
                className="btn-primary text-xs py-2 px-3 shadow-xs"
              >
                <Plus size={14} />
                <span>+ Add Item / Product</span>
              </button>

              <button
                onClick={() => setMovementModalOpen(true)}
                className="btn-secondary text-xs py-2 px-3 border border-orange-500/30 text-orange-600 dark:text-orange-400 font-bold hover:bg-orange-500/5 shadow-xs"
              >
                <Truck size={14} />
                <span>+ Record Item Collection</span>
              </button>
            </div>
          </div>

          {/* SKU Inventory Table with Delete Option */}
          <div className="surface-card rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Boxes size={16} className="text-orange-500" />
                <span>Active SKU Stock Inventory ({products.length} Items)</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-bold uppercase text-[10px]">
                    <th className="pb-2">SKU Code</th>
                    <th className="pb-2">Product Name</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Selling Price</th>
                    <th className="pb-2">Cost Price</th>
                    <th className="pb-2">Current Stock</th>
                    <th className="pb-2">Warehouse / Depot</th>
                    <th className="pb-2 text-right">Delete / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-500/5 transition">
                      <td className="py-3 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {p.sku}
                      </td>
                      <td className="py-3 font-bold text-zinc-900 dark:text-zinc-100">
                        {p.name}
                      </td>
                      <td className="py-3 text-zinc-600 dark:text-zinc-400">
                        <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-semibold">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 font-black text-orange-600 dark:text-orange-400">
                        {formatMoney(p.price)}
                      </td>
                      <td className="py-3 font-mono text-zinc-500">
                        {formatMoney(p.cost_price || 0)}
                      </td>
                      <td className="py-3">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          p.stock_quantity <= (p.reorder_level || 20)
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {p.stock_quantity} {p.unit || 'carton'}s
                        </span>
                      </td>
                      <td className="py-3 text-zinc-500 text-[11px]">
                        <div>{p.warehouse_name || 'Ikeja Central Depot'}</div>
                        <div className="text-[10px] text-zinc-400">{p.shelve_location || 'Aisle 1 - Bay A'}</div>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name, p.sku)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition"
                          title="Delete Product from Inventory"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-zinc-400 text-xs">
                        No product SKUs registered yet. Click "+ Add Item / Product" above to create inventory.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: RECEIPT & BRAND SETTINGS (CUSTOMIZABLE INVOICE BRANDING) */}
      {activeTab === 'receipt' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Settings Form */}
          <div className="surface-card rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Printer size={18} className="text-orange-500" />
                <span>Commercial Sales Receipt Customizer</span>
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed mt-0.5">
                Customize exactly what prints on all sales receipts, invoices, and POS documents. Changes apply instantly across the entire enterprise.
              </p>
            </div>

            <form onSubmit={handleSaveReceiptSettings} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Company / Organization Name on Receipt *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EXPERIENTIAL EDGE or YOUR COMPANY NAME"
                  value={receiptForm.receipt_company_name}
                  onChange={(e) => setReceiptForm({ ...receiptForm, receipt_company_name: e.target.value })}
                  className="form-input font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tagline / Business Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g. Integrated Marketing & Commercial Distribution Solutions"
                  value={receiptForm.receipt_tagline}
                  onChange={(e) => setReceiptForm({ ...receiptForm, receipt_tagline: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Receipt Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EDGEWFORCE SALES RECEIPT or OFFICIAL INVOICE"
                  value={receiptForm.receipt_title}
                  onChange={(e) => setReceiptForm({ ...receiptForm, receipt_title: e.target.value })}
                  className="form-input font-bold text-orange-600 dark:text-orange-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Operating Address on Receipt
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 15 Atiba Osborne, Mende, Maryland, Lagos"
                    value={receiptForm.receipt_address}
                    onChange={(e) => setReceiptForm({ ...receiptForm, receipt_address: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Contact Phone / Support
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +2348031234567"
                    value={receiptForm.receipt_phone}
                    onChange={(e) => setReceiptForm({ ...receiptForm, receipt_phone: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Footer Terms / Receipt Note
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Thank you for your business. Goods received in good condition."
                  value={receiptForm.receipt_footer_note}
                  onChange={(e) => setReceiptForm({ ...receiptForm, receipt_footer_note: e.target.value })}
                  className="form-input"
                />
              </div>

              <button
                type="submit"
                disabled={savingReceipt}
                className="btn-primary w-full py-2.5 font-bold shadow-xs"
              >
                {savingReceipt ? 'Saving Receipt Settings…' : 'Save Receipt & Branding Settings'}
              </button>
            </form>
          </div>

          {/* Live Receipt Print Preview */}
          <div className="surface-card rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Live Receipt Preview
              </span>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                Real-Time Preview
              </span>
            </div>

            {/* Paper Preview */}
            <div className="p-6 bg-white text-zinc-950 rounded-xl border border-zinc-300 shadow-md font-mono text-xs max-w-md mx-auto">
              <div className="text-center pb-4 border-b-2 border-dashed border-zinc-300">
                <div className="font-black text-base uppercase tracking-wider text-zinc-900">
                  {receiptForm.receipt_company_name || 'EXPERIENTIAL EDGE'}
                </div>
                {receiptForm.receipt_tagline && (
                  <div className="text-[10px] text-zinc-600 font-sans mt-0.5">
                    {receiptForm.receipt_tagline}
                  </div>
                )}
                {receiptForm.receipt_address && (
                  <div className="text-[9px] text-zinc-500 font-sans mt-0.5">
                    {receiptForm.receipt_address} {receiptForm.receipt_phone ? `• Tel: ${receiptForm.receipt_phone}` : ''}
                  </div>
                )}
                <div className="text-[11px] font-bold text-orange-600 mt-1.5 font-sans">
                  {receiptForm.receipt_title || 'EDGEWFORCE SALES RECEIPT'}
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">
                  Order #: ORD-202608-SAMPLE
                </div>
                <div className="text-[10px] text-zinc-500">
                  Date: 25 Aug 2026 • 04:06 PM
                </div>
              </div>

              <div className="py-3 border-b border-zinc-200 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Customer:</span>
                  <span className="font-bold text-zinc-900">Zenith Mega Supermarket</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Sales Agent:</span>
                  <span>Adebanjo Adeleke</span>
                </div>
              </div>

              <div className="py-3 border-b border-zinc-200">
                <div className="flex justify-between font-bold text-[10px] text-zinc-500 uppercase pb-1.5">
                  <span>Item & Qty</span>
                  <span>Total (₦)</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span>Golden Penny Spaghetti (5 cartons)</span>
                    <span className="font-bold">₦120,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Peak Milk Refill 400g (3 cartons)</span>
                    <span className="font-bold">₦75,000</span>
                  </div>
                </div>
              </div>

              <div className="py-3 border-b-2 border-dashed border-zinc-300 space-y-1 text-[11px]">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal:</span>
                  <span>₦195,000</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>VAT (7.5%):</span>
                  <span>₦14,625</span>
                </div>
                <div className="flex justify-between text-sm font-black text-zinc-900 pt-1 border-t border-zinc-200">
                  <span>Total Payable:</span>
                  <span className="text-orange-600">₦209,625</span>
                </div>
              </div>

              <div className="pt-3 text-[9px] text-center text-zinc-500 font-sans">
                {receiptForm.receipt_footer_note || 'Thank you for your business. Verified by EdgeWForce Operating System.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: STAFF HIERARCHY & ORG CHART */}
      {activeTab === 'hierarchy' && (
        <div className="surface-card rounded-xl p-5 space-y-4">
          <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Network size={18} className="text-orange-500" />
            <span>Corporate Organizational Structure & Reporting Hierarchy</span>
          </h3>
          {dataIssues.organization && !orgTree ? (
            <div className="text-xs text-rose-700 dark:text-rose-300">
              Organization chart could not be loaded. <button onClick={loadData} className="font-semibold underline">Retry</button>
            </div>
          ) : <OrgChartTree orgTree={orgTree} user={user} onRefresh={loadData} />}
        </div>
      )}

      {/* SUB-TAB 5: WORK LOCATIONS & GEOFENCING */}
      {activeTab === 'locations' && (
        <LocationAssignmentDashboard />
      )}

      {/* SUB-TAB 6: SYSTEM HEALTH & DB */}
      {activeTab === 'system' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="surface-card rounded-xl p-5 space-y-3">
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Server size={18} className="text-orange-500" />
              <span>Platform Node & Hosting Environment</span>
            </h3>
            <div className="space-y-2 text-xs divide-y divide-zinc-200 dark:divide-zinc-800">
              <div className="flex justify-between py-2">
                <span className="text-zinc-500">Operating System:</span>
                <b className="text-zinc-900 dark:text-zinc-100">Online Infrastructure</b>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-500">Hosting Architecture:</span>
                <b className="text-zinc-900 dark:text-zinc-100">Online Infrastructure</b>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-500">Database Engine:</span>
                <b className="text-emerald-600 font-bold">Supabase Cloud PostgreSQL & Storage</b>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-500">Headquarters Address:</span>
                <b className="text-zinc-900 dark:text-zinc-100">15 Atiba Osborne, Mende, Maryland, Lagos</b>
              </div>
            </div>
          </div>

          <div className="surface-card rounded-xl p-5 space-y-3">
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <ShieldAlert size={18} className="text-orange-500" />
              <span>Security & Access Control</span>
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Give each new staff member a unique initial password. Use Staff Directory to reset an individual account when needed.
            </p>
            <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 text-xs space-y-1">
              <div className="font-bold text-zinc-800 dark:text-zinc-200">Department Passwords:</div>
              <div className="text-zinc-600 dark:text-zinc-400">Click "Change Password" on any staff row in Staff Directory to set your desired department password.</div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: REGISTER STAFF */}
      <Modal
        title="Register New Staff Member"
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleRegisterStaff} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
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
                placeholder="e.g. Fashola"
                className="form-input"
                value={registerForm.last_name}
                onChange={(e) => setRegisterForm({ ...registerForm, last_name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Official Email Address
              </label>
              <input
                type="email"
                placeholder="staff@edgewforce.com"
                className="form-input"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Phone Number (Nigerian Format)
              </label>
              <input
                type="tel"
                placeholder="+234 800 000 0000"
                className="form-input"
                value={registerForm.phone}
                onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
              />
            </div>

            <div className="md:col-span-2 p-3 rounded-xl bg-orange-500/5 border border-orange-500/20">
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                  <Lock size={13} />
                  <span>Account Login Password</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-normal">Required</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Unique password (8 characters minimum)"
                  className="form-input pr-10 font-mono text-xs"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
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
                  <span>Assigned Work Location / Workplace Geofence</span>
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
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Residential / Workstation Address
              </label>
              <input
                type="text"
                className="form-input"
                value={registerForm.address}
                onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[11px] text-zinc-700 dark:text-zinc-300">
            The staff member will change the initial password on first login.
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Registering Staff…' : 'Complete Staff Registration'}
            </button>
            <button type="button" onClick={() => setRegisterModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: CHANGE STAFF PASSWORD */}
      <Modal
        title={`Change Password: ${selectedStaffForPassword?.first_name || ''} ${selectedStaffForPassword?.last_name || ''}`}
        isOpen={passwordModalOpen}
        onClose={() => {
          setPasswordModalOpen(false);
          setSelectedStaffForPassword(null);
        }}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-1">
            <div className="font-bold text-zinc-900 dark:text-zinc-100">
              {selectedStaffForPassword?.first_name} {selectedStaffForPassword?.last_name} ({selectedStaffForPassword?.employee_code})
            </div>
            <div className="text-[11px] text-zinc-500">
              Department: {selectedStaffForPassword?.department} • Role: {selectedStaffForPassword?.rank_code || 'STAFF'}
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">
              Login ID: {selectedStaffForPassword?.email || selectedStaffForPassword?.phone}
            </div>
          </div>

          <div>
            <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              New Staff Password *
            </label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Unique password (8 characters minimum)"
              value={newStaffPassword}
              onChange={(e) => setNewStaffPassword(e.target.value)}
              className="form-input font-mono font-bold"
            />
            <span className="text-[10px] text-zinc-400 mt-1 block">
              Set a unique password of at least 8 characters for this staff member.
            </span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={savingPassword}
              className="btn-primary flex-1 py-2.5 font-bold"
            >
              {savingPassword ? 'Updating Password…' : 'Set New Password'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPasswordModalOpen(false);
                setSelectedStaffForPassword(null);
              }}
              className="btn-secondary py-2.5 px-4"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: ADD PRODUCT (SUPPLY CHAIN) */}
      <Modal
        title="Add Inventory Item / Product"
        isOpen={addProductModalOpen}
        onClose={() => setAddProductModalOpen(false)}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddProduct} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Product / Item Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Golden Penny Spaghetti 500g"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                SKU Code (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. SKU-GP-500G"
                value={productForm.sku}
                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                className="form-input font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Category
              </label>
              <select
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                className="form-input"
              >
                <option>Beverages & Drinks</option>
                <option>Food & Grains</option>
                <option>Personal Care & Hygiene</option>
                <option>Household Essentials</option>
                <option>General FMCG</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Selling Price (₦) *
              </label>
              <input
                type="number"
                required
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                className="form-input font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Cost Price (₦)
              </label>
              <input
                type="number"
                value={productForm.cost_price}
                onChange={(e) => setProductForm({ ...productForm, cost_price: Number(e.target.value) })}
                className="form-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Initial Stock Qty
              </label>
              <input
                type="number"
                value={productForm.stock_quantity}
                onChange={(e) => setProductForm({ ...productForm, stock_quantity: Number(e.target.value) })}
                className="form-input font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Unit of Measure
              </label>
              <select
                value={productForm.unit}
                onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                className="form-input"
              >
                <option value="carton">Carton</option>
                <option value="pack">Pack</option>
                <option value="crate">Crate</option>
                <option value="bag">Bag</option>
                <option value="piece">Piece / Bottle</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Warehouse / Depot
              </label>
              <input
                type="text"
                value={productForm.warehouse_name}
                onChange={(e) => setProductForm({ ...productForm, warehouse_name: e.target.value })}
                className="form-input"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Shelf / Bay Location
              </label>
              <input
                type="text"
                value={productForm.shelve_location}
                onChange={(e) => setProductForm({ ...productForm, shelve_location: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              disabled={savingProduct}
              className="btn-primary flex-1 py-2.5"
            >
              {savingProduct ? 'Adding Product…' : '+ Save Product to Inventory'}
            </button>
            <button
              type="button"
              onClick={() => setAddProductModalOpen(false)}
              className="btn-secondary py-2.5 px-4"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: RECORD ITEM COLLECTION */}
      <Modal
        title="Record Item Collection / Stock Movement"
        isOpen={movementModalOpen}
        onClose={() => setMovementModalOpen(false)}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRecordMovement} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Select Product SKU *
            </label>
            <select
              required
              value={movementForm.product_id}
              onChange={(e) => setMovementForm({ ...movementForm, product_id: e.target.value })}
              className="form-input"
            >
              <option value="">-- Choose Product --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) • Stock: {p.stock_quantity} {p.unit}s
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Movement Type *
              </label>
              <select
                value={movementForm.movement_type}
                onChange={(e) => setMovementForm({ ...movementForm, movement_type: e.target.value })}
                className="form-input"
              >
                <option value="COLLECTION">Item Collection (Dispatch)</option>
                <option value="RESTOCK">Replenishment / Restock</option>
                <option value="TRANSFER">Inter-Depot Transfer</option>
                <option value="DAMAGE">Damaged / Returned Goods</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                required
                min="1"
                value={movementForm.quantity}
                onChange={(e) => setMovementForm({ ...movementForm, quantity: Number(e.target.value) })}
                className="form-input font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Waybill / Reference Number (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. WB-2026-009"
              value={movementForm.reference_number}
              onChange={(e) => setMovementForm({ ...movementForm, reference_number: e.target.value })}
              className="form-input font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Movement Notes
            </label>
            <textarea
              rows="2"
              value={movementForm.notes}
              onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              disabled={savingMovement}
              className="btn-primary flex-1 py-2.5"
            >
              {savingMovement ? 'Recording…' : 'Record Stock Movement'}
            </button>
            <button
              type="button"
              onClick={() => setMovementModalOpen(false)}
              className="btn-secondary py-2.5 px-4"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
      {/* 23-Field Detailed Staff Personnel Profile Drawer */}
      <StaffProfileDrawer
        employee={selectedStaffForView}
        isOpen={Boolean(selectedStaffForView)}
        onClose={() => setSelectedStaffForView(null)}
        auditLogs={auditLogs}
      />
    </div>
  );
}
