import * as THREE from "three";

// Simplified accurate polygonal coordinates for world continents [lon, lat] (-180 to 180, -90 to 90)
const CONTINENT_POLYGONS: [number, number][][] = [
  // North America & Canada & Alaska
  [
    [-168, 65], [-160, 71], [-140, 70], [-125, 69], [-85, 70], [-80, 62],
    [-65, 58], [-55, 52], [-60, 44], [-70, 42], [-75, 35], [-80, 25],
    [-82, 23], [-90, 30], [-97, 26], [-97, 20], [-105, 20], [-105, 25],
    [-115, 30], [-120, 35], [-124, 40], [-125, 49], [-135, 57], [-150, 60],
    [-165, 60], [-168, 65]
  ],
  // Greenland
  [
    [-45, 60], [-35, 65], [-20, 75], [-25, 82], [-45, 83], [-55, 76],
    [-50, 65], [-45, 60]
  ],
  // Central America
  [
    [-97, 20], [-90, 16], [-85, 14], [-83, 10], [-78, 8], [-80, 8],
    [-84, 10], [-90, 14], [-97, 20]
  ],
  // South America
  [
    [-77, 8], [-72, 12], [-60, 10], [-50, 0], [-35, -5], [-35, -12],
    [-40, -22], [-50, -30], [-58, -38], [-65, -45], [-68, -55], [-75, -50],
    [-73, -40], [-72, -30], [-70, -18], [-80, -5], [-80, 2], [-77, 8]
  ],
  // Europe & Scandinavia
  [
    [-9, 36], [-9, 43], [-1, 44], [-4, 48], [2, 51], [8, 54],
    [5, 58], [5, 62], [12, 65], [18, 70], [28, 71], [30, 65],
    [25, 60], [20, 55], [14, 54], [12, 45], [16, 40], [24, 38],
    [26, 41], [15, 42], [5, 43], [0, 40], [-5, 36], [-9, 36]
  ],
  // Great Britain & Ireland
  [
    [-5, 50], [0, 51], [1, 53], [-2, 57], [-4, 58], [-6, 55], [-5, 50]
  ],
  [
    [-10, 51], [-6, 52], [-6, 55], [-10, 54], [-10, 51]
  ],
  // Africa & Madagascar
  [
    [-6, 36], [10, 37], [25, 32], [33, 31], [34, 27], [43, 12],
    [51, 12], [42, 0], [40, -10], [35, -25], [32, -28], [28, -33],
    [18, -34], [15, -23], [12, -15], [8, 4], [3, 6], [-5, 5],
    [-15, 11], [-17, 15], [-17, 21], [-10, 28], [-6, 36]
  ],
  // Madagascar
  [
    [44, -12], [50, -14], [50, -24], [44, -25], [44, -12]
  ],
  // Asia & Russia & Middle East & India
  [
    [30, 65], [40, 68], [60, 73], [75, 73], [100, 77], [140, 72],
    [170, 67], [180, 65], [170, 60], [160, 55], [145, 48], [130, 42],
    [122, 38], [120, 32], [118, 24], [108, 18], [105, 10], [100, 5],
    [98, 12], [90, 22], [82, 17], [78, 8], [73, 18], [68, 24],
    [60, 25], [56, 26], [50, 30], [36, 32], [35, 40], [40, 42],
    [45, 40], [50, 42], [55, 50], [40, 55], [30, 65]
  ],
  // Arabian Peninsula
  [
    [35, 30], [45, 30], [55, 25], [60, 22], [55, 15], [45, 12],
    [43, 14], [35, 30]
  ],
  // Indian Subcontinent Detail
  [
    [68, 24], [73, 18], [78, 8], [80, 13], [88, 22], [90, 22], [82, 28], [68, 24]
  ],
  // Japan
  [
    [130, 32], [132, 34], [136, 35], [140, 40], [142, 44], [145, 44],
    [141, 38], [135, 34], [130, 32]
  ],
  // Indonesia & Philippines
  [
    [95, 5], [105, -5], [115, -8], [125, -8], [125, 0], [115, 0], [95, 5]
  ],
  [
    [120, 15], [125, 14], [125, 7], [121, 6], [120, 15]
  ],
  // Australia & New Zealand
  [
    [113, -22], [115, -34], [130, -32], [138, -35], [148, -38], [153, -28],
    [150, -20], [142, -11], [136, -12], [130, -14], [122, -18], [113, -22]
  ],
  // New Zealand
  [
    [166, -46], [170, -43], [174, -41], [176, -38], [178, -38], [174, -36],
    [172, -41], [168, -45], [166, -46]
  ],
  // Antarctica
  [
    [-180, -70], [-120, -72], [-60, -65], [0, -68], [60, -66], [120, -65],
    [180, -70], [180, -90], [-180, -90], [-180, -70]
  ]
];

