import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';

vi.mock('three', async () => {
  const actual = await vi.importActual<typeof import('three')>('three');
  class MockWebGLRenderer {
    domElement = { width: 0, height: 0 };
    _pixelRatio = 1;
    outputColorSpace = actual.SRGBColorSpace;
    setPixelRatio = vi.fn(function (this: MockWebGLRenderer, ratio: number) {
      this._pixelRatio = ratio;
    });
    // Mirrors three.js: canvas buffer = floor(cssSize * pixelRatio).
    setSize = vi.fn(function (this: MockWebGLRenderer, width: number, height: number) {
      this.domElement.width = Math.floor(width * this._pixelRatio);
      this.domElement.height = Math.floor(height * this._pixelRatio);
    });
    setClearColor = vi.fn();
    render = vi.fn();
    dispose = vi.fn();
    forceContextLoss = vi.fn();
  }
  return {
    ...actual,
    WebGLRenderer: MockWebGLRenderer,
  };
});

import { ArGpuScene, GpuSkyFrame } from './arGpuScene';

const createMockCanvas = (): HTMLCanvasElement => {
  const ctx = {
    createRadialGradient: () => ({ addColorStop: vi.fn() }),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    ellipse: vi.fn(),
    stroke: vi.fn(),
    clip: vi.fn(),
    fillRect: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalCompositeOperation: 'source-over',
  };
  return {
    width: 192,
    height: 192,
    getContext: vi.fn(() => ctx),
  } as unknown as HTMLCanvasElement;
};

