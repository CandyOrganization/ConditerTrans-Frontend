import type { CargoLocationUpdate } from '../types';
import { buildTrackingWsUrl, type TrackingRole } from '../config/tracking';

export interface TrackingConnectedMessage {
  type: 'connected';
  role: TrackingRole;
  cargo_id: string;
  driver_id: string;
  delivery_address?: string;
}

export interface TrackingLocationMessage {
  type: 'location';
  cargo_id: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  updated_at: string;
}

export interface TrackingErrorMessage {
  type: 'error';
  message: string;
}

export type TrackingIncomingMessage =
  | TrackingConnectedMessage
  | TrackingLocationMessage
  | TrackingErrorMessage
  | { type: 'location_ack'; updated_at: string };

function parseLocationMessage(message: TrackingLocationMessage): CargoLocationUpdate {
  return {
    cargoId: message.cargo_id,
    driverId: message.driver_id,
    latitude: message.latitude,
    longitude: message.longitude,
    heading: message.heading ?? null,
    speed: message.speed ?? null,
    updatedAt: message.updated_at,
  };
}

export interface CargoTrackingSubscription {
  close: () => void;
}

export function subscribeToCargoLocation(
  cargoId: string,
  handlers: {
    onLocation: (location: CargoLocationUpdate) => void;
    onConnected?: () => void;
    onDisconnected?: () => void;
    onError?: (message: string) => void;
  },
): CargoTrackingSubscription {
  const ws = new WebSocket(buildTrackingWsUrl(cargoId, 'subscriber'));
  let closed = false;

  ws.onopen = () => {
    handlers.onConnected?.();
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(String(event.data)) as TrackingIncomingMessage;

      if (data.type === 'location') {
        handlers.onLocation(parseLocationMessage(data));
        return;
      }

      if (data.type === 'error') {
        handlers.onError?.(data.message);
      }
    } catch {
      handlers.onError?.('Не удалось разобрать сообщение трекинга');
    }
  };

  ws.onerror = () => {
    handlers.onError?.('Ошибка WebSocket-соединения');
  };

  ws.onclose = () => {
    if (!closed) {
      handlers.onDisconnected?.();
    }
  };

  return {
    close: () => {
      closed = true;
      ws.close();
    },
  };
}

export interface DriverTrackingPublisher {
  close: () => void;
  sendLocation: (payload: {
    latitude: number;
    longitude: number;
    heading?: number | null;
    speed?: number | null;
  }) => void;
}

export function connectDriverTracking(
  cargoId: string,
  driverId: string,
  handlers: {
    onReady?: () => void;
    onLocation?: (location: CargoLocationUpdate) => void;
    onError?: (message: string) => void;
    onDisconnected?: () => void;
  },
): Promise<DriverTrackingPublisher> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(buildTrackingWsUrl(cargoId, 'driver', driverId));
    let closed = false;
    let ready = false;

    const publisher: DriverTrackingPublisher = {
      sendLocation: (payload) => {
        if (ws.readyState !== WebSocket.OPEN) {
          return;
        }

        ws.send(
          JSON.stringify({
            type: 'location_update',
            latitude: payload.latitude,
            longitude: payload.longitude,
            heading: payload.heading ?? null,
            speed: payload.speed ?? null,
          }),
        );
      },
      close: () => {
        closed = true;
        ws.close();
      },
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(String(event.data)) as TrackingIncomingMessage;

        if (data.type === 'connected' && !ready) {
          ready = true;
          handlers.onReady?.();
          resolve(publisher);
          return;
        }

        if (data.type === 'location') {
          handlers.onLocation?.(parseLocationMessage(data));
          return;
        }

        if (data.type === 'error') {
          handlers.onError?.(data.message);
          if (!ready) {
            reject(new Error(data.message));
          }
        }
      } catch {
        const message = 'Не удалось разобрать сообщение трекинга';
        handlers.onError?.(message);
        if (!ready) {
          reject(new Error(message));
        }
      }
    };

    ws.onerror = () => {
      const message = 'Ошибка WebSocket-соединения';
      handlers.onError?.(message);
      if (!ready) {
        reject(new Error(message));
      }
    };

    ws.onclose = () => {
      if (!closed) {
        handlers.onDisconnected?.();
      }
      if (!ready) {
        reject(new Error('WebSocket закрыт до установки соединения'));
      }
    };
  });
}

// Backward-compatible aliases during migration away from trip tracking.
export const subscribeToTripLocation = subscribeToCargoLocation;
export type TripTrackingSubscription = CargoTrackingSubscription;
