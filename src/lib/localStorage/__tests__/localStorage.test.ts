import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getLocalTags, saveLocalTag, removeLocalTag, syncLocalTags } from '../tags';

describe('localStorage tags', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getLocalTags', () => {
    it('returns empty array when no tags stored', () => {
      expect(getLocalTags()).toEqual([]);
    });

    it('returns stored tags', () => {
      const tags = [{ id: 'local-1', name: 'vegan', isLocal: true }];
      localStorage.setItem('bmad_local_tags', JSON.stringify(tags));
      expect(getLocalTags()).toEqual(tags);
    });

    it('returns empty array on corrupt data', () => {
      localStorage.setItem('bmad_local_tags', 'not-json');
      const result = getLocalTags();
      expect(result).toEqual([]);
    });
  });

  describe('saveLocalTag', () => {
    it('creates a new local tag', () => {
      vi.setSystemTime(new Date('2024-01-01'));
      const tag = saveLocalTag('vegan');
      expect(tag.name).toBe('vegan');
      expect(tag.isLocal).toBe(true);
      expect(tag.id).toMatch(/^local-/);
    });

    it('persists the tag to localStorage', () => {
      saveLocalTag('keto');
      const stored = JSON.parse(localStorage.getItem('bmad_local_tags')!);
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe('keto');
    });

    it('returns existing tag if name already exists (case-insensitive)', () => {
      saveLocalTag('vegan');
      const result = saveLocalTag('Vegan');
      expect(result.name).toBe('vegan');
      const stored = JSON.parse(localStorage.getItem('bmad_local_tags')!);
      expect(stored).toHaveLength(1);
    });

    it('trims whitespace from name', () => {
      const tag = saveLocalTag('  keto  ');
      expect(tag.name).toBe('keto');
    });
  });

  describe('removeLocalTag', () => {
    it('removes a tag by id', () => {
      saveLocalTag('vegan');
      vi.advanceTimersByTime(1);
      saveLocalTag('keto');
      const tags = getLocalTags();
      removeLocalTag(tags[0].id);
      const remaining = getLocalTags();
      expect(remaining).toHaveLength(1);
    });
  });

  describe('syncLocalTags', () => {
    it('removes local tags that now exist on server', () => {
      saveLocalTag('vegan');
      saveLocalTag('keto');
      syncLocalTags([{ id: 1, name: 'vegan' }]);
      const remaining = getLocalTags();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].name).toBe('keto');
    });

    it('does nothing if no local tags', () => {
      syncLocalTags([{ id: 1, name: 'vegan' }]);
      expect(getLocalTags()).toEqual([]);
    });

    it('matches case-insensitively', () => {
      saveLocalTag('Vegan');
      syncLocalTags([{ id: 1, name: 'vegan' }]);
      expect(getLocalTags()).toHaveLength(0);
    });
  });

  describe('SSR safety', () => {
    it('returns empty array when window is undefined (SSR)', () => {
      vi.stubGlobal('window', undefined);
      const result = getLocalTags();
      expect(result).toEqual([]);
      vi.unstubAllGlobals();
    });
  });
});