import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTripLocationSubscription } from '../../hooks/useTripLocationSubscription';
import { TRACKING_WS_BASE_URL } from '../../config/tracking';
import { colors } from '../../theme/colors';
import { getMockRouteForTrip } from './routeMock';
import type { TripMapProps } from './types';

function buildMapHtml(lat: number, lng: number, routeLabel: string) {
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
      marker.bindPopup(${JSON.stringify(routeLabel)}).openPopup();
      window.updatePosition = function(lat, lng) {
        marker.setLatLng([lat, lng]);
        map.panTo([lat, lng]);
      };
    </script>
  </body>
</html>`;
}

export default function TripMap({
  tripId,
  routeLabel,
  liveLocation,
  subscribe = true,
}: TripMapProps) {
  const webViewRef = useRef<WebView>(null);
  const subscription = useTripLocationSubscription(tripId, { enabled: subscribe });
  const location = liveLocation ?? subscription.location;
  const connected = subscribe ? subscription.connected : Boolean(liveLocation);
  const error = subscribe ? subscription.error : null;

  const route = useMemo(
    () => getMockRouteForTrip(tripId, routeLabel),
    [tripId, routeLabel],
  );

  const initialLat = location?.latitude ?? route.points[Math.floor(route.points.length / 2)][0];
  const initialLng = location?.longitude ?? route.points[Math.floor(route.points.length / 2)][1];
  const mapHtml = useMemo(
    () => buildMapHtml(initialLat, initialLng, routeLabel),
    [initialLat, initialLng, routeLabel],
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
  legendText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  legendError: {
    fontSize: 12,
    color: colors.error,
  },
});
