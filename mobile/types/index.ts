export interface MapData {
  address: string;
  category: string;
  rating_info: string | null;
  source: string;
  lat: number;
  lng: number;
}

export interface Place {
  id: string;
  restaurant_name: string;
  region: string;
  country: string;
  insta_summary: string | null;
  instagram_url: string | null;
  thumbnail_url: string | null;
  map_data: MapData;
}

export interface SearchParams {
  region?: string;
  category?: string;
  country?: string;
}
