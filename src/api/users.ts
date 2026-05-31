import type { CreateEmployeeDto, CurrentUser, UserRole } from '../types';
import { apiRequest } from './client';

export async function fetchCurrentUser(): Promise<CurrentUser> {
  return apiRequest<CurrentUser>('/users/me');
}

export async function fetchCompanyEmployees(): Promise<CurrentUser[]> {
  return apiRequest<CurrentUser[]>('/users/employees');
}

export async function inviteEmployee(dto: CreateEmployeeDto): Promise<{ inviteId: string }> {
  return apiRequest<{ inviteId: string }>('/users/admin-invite', {
    method: 'POST',
    body: JSON.stringify({
      name: dto.name,
      surname: dto.surname,
      patronymic: dto.patronymic || null,
      phone: dto.phone,
      employeeNumber: dto.employeeNumber,
      email: dto.email,
      userRole: dto.userRole,
    }),
  });
}

export function getUserRoleLabel(role: UserRole): string {
  switch (role) {
    case 'Coordinator':
      return 'Логист-координатор';
    case 'Driver':
      return 'Водитель';
    case 'Dispatcher':
      return 'Диспетчер';
    case 'Manager':
      return 'Менеджер';
    default:
      return role;
  }
}

export function formatEmployeeName(user: CurrentUser): string {
  const employee = user.employee;
  if (!employee) {
    return user.email;
  }

  return [employee.surname, employee.name, employee.patronymic].filter(Boolean).join(' ');
}
