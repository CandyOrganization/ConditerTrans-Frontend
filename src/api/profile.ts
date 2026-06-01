import type { ChangePasswordDto, UpdateProfileDto, UserProfile } from '../types';
import { apiRequest } from './client';

interface EmployeeApiResponse {
  name: string;
  surname: string;
  patronymic?: string | null;
  phone: string;
  employeeNumber: string;
  companyId: string;
  createdAt: string;
}

interface UserMeApiResponse {
  id: string;
  email: string;
  userRole: string;
  isAdmin: boolean;
  employeeId: string;
  employee: EmployeeApiResponse | null;
}

const USER_ROLE_LABELS: Record<string, string> = {
  Manager: 'Менеджер',
  Dispatcher: 'Диспетчер производства',
  Coordinator: 'Координатор',
};

function formatRole(userRole: string, isAdmin: boolean): string {
  if (isAdmin) {
    return 'Администратор';
  }
  return USER_ROLE_LABELS[userRole] ?? userRole;
}

function formatRegistrationDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString('ru-RU');
}

function mapUserMeToProfile(data: UserMeApiResponse): UserProfile {
  const employee = data.employee;

  if (!employee) {
    return {
      firstName: '—',
      lastName: '—',
      middleName: '',
      role: formatRole(data.userRole, data.isAdmin),
      personnelNumber: '—',
      phone: '—',
      email: data.email,
      registrationDate: '—',
    };
  }

  return {
    firstName: employee.name,
    lastName: employee.surname,
    middleName: employee.patronymic ?? '',
    role: formatRole(data.userRole, data.isAdmin),
    personnelNumber: employee.employeeNumber,
    phone: employee.phone,
    email: data.email,
    registrationDate: formatRegistrationDate(employee.createdAt),
  };
}

export async function fetchUserProfile(): Promise<UserProfile> {
  const data = await apiRequest<UserMeApiResponse>('/users/me');
  return mapUserMeToProfile(data);
}

export async function updateUserProfile(dto: UpdateProfileDto): Promise<UserProfile> {
  const data = await apiRequest<UserMeApiResponse>('/users/me', {
    method: 'PUT',
    body: JSON.stringify({
      lastName: dto.lastName,
      firstName: dto.firstName,
      middleName: dto.middleName || null,
      phone: dto.phone,
      email: dto.email,
    }),
  });
  return mapUserMeToProfile(data);
}

export async function changePassword(dto: ChangePasswordDto): Promise<void> {
  if (dto.newPassword !== dto.confirmPassword) {
    throw new Error('Пароли не совпадают');
  }
  if (dto.newPassword.length < 6) {
    throw new Error('Новый пароль должен быть не короче 6 символов');
  }

  await apiRequest('/users/me/change-password', {
    method: 'POST',
    body: JSON.stringify({
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
      confirmPassword: dto.confirmPassword,
    }),
  });
}

export function formatFullName(profile: UserProfile): string {
  const parts = [profile.lastName, profile.firstName, profile.middleName].filter(Boolean);
  return parts.join(' ');
}

export function getProfileInitials(profile: UserProfile): string {
  const first = profile.firstName?.[0] ?? '';
  const last = profile.lastName?.[0] ?? '';
  const initials = `${first}${last}`.toUpperCase();
  return initials || '?';
}
