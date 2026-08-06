export const CLOUDINARY = {
  cloudName: 'dbt58u6ag',
  songImageBase: `https://res.cloudinary.com/dbt58u6ag/image/upload/v1740519430`,
  defaultAvatar: `https://res.cloudinary.com/dbt58u6ag/image/upload/v1740604204/uploads/afo3nyrvyhmn330lq0np.webp`,
  logo: `https://res.cloudinary.com/dbt58u6ag/image/upload/v1740601259/uploads/zwutfwchdyr0qxo0b9vv.png`,
} as const;

export function buildCloudinaryUrl(path: string | null | undefined, base: string = CLOUDINARY.songImageBase): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${base}/${path}`;
}
