/**
 * OceanVision 3D - Ocean Regions Dataset & Spatial Detection
 * Defines major ocean basins, marginal seas, camera viewpoints, and spatial bounding boxes.
 */

export interface OceanRegion {
  id: string;
  name: string;
  parentName: string;
  breadcrumb: string[]; // e.g. ['EARTH', 'INDIAN OCEAN', 'ARABIAN SEA']
  center: { lat: number; lon: number };
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number };
  camera: {
    altitude: number;      // in meters (e.g. 2,200,000 for sea, 6,500,000 for ocean)
    heading: number;       // in degrees
    pitch: number;         // in degrees (e.g. -52° tilt for cinematic 3D perspective)
    roll: number;
    underwaterAlt?: number;// in meters for underwater view (e.g. 80,000)
    underwaterPitch?: number; // e.g. -25°
  };
  stats: {
    avgTemp: number;
    avgSalinity: number;
    maxDepth: number; // in meters
    primaryCurrent: string;
    description: string;
  };
  dominantColor: string;
}

export const OCEAN_REGIONS: OceanRegion[] = [
  {
    id: 'arabian-sea',
    name: 'ARABIAN SEA',
    parentName: 'Indian Ocean',
    breadcrumb: ['EARTH', 'INDIAN OCEAN', 'ARABIAN SEA'],
    center: { lat: 16.5, lon: 65.0 },
    bounds: { minLat: 8.0, maxLat: 26.0, minLon: 50.0, maxLon: 78.0 },
    camera: {
      altitude: 2100000,
      heading: 18,
      pitch: -52,
      roll: 0,
      underwaterAlt: 95000,
      underwaterPitch: -22,
    },
    stats: {
      avgTemp: 28.6,
      avgSalinity: 36.5,
      maxDepth: 4652,
      primaryCurrent: 'Somali Current & West India Coastal Current',
      description: 'High-salinity, monsoon-driven basin with rich upwelling zones and deep oxygen minimum zones (OMZ).',
    },
    dominantColor: '#0284c7',
  },
  {
    id: 'bay-of-bengal',
    name: 'BAY OF BENGAL',
    parentName: 'Indian Ocean',
    breadcrumb: ['EARTH', 'INDIAN OCEAN', 'BAY OF BENGAL'],
    center: { lat: 15.0, lon: 88.5 },
    bounds: { minLat: 5.0, maxLat: 23.0, minLon: 80.0, maxLon: 98.0 },
    camera: {
      altitude: 2300000,
      heading: 352,
      pitch: -54,
      roll: 0,
      underwaterAlt: 100000,
      underwaterPitch: -25,
    },
    stats: {
      avgTemp: 29.2,
      avgSalinity: 33.2,
      maxDepth: 4694,
      primaryCurrent: 'East India Coastal Current (EICC)',
      description: 'Low-salinity surface layer due to massive Ganges-Brahmaputra river discharge; high tropical cyclone activity.',
    },
    dominantColor: '#0ea5e9',
  },
  {
    id: 'indian-ocean',
    name: 'INDIAN OCEAN',
    parentName: 'Global Ocean',
    breadcrumb: ['EARTH', 'INDIAN OCEAN'],
    center: { lat: -8.0, lon: 77.0 },
    bounds: { minLat: -45.0, maxLat: 25.0, minLon: 35.0, maxLon: 115.0 },
    camera: {
      altitude: 6800000,
      heading: 5,
      pitch: -65,
      roll: 0,
      underwaterAlt: 250000,
      underwaterPitch: -30,
    },
    stats: {
      avgTemp: 26.8,
      avgSalinity: 35.2,
      maxDepth: 7290,
      primaryCurrent: 'South Equatorial Current & Agulhas Current',
      description: 'Third-largest ocean basin; major regulator of the Asian monsoon and global heat transport.',
    },
    dominantColor: '#06b6d4',
  },
  {
    id: 'pacific-ocean',
    name: 'PACIFIC OCEAN',
    parentName: 'Global Ocean',
    breadcrumb: ['EARTH', 'PACIFIC OCEAN'],
    center: { lat: 5.0, lon: -160.0 },
    bounds: { minLat: -55.0, maxLat: 55.0, minLon: -180.0, maxLon: -75.0 },
    camera: {
      altitude: 9500000,
      heading: 0,
      pitch: -70,
      roll: 0,
      underwaterAlt: 350000,
      underwaterPitch: -32,
    },
    stats: {
      avgTemp: 24.1,
      avgSalinity: 34.8,
      maxDepth: 10994,
      primaryCurrent: 'Kuroshio, California Current & Equatorial Countercurrent',
      description: 'The largest and deepest oceanic division on Earth, spanning from the Arctic to the Southern Ocean.',
    },
    dominantColor: '#3b82f6',
  },
  {
    id: 'atlantic-ocean',
    name: 'ATLANTIC OCEAN',
    parentName: 'Global Ocean',
    breadcrumb: ['EARTH', 'ATLANTIC OCEAN'],
    center: { lat: 18.0, lon: -38.0 },
    bounds: { minLat: -50.0, maxLat: 60.0, minLon: -75.0, maxLon: 15.0 },
    camera: {
      altitude: 8200000,
      heading: 345,
      pitch: -68,
      roll: 0,
      underwaterAlt: 300000,
      underwaterPitch: -30,
    },
    stats: {
      avgTemp: 22.4,
      avgSalinity: 35.6,
      maxDepth: 8376,
      primaryCurrent: 'Gulf Stream & North Atlantic Drift (AMOC)',
      description: 'Crucial driver of Atlantic Meridional Overturning Circulation, transporting warm equatorial waters poleward.',
    },
    dominantColor: '#6366f1',
  },
  {
    id: 'southern-ocean',
    name: 'SOUTHERN OCEAN',
    parentName: 'Global Ocean',
    breadcrumb: ['EARTH', 'SOUTHERN OCEAN'],
    center: { lat: -62.0, lon: 70.0 },
    bounds: { minLat: -75.0, maxLat: -50.0, minLon: -180.0, maxLon: 180.0 },
    camera: {
      altitude: 6500000,
      heading: 0,
      pitch: -62,
      roll: 0,
      underwaterAlt: 220000,
      underwaterPitch: -28,
    },
    stats: {
      avgTemp: 2.1,
      avgSalinity: 34.2,
      maxDepth: 7434,
      primaryCurrent: 'Antarctic Circumpolar Current (ACC)',
      description: 'The mightiest ocean current system, encircling Antarctica without land blockage and absorbing immense heat.',
    },
    dominantColor: '#38bdf8',
  },
  {
    id: 'mediterranean-sea',
    name: 'MEDITERRANEAN SEA',
    parentName: 'Atlantic Basin',
    breadcrumb: ['EARTH', 'ATLANTIC BASIN', 'MEDITERRANEAN SEA'],
    center: { lat: 35.8, lon: 18.2 },
    bounds: { minLat: 30.0, maxLat: 46.0, minLon: -5.0, maxLon: 36.0 },
    camera: {
      altitude: 1950000,
      heading: 14,
      pitch: -48,
      roll: 0,
      underwaterAlt: 85000,
      underwaterPitch: -20,
    },
    stats: {
      avgTemp: 23.8,
      avgSalinity: 38.6,
      maxDepth: 5267,
      primaryCurrent: 'Algerian Current & Levantine Intermediate Flow',
      description: 'Semi-enclosed basin with rapid evaporation, high salinity, and intermediate water mass formation.',
    },
    dominantColor: '#0284c7',
  },
  {
    id: 'coral-sea',
    name: 'CORAL SEA',
    parentName: 'Pacific Ocean',
    breadcrumb: ['EARTH', 'PACIFIC OCEAN', 'CORAL SEA'],
    center: { lat: -17.5, lon: 153.0 },
    bounds: { minLat: -28.0, maxLat: -10.0, minLon: 142.0, maxLon: 165.0 },
    camera: {
      altitude: 2400000,
      heading: 25,
      pitch: -52,
      roll: 0,
      underwaterAlt: 90000,
      underwaterPitch: -24,
    },
    stats: {
      avgTemp: 27.5,
      avgSalinity: 35.4,
      maxDepth: 9140,
      primaryCurrent: 'East Australian Current (EAC)',
      description: 'Marginal sea hosting the Great Barrier Reef; rich marine biodiversity and strong boundary currents.',
    },
    dominantColor: '#14b8a6',
  },
];

