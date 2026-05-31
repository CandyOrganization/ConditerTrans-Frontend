import { useEffect, useRef, useState } from 'react';
import type { LatLngTuple } from 'leaflet';
import type { CargoLocationUpdate } from '../types';
import { fetchCargoMovementHistory } from '../config/tracking';
import { subscribeToCargoLocation } from '../services/cargoTrackingWebSocket';

const MAX_TRAIL_POINTS = 500;

function appendTrailPoint(trail: LatLngTuple[], point: LatLngTuple): LatLngTuple[] {
  const last = trail[trail.length - 1];
  if (last && last[0] === point[0] && last[1] === point[1]) {
    return trail;
  }

  const next = [...trail, point];
  if (next.length > MAX_TRAIL_POINTS) {
    return next.slice(next.length - MAX_TRAIL_POINTS);
  }

  return next;
}

interface UseCargoLocationSubscriptionOptions {
  enabled?: boolean;
  loadHistory?: boolean;
}

export function useCargoLocationSubscription(
  cargoId: string,
  options: UseCargoLocationSubscriptionOptions = {},
) {
  const enabled = options.enabled !== false;
  const loadHistory = options.loadHistory !== false;
  const [location, setLocation] = useState<CargoLocationUpdate | null>(null);
  const [trail, setTrail] = useState<LatLngTuple[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !cargoId) {
      setConnected(false);
      setError(null);
      return;
    }

    initializedRef.current = false;
    setLocation(null);
    setTrail([]);
    setConnected(false);
    setError(null);

    let cancelled = false;

    (async () => {
      if (loadHistory) {
        try {
          const history = await fetchCargoMovementHistory(cargoId);
          if (cancelled) return;
          const points = history.map(
            (point) => [point.latitude, point.longitude] as LatLngTuple,
          );
          if (points.length > 0) {
            setTrail(points);
            const last = history[history.length - 1];
            setLocation({
              cargoId: last.cargoId,
              driverId: last.driverId,
              latitude: last.latitude,
              longitude: last.longitude,
              heading: last.heading ?? null,
              speed: last.speed ?? null,
              updatedAt: last.recordedAt,
            });
            initializedRef.current = true;
          }
        } catch {
          // history is optional on first load
        }
      }
    })();

    const subscription = subscribeToCargoLocation(cargoId, {
      onConnected: () => setConnected(true),
      onDisconnected: () => setConnected(false),
      onError: (message) => setError(message),
      onLocation: (update) => {
        setLocation(update);
        const point: LatLngTuple = [update.latitude, update.longitude];
        setTrail((current) => {
          if (!initializedRef.current) {
            initializedRef.current = true;
            return [point];
          }
          return appendTrailPoint(current, point);
        });
      },
    });

    return () => {
      cancelled = true;
      subscription.close();
    };
  }, [cargoId, enabled, loadHistory]);

  return {
    location,
    trail,
    connected,
    error,
    hasLiveLocation: location !== null,
  };
}

export const useTripLocationSubscription = useCargoLocationSubscription;
