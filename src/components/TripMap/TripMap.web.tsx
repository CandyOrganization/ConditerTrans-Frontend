import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import type { LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTripLocationSubscription } from '../../hooks/useTripLocationSubscription';
import { TRACKING_WS_BASE_URL } from '../../config/tracking';
import { colors } from '../../theme/colors';
import { getMockRouteForTrip, interpolateRoutePoint } from './routeMock';
import type { TripMapProps } from './types';

function FitRouteBounds({ points }: { points: LatLngTuple[] }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(points, { padding: [36, 36] });
  }, [map, points]);

  return null;
}

function FollowVehicle({ position }: { position: LatLngTuple }) {
  const map = useMap();

  useEffect(() => {
    map.panTo(position, { animate: true, duration: 0.8 });
  }, [map, position]);

  return null;
}

function createPointIcon(color: string, label: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: ${color};
      border: 2px solid #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.35);
    " title="${label}"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function createTruckIcon(licensePlate: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -50%);
    ">
      <div style="
        font-size: 22px;
        line-height: 1;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));
      ">🚛</div>
      <div style="
        margin-top: 2px;
        padding: 2px 6px;
        border-radius: 4px;
        background: ${colors.primary};
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        white-space: nowrap;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      ">${licensePlate}</div>
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function appendTrailPoint(trail: LatLngTuple[], point: LatLngTuple): LatLngTuple[] {
  const last = trail[trail.length - 1];
  if (last && last[0] === point[0] && last[1] === point[1]) {
    return trail;
  }
  return [...trail, point];
}

export default function TripMap({
  tripId,
  routeLabel,
  vehicleLabel,
  licensePlate,
  liveLocation,
  subscribe = true,
}: TripMapProps) {
  const [mounted, setMounted] = useState(false);
  const [fallbackProgress, setFallbackProgress] = useState(0.42);
  const [driverTrail, setDriverTrail] = useState<LatLngTuple[]>([]);
  const subscription = useTripLocationSubscription(tripId, { enabled: subscribe });
  const location = liveLocation ?? subscription.location;
  const trail = subscribe ? subscription.trail : driverTrail;
  const connected = subscribe ? subscription.connected : Boolean(liveLocation);
  const error = subscribe ? subscription.error : null;
  const hasLiveLocation = location !== null;

  const route = useMemo(
    () => getMockRouteForTrip(tripId, routeLabel),
    [tripId, routeLabel],
  );

  const fallbackPosition = useMemo(
    () => interpolateRoutePoint(route.points, fallbackProgress),
    [route.points, fallbackProgress],
  );

  const vehiclePosition = useMemo<LatLngTuple>(() => {
    if (location) {
      return [location.latitude, location.longitude];
    }
    return fallbackPosition;
  }, [fallbackPosition, location]);

  useEffect(() => {
    if (!liveLocation) {
      return;
    }

    const point: LatLngTuple = [liveLocation.latitude, liveLocation.longitude];
    setDriverTrail((current) => (current.length ? appendTrailPoint(current, point) : [point]));
  }, [liveLocation]);

  const traveledRoute = useMemo(() => {
    if (trail.length > 1) {
      return trail;
    }

    const result: LatLngTuple[] = [route.points[0]];
    const totalSegments = route.points.length - 1;
    const scaled = fallbackProgress * totalSegments;
    const segmentIndex = Math.min(Math.floor(scaled), totalSegments - 1);
    const segmentProgress = scaled - segmentIndex;

    for (let i = 1; i <= segmentIndex; i += 1) {
      result.push(route.points[i]);
    }

    if (segmentIndex < totalSegments) {
      const [lat1, lng1] = route.points[segmentIndex];
      const [lat2, lng2] = route.points[segmentIndex + 1];
      result.push([
        lat1 + (lat2 - lat1) * segmentProgress,
        lng1 + (lng2 - lng1) * segmentProgress,
      ]);
    }

    return result;
  }, [fallbackProgress, route.points, trail]);

  const remainingRoute = useMemo(() => {
    if (traveledRoute.length < 2) return route.points;
    return [traveledRoute[traveledRoute.length - 1], ...route.points.slice(traveledRoute.length - 1)];
  }, [route.points, traveledRoute]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (hasLiveLocation || liveLocation) {
      return;
    }

    const interval = setInterval(() => {
      setFallbackProgress((current) => {
        const next = current + 0.004;
        return next > 0.92 ? 0.18 : next;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [hasLiveLocation, liveLocation]);

  if (!mounted) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Загрузка карты...</Text>
      </View>
    );
  }

  const startPoint = route.points[0];
  const endPoint = route.points[route.points.length - 1];

  return (
    <View style={styles.wrap}>
      <MapContainer
        center={vehiclePosition}
        zoom={7}
        scrollWheelZoom={false}
        style={styles.map}
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitRouteBounds points={route.points} />
        {hasLiveLocation ? <FollowVehicle position={vehiclePosition} /> : null}

        <Polyline positions={remainingRoute} pathOptions={{ color: '#cbd5e1', weight: 5, opacity: 0.9 }} />
        <Polyline positions={traveledRoute} pathOptions={{ color: colors.primary, weight: 5, opacity: 0.95 }} />

        <Marker position={startPoint} icon={createPointIcon(colors.success, route.startLabel)}>
          <Popup>{route.startLabel}</Popup>
        </Marker>

        <Marker position={endPoint} icon={createPointIcon(colors.error, route.endLabel)}>
          <Popup>{route.endLabel}</Popup>
        </Marker>

        <Marker position={vehiclePosition} icon={createTruckIcon(licensePlate)}>
          <Popup>
            {vehicleLabel}
            {'\n'}
            {licensePlate}
            {location?.speed != null ? `\n${Math.round(location.speed)} км/ч` : ''}
          </Popup>
        </Marker>
      </MapContainer>

      <View style={styles.legend}>
        <Text style={styles.legendText}>
          {route.startLabel} → {route.endLabel}
          {' · '}
          {liveLocation
            ? 'GPS передаётся'
            : hasLiveLocation
              ? `GPS онлайн${connected ? '' : ' (переподключение...)'}`
              : connected
                ? 'ожидание GPS от водителя'
                : 'нет связи с tracking-сервисом'}
        </Text>
        {error ? <Text style={styles.legendError}>{error}</Text> : null}
        <Text style={styles.legendText}>WS: {TRACKING_WS_BASE_URL}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  map: {
    height: 320,
    width: '100%',
  },
  legend: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4,
  },
  legendText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  legendError: {
    fontSize: 12,
    color: colors.error,
  },
  placeholder: {
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  placeholderText: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