/**
 * Detect matching ocean region by coordinates (prioritizing specific marginal seas over broad oceans)
 */
export function detectOceanRegion(lat: number, lon: number): OceanRegion | null {
  // Normalize lon to -180 .. 180
  let normLon = lon;
  while (normLon > 180) normLon -= 360;
  while (normLon < -180) normLon += 360;

  // 1. Check small/marginal seas first (Arabian Sea, Bay of Bengal, Med, Coral Sea)
  const marginalSeas = OCEAN_REGIONS.filter(
    (r) => r.id !== 'indian-ocean' && r.id !== 'pacific-ocean' && r.id !== 'atlantic-ocean' && r.id !== 'southern-ocean'
  );

  for (const sea of marginalSeas) {
    if (
      lat >= sea.bounds.minLat &&
      lat <= sea.bounds.maxLat &&
      normLon >= sea.bounds.minLon &&
      normLon <= sea.bounds.maxLon
    ) {
      return sea;
    }
  }

  // 2. Check major oceans
  if (lat <= -50.0) {
    return OCEAN_REGIONS.find((r) => r.id === 'southern-ocean') || null;
  }

  if (lat >= -45.0 && lat <= 30.0 && normLon >= 35.0 && normLon <= 115.0) {
    return OCEAN_REGIONS.find((r) => r.id === 'indian-ocean') || null;
  }

  if ((normLon >= 115.0 && normLon <= 180.0) || (normLon >= -180.0 && normLon <= -70.0)) {
    return OCEAN_REGIONS.find((r) => r.id === 'pacific-ocean') || null;
  }

  if (normLon >= -75.0 && normLon <= 25.0) {
    return OCEAN_REGIONS.find((r) => r.id === 'atlantic-ocean') || null;
  }

  return null;
}
