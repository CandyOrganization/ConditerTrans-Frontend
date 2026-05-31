import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useCargoLocationSubscription } from '../../hooks/useCargoLocationSubscription';
import { TRACKING_WS_BASE_URL } from '../../config/tracking';
import { colors } from '../../theme/colors';
import type { CargoMapProps } from './types';

const DEFAULT_LAT = 55.7558;
const DEFAULT_LNG = 37.6173;

function buildMapHtml(lat: number, lng: number, deliveryAddress: string) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      html, body, #map { height: 100%; margin: 0; padding: 0; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const map = L.map('map').setView([${lat}, ${lng}], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);
      const marker = L.marker([${lat}, ${lng}]).addTo(map);
      marker.bindPopup(${JSON.stringify(deliveryAddress)}).openPopup();
      window.updatePosition = function(lat, lng) {
        marker.setLatLng([lat, lng]);
        map.panTo([lat, lng]);
      };
    </script>
  </body>
</html>`;
}

export default function CargoMap({
  cargoId,
  deliveryAddress,
  liveLocation,
  subscribe = true,
}: CargoMapProps) {
  const webViewRef = useRef<WebView>(null);
  const subscription = useCargoLocationSubscription(cargoId, { enabled: subscribe });
  const location = liveLocation ?? subscription.location;
  const connected = subscribe ? subscription.connected : Boolean(liveLocation);
  const error = subscribe ? subscription.error : null;

  const initialLat = location?.latitude ?? DEFAULT_LAT;
  const initialLng = location?.longitude ?? DEFAULT_LNG;
  const mapHtml = useMemo(
    () => buildMapHtml(initialLat, initialLng, deliveryAddress),
    [deliveryAddress, initialLat, initialLng],
  );

  useEffect(() => {
    if (!location || !webViewRef.current) {
      return;
    }

    webViewRef.current.injectJavaScript(
      `window.updatePosition(${location.latitude}, ${location.longitude}); true;`,
    );
  }, [location]);

  return (
    <View style={styles.wrap}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.map}
        javaScriptEnabled
        domStorageEnabled
      />

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Адрес доставки</Text>
        <Text style={styles.legendAddress}>{deliveryAddress}</Text>
        <Text style={styles.legendText}>
          {location
            ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
            : connected
              ? 'Ожидание GPS...'
              : 'Нет связи с tracking-сервисом'}
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
    backgroundColor: colors.background,
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
  },
  legendText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  legendError: {
    fontSize: 12,
    color: colors.error,
  },
});
