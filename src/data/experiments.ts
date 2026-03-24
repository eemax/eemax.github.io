export interface ExperimentMeta {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  enabled: boolean;
  date: string;
  tech: string[];
  color: string;
}

export const experiments: ExperimentMeta[] = [
  {
    slug: 'shader-noise-field',
    title: 'NOISE_FIELD',
    description: 'Fractal Brownian Motion through a feedback loop. GPU-driven.',
    tags: ['webgl', 'generative'],
    enabled: true,
    date: '2026-03-24',
    tech: ['WebGL2', 'GLSL 300 es', 'FBM'],
    color: '#00ff41',
  },
  {
    slug: 'css-tesseract',
    title: 'TESSERACT',
    description: 'A rotating hypercube projected into CSS 3D space. No JavaScript.',
    tags: ['css', '3d'],
    enabled: true,
    date: '2026-03-24',
    tech: ['CSS 3D Transforms', '@property', '@keyframes'],
    color: '#ff003c',
  },
  {
    slug: 'flow-field',
    title: 'FLOW_FIELD',
    description: 'Particles following curl noise. Click to disturb.',
    tags: ['canvas', 'generative'],
    enabled: true,
    date: '2026-03-24',
    tech: ['Canvas2D', 'Perlin Noise', 'Curl Noise'],
    color: '#3d5afe',
  },
];

export function getActiveExperiments(): ExperimentMeta[] {
  return experiments.filter((e) => e.enabled);
}
