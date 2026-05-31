import type { LatLngTuple } from 'leaflet';

export interface TripRouteMock {
  points: LatLngTuple[];
  startLabel: string;
  endLabel: string;
}

const MOSCOW_TVER_ROUTE: TripRouteMock = {
  startLabel: 'Москва',
  endLabel: 'Тверь',
  points: [
    [55.7558, 37.6173],
    [55.791, 37.534],
    [55.872, 37.392],
    [55.965, 37.198],
    [56.12, 36.95],
    [56.31, 36.72],
    [56.52, 36.35],
    [56.715, 36.05],
    [56.8587, 35.9176],
  ],
};

const DEFAULT_ROUTE: TripRouteMock = {
  startLabel: 'Пункт А',
  endLabel: 'Пункт Б',
  points: MOSCOW_TVER_ROUTE.points,
};

export function getMockRouteForTrip(tripId: string, routeLabel: string): TripRouteMock {
  if (tripId === 'R00101' || routeLabel.includes('Москва') || routeLabel.includes('Тверь')) {
    return MOSCOW_TVER_ROUTE;
  }

  return {
    ...DEFAULT_ROUTE,
    startLabel: routeLabel.split('→')[0]?.trim() || DEFAULT_ROUTE.startLabel,
    endLabel: routeLabel.split('→')[1]?.trim() || DEFAULT_ROUTE.endLabel,
  };
}

export function interpolateRoutePoint(points: LatLngTuple[], progress: number): LatLngTuple {
  if (points.length === 0) return [0, 0];
  if (points.length === 1) return points[0];

  const clamped = Math.min(Math.max(progress, 0), 1);
  const totalSegments = points.length - 1;
  const scaled = clamped * totalSegments;
  const segmentIndex = Math.min(Math.floor(scaled), totalSegments - 1);
  const segmentProgress = scaled - segmentIndex;

  const [lat1, lng1] = points[segmentIndex];
  const [lat2, lng2] = points[segmentIndex + 1];

  return [
    lat1 + (lat2 - lat1) * segmentProgress,
    lng1 + (lng2 - lng1) * segmentProgress,
  ];
}
