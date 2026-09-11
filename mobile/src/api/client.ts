import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Default base URL depending on platform / environment
const DEFAULT_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:5005', // Android Emulator Host Loopback
  ios: 'http://localhost:5005',     // iOS Simulator
  default: 'http://localhost:5005'
});

export const api = axios.create({
  baseURL: DEFAULT_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set custom Base URL (e.g. LAN IP or Vercel production)
export const setApiBaseUrl = async (url: string) => {
  api.defaults.baseURL = url;
  await AsyncStorage.setItem('custom_api_url', url);
};

// Initialize saved Base URL
AsyncStorage.getItem('custom_api_url').then((savedUrl) => {
  if (savedUrl) {
    api.defaults.baseURL = savedUrl;
  }
});

// Attach JWT token automatically to every outgoing request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response error handler
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Network request failed';
    return Promise.reject(new Error(message));
  }
);
