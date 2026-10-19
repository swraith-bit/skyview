import { describe, expect, it } from 'vitest';
import { classifyCameraError } from './useCameraStream';

const namedError = (name: string): Error => {
  const error = new Error(name);
  error.name = name;
  return error;
};

describe('camera error classification (F2.6)', () => {
  it('maps permission rejections to denied', () => {
    expect(classifyCameraError(namedError('NotAllowedError'))).toBe('denied');
    expect(classifyCameraError(namedError('SecurityError'))).toBe('denied');
  });

  it('maps a camera held by another app to busy', () => {
    expect(classifyCameraError(namedError('NotReadableError'))).toBe('busy');
    expect(classifyCameraError(namedError('TrackStartError'))).toBe('busy');
  });

  it('maps missing cameras to missing', () => {
    expect(classifyCameraError(namedError('NotFoundError'))).toBe('missing');
    expect(classifyCameraError(namedError('OverconstrainedError'))).toBe('missing');
  });

  it('keeps playback aborts silent instead of claiming denied permission', () => {
    expect(classifyCameraError(namedError('AbortError'))).toBe('aborted');
  });

  it('falls back to unknown for unpredicted failures', () => {
    expect(classifyCameraError(new Error('boom'))).toBe('unknown');
    expect(classifyCameraError(undefined)).toBe('unknown');
    expect(classifyCameraError(7)).toBe('unknown');
  });
});
