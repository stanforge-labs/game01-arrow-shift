import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('Yandex platform loader', () => {
  it('shares one init promise and caches the single SDK instance', async () => {
    const sdk = {
      on: vi.fn(),
      getPlayer: vi.fn().mockResolvedValue(null),
      features: { LoadingAPI: { ready: vi.fn() }, GameplayAPI: { start: vi.fn(), stop: vi.fn() } },
    };
    const init = vi.fn().mockResolvedValue(sdk);
    vi.stubGlobal('window', {
      YaGames: { init },
      location: { hostname: 'games.yandex.ru' },
      setTimeout,
      clearTimeout,
    });

    const platform = await import('./yandex.js');
    const first = platform.initPlatform({});
    const second = platform.initPlatform({});
    expect(first).toBe(second);
    await Promise.all([first, second]);
    expect(init).toHaveBeenCalledTimes(1);
    expect(platform.getPlatform().ysdk).toBe(sdk);
  });
});
