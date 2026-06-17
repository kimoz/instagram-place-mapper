import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { Place } from '../types';

const client = axios.create({ baseURL: API_BASE_URL, timeout: 10000 });

export async function searchPlaces(params: {
  region?: string;
  category?: string;
  country?: string;
}): Promise<Place[]> {
  const { data } = await client.get('/api/places/search', { params });
  if (!data.success) return [];
  return data.data as Place[];
}

export async function getTrendingPlaces(): Promise<Place[]> {
  const { data } = await client.get('/api/places/trending');
  if (!data.success) return [];
  return data.data as Place[];
}

export async function getPlace(id: string): Promise<Place> {
  const { data } = await client.get(`/api/places/${id}`);
  return data as Place;
}