describe('ArGpuScene buffer reuse and lifecycle', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { devicePixelRatio: 1 });
    vi.stubGlobal('document', {
      createElement: vi.fn(() => createMockCanvas()),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const createInput = (starCount: number, lineCount: number): GpuSkyFrame => ({
    width: 800,
    height: 600,
    maxPixelRatio: 2,
    nightVision: false,
    timeMs: 1000,
    stars: Array.from({ length: starCount }, (_, index) => ({
      id: `star-${index}`,
      x: 100 + index,
      y: 200 + index,
      size: 2.5,
      color: index % 2 === 0 ? '#ffffff' : '#93c5fd',
      phase: 0.5,
    })),
    deepSky: [
      {
        id: 'm31',
        x: 300,
        y: 250,
        size: 6,
        color: '#c084fc',
        phase: 0.75,
      },
    ],
    bodies: [
      {
        id: 'mars',
        key: 'Mars',
        x: 400,
        y: 300,
        size: 8,
        color: '#ef4444',
        selected: false,
      },
    ],
    constellationLines: Array.from({ length: lineCount }, (_, index) => ({
      start: { x: 50 + index, y: 60 + index },
      end: { x: 150 + index, y: 160 + index },
    })),
  });

  it('reuses preallocated Float32Array buffers across frames without reallocating when within capacity', () => {
    const canvas = createMockCanvas();
    const scene = new ArGpuScene(canvas, 16, 8);

    const internal = scene as unknown as {
      starGeometry: THREE.BufferGeometry;
      lineGeometry: THREE.BufferGeometry;
    };

    const initialStarPositionArray = internal.starGeometry.getAttribute('position').array;
    const initialLinePositionArray = internal.lineGeometry.getAttribute('position').array;

    // 5 stars + 1 deepSky = 6 points total; 3 lines = 6 line vertices
    scene.render(createInput(5, 3));
    expect(internal.starGeometry.getAttribute('position').array).toBe(initialStarPositionArray);
    expect(internal.starGeometry.drawRange.count).toBe(6);
    expect(internal.lineGeometry.getAttribute('position').array).toBe(initialLinePositionArray);
    expect(internal.lineGeometry.drawRange.count).toBe(6);

    // 10 stars + 1 deepSky = 11 points total; 4 lines = 8 line vertices
    scene.render(createInput(10, 4));
    expect(internal.starGeometry.getAttribute('position').array).toBe(initialStarPositionArray);
    expect(internal.starGeometry.drawRange.count).toBe(11);
    expect(internal.lineGeometry.getAttribute('position').array).toBe(initialLinePositionArray);
    expect(internal.lineGeometry.drawRange.count).toBe(8);

    scene.dispose();
  });

  it('expands buffer capacity in a controlled way only when point or line count exceeds capacity', () => {
    const canvas = createMockCanvas();
    const scene = new ArGpuScene(canvas, 4, 2);

    const internal = scene as unknown as {
      starGeometry: THREE.BufferGeometry;
    };
    const initialArray = internal.starGeometry.getAttribute('position').array;

    // 6 stars + 1 deepSky = 7 points (exceeds capacity 4 -> grows to 8)
    scene.render(createInput(6, 1));
    const expandedArray = internal.starGeometry.getAttribute('position').array;
    expect(expandedArray).not.toBe(initialArray);
    expect(expandedArray.length).toBeGreaterThanOrEqual(7 * 3);

    // 7 stars + 1 deepSky = 8 points (within expanded capacity 8 -> reuses buffer)
    scene.render(createInput(7, 1));
    expect(internal.starGeometry.getAttribute('position').array).toBe(expandedArray);

    scene.dispose();
  });

  it('writes projected guide segments into their own dim buffer layer (F2.1)', () => {
    const canvas = createMockCanvas();
    const scene = new ArGpuScene(canvas, 16, 8);

    const internal = scene as unknown as {
      guideLineGeometry: THREE.BufferGeometry;
    };

    const withGuides: GpuSkyFrame = {
      ...createInput(2, 1),
      guideLines: [
        { start: { x: 1, y: 2 }, end: { x: 3, y: 4 } },
        { start: { x: 5, y: 6 }, end: { x: 7, y: 8 } },
      ],
    };
    scene.render(withGuides);

    // 2 guide segments = 4 vertices in the dedicated guide geometry.
    expect(internal.guideLineGeometry.drawRange.count).toBe(4);
    const guidePositions = Array.from(
      internal.guideLineGeometry.getAttribute('position').array as Float32Array,
    ).slice(0, 6);
    expect(guidePositions).toEqual([1, 2, 0, 3, 4, 0]);

    // A frame without guideLines hides the layer again.
    scene.render(createInput(2, 1));
    expect(internal.guideLineGeometry.drawRange.count).toBe(0);

    scene.dispose();
  });

  it('expands guide buffer capacity in a controlled way when above capacity', () => {
    const canvas = createMockCanvas();
    const scene = new ArGpuScene(canvas, 4, 2);

    const internal = scene as unknown as {
      guideLineGeometry: THREE.BufferGeometry;
    };
    const initialArray = internal.guideLineGeometry.getAttribute('position').array;

    const guides = Array.from({ length: 3 }, (_, index) => ({
      start: { x: index, y: index },
      end: { x: index + 1, y: index + 1 },
    }));
    scene.render({ ...createInput(1, 0), guideLines: guides });

    // 3 guide segments (6 vertices) exceed capacity 2 -> buffer grows.
    const expandedArray = internal.guideLineGeometry.getAttribute('position').array;
    expect(expandedArray).not.toBe(initialArray);
    expect(expandedArray.length).toBeGreaterThanOrEqual(6);

    scene.dispose();
  });

  it('disposes geometries, materials, sprites, and caches cleanly', () => {
    const canvas = createMockCanvas();
    const scene = new ArGpuScene(canvas, 8, 4);
    scene.render(createInput(3, 2));

    const internal = scene as unknown as {
      bodySprites: Map<string, THREE.Sprite>;
      colorCache: Map<string, THREE.Color>;
    };
    expect(internal.bodySprites.size).toBe(1);
    expect(internal.colorCache.size).toBeGreaterThan(0);

    scene.dispose();
    expect(internal.bodySprites.size).toBe(0);
    expect(internal.colorCache.size).toBe(0);
  });

  it('forces GL context loss on dispose (F3.4, StrictMode double-mount)', () => {
    const canvas = createMockCanvas();
    const scene = new ArGpuScene(canvas, 8, 4);

    scene.dispose();

    const internal = scene as unknown as { renderer: { forceContextLoss: ReturnType<typeof vi.fn> } };
    expect(internal.renderer.forceContextLoss).toHaveBeenCalledTimes(1);
  });

  it('does not re-run setSize on every frame at fractional CSS widths (F3.4)', () => {
    const canvas = createMockCanvas();
    const scene = new ArGpuScene(canvas, 16, 8);

    const internal = scene as unknown as {
      renderer: { setSize: ReturnType<typeof vi.fn>; domElement: { width: number; height: number } };
    };

    const fractional = { ...createInput(2, 1), width: 800.5, height: 600.5 };
    scene.render(fractional);
    const callsAfterFirst = internal.renderer.setSize.mock.calls.length;

    scene.render(fractional);
    scene.render(fractional);

    expect(internal.renderer.setSize.mock.calls.length).toBe(callsAfterFirst);
    expect(internal.renderer.domElement.width).toBe(Math.floor(800.5 * 1));
    scene.dispose();
  });

  it('reuses one visibility set for body sprites across frames (F3.4)', () => {
    const canvas = createMockCanvas();
    const scene = new ArGpuScene(canvas, 16, 8);

    const internal = scene as unknown as { visibleBodyKeys: Set<string> };
    const sameSet = internal.visibleBodyKeys;

    scene.render(createInput(1, 1));
    expect(internal.visibleBodyKeys.has('Mars')).toBe(true);

    scene.render({ ...createInput(1, 1), bodies: [] });
    expect(internal.visibleBodyKeys).toBe(sameSet);
    expect(internal.visibleBodyKeys.size).toBe(0);
    scene.dispose();
  });
});
