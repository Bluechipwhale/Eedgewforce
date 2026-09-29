import { readAll } from '../utils/readAll.js';
import { employeeRef, sameId } from '../utils/id.js';
import { validateHierarchyAssignment } from '../middleware/rbac.js';

export function canAssignEmployee(actor, employee, ranks = []) {
  if (!actor || !sameId(actor.company_id || actor.employee?.company_id || 1, employee.company_id || 1)) return false;
  if (['CEO', 'CTO', 'SUPER_ADMIN', 'ADMIN', 'IT_ADMIN', 'HR_MANAGER', 'HR']
    .some(role => [actor.role_code?.toUpperCase(), actor.rank?.code?.toUpperCase()].includes(role))) return true;
  const level = actor.rank?.level || ranks.find(r => r.code === (actor.rank?.code || actor.employee?.rank_code))?.level || 8;
  const targetLevel = ranks.find(r => r.code === employee.rank_code)?.level || 8;
  return validateHierarchyAssignment(level, targetLevel);
}

export async function getTaskDirectory(actor) {
  const [employees, ranks] = await Promise.all([readAll('employees'), readAll('ranks')]);
  return employees
    .filter(e => sameId(e.company_id || 1, actor.company_id || actor.employee?.company_id || 1))
    .map(e => ({
      id: employeeRef(e),
      first_name: e.first_name || '', last_name: e.last_name || '',
      full_name: e.full_name || `${e.first_name || ''} ${e.last_name || ''}`.trim(),
      employee_code: e.employee_code || e.staff_id || '',
      department: typeof e.department === 'string' ? e.department : e.department?.name || '',
      position: e.position || e.rank_code || 'Staff',
      assignable: !['inactive', 'suspended', 'terminated'].includes(String(e.status).toLowerCase()) && canAssignEmployee(actor, e, ranks),
      status: e.status || 'active'
    }))
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
}
