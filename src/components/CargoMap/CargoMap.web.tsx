import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import type { LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCargoLocationSubscription } from '../../hooks/useCargoLocationSubscription';
import { TRACKING_WS_BASE_URL } from '../../config/tracking';
import { colors } from '../../theme/colors';
import type { CargoMapProps } from './types';

const DEFAULT_CENTER: LatLngTuple = [55.7558, 37.6173];

function FitPointsBounds({ points }: { points: LatLngTuple[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) {
      map.setView(DEFAULT_CENTER, 10);
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }

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

export default function CargoMap({
  cargoId,
  deliveryAddress,
  vehicleLabel,
  licensePlate = '—',
  liveLocation,
  subscribe = true,
}: CargoMapProps) {
  const [mounted, setMounted] = useState(false);
  const [driverTrail, setDriverTrail] = useState<LatLngTuple[]>([]);
  const subscription = useCargoLocationSubscription(cargoId, { enabled: subscribe });
  const location = liveLocation ?? subscription.location;
  const trail = subscribe ? subscription.trail : driverTrail;
  const connected = subscribe ? subscription.connected : Boolean(liveLocation);
  const error = subscribe ? subscription.error : null;
  const hasLiveLocation = location !== null;

  const vehiclePosition = useMemo<LatLngTuple>(() => {
    if (location) {
      return [location.latitude, location.longitude];
    }
    if (trail.length > 0) {
      return trail[trail.length - 1];
    }
    return DEFAULT_CENTER;
  }, [location, trail]);

  const boundsPoints = useMemo(() => {
    if (trail.length > 0) {
      return trail;
    }
    return hasLiveLocation ? [vehiclePosition] : [];
  }, [hasLiveLocation, trail, vehiclePosition]);

  useEffect(() => {
    if (!liveLocation) {
      return;
    }

    const point: LatLngTuple = [liveLocation.latitude, liveLocation.longitude];
    setDriverTrail((current) => (current.length ? appendTrailPoint(current, point) : [point]));
  }, [liveLocation]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Загрузка карты...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <MapContainer
        center={vehiclePosition}
        zoom={hasLiveLocation ? 12 : 10}
        scrollWheelZoom={false}
        style={styles.map}
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitPointsBounds points={boundsPoints} />
        {hasLiveLocation ? <FollowVehicle position={vehiclePosition} /> : null}

        {trail.length > 1 ? (
          <Polyline positions={trail} pathOptions={{ color: colors.primary, weight: 5, opacity: 0.95 }} />
        ) : null}

        {hasLiveLocation ? (
          <Marker position={vehiclePosition} icon={createTruckIcon(licensePlate)}>
            <Popup>
              {vehicleLabel}
              {'\n'}
              {licensePlate}
              {location?.speed != null ? `\n${Math.round(location.speed)} км/ч` : ''}
            </Popup>
          </Marker>
        ) : null}
      </MapContainer>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Адрес доставки</Text>
        <Text style={styles.legendAddress}>{deliveryAddress}</Text>
        <Text style={styles.legendText}>
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
  legendTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  legendAddress: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 2,
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
