import type { CreateEmployeeDto, CurrentUser, UserRole } from '../types';
import { apiRequest } from './client';

export async function fetchCurrentUser(): Promise<CurrentUser> {
  return apiRequest<CurrentUser>('/users/me');
}

export async function fetchCompanyEmployees(): Promise<CurrentUser[]> {
  return apiRequest<CurrentUser[]>('/users/employees');
}

export async function inviteEmployee(
  dto: CreateEmployeeDto,
  options?: { omitRole?: boolean },
): Promise<{ inviteId: string }> {
  const body: Record<string, unknown> = {
    name: dto.name,
    surname: dto.surname,
    patronymic: dto.patronymic || null,
    phone: dto.phone,
    employeeNumber: dto.employeeNumber,
    email: dto.email,
  };

  if (!options?.omitRole && dto.userRole) {
    body.userRole = dto.userRole;
  }

  return apiRequest<{ inviteId: string }>('/users/admin-invite', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getUserRoleLabel(role: UserRole): string {
  switch (role) {
    case 'Coordinator':
      return 'Логист-координатор';
    case 'Driver':
      return 'Водитель';
    case 'Dispatcher':
      return 'Диспетчер производства';
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
