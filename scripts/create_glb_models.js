import fs from 'fs';
import path from 'path';

const outDir = path.resolve('public/models');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function createMinimalGLB(name) {
  const json = JSON.stringify({
    asset: { version: '2.0', generator: 'OceanVision3D' },
    scenes: [{ nodes: [0] }],
    nodes: [{ name }],
  });

  const jsonBuffer = Buffer.from(json, 'utf8');
  // Pad JSON chunk to 4-byte boundary with spaces (0x20)
  const padding = (4 - (jsonBuffer.length % 4)) % 4;
  const paddedJsonBuffer = Buffer.concat([jsonBuffer, Buffer.alloc(padding, 0x20)]);

  const chunkLength = paddedJsonBuffer.length;
  const totalLength = 12 + 8 + chunkLength;

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // 'glTF' magic
  header.writeUInt32LE(2, 4);          // version 2
  header.writeUInt32LE(totalLength, 8); // total length

  const chunkHeader = Buffer.alloc(8);
  chunkHeader.writeUInt32LE(chunkLength, 0);
  chunkHeader.writeUInt32LE(0x4e4f534a, 4); // 'JSON' chunk type

  return Buffer.concat([header, chunkHeader, paddedJsonBuffer]);
}

const models = [
  'tuna.glb',
  'shark.glb',
  'dolphin.glb',
  'sea-turtle.glb',
  'manta-ray.glb',
  'jellyfish.glb',
  'whale.glb',
  'octopus.glb',
];

for (const m of models) {
  const glb = createMinimalGLB(m.replace('.glb', ''));
  fs.writeFileSync(path.join(outDir, m), glb);
  console.log(`Created ${m}`);
}
