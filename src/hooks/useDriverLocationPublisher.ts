import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import type { CargoLocationUpdate } from '../types';
import {
  connectDriverTracking,
  type DriverTrackingPublisher,
} from '../services/cargoTrackingWebSocket';

interface UseDriverLocationPublisherOptions {
  autoStart?: boolean;
}

function toLocationUpdate(
  cargoId: string,
  driverId: string,
  position: Location.LocationObject,
): CargoLocationUpdate {
  return {
    cargoId,
    driverId,
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    heading: position.coords.heading,
    speed: position.coords.speed != null ? position.coords.speed * 3.6 : null,
    updatedAt: new Date().toISOString(),
  };
}

export function useDriverLocationPublisher(
  cargoId: string,
  driverId: string,
  options: UseDriverLocationPublisherOptions = {},
) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastSent, setLastSent] = useState<CargoLocationUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const publisherRef = useRef<DriverTrackingPublisher | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startingRef = useRef(false);

  const sendPosition = useCallback(
    (publisher: DriverTrackingPublisher, position: Location.LocationObject) => {
      publisher.sendLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        heading: position.coords.heading,
        speed: position.coords.speed != null ? position.coords.speed * 3.6 : null,
      });
      setLastSent(toLocationUpdate(cargoId, driverId, position));
    },
    [cargoId, driverId],
  );

  const stop = useCallback(async () => {
    watchRef.current?.remove();
    watchRef.current = null;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    publisherRef.current?.close();
    publisherRef.current = null;
    startingRef.current = false;
    setIsPublishing(false);
  }, []);

  const start = useCallback(async () => {
    if (startingRef.current || !cargoId || !driverId) {
      return;
    }

    startingRef.current = true;
    setError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error('Нет доступа к геолокации');
      }

      await stop();
      startingRef.current = true;

      const publisher = await connectDriverTracking(cargoId, driverId, {
        onError: (message) => setError(message),
        onDisconnected: () => {
          setIsPublishing(false);
          startingRef.current = false;
        },
        onLocation: (update) => setLastSent(update),
      });

      publisherRef.current = publisher;

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      sendPosition(publisher, current);

      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5,
          timeInterval: 2000,
        },
        (position) => {
          sendPosition(publisher, position);
        },
      );

      intervalRef.current = setInterval(async () => {
        if (!publisherRef.current) {
          return;
        }

        try {
          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          sendPosition(publisherRef.current, position);
        } catch {
          // ignore periodic read errors
        }
      }, 4000);

      setIsPublishing(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось начать передачу GPS');
      await stop();
    } finally {
      startingRef.current = false;
    }
  }, [cargoId, driverId, sendPosition, stop]);

  useEffect(() => {
    if (!options.autoStart) {
      return;
    }

    void start();

    return () => {
      void stop();
    };
  }, [options.autoStart, cargoId, driverId, start, stop]);

  return {
    isPublishing,
    lastSent,
    error,
    start,
    stop,
  };
}
