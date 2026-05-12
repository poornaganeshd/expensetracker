import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// DOM / browser API mocks
// jsdom does not implement HTMLCanvasElement.getContext or toDataURL.
// We mock URL.createObjectURL, URL.revokeObjectURL, and document.createElement
// to return a fake canvas with a predictable toDataURL result.
// ---------------------------------------------------------------------------

const FAKE_DATA_URL  = 'data:image/jpeg;base64,FAKEBASE64DATA';
const FAKE_BASE64    = 'FAKEBASE64DATA';

function makeFile() {
  return new Blob(['fake-image-bytes'], { type: 'image/jpeg' });
}

function makeMockCanvas() {
  return {
    width: 0,
    height: 0,
    getContext: () => ({ drawImage: vi.fn() }),
    toDataURL: () => FAKE_DATA_URL,
  };
}

let origCreateElement;
let origImage;
let origCreateObjectURL;
let origRevokeObjectURL;
let origFetch;

beforeEach(() => {
  origCreateElement    = document.createElement.bind(document);
  origImage            = globalThis.Image;
  origCreateObjectURL  = globalThis.URL.createObjectURL;
  origRevokeObjectURL  = globalThis.URL.revokeObjectURL;
  origFetch            = globalThis.fetch;

  globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  globalThis.URL.revokeObjectURL = vi.fn();

  vi.spyOn(document, 'createElement').mockImplementation((tag, ...args) => {
    if (tag === 'canvas') return makeMockCanvas();
    return origCreateElement(tag, ...args);
  });
});

afterEach(() => {
  globalThis.Image             = origImage;
  globalThis.URL.createObjectURL = origCreateObjectURL;
  globalThis.URL.revokeObjectURL = origRevokeObjectURL;
  globalThis.fetch             = origFetch;
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// compressFoodImageToBase64
// ---------------------------------------------------------------------------
describe('compressFoodImageToBase64', () => {
  it('resolves with base64 string (no data: prefix) for a valid image', async () => {
    globalThis.Image = class {
      constructor() { this.width = 200; this.height = 150; }
      set src(_) { Promise.resolve().then(() => this.onload?.()); }
    };

    const { compressFoodImageToBase64 } = await import('../foodVision.js');
    const result = await compressFoodImageToBase64(makeFile());
    expect(result).toBe(FAKE_BASE64);
    expect(result).not.toMatch(/^data:/);
  });

  it('scales down images wider than 800px', async () => {
    let canvasRef = null;
    globalThis.Image = class {
      constructor() { this.width = 1600; this.height = 1200; }
      set src(_) { Promise.resolve().then(() => this.onload?.()); }
    };
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') {
        // Return the SAME object so mutations (canvas.width = N) are visible here
        canvasRef = makeMockCanvas();
        return canvasRef;
      }
      return origCreateElement(tag);
    });

    const { compressFoodImageToBase64 } = await import('../foodVision.js');
    await compressFoodImageToBase64(makeFile());
    expect(canvasRef.width).toBe(800);
  });

  it('does not upscale images smaller than 800px', async () => {
    let canvasRef = null;
    globalThis.Image = class {
      constructor() { this.width = 400; this.height = 300; }
      set src(_) { Promise.resolve().then(() => this.onload?.()); }
    };
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') {
        canvasRef = makeMockCanvas();
        return canvasRef;
      }
      return origCreateElement(tag);
    });

    const { compressFoodImageToBase64 } = await import('../foodVision.js');
    await compressFoodImageToBase64(makeFile());
    expect(canvasRef.width).toBe(400);
  });

  it('rejects for a zero-dimension image', async () => {
    globalThis.Image = class {
      constructor() { this.width = 0; this.height = 0; }
      set src(_) { Promise.resolve().then(() => this.onload?.()); }
    };

    const { compressFoodImageToBase64 } = await import('../foodVision.js');
    await expect(compressFoodImageToBase64(makeFile())).rejects.toThrow('zero dimensions');
  });

  it('rejects when image fires onerror', async () => {
    globalThis.Image = class {
      constructor() {}
      set src(_) { Promise.resolve().then(() => this.onerror?.()); }
    };

    const { compressFoodImageToBase64 } = await import('../foodVision.js');
    await expect(compressFoodImageToBase64(makeFile())).rejects.toThrow('Failed to load image');
  });
});

