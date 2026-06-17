export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export const CATEGORIES = ['전체', '카페', '맛집', '술집', '기타'] as const;

export const COUNTRIES = [
  { label: '전체', value: '' },
  { label: '🇰🇷 국내', value: 'KR' },
  { label: '✈️ 해외', value: '' },
] as const;
