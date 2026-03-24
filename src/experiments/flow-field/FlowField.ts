export class FlowField {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private particleCount: number;
  private px: Float32Array;
  private py: Float32Array;
  private pvx: Float32Array;
  private pvy: Float32Array;
  private pspeed: Float32Array;
  private plife: Float32Array;
  private raf = 0;
  private time = 0;
  private resizeObserver: ResizeObserver;
  private disturbances: { x: number; y: number; strength: number; decay: number }[] = [];
  private interactive: boolean;

  // Perlin noise permutation table
  private perm: Uint8Array;

  constructor(canvas: HTMLCanvasElement, preview = false) {
    this.canvas = canvas;
    this.interactive = !preview;
    this.particleCount = preview ? 8000 : 120000;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas2D not available');
    this.ctx = ctx;

    // Initialize permutation table
    this.perm = new Uint8Array(512);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];

    // Initialize particles (SoA layout)
    this.px = new Float32Array(this.particleCount);
    this.py = new Float32Array(this.particleCount);
    this.pvx = new Float32Array(this.particleCount);
    this.pvy = new Float32Array(this.particleCount);
    this.pspeed = new Float32Array(this.particleCount);
    this.plife = new Float32Array(this.particleCount);

    this.resize();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);

    if (this.interactive) {
      canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.disturbances.push({
          x: (e.clientX - rect.left) * dpr,
          y: (e.clientY - rect.top) * dpr,
          strength: 8,
          decay: 1,
        });
      });

      canvas.addEventListener('mousemove', (e) => {
        if (e.buttons > 0) {
          const rect = canvas.getBoundingClientRect();
          const dpr = window.devicePixelRatio || 1;
          this.disturbances.push({
            x: (e.clientX - rect.left) * dpr,
            y: (e.clientY - rect.top) * dpr,
            strength: 3,
            decay: 1,
          });
        }
      });
    }
  }

  private resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width * dpr;
    this.height = rect.height * dpr;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Reset particles
    for (let i = 0; i < this.particleCount; i++) {
      this.resetParticle(i);
    }

    // Clear canvas to black
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private resetParticle(i: number) {
    this.px[i] = Math.random() * this.width;
    this.py[i] = Math.random() * this.height;
    this.pvx[i] = 0;
    this.pvy[i] = 0;
    this.pspeed[i] = 0.5 + Math.random() * 1.5;
    this.plife[i] = Math.random() * 300 + 100;
  }

  // Improved Perlin noise
  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  private noise3d(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);
    const p = this.perm;
    const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z;
    const B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;

    return this.lerp(
      this.lerp(
        this.lerp(this.grad(p[AA], x, y, z), this.grad(p[BA], x - 1, y, z), u),
        this.lerp(this.grad(p[AB], x, y - 1, z), this.grad(p[BB], x - 1, y - 1, z), u),
        v,
      ),
      this.lerp(
        this.lerp(this.grad(p[AA + 1], x, y, z - 1), this.grad(p[BA + 1], x - 1, y, z - 1), u),
        this.lerp(this.grad(p[AB + 1], x, y - 1, z - 1), this.grad(p[BB + 1], x - 1, y - 1, z - 1), u),
        w,
      ),
      w,
    );
  }

  // Curl noise (2D curl of 3D noise for divergence-free field)
  private curl(x: number, y: number, z: number): [number, number] {
    const eps = 0.001;
    // ∂noise/∂y
    const dndy = (this.noise3d(x, y + eps, z) - this.noise3d(x, y - eps, z)) / (2 * eps);
    // ∂noise/∂x
    const dndx = (this.noise3d(x + eps, y, z) - this.noise3d(x - eps, y, z)) / (2 * eps);
    // Curl: (∂n/∂y, -∂n/∂x)
    return [dndy, -dndx];
  }

  start() {
    const render = () => {
      const ctx = this.ctx;
      this.time += 0.003;

      // Trail effect
      ctx.fillStyle = 'rgba(10, 10, 10, 0.025)';
      ctx.fillRect(0, 0, this.width, this.height);

      const noiseScale = 0.002;

      // Update disturbances
      for (let d = this.disturbances.length - 1; d >= 0; d--) {
        this.disturbances[d].decay -= 0.015;
        if (this.disturbances[d].decay <= 0) {
          this.disturbances.splice(d, 1);
        }
      }

      // Update and draw particles
      for (let i = 0; i < this.particleCount; i++) {
        const x = this.px[i];
        const y = this.py[i];

        // Sample curl noise
        const [cx, cy] = this.curl(
          x * noiseScale,
          y * noiseScale,
          this.time,
        );

        // Apply disturbances
        let dx = 0, dy = 0;
        for (const dist of this.disturbances) {
          const ddx = x - dist.x;
          const ddy = y - dist.y;
          const d2 = ddx * ddx + ddy * ddy;
          const r = 150;
          if (d2 < r * r) {
            const force = dist.strength * dist.decay * (1 - Math.sqrt(d2) / r);
            dx += (ddy / Math.sqrt(d2 + 1)) * force;
            dy -= (ddx / Math.sqrt(d2 + 1)) * force;
          }
        }

        const speed = this.pspeed[i];
        this.pvx[i] = this.pvx[i] * 0.9 + (cx + dx) * speed * 0.1;
        this.pvy[i] = this.pvy[i] * 0.9 + (cy + dy) * speed * 0.1;

        this.px[i] += this.pvx[i];
        this.py[i] += this.pvy[i];
        this.plife[i]--;

        // Wrap around edges
        if (this.px[i] < 0) this.px[i] += this.width;
        if (this.px[i] > this.width) this.px[i] -= this.width;
        if (this.py[i] < 0) this.py[i] += this.height;
        if (this.py[i] > this.height) this.py[i] -= this.height;

        // Reset dead particles
        if (this.plife[i] <= 0) {
          this.resetParticle(i);
          continue;
        }

        // Color by velocity angle
        const vel = Math.sqrt(this.pvx[i] * this.pvx[i] + this.pvy[i] * this.pvy[i]);
        const alpha = Math.min(vel * 0.3, 0.7);

        // Subtle color: mostly white/gray, hint of blue at high speed
        const hue = vel > 2 ? 220 : 0;
        const sat = vel > 2 ? 30 : 0;
        const light = 70 + vel * 5;

        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${Math.min(light, 95)}%, ${alpha})`;
        ctx.fillRect(this.px[i], this.py[i], 1, 1);
      }

      this.raf = requestAnimationFrame(render);
    };

    this.raf = requestAnimationFrame(render);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
  }
}
