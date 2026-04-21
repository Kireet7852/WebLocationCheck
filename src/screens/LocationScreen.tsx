import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
} from 'react-native';
import GetLocation from 'react-native-get-location';
import { isLocationEnabled, promptForEnableLocationIfNeeded } from 'react-native-android-location-enabler';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

interface Location {
  latitude: number;
  longitude: number;
  timestamp?: number;
}

type LocationScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

interface LocationScreenProps {
  navigation: LocationScreenNavigationProp;
}

const LocationScreen: React.FC<LocationScreenProps> = ({ navigation }) => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [savedLocations, setSavedLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Load saved locations from storage (mock implementation)
    const mockSavedLocations: Location[] = [
      { latitude: 37.7749, longitude: -122.4194, timestamp: Date.now() - 3600000 }, // San Francisco
      { latitude: 40.7128, longitude: -74.0060, timestamp: Date.now() - 7200000 },  // New York
    ];
    setSavedLocations(mockSavedLocations);
  }, []);

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);

        return (
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    setErrorMsg(null);

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setErrorMsg('Location permission denied');
      setLoading(false);
      Alert.alert('Permission Denied', 'Cannot access location without permission.');
      return;
    }

    // Use location enabler for Android to show the "Google Maps" style prompt
    if (Platform.OS === 'android') {
      try {
        const enable = await isLocationEnabled();
        console.log('####Location enabled: ', enable);
        await promptForEnableLocationIfNeeded({
          interval: 500,
          // fastInterval: 5000,
        });
      } catch (error: any) {
        setErrorMsg('Location services not enabled');
        setLoading(false);
        return;
      }
    }

    GetLocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 30000,
    })
      .then(location => {
        const { latitude, longitude, time } = location;
        const locationData: Location = {
          latitude,
          longitude,
          timestamp: time,
        };
        setCurrentLocation(locationData);
        setLoading(false);
      })
      .catch(error => {
        console.log('GetLocation high accuracy failed, trying fast fallback:', error);
        
        // Instant fallback to network location
        GetLocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 10000,
        })
          .then(location => {
            const { latitude, longitude, time } = location;
            const locationData: Location = {
              latitude,
              longitude,
              timestamp: time,
            };
            setCurrentLocation(locationData);
            setLoading(false);
          })
          .catch(lowAccError => {
            setErrorMsg(`Error: ${lowAccError.message}`);
            setLoading(false);
            Alert.alert('Location Error', 'Could not retrieve location. Please ensure you are not in a basement or shielded area.');
          });
      });
  };

  const saveCurrentLocation = () => {
    if (currentLocation) {
      setSavedLocations(prev => [...prev, currentLocation]);
      Alert.alert('Success', 'Location saved successfully!');
    }
  };

  const viewOnMap = (location: Location) => {
    navigation.navigate('Map', { location });
  };

  const openWebCheck = () => {
    navigation.navigate('Browser', { url: 'https://www.gps-coordinates.net/' });
  };

  const formatLocation = (location: Location): string => {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  };

  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Location Services</Text>

      {/* Current Location Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Current Location</Text>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#1E88E5" />
            <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        ) : errorMsg ? (
          <Text style={styles.errorText}>{errorMsg}</Text>
        ) : currentLocation ? (
          <View>
            <Text style={styles.coordinates}>
              {formatLocation(currentLocation)}
            </Text>
            <Text style={styles.timestamp}>
              Last updated: {formatDate(currentLocation.timestamp)}
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={saveCurrentLocation}>
                <Text style={styles.secondaryButtonText}>Save Location</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: '#FF9800' }]}
                onPress={() => viewOnMap(currentLocation)}
              >
                <Text style={styles.secondaryButtonText}>View on Map</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={styles.placeholderText}>
            No location data yet. Tap "Get Location" to retrieve your current position.
          </Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={getCurrentLocation}>
          <Text style={styles.primaryButtonText}>
            {currentLocation ? 'Refresh Location' : 'Get Current Location'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: '#673AB7', marginTop: 15 }]} 
          onPress={openWebCheck}
        >
          <Text style={styles.primaryButtonText}>Open Web Location Check</Text>
        </TouchableOpacity>
      </View>

      {/* Saved Locations */}
      {savedLocations.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Saved Locations</Text>
          {savedLocations.map((location, index) => (
            <TouchableOpacity
              key={index}
              style={styles.savedLocationItem}
              onPress={() => viewOnMap(location)}
            >
              <Text style={styles.savedLocationCoords}>
                {formatLocation(location)}
              </Text>
              <Text style={styles.savedLocationTime}>
                {formatDate(location.timestamp)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Features List */}
      <View style={styles.featuresCard}>
        <Text style={styles.featuresTitle}>Features:</Text>
        <View style={styles.featureItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.featureText}>Real-time GPS location tracking</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.featureText}>Interactive Google Maps integration</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.featureText}>Location saving and history</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.featureText}>High accuracy positioning</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.featureText}>Cross-platform compatibility</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  centered: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    color: '#f44336',
    fontSize: 16,
    textAlign: 'center',
    padding: 10,
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  coordinates: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 10,
    color: '#1E88E5',
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 5,
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  savedLocationItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  savedLocationCoords: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  savedLocationTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 3,
  },
  featuresCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bullet: {
    fontSize: 16,
    marginRight: 10,
    color: '#1E88E5',
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
});

export default LocationScreen;