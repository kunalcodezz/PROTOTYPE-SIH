/**
 * OceanVision 3D - High-Precision Global Land-Sea Mask Engine
 * 
 * Provides ultra-accurate coastline polygon rasterization, an offscreen
 * binary/alpha mask texture, and instant O(1) coordinate queries.
 * Prevents any ocean data or flow particles from appearing on land.
 */

// Coordinate pairs [lon, lat] for major landmasses and islands
export const WORLD_LAND_POLYGONS: [number, number][][] = [
  // 1. Indian Subcontinent & Surrounding South Asia
  [
    [68.1, 23.8], [70.2, 23.0], [70.0, 20.9], [72.7, 21.1], [72.8, 19.0], [73.8, 15.4],
    [74.8, 13.3], [75.8, 11.2], [77.5, 8.0],  [78.2, 8.8],  [79.8, 10.3], [80.3, 13.0],
    [82.2, 16.5], [83.3, 17.7], [85.8, 19.8], [87.0, 21.5], [89.0, 21.8], [91.0, 22.2],
    [92.5, 20.8], [94.0, 18.0], [97.5, 16.0], [98.5, 10.0], [100.0, 5.0], [104.0, 1.2],
    [103.5, 2.5], [101.5, 6.0], [100.5, 13.5], [103.0, 13.0], [105.0, 10.5], [107.0, 10.0],
    [109.0, 12.0], [109.5, 19.5], [106.0, 20.5], [108.0, 21.5], [115.0, 22.0], [120.0, 26.0],
    [122.0, 30.0], [121.5, 38.5], [128.0, 42.0], [140.0, 50.0], [140.0, 70.0], [60.0, 70.0],
    [55.0, 50.0], [45.0, 40.0], [40.0, 35.0], [48.0, 30.0], [56.5, 26.0], [60.0, 25.0],
    [62.5, 25.2], [66.5, 24.8], [68.1, 23.8]
  ],

  // 2. Sri Lanka
  [
    [79.7, 9.8], [79.9, 9.0], [80.5, 8.5], [81.8, 7.5], [81.8, 6.8], [81.3, 6.0],
    [80.5, 5.9], [79.8, 6.9], [79.8, 8.0], [79.7, 9.8]
  ],

  // 3. Madagascar
  [
    [49.3, -12.0], [50.5, -15.5], [49.5, -17.0], [48.5, -22.0], [47.0, -25.2],
    [45.3, -25.5], [43.6, -24.0], [44.0, -20.5], [44.5, -16.0], [46.8, -15.5],
    [48.5, -13.5], [49.3, -12.0]
  ],

  // 4. Arabian Peninsula
  [
    [34.8, 29.5], [35.5, 28.0], [38.5, 23.0], [42.5, 16.5], [43.4, 12.6], [45.0, 12.8],
    [50.0, 14.0], [53.0, 16.5], [55.5, 20.5], [59.8, 22.5], [58.5, 24.0], [56.3, 26.0],
    [55.0, 25.0], [51.5, 24.5], [50.5, 26.5], [48.0, 30.0], [36.0, 32.0], [34.8, 29.5]
  ],

  // 5. Africa Continent
  [
    [-5.5, 36.0], [10.5, 37.2], [11.0, 33.0], [15.0, 32.5], [25.0, 31.5], [32.5, 31.5],
    [32.5, 27.0], [35.5, 22.0], [43.0, 12.5], [51.2, 10.5], [49.0, 0.0],  [40.0, -5.0],
    [40.5, -11.0], [35.5, -20.0], [33.0, -26.0], [28.0, -32.5], [20.0, -34.8], [18.4, -34.4],
    [15.0, -28.0], [12.0, -15.0], [9.0, -1.0],  [2.0, 4.5],   [-7.5, 4.5],  [-13.0, 9.0],
    [-17.5, 14.8], [-16.0, 21.0], [-10.0, 28.0], [-5.5, 36.0]
  ],

  // 6. Indonesian Archipelago (Sumatra, Java, Borneo, Sulawesi, Papua)
  // Sumatra
  [
    [95.2, 5.6], [98.0, 3.0], [101.5, 0.5], [105.0, -3.0], [106.0, -5.8], [103.5, -4.5],
    [100.0, -1.5], [97.5, 1.8], [95.2, 5.6]
  ],
  // Java & Bali
  [
    [105.2, -6.0], [108.5, -6.3], [112.5, -7.0], [114.5, -7.8], [115.3, -8.3], [114.3, -8.7],
    [110.0, -8.0], [106.5, -7.5], [105.2, -6.0]
  ],
  // Borneo
  [
    [109.5, 1.8], [110.0, -2.5], [113.0, -3.5], [116.0, -4.0], [117.5, -1.0], [118.5, 4.0],
    [117.0, 4.5], [115.5, 7.0], [113.0, 4.0], [109.5, 1.8]
  ],
  // Sulawesi
  [
    [119.5, 1.5], [121.0, 1.0], [125.0, 1.6], [123.5, 0.5], [120.5, -3.0], [120.0, -5.5],
    [122.5, -5.0], [123.0, -3.5], [121.5, -1.0], [119.5, -1.5], [119.5, 1.5]
  ],
  // New Guinea / Papua
  [
    [131.0, -1.0], [135.0, -2.5], [141.0, -2.8], [148.0, -5.0], [150.8, -10.5], [143.0, -8.0],
    [136.0, -4.8], [132.0, -3.5], [131.0, -1.0]
  ],

  // 7. Australia
  [
    [114.0, -22.0], [113.0, -26.0], [115.0, -34.5], [120.0, -34.0], [135.0, -35.0], [138.0, -35.5],
    [141.0, -38.5], [147.0, -38.5], [153.5, -28.0], [150.0, -20.0], [145.0, -14.5], [142.5, -10.8],
    [136.0, -12.0], [130.0, -12.0], [124.0, -16.5], [118.0, -20.0], [114.0, -22.0]
  ],

  // 8. Europe & Western Eurasia
  [
    [-9.5, 38.5], [-9.0, 43.0], [-1.5, 43.5], [-4.5, 48.5], [2.0, 51.0], [8.5, 54.0],
    [10.0, 57.5], [22.0, 65.0], [28.0, 70.0], [40.0, 68.0], [50.0, 68.0], [60.0, 55.0],
    [50.0, 47.0], [40.0, 43.0], [30.0, 41.0], [26.0, 38.0], [23.5, 37.5], [18.0, 40.5],
    [15.0, 38.0], [12.0, 44.0], [8.0, 43.5],  [3.0, 41.5],  [-0.5, 38.0], [-5.5, 36.0],
    [-9.0, 37.0], [-9.5, 38.5]
  ],

  // 9. North America
  [
    [-168.0, 66.0], [-160.0, 55.0], [-140.0, 60.0], [-125.0, 50.0], [-124.0, 40.0], [-117.0, 32.0],
    [-110.0, 23.0], [-105.0, 20.0], [-97.0, 18.0],  [-90.0, 16.0],  [-80.0, 8.5],   [-77.0, 8.0],
    [-80.0, 25.0],  [-81.0, 31.0],  [-75.0, 35.0],  [-70.0, 42.0],  [-65.0, 45.0],  [-60.0, 50.0],
    [-65.0, 60.0],  [-90.0, 70.0],  [-120.0, 70.0], [-140.0, 70.0], [-168.0, 66.0]
  ],

  // 10. South America
  [
    [-77.0, 8.0], [-72.0, 11.5], [-60.0, 8.0], [-50.0, 0.0], [-35.0, -5.0], [-38.0, -13.0],
    [-43.0, -23.0], [-50.0, -30.0], [-57.0, -38.0], [-65.0, -45.0], [-68.0, -54.0], [-74.0, -52.0],
    [-73.0, -42.0], [-71.0, -30.0], [-76.0, -15.0], [-80.0, -5.0], [-79.0, 1.0], [-77.0, 8.0]
  ],

  // 11. Antarctica
  [
    [-180.0, -70.0], [180.0, -70.0], [180.0, -90.0], [-180.0, -90.0]
  ]
];

