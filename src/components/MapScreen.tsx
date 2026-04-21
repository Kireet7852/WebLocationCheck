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

  // Generate HTML with Google Maps JavaScript API
  const generateMapHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          html, body, #map {
            height: 100%;
            margin: 0;
            padding: 0;
          }
          #controls {
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 100;
            background: white;
            padding: 10px;
            border-radius: 5px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          }
          button {
            background-color: #4285f4;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 14px;
            margin: 5px;
          }
          button:hover {
            background-color: #3367d6;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div id="controls">
          <button id="select-btn">Select Location</button>
          <button id="current-location">Current Location</button>
        </div>

        <script>
          let map;
          let marker;
          let currentLat = ${location.latitude};
          let currentLng = ${location.longitude};

          function initMap() {
            const initialLocation = { lat: currentLat, lng: currentLng };

            map = new google.maps.Map(document.getElementById('map'), {
              zoom: 15,
              center: initialLocation,
              mapTypeId: google.maps.MapTypeId.ROADMAP
            });

            // Add marker at initial location
            marker = new google.maps.Marker({
              position: initialLocation,
              map: map,
              draggable: true,
              title: 'Selected Location'
            });

            // Update marker position when dragged
            marker.addListener('dragend', function() {
              const position = marker.getPosition();
              currentLat = position.lat();
              currentLng = position.lng();
            });

            // Add click listener to map to place marker
            map.addListener('click', function(event) {
              placeMarker(event.latLng);
            });

            // Setup button listeners
            document.getElementById('select-btn').addEventListener('click', function() {
              // Send selected location back to app
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'locationSelected',
                lat: currentLat,
                lng: currentLng
              }));
            });

            document.getElementById('current-location').addEventListener('click', function() {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                  const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                  };

                  map.setCenter(pos);
                  placeMarker(pos);
                  currentLat = pos.lat;
                  currentLng = pos.lng;
                }, function() {
                  alert('Error: The Geolocation service failed.');
                });
              } else {
                alert('Error: Your browser doesn\'t support geolocation.');
              }
            });
          }

          function placeMarker(location) {
            if (marker) {
              marker.setPosition(location);
            } else {
              marker = new google.maps.Marker({
                position: location,
                map: map,
                draggable: true
              });

              marker.addListener('dragend', function() {
                const position = marker.getPosition();
                currentLat = position.lat();
                currentLng = position.lng();
              });
            }
            currentLat = location.lat();
            currentLng = location.lng();
          }

          // Fallback if Google Maps API fails to load
          setTimeout(function() {
            if (typeof google === 'undefined') {
              document.body.innerHTML = '<div style="padding:20px;font-family:sans-serif;"><h2>Unable to load Google Maps</h2><p>Please check your internet connection and try again.</p></div>';
            }
          }, 5000);
        </script>

        <script async defer
          src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBdVl-C6K9xwVuOWXCvZnJvYYyP0dF_wRQ&callback=initMap">
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