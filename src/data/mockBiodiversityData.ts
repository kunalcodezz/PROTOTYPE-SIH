/**
 * OceanVision 3D - Marine Biodiversity & In-Situ Species Observation Dataset
 * Spatially anchored marine animal observations with geographic coordinates (lat, lon) and authentic depth layers.
 */

export interface SpeciesObservation {
  id: string;
  species: 'Tuna' | 'Shark' | 'Dolphin' | 'Sea Turtle' | 'Manta Ray' | 'Jellyfish' | 'Whale' | 'Octopus';
  commonName: string;
  scientificName: string;
  latitude: number;
  longitude: number;
  depth: number; // meters
  count: number;
  status: string;
  velocity: number; // m/s
  diet: string;
  temperatureRange: string;
  timestamp: string;
  locationName: string;
  modelFile: string;
}

export const BIODIVERSITY_DATABASE: SpeciesObservation[] = [
  // 1. Bay of Bengal Observations
  {
    id: 'bob-tuna-01',
    species: 'Tuna',
    commonName: 'Yellowfin Tuna',
    scientificName: 'Thunnus albacares',
    latitude: 14.5,
    longitude: 88.5,
    depth: 250,
    count: 8,
    status: 'Active Feeding Aggregation',
    velocity: 1.8,
    diet: 'Pelagic forage fish, squid, crustacea',
    temperatureRange: '18°C – 28°C',
    timestamp: '27 Aug 2026, 14:32 UTC',
    locationName: 'Bay of Bengal Deep Thermocline Zone',
    modelFile: '/models/tuna.glb',
  },
  {
    id: 'bob-manta-02',
    species: 'Manta Ray',
    commonName: 'Giant Oceanic Manta',
    scientificName: 'Mobula birostris',
    latitude: 14.2,
    longitude: 88.7,
    depth: 120,
    count: 2,
    status: 'Plankton Filter Feeding',
    velocity: 0.9,
    diet: 'Zooplankton, fish larvae',
    temperatureRange: '20°C – 29°C',
    timestamp: '27 Aug 2026, 11:15 UTC',
    locationName: 'Andaman Basin Upwelling Ridge',
    modelFile: '/models/manta-ray.glb',
  },
  {
    id: 'bob-turtle-03',
    species: 'Sea Turtle',
    commonName: 'Olive Ridley Turtle',
    scientificName: 'Lepidochelys olivacea',
    latitude: 15.1,
    longitude: 88.2,
    depth: 80,
    count: 4,
    status: 'Pelagic Migration Corridor',
    velocity: 0.6,
    diet: 'Jellyfish, crustaceans, salps',
    temperatureRange: '22°C – 30°C',
    timestamp: '27 Aug 2026, 09:45 UTC',
    locationName: 'Odisha Coastal Transit Path',
    modelFile: '/models/sea-turtle.glb',
  },
  {
    id: 'bob-jelly-04',
    species: 'Jellyfish',
    commonName: 'Moon Jellyfish',
    scientificName: 'Aurelia aurita',
    latitude: 14.7,
    longitude: 88.9,
    depth: 160,
    count: 14,
    status: 'Drifting Mesopelagic Bloom',
    velocity: 0.3,
    diet: 'Microscopic plankton, molluscan larvae',
    temperatureRange: '12°C – 25°C',
    timestamp: '27 Aug 2026, 08:20 UTC',
    locationName: 'Central Bay Pycnocline Layer',
    modelFile: '/models/jellyfish.glb',
  },
  {
    id: 'bob-whale-05',
    species: 'Whale',
    commonName: "Bryde's Whale",
    scientificName: 'Balaenoptera edeni',
    latitude: 13.9,
    longitude: 88.1,
    depth: 550,
    count: 1,
    status: 'Deep Foraging Dive',
    velocity: 2.4,
    diet: 'Anchovies, sardines, pelagic krill',
    temperatureRange: '15°C – 26°C',
    timestamp: '27 Aug 2026, 06:10 UTC',
    locationName: 'Swatch of No Ground Deep Trench',
    modelFile: '/models/whale.glb',
  },

  // 2. Arabian Sea Observations
  {
    id: 'ars-shark-01',
    species: 'Shark',
    commonName: 'Silky Shark',
    scientificName: 'Carcharhinus falciformis',
    latitude: 16.0,
    longitude: 65.5,
    depth: 420,
    count: 3,
    status: 'Pelagic Thermocline Patrol',
    velocity: 1.6,
    diet: 'Cephalopods, tuna, pelagic crab',
    temperatureRange: '16°C – 27°C',
    timestamp: '27 Aug 2026, 13:50 UTC',
    locationName: 'Arabian Sea Central Basin',
    modelFile: '/models/shark.glb',
  },
  {
    id: 'ars-dolphin-02',
    species: 'Dolphin',
    commonName: 'Spinner Dolphin',
    scientificName: 'Stenella longirostris',
    latitude: 16.3,
    longitude: 65.9,
    depth: 45,
    count: 12,
    status: 'Surfacing Pod / Socializing',
    velocity: 3.2,
    diet: 'Small mesopelagic fish, lanternfish',
    temperatureRange: '24°C – 30°C',
    timestamp: '27 Aug 2026, 15:10 UTC',
    locationName: 'Konkan-Lakshadweep Boundary',
    modelFile: '/models/dolphin.glb',
  },
  {
    id: 'ars-octopus-03',
    species: 'Octopus',
    commonName: 'Pelagic Argonaut / Deep Octopus',
    scientificName: 'Grimpoteuthis sp.',
    latitude: 15.8,
    longitude: 65.2,
    depth: 1100,
    count: 1,
    status: 'Abyssal Benthic Drift',
    velocity: 0.4,
    diet: 'Deep sea polychaetes, isopods',
    temperatureRange: '4°C – 9°C',
    timestamp: '27 Aug 2026, 04:30 UTC',
    locationName: 'Carlsberg Ridge Fracture Zone',
    modelFile: '/models/octopus.glb',
  },
];

/**
 * Retrieves spatially anchored biodiversity observations near coordinates
 */
export function getSpeciesObservationsNear(lat: number, lon: number, radiusDeg: number = 8.0): SpeciesObservation[] {
  return BIODIVERSITY_DATABASE.filter((obs) => {
    const dLat = Math.abs(obs.latitude - lat);
    const dLon = Math.abs(obs.longitude - lon);
    return dLat <= radiusDeg && dLon <= radiusDeg;
  });
}