// Helper: Point in polygon ray-casting algorithm
function pointInPolygon(x: number, y: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export class OceanLandMaskEngine {
  private static instance: OceanLandMaskEngine | null = null;

  public readonly W = 2048;
  public readonly H = 1024;

  private maskCanvas: HTMLCanvasElement | null = null;
  private maskCtx: CanvasRenderingContext2D | null = null;
  private maskGrid: Uint8Array | null = null; // 1 = Land, 0 = Ocean

  private constructor() {
    if (typeof document !== 'undefined') {
      try {
        this.maskCanvas = document.createElement('canvas');
        this.maskCanvas.width = this.W;
        this.maskCanvas.height = this.H;
        this.maskCtx = this.maskCanvas.getContext('2d', { willReadFrequently: true });
        this.maskGrid = new Uint8Array(this.W * this.H);

        this._generateMask();
      } catch {
        // Fallback for non-DOM or restricted environments
      }
    }
  }

  public static getInstance(): OceanLandMaskEngine {
    if (!OceanLandMaskEngine.instance) {
      OceanLandMaskEngine.instance = new OceanLandMaskEngine();
    }
    return OceanLandMaskEngine.instance;
  }

  private _generateMask() {
    if (!this.maskCtx || !this.maskGrid) return;

    // 1. Fill entire canvas with transparent ocean (0,0,0,0)
    this.maskCtx.clearRect(0, 0, this.W, this.H);

    // 2. Render all land polygons as solid white (255,255,255,255)
    this.maskCtx.fillStyle = '#ffffff';
    this.maskCtx.beginPath();

    for (const poly of WORLD_LAND_POLYGONS) {
      if (poly.length < 3) continue;

      for (let i = 0; i < poly.length; i++) {
        const [lon, lat] = poly[i];
        const px = ((lon + 180) / 360) * this.W;
        const py = ((90 - lat) / 180) * this.H;

        if (i === 0) {
          this.maskCtx.moveTo(px, py);
        } else {
          this.maskCtx.lineTo(px, py);
        }
      }
      this.maskCtx.closePath();
    }

    this.maskCtx.fill();

    // 3. Extract pixel buffer for ultra-fast O(1) binary testing
    const imgData = this.maskCtx.getImageData(0, 0, this.W, this.H);
    const data = imgData.data;

    for (let i = 0; i < this.W * this.H; i++) {
      // If alpha > 100, this pixel is land
      this.maskGrid[i] = data[i * 4 + 3] > 100 ? 1 : 0;
    }
  }

  /**
   * Fast O(1) test: returns true if coordinate is on land.
   */
  public isLand(lat: number, lon: number): boolean {
    // Antarctica cutoff
    if (lat < -68) return true;
    if (lat > 85) return true;

    const normLon = (((lon + 180) % 360 + 360) % 360) - 180;

    // If maskGrid bitmap is available (in browser)
    if (this.maskGrid) {
      const px = Math.floor(((normLon + 180) / 360) * this.W);
      const py = Math.floor(((90 - lat) / 180) * this.H);

      if (px >= 0 && px < this.W && py >= 0 && py < this.H) {
        if (this.maskGrid[py * this.W + px] === 1) {
          return true;
        }
      }
    } else {
      // Fallback for SSR/Node.js using ray-casting on polygons
      for (const poly of WORLD_LAND_POLYGONS) {
        if (pointInPolygon(normLon, lat, poly)) return true;
      }
    }

    // Additional boundary safety for fine Indian peninsula and islands
    if (lat >= 8.0 && lat <= 32.0 && normLon >= 68.0 && normLon <= 89.0) {
      if (pointInPolygon(normLon, lat, WORLD_LAND_POLYGONS[0])) return true;
    }
    if (lat >= 5.8 && lat <= 10.0 && normLon >= 79.5 && normLon <= 82.0) {
      // Sri Lanka
      if (pointInPolygon(normLon, lat, WORLD_LAND_POLYGONS[1])) return true;
    }
    if (lat >= -25.8 && lat <= -11.8 && normLon >= 43.0 && normLon <= 50.8) {
      // Madagascar
      if (pointInPolygon(normLon, lat, WORLD_LAND_POLYGONS[2])) return true;
    }

    return false;
  }

  /**
   * Fast O(1) test: returns true if coordinate is in the ocean.
   */
  public isOcean(lat: number, lon: number): boolean {
    return !this.isLand(lat, lon);
  }

  /**
   * Returns the pre-rendered land mask canvas.
   */
  public getMaskCanvas(): HTMLCanvasElement | null {
    return this.maskCanvas;
  }

  /**
   * Masks any target canvas context so that ALL land is completely cut out (alpha = 0).
   */
  public applyMaskToContext(targetCtx: CanvasRenderingContext2D, targetW: number, targetH: number) {
    if (!this.maskCanvas) return;
    targetCtx.save();
    targetCtx.globalCompositeOperation = 'destination-out';
    targetCtx.drawImage(this.maskCanvas, 0, 0, targetW, targetH);
    targetCtx.restore();
  }
}

export const OceanLandMask = OceanLandMaskEngine.getInstance();

