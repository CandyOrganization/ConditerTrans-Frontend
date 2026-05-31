import { env, trackingHttpUrl } from './env';

export const TRACKING_WS_BASE_URL = env.trackingWsUrl;
export const TRACKING_HTTP_BASE_URL = trackingHttpUrl;

export type TrackingRole = 'subscriber' | 'driver';

export function buildTrackingWsUrl(
  cargoId: string,
  role: TrackingRole,
  driverId?: string,
): string {
  const base = env.trackingWsUrl.replace(/\/$/, '');
  const url = new URL(`${base}/tracking/ws/cargo/${encodeURIComponent(cargoId)}`);
  url.searchParams.set('role', role);
  if (driverId) {
    url.searchParams.set('driver_id', driverId);
  }
  return url.toString();
}

export interface CargoMovementHistoryItem {
  id: string;
  cargoId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  recordedAt: string;
}

interface CargoMovementHistoryResponse {
  cargoId: string;
  items: Array<{
    id: string;
    cargo_id: string;
    driver_id: string;
    latitude: number;
    longitude: number;
    heading?: number | null;
    speed?: number | null;
    recorded_at: string;
  }>;
  total: number;
}

export async function fetchCargoMovementHistory(
  cargoId: string,
  limit = 500,
): Promise<CargoMovementHistoryItem[]> {
  const response = await fetch(
    `${trackingHttpUrl}/tracking/cargo/${encodeURIComponent(cargoId)}/history?limit=${limit}`,
  );

  if (!response.ok) {
    throw new Error('Не удалось загрузить историю перемещения');
  }

  const data = (await response.json()) as CargoMovementHistoryResponse;
  return (data.items ?? []).map((item) => ({
    id: item.id,
    cargoId: item.cargo_id,
    driverId: item.driver_id,
    latitude: item.latitude,
    longitude: item.longitude,
    heading: item.heading ?? null,
    speed: item.speed ?? null,
    recordedAt: item.recorded_at,
  }));
}