// Country internal border segment coordinates for extra realism [lon1, lat1, lon2, lat2]
const COUNTRY_BORDER_SEGMENTS: [number, number, number, number][] = [
  // US / Canada border (~49th parallel)
  [-123, 49, -95, 49], [-95, 49, -89, 48], [-83, 42, -75, 45],
  // US / Mexico border
  [-117, 32.5, -111, 31.3], [-111, 31.3, -106, 31.8], [-106, 31.8, -97, 26],
  // South America borders
  [-70, -18, -60, -22], [-60, -22, -55, -30], [-70, -33, -65, -45],
  // Europe borders
  [2, 49, 7, 49], [8, 48, 8, 54], [14, 50, 14, 54], [20, 50, 24, 45],
  // Africa internal division lines
  [-15, 20, 30, 20], [10, 5, 10, -15], [30, 5, 30, -20],
  // Asia internal division lines
  [74, 37, 88, 28], [88, 28, 97, 28], [75, 30, 75, 20], [60, 40, 85, 45],
  [85, 45, 120, 50], [100, 22, 108, 22]
];

export interface GlobeMapData {
  canvasTexture: THREE.CanvasTexture;
  landPoints: Float32Array;
  borderPoints: Float32Array;
}

export function createWorldGlobeData(radius = 1.4): GlobeMapData {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Fill ocean background with pure deep black
  ctx.fillStyle = "#010603";
  ctx.fillRect(0, 0, width, height);

  // Function to project lon/lat to canvas x/y
  const toX = (lon: number) => ((lon + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  // Draw latitude and longitude meridian grid onto texture
  ctx.strokeStyle = "rgba(0, 255, 102, 0.12)";
  ctx.lineWidth = 1.2;
  // Longitudes
  for (let lon = -180; lon <= 180; lon += 30) {
    const x = toX(lon);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  // Latitudes
  for (let lat = -90; lat <= 90; lat += 30) {
    const y = toY(lat);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Draw Continents fill with deep glowing green tint
  ctx.fillStyle = "rgba(0, 60, 25, 0.55)";
  ctx.shadowColor = "#00ff66";
  ctx.shadowBlur = 12;

  CONTINENT_POLYGONS.forEach((poly) => {
    ctx.beginPath();
    poly.forEach(([lon, lat], i) => {
      const x = toX(lon);
      const y = toY(lat);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
  });

  // Draw Crisp Neon Coastlines
  ctx.shadowBlur = 18;
  ctx.shadowColor = "#00ff66";
  ctx.strokeStyle = "#00ff66";
  ctx.lineWidth = 3.5;

  CONTINENT_POLYGONS.forEach((poly) => {
    ctx.beginPath();
    poly.forEach(([lon, lat], i) => {
      const x = toX(lon);
      const y = toY(lat);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  });

  // Draw Country Borders
  ctx.shadowBlur = 8;
  ctx.shadowColor = "#39ff14";
  ctx.strokeStyle = "rgba(57, 255, 20, 0.75)";
  ctx.lineWidth = 1.6;
  ctx.setLineDash([4, 4]);

  COUNTRY_BORDER_SEGMENTS.forEach(([lon1, lat1, lon2, lat2]) => {
    ctx.beginPath();
    ctx.moveTo(toX(lon1), toY(lat1));
    ctx.lineTo(toX(lon2), toY(lat2));
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // Generate 3D Land Particles by sampling canvas land pixels!
  const imgData = ctx.getImageData(0, 0, width, height).data;
  const landCoords: number[] = [];
  const borderCoords: number[] = [];

  // Sample points uniformly across sphere surface
  const sampleCount = 9000;
  for (let i = 0; i < sampleCount; i++) {
    // Generate uniform spherical lat/lon
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI; // lon
    const phi = Math.acos(2.0 * v - 1.0); // lat angle from pole

    const lonDeg = (theta * 180) / Math.PI - 180;
    const latDeg = 90 - (phi * 180) / Math.PI;

    const px = Math.floor(toX(lonDeg));
    const py = Math.floor(toY(latDeg));

    if (px >= 0 && px < width && py >= 0 && py < height) {
      const idx = (py * width + px) * 4;
      const g = imgData[idx + 1]; // Green channel value

      // If pixel is land (green channel > 40)
      if (g > 40) {
        const r = radius + 0.015;
        const x = r * Math.sin(phi) * Math.sin(theta);
        const y = r * Math.cos(phi);
        const z = r * Math.sin(phi) * Math.cos(theta);

        if (g > 180) {
          // Bright border / coastline dot
          borderCoords.push(x, y, z);
        } else {
          // Inland dot
          landCoords.push(x, y, z);
        }
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  return {
    canvasTexture: texture,
    landPoints: new Float32Array(landCoords),
    borderPoints: new Float32Array(borderCoords),
  };
}
