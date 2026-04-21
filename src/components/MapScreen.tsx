import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type MapScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Map'
>;

type MapScreenRouteProp = RouteProp<RootStackParamList, 'Map'>;

interface MapScreenProps {
  navigation: MapScreenNavigationProp;
  route: MapScreenRouteProp;
}

const MapScreen: React.FC<MapScreenProps> = ({ route, navigation }) => {
  const { location } = route.params;
  const [mapLoaded, setMapLoaded] = useState(false);

  // Generate HTML with Leaflet and OpenStreetMap (Free, no API key required)
  const generateMapHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          html, body, #map {
            height: 100%;
            margin: 0;
            padding: 0;
            background-color: #f0f0f0;
          }
          .custom-button {
            background-color: #1E88E5;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 25px;
            font-family: sans-serif;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
            cursor: pointer;
            pointer-events: auto;
          }
          .controls-container {
            position: fixed;
            bottom: 30px;
            left: 0;
            right: 0;
            display: flex;
            justify-content: center;
            gap: 10px;
            z-index: 1000;
            pointer-events: none;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="controls-container">
          <button class="custom-button" id="select-btn">Select This Location</button>
        </div>

        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          let map;
          let marker;
          let currentLat = ${location.latitude};
          let currentLng = ${location.longitude};

          function initMap() {
            // Initialize map
            map = L.map('map', {
              zoomControl: false
            }).setView([currentLat, currentLng], 15);

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Add zoom control to top-right
            L.control.zoom({
              position: 'topright'
            }).addTo(map);

            // Create draggable marker
            marker = L.marker([currentLat, currentLng], {
              draggable: true
            }).addTo(map);

            // Update position when marker is dragged
            marker.on('dragend', function(event) {
              const position = marker.getLatLng();
              currentLat = position.lat;
              currentLng = position.lng;
            });

            // Update marker on map click
            map.on('click', function(e) {
              const latlng = e.latlng;
              marker.setLatLng(latlng);
              currentLat = latlng.lat;
              currentLng = latlng.lng;
            });

            // Button listener
            document.getElementById('select-btn').addEventListener('click', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'locationSelected',
                lat: currentLat,
                lng: currentLng
              }));
            });
          }

          // Initialize on load
          window.onload = initMap;
        </script>
      </body>
      </html>
    `;
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'locationSelected') {
        Alert.alert(
          'Location Selected',
          `Latitude: ${data.lat.toFixed(6)}\nLongitude: ${data.lng.toFixed(6)}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.log('Error parsing WebView message:', error);
    }
  };

  return (
    <View style={styles.container}>
      {!mapLoaded && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}

      <WebView
        originWhitelist={['*']}
        source={{ html: generateMapHTML() }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleWebViewMessage}
        onLoadEnd={() => setMapLoaded(true)}
        style={[styles.webview, !mapLoaded && styles.hidden]}
        startInLoadingState={true}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
          Alert.alert('Map Error', 'Failed to load map. Please check your internet connection.');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  webview: {
    flex: 1,
  },
  hidden: {
    opacity: 0,
  },
});

export default MapScreen;