// ---------------------------------------------------------------------------
// analyzeFood
// ---------------------------------------------------------------------------
describe('analyzeFood', () => {
  beforeEach(() => {
    // Default: valid Image so compressFoodImageToBase64 succeeds
    globalThis.Image = class {
      constructor() { this.width = 100; this.height = 100; }
      set src(_) { Promise.resolve().then(() => this.onload?.()); }
    };
  });

  it('throws immediately when no file provided', async () => {
    const { analyzeFood } = await import('../foodVision.js');
    await expect(analyzeFood(null)).rejects.toThrow('No file provided');
  });

  it('throws when fetch returns a non-ok response with error field', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'All providers failed' }),
    });

    const { analyzeFood } = await import('../foodVision.js');
    await expect(analyzeFood(makeFile())).rejects.toThrow('All providers failed');
  });

  it('throws generic message when fetch returns non-ok without error field', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const { analyzeFood } = await import('../foodVision.js');
    await expect(analyzeFood(makeFile())).rejects.toThrow('HTTP 500');
  });

  it('throws when fetch returns 200 but unparseable body', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => { throw new SyntaxError('bad json'); },
    });

    const { analyzeFood } = await import('../foodVision.js');
    await expect(analyzeFood(makeFile())).rejects.toThrow('unreadable response');
  });

  it('returns nutrition data on success', async () => {
    const payload = {
      name: 'Dal Tadka',
      serving_desc: '1 bowl',
      calories: 280,
      protein_g: 14,
      carbs_g: 38,
      fat_g: 6,
      confidence: 'high',
      provider: 'gemini',
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    const { analyzeFood } = await import('../foodVision.js');
    const result = await analyzeFood(makeFile());
    expect(result).toEqual(payload);
  });

  it('POSTs to /api/food-vision with imageBase64 and mimeType', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ name: 'Test', calories: 100, protein_g: 5, carbs_g: 10, fat_g: 2 }),
    });

    const { analyzeFood } = await import('../foodVision.js');
    await analyzeFood(makeFile());

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/food-vision',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
    const body = JSON.parse(globalThis.fetch.mock.calls[0][1].body);
    expect(body.imageBase64).toBe(FAKE_BASE64);
    expect(body.mimeType).toBe('image/jpeg');
  });
});

// ---------------------------------------------------------------------------
// foodResultToText
// ---------------------------------------------------------------------------
describe('foodResultToText', () => {
  it('returns name + serving_desc', async () => {
    const { foodResultToText } = await import('../foodVision.js');
    expect(foodResultToText({ name: 'Dal Tadka', serving_desc: '1 bowl' })).toBe('Dal Tadka (1 bowl)');
  });

  it('returns just name when no serving_desc', async () => {
    const { foodResultToText } = await import('../foodVision.js');
    expect(foodResultToText({ name: 'Roti' })).toBe('Roti');
  });

  it('returns empty string when result is null', async () => {
    const { foodResultToText } = await import('../foodVision.js');
    expect(foodResultToText(null)).toBe('');
  });

  it('returns empty string when name is missing', async () => {
    const { foodResultToText } = await import('../foodVision.js');
    expect(foodResultToText({ serving_desc: '1 bowl' })).toBe('');
  });
});

// ---------------------------------------------------------------------------
// foodResultToMacroString
// ---------------------------------------------------------------------------
describe('foodResultToMacroString', () => {
  it('formats all macros into a compact string', async () => {
    const { foodResultToMacroString } = await import('../foodVision.js');
    const result = foodResultToMacroString({ calories: 280, protein_g: 14, carbs_g: 38, fat_g: 6 });
    expect(result).toBe('280 cal · P 14g · C 38g · F 6g');
  });

  it('handles zero calories', async () => {
    const { foodResultToMacroString } = await import('../foodVision.js');
    const result = foodResultToMacroString({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
    expect(result).toBe('0 cal · P 0g · C 0g · F 0g');
  });

  it('returns empty string when result is null', async () => {
    const { foodResultToMacroString } = await import('../foodVision.js');
    expect(foodResultToMacroString(null)).toBe('');
  });

  it('returns empty string when calories is undefined', async () => {
    const { foodResultToMacroString } = await import('../foodVision.js');
    expect(foodResultToMacroString({ protein_g: 10 })).toBe('');
  });
});
