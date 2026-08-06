export const CLOUDINARY = {
  cloudName: 'dbt58u6ag',
  songImageBase: `https://res.cloudinary.com/dbt58u6ag/image/upload/v1740519430`,
  defaultAvatar: `https://res.cloudinary.com/dbt58u6ag/image/upload/v1786044748/266033_pc3rjp.png`,
  logo: `https://res.cloudinary.com/dbt58u6ag/image/upload/v1786032568/auralis_music_fug6as.png`,
} as const;

export function buildCloudinaryUrl(path: string | null | undefined, base: string = CLOUDINARY.songImageBase): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${base}/${path}`;
}

export interface GenreMeta {
  icon: string;
  gradient: string;
  accent: string;
}

export const GENRE_META: Record<string, GenreMeta> = {
  'reggaeton':   { icon: '🎤', gradient: 'linear-gradient(135deg,#7C3AED 0%,#4C1D95 100%)', accent: '#7C3AED' },
  'pop':         { icon: '🌟', gradient: 'linear-gradient(135deg,#DB2777 0%,#831843 100%)', accent: '#DB2777' },
  'r&b':         { icon: '🎷', gradient: 'linear-gradient(135deg,#DC2626 0%,#7F1D1D 100%)', accent: '#DC2626' },
  'hip-hop':     { icon: '🎧', gradient: 'linear-gradient(135deg,#D97706 0%,#78350F 100%)', accent: '#D97706' },
  'alternative': { icon: '🎸', gradient: 'linear-gradient(135deg,#059669 0%,#064E3B 100%)', accent: '#059669' },
  'indie':       { icon: '🎵', gradient: 'linear-gradient(135deg,#0284C7 0%,#0C4A6E 100%)', accent: '#0284C7' },
  'indie pop':   { icon: '🎵', gradient: 'linear-gradient(135deg,#0EA5E9 0%,#0C4A6E 100%)', accent: '#0EA5E9' },
  'latin urban': { icon: '🎺', gradient: 'linear-gradient(135deg,#B2A179 0%,#78683A 100%)', accent: '#B2A179' },
  'latin':       { icon: '🪘', gradient: 'linear-gradient(135deg,#F59E0B 0%,#92400E 100%)', accent: '#F59E0B' },
  'rock':        { icon: '🎸', gradient: 'linear-gradient(135deg,#6B7280 0%,#1F2937 100%)', accent: '#9CA3AF' },
  'electronic':  { icon: '⚡', gradient: 'linear-gradient(135deg,#6366F1 0%,#3730A3 100%)', accent: '#6366F1' },
  'dance':       { icon: '💃', gradient: 'linear-gradient(135deg,#06B6D4 0%,#0E7490 100%)', accent: '#06B6D4' },
  'trap':        { icon: '🔊', gradient: 'linear-gradient(135deg,#8B5CF6 0%,#4C1D95 100%)', accent: '#8B5CF6' },
  'soul':        { icon: '❤️', gradient: 'linear-gradient(135deg,#EF4444 0%,#7F1D1D 100%)', accent: '#EF4444' },
  'jazz':        { icon: '🎷', gradient: 'linear-gradient(135deg,#F59E0B 0%,#451A03 100%)', accent: '#F59E0B' },
  'classical':   { icon: '🎻', gradient: 'linear-gradient(135deg,#9CA3AF 0%,#111827 100%)', accent: '#9CA3AF' },
};

export const DEFAULT_GENRE_META: GenreMeta = {
  icon: '🎶',
  gradient: 'linear-gradient(135deg,#374151 0%,#111827 100%)',
  accent: '#9CA3AF',
};

export const ROUTES = {
  HOME: '/home',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  PLAYLIST: '/playlist',
  ARTIST: '/artist',
  GENRE: '/genre',
  SUBIR: '/subir',
  ADMIN_SOLICITUDES: '/admin/solicitudes',
  VERIFICAR_EMAIL: '/verificar-email',
  VERIFICAR: '/verificar',
  VERIFICACION_EXITOSA: '/verificacion-exitosa',
  SPOTIFY_SEARCH: '/spotify/search',
  SPOTIFY_IMPORT: '/spotify/import',
  SPOTIFY_CALLBACK: '/spotify/callback',
} as const;
