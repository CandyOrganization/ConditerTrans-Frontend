import type { Application, ProcessApplicationDto } from '../types';
import {
  assignDriverToCargo,
  fetchPendingCargos,
  formatApplicationLabel,
  formatApplicationRoute,
} from './cargo';

export { formatApplicationLabel, formatApplicationRoute };

export async function fetchApplications(): Promise<Application[]> {
  return fetchPendingCargos();
}

export async function processApplication(
  id: string,
  payload: ProcessApplicationDto,
): Promise<void> {
  await assignDriverToCargo(id, payload);
}
