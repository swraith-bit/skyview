import * as THREE from 'three';

export interface GpuSkyPoint {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  phase?: number;
}

export interface GpuBody extends GpuSkyPoint {
  key: string;
  selected: boolean;
  moonFraction?: number;
  moonWaxing?: boolean;
}

export interface GpuConstellationLine {
  start: { x: number; y: number };
  end: { x: number; y: number };
}

export interface GpuSkyFrame {
  width: number;
  height: number;
  maxPixelRatio: number;
  nightVision: boolean;
  timeMs: number;
  stars: GpuSkyPoint[];
  deepSky: GpuSkyPoint[];
  bodies: GpuBody[];
  constellationLines: GpuConstellationLine[];
  // F2.1: grid/ecliptic/celestial-equator guide rings, drawn behind the sky.
  guideLines?: GpuConstellationLine[];
}

const createBodyTexture = (
  body: GpuBody,
  nightVision: boolean,
  textureCache: Map<string, THREE.CanvasTexture>,
): THREE.CanvasTexture => {
  const moonStep = body.key === 'Moon' ? Math.round((body.moonFraction ?? 0.5) * 24) : -1;
  const cacheKey = `${body.key}-${nightVision ? 'night' : 'day'}-${moonStep}-${body.moonWaxing ? 'wax' : 'wane'}`;
  const cached = textureCache.get(cacheKey);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('AR texture context unavailable');
  const center = 96;
  const radius = 58;
  const red = nightVision;
  const color = red ? '#ef4444' : body.color;

  const glow = ctx.createRadialGradient(center, center, radius * 0.15, center, center, radius * 1.55);
  glow.addColorStop(0, color);
  glow.addColorStop(0.45, color);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(center, center, radius * 1.45, 0, Math.PI * 2);
  ctx.fill();

  if (body.key === 'Saturn') {
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(Math.PI / 9);
    ctx.strokeStyle = red ? 'rgba(255,190,190,0.9)' : 'rgba(238,216,170,0.9)';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 1.55, radius * 0.46, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.clip();

  if (body.key === 'Jupiter') {
    ctx.fillStyle = red ? '#cf3131' : '#d8ad8a';
    ctx.fillRect(center - radius, center - radius, radius * 2, radius * 2);
    ctx.fillStyle = red ? '#7f1d1d' : '#9f6046';
    [-0.56, -0.15, 0.27].forEach(offset => {
      ctx.fillRect(center - radius, center + radius * offset, radius * 2, radius * 0.15);
    });
    ctx.fillStyle = red ? '#fecaca' : '#c65345';
    ctx.beginPath();
    ctx.ellipse(center + radius * 0.36, center + radius * 0.3, radius * 0.25, radius * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (body.key === 'Mars') {
    ctx.fillStyle = red ? '#c93030' : '#c76043';
    ctx.fillRect(center - radius, center - radius, radius * 2, radius * 2);
    ctx.fillStyle = red ? '#7f1d1d' : '#873a2a';
    ctx.beginPath();
    ctx.arc(center - radius * 0.18, center + radius * 0.15, radius * 0.52, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = red ? '#fee2e2' : '#fff7ed';
    ctx.beginPath();
    ctx.ellipse(center, center - radius * 0.78, radius * 0.44, radius * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (body.key === 'Moon') {
    const litColor = red ? '#fca5a5' : '#f7edc5';
    const shadowColor = red ? 'rgba(36,0,0,0.94)' : 'rgba(7,12,22,0.95)';
    ctx.fillStyle = litColor;
    ctx.fillRect(center - radius, center - radius, radius * 2, radius * 2);

    const fraction = Math.max(0, Math.min(1, body.moonFraction ?? 0.5));
    const waxing = body.moonWaxing ?? true;

    if (fraction <= 0.03) {
      ctx.fillStyle = shadowColor;
      ctx.fillRect(center - radius, center - radius, radius * 2, radius * 2);
    } else if (fraction < 0.99) {
      // 1. Draw shadow over the unlit half-disk
      ctx.fillStyle = shadowColor;
      ctx.beginPath();
      ctx.arc(center, center, radius + 1, Math.PI / 2, Math.PI * 1.5, !waxing);
      ctx.fill();

      // 2. Draw terminator ellipse: shadow for crescent, lit for gibbous
      const phaseWidth = Math.abs(2 * fraction - 1) * radius;
      const isCrescent = (fraction < 0.5 && waxing) || (fraction > 0.5 && !waxing);
      ctx.fillStyle = isCrescent ? shadowColor : litColor;
      ctx.beginPath();
      ctx.ellipse(center, center, phaseWidth, radius + 1, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Subtle lunar mares/craters overlay
    ctx.fillStyle = red ? 'rgba(127,29,29,0.34)' : 'rgba(104,91,71,0.30)';
    [[-0.34, -0.28, 0.16], [0.22, -0.15, 0.12], [-0.1, 0.31, 0.19], [0.37, 0.28, 0.1]].forEach(([x, y, r]) => {
      ctx.beginPath();
      // Sabit 3'lu ([x, y, r]) literal tuple'lari; elemanlar bu literallerde garanti.
      ctx.arc(center + x! * radius, center + y! * radius, r! * radius, 0, Math.PI * 2);
      ctx.fill();
    });
  } else {
    const base = ctx.createRadialGradient(center - radius * 0.3, center - radius * 0.35, radius * 0.1, center, center, radius);
    base.addColorStop(0, red ? '#fecaca' : '#ffffff');
    base.addColorStop(0.4, color);
    base.addColorStop(1, red ? '#991b1b' : '#172554');
    ctx.fillStyle = base;
    ctx.fillRect(center - radius, center - radius, radius * 2, radius * 2);
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  textureCache.set(cacheKey, texture);
  return texture;
};

export class ArGpuScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(0, 1, 1, 0, -10, 10);
  private readonly starGeometry = new THREE.BufferGeometry();
  private readonly starMaterial: THREE.ShaderMaterial;
  private readonly starPoints: THREE.Points;
  private readonly lineGeometry = new THREE.BufferGeometry();
  private readonly lineMaterial = new THREE.LineBasicMaterial({
    color: '#5eead4',
    transparent: true,
    opacity: 0.44,
    depthWrite: false,
  });
  private readonly lines = new THREE.LineSegments(this.lineGeometry, this.lineMaterial);
  private readonly guideLineGeometry = new THREE.BufferGeometry();
  private readonly guideLineMaterial = new THREE.LineBasicMaterial({
    color: '#6366f1',
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  });
  private readonly guideLineSegments = new THREE.LineSegments(this.guideLineGeometry, this.guideLineMaterial);
  private readonly bodyGroup = new THREE.Group();
  private readonly bodySprites = new Map<string, THREE.Sprite>();
  private readonly bodyTextureCache = new Map<string, THREE.CanvasTexture>();
  private readonly colorCache = new Map<string, THREE.Color>();
  private readonly nightVisionColor = new THREE.Color('#ff6b6b');
  // F3.4: reused visibility set — updateBodies used to allocate a fresh Set on
  // every rendered frame.
  private readonly visibleBodyKeys = new Set<string>();

  private pointCapacity: number;
  private lineCapacity: number;
  private guideLineCapacity: number;
  private positionBuffer!: Float32Array;
  private colorBuffer!: Float32Array;
  private sizeBuffer!: Float32Array;
  private phaseBuffer!: Float32Array;
  private positionAttr!: THREE.BufferAttribute;
  private colorAttr!: THREE.BufferAttribute;
  private sizeAttr!: THREE.BufferAttribute;
  private phaseAttr!: THREE.BufferAttribute;
  private linePositionBuffer!: Float32Array;
  private linePositionAttr!: THREE.BufferAttribute;
  private guideLinePositionBuffer!: Float32Array;
  private guideLinePositionAttr!: THREE.BufferAttribute;

  constructor(canvas: HTMLCanvasElement, maxCapacity = 256, maxLineCapacity = 256) {
    this.pointCapacity = Math.max(1, maxCapacity);
    this.lineCapacity = Math.max(1, maxLineCapacity);
    this.guideLineCapacity = Math.max(1, maxLineCapacity);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      // F1.4: keep the color buffer after compositing so captureArView can composite the
      // GPU layer instead of reading an already-cleared framebuffer.
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.allocatePointBuffers(this.pointCapacity);
    this.allocateLineBuffers(this.lineCapacity);
    this.allocateGuideLineBuffers(this.guideLineCapacity);

    this.starMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 } },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vTwinkle;
        uniform float uTime;
        uniform float uPixelRatio;
        void main() {
          vColor = color;
          vTwinkle = 0.78 + sin(uTime * 1.7 + aPhase) * 0.22;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * uPixelRatio * vTwinkle;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vTwinkle;
        void main() {
          vec2 point = gl_PointCoord - vec2(0.5);
          float distanceToCenter = length(point) * 2.0;
          float glow = 1.0 - smoothstep(0.18, 1.0, distanceToCenter);
          float core = 1.0 - smoothstep(0.0, 0.34, distanceToCenter);
          float alpha = glow * (0.35 + core * 0.65) * vTwinkle;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
    });
    this.starPoints = new THREE.Points(this.starGeometry, this.starMaterial);
    this.starPoints.frustumCulled = false;
    this.lines.frustumCulled = false;
    this.guideLineSegments.frustumCulled = false;
    this.scene.add(this.guideLineSegments, this.lines, this.starPoints, this.bodyGroup);
  }

  render(frame: GpuSkyFrame): void {
    this.resize(frame.width, frame.height, frame.maxPixelRatio);
    // noUnchecked: uniform anahtari bu material'da tanimli (constructor satirlarini/yukarisini bkz).
    this.starMaterial.uniforms.uTime!.value = frame.timeMs / 1000;
    this.lineMaterial.color.set(frame.nightVision ? '#ef4444' : '#5eead4');
    this.lineMaterial.opacity = frame.nightVision ? 0.34 : 0.44;
    this.guideLineMaterial.color.set(frame.nightVision ? '#ef4444' : '#6366f1');
    this.guideLineMaterial.opacity = frame.nightVision ? 0.22 : 0.3;
    this.updatePoints(frame.stars, frame.nightVision, frame.deepSky);
    this.updateLines(frame.constellationLines);
    this.updateGuideLines(frame.guideLines ?? []);
    this.updateBodies(frame.bodies, frame.nightVision);
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.starGeometry.dispose();
    this.lineGeometry.dispose();
    this.guideLineGeometry.dispose();
    this.starMaterial.dispose();
    this.lineMaterial.dispose();
    this.guideLineMaterial.dispose();
    this.bodySprites.forEach(sprite => sprite.material.dispose());
    this.bodySprites.clear();
    this.bodyTextureCache.forEach(texture => texture.dispose());
    this.bodyTextureCache.clear();
    this.colorCache.clear();
    this.renderer.dispose();
    // F3.4: StrictMode double-mount leaks GL contexts without an explicit loss.
    this.renderer.forceContextLoss();
  }

  private allocatePointBuffers(capacity: number): void {
    this.pointCapacity = capacity;
    this.positionBuffer = new Float32Array(capacity * 3);
    this.colorBuffer = new Float32Array(capacity * 3);
    this.sizeBuffer = new Float32Array(capacity);
    this.phaseBuffer = new Float32Array(capacity);

    this.positionAttr = new THREE.BufferAttribute(this.positionBuffer, 3);
    this.positionAttr.setUsage(THREE.DynamicDrawUsage);
    this.colorAttr = new THREE.BufferAttribute(this.colorBuffer, 3);
    this.colorAttr.setUsage(THREE.DynamicDrawUsage);
    this.sizeAttr = new THREE.BufferAttribute(this.sizeBuffer, 1);
    this.sizeAttr.setUsage(THREE.DynamicDrawUsage);
    this.phaseAttr = new THREE.BufferAttribute(this.phaseBuffer, 1);
    this.phaseAttr.setUsage(THREE.DynamicDrawUsage);

    this.starGeometry.setAttribute('position', this.positionAttr);
    this.starGeometry.setAttribute('color', this.colorAttr);
    this.starGeometry.setAttribute('aSize', this.sizeAttr);
    this.starGeometry.setAttribute('aPhase', this.phaseAttr);
    this.starGeometry.setDrawRange(0, 0);
  }

  private allocateLineBuffers(capacity: number): void {
    this.lineCapacity = capacity;
    this.linePositionBuffer = new Float32Array(capacity * 6);
    this.linePositionAttr = new THREE.BufferAttribute(this.linePositionBuffer, 3);
    this.linePositionAttr.setUsage(THREE.DynamicDrawUsage);
    this.lineGeometry.setAttribute('position', this.linePositionAttr);
    this.lineGeometry.setDrawRange(0, 0);
  }

  private allocateGuideLineBuffers(capacity: number): void {
    this.guideLineCapacity = capacity;
    this.guideLinePositionBuffer = new Float32Array(capacity * 6);
    this.guideLinePositionAttr = new THREE.BufferAttribute(this.guideLinePositionBuffer, 3);
    this.guideLinePositionAttr.setUsage(THREE.DynamicDrawUsage);
    this.guideLineGeometry.setAttribute('position', this.guideLinePositionAttr);
    this.guideLineGeometry.setDrawRange(0, 0);
  }

  private getCachedColor(colorHex: string): THREE.Color {
    let cached = this.colorCache.get(colorHex);
    if (!cached) {
      cached = new THREE.Color(colorHex);
      this.colorCache.set(colorHex, cached);
    }
    return cached;
  }

  private resize(width: number, height: number, maxPixelRatio: number): void {
    const nextPixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
    // F3.4: three.js floors width*ratio when writing the canvas buffer — comparing
    // with Math.round made fractional CSS widths miss this guard on every frame
    // and re-run setSize/setPixelRatio (buffer churn) 60 times per second.
    const expectedBufferWidth = Math.max(1, Math.floor(width * nextPixelRatio));
    const expectedBufferHeight = Math.max(1, Math.floor(height * nextPixelRatio));
    if (this.renderer.domElement.width === expectedBufferWidth
      && this.renderer.domElement.height === expectedBufferHeight) return;
    this.renderer.setPixelRatio(nextPixelRatio);
    this.renderer.setSize(width, height, false);
    this.camera.left = 0;
    this.camera.right = width;
    this.camera.top = 0;
    this.camera.bottom = height;
    this.camera.updateProjectionMatrix();
    // noUnchecked: uniform anahtari bu material'da tanimli (constructor'da olusturulan uniforms).
    this.starMaterial.uniforms.uPixelRatio!.value = nextPixelRatio;
  }

  updatePoints(
    points: readonly GpuSkyPoint[],
    nightVision: boolean,
    extraPoints: readonly GpuSkyPoint[] = [],
  ): void {
    const totalCount = points.length + extraPoints.length;
    if (totalCount > this.pointCapacity) {
      this.allocatePointBuffers(Math.max(totalCount, this.pointCapacity * 2));
    }

    const writePoint = (point: GpuSkyPoint, index: number) => {
      const offset = index * 3;
      this.positionBuffer[offset] = point.x;
      this.positionBuffer[offset + 1] = point.y;
      this.positionBuffer[offset + 2] = 0;
      const color = nightVision ? this.nightVisionColor : this.getCachedColor(point.color);
      this.colorBuffer[offset] = color.r;
      this.colorBuffer[offset + 1] = color.g;
      this.colorBuffer[offset + 2] = color.b;
      this.sizeBuffer[index] = Math.max(3, point.size * 3.8);
      this.phaseBuffer[index] = point.phase ?? index * 0.618;
    };

    for (let i = 0; i < points.length; i += 1) {
      const point = points[i];
      if (point) writePoint(point, i); // noUnchecked: i < points.length; sadece tip guard'i
    }
    for (let j = 0; j < extraPoints.length; j += 1) {
      const extra = extraPoints[j];
      if (extra) writePoint(extra, points.length + j); // noUnchecked: j < extraPoints.length; sadece tip guard'i
    }

    this.starGeometry.setDrawRange(0, totalCount);
    this.positionAttr.needsUpdate = true;
    this.colorAttr.needsUpdate = true;
    this.sizeAttr.needsUpdate = true;
    this.phaseAttr.needsUpdate = true;
  }

  updateLines(lines: readonly GpuConstellationLine[]): void {
    if (lines.length > this.lineCapacity) {
      this.allocateLineBuffers(Math.max(lines.length, this.lineCapacity * 2));
    }

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (!line) continue; // noUnchecked: index < lines.length; sadece tip guard'i
      const offset = index * 6;
      this.linePositionBuffer[offset] = line.start.x;
      this.linePositionBuffer[offset + 1] = line.start.y;
      this.linePositionBuffer[offset + 2] = 0;
      this.linePositionBuffer[offset + 3] = line.end.x;
      this.linePositionBuffer[offset + 4] = line.end.y;
      this.linePositionBuffer[offset + 5] = 0;
    }

    this.lineGeometry.setDrawRange(0, lines.length * 2);
    this.linePositionAttr.needsUpdate = true;
  }

  updateGuideLines(lines: readonly GpuConstellationLine[]): void {
    if (lines.length > this.guideLineCapacity) {
      this.allocateGuideLineBuffers(Math.max(lines.length, this.guideLineCapacity * 2));
    }

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (!line) continue; // noUnchecked: index < lines.length; sadece tip guard'i
      const offset = index * 6;
      this.guideLinePositionBuffer[offset] = line.start.x;
      this.guideLinePositionBuffer[offset + 1] = line.start.y;
      this.guideLinePositionBuffer[offset + 2] = 0;
      this.guideLinePositionBuffer[offset + 3] = line.end.x;
      this.guideLinePositionBuffer[offset + 4] = line.end.y;
      this.guideLinePositionBuffer[offset + 5] = 0;
    }

    this.guideLineGeometry.setDrawRange(0, lines.length * 2);
    this.guideLinePositionAttr.needsUpdate = true;
  }

  private updateBodies(bodies: GpuBody[], nightVision: boolean): void {
    this.visibleBodyKeys.clear();
    bodies.forEach(body => {
      this.visibleBodyKeys.add(body.key);
      let sprite = this.bodySprites.get(body.key);
      const texture = createBodyTexture(body, nightVision, this.bodyTextureCache);
      if (!sprite) {
        sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
        this.bodySprites.set(body.key, sprite);
        this.bodyGroup.add(sprite);
      } else {
        const material = sprite.material as THREE.SpriteMaterial;
        if (material.map !== texture) {
          material.map = texture;
          material.needsUpdate = true;
        }
      }
      sprite.visible = true;
      sprite.position.set(body.x, body.y, 1);
      const scale = body.key === 'Sun' ? body.size * 5.3 : body.key === 'Saturn' ? body.size * 4.7 : body.size * 4;
      sprite.scale.set(scale, scale, 1);
      (sprite.material as THREE.SpriteMaterial).opacity = body.selected ? 1 : 0.9;
    });
    this.bodySprites.forEach((sprite, key) => { sprite.visible = this.visibleBodyKeys.has(key); });
  }
}
