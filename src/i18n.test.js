import { describe, expect, it } from 'vitest';
import { translations } from './i18n.js';

describe('localization coverage', () => {
  it('contains all Route and Rush UI keys in Russian and English', () => {
    const required = [
      'route', 'run', 'reset', 'rotations', 'pathBroken', 'routeLooped',
      'routeComplete', 'best', 'next', 'levels', 'bestResult', 'start', 'target',
      'rush', 'time', 'score', 'combo', 'fields', 'again', 'home', 'rushBonus',
    ];
    for (const language of ['ru', 'en']) {
      for (const key of required) expect(typeof translations[language][key]).toBe('string');
    }
  });
});
