import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('Yandex platform loader', () => {
  it('shares one init promise and caches the single SDK instance', async () => {
    const sdk = {
      on: vi.fn(),
      getPlayer: vi.fn().mockResolvedValue(null),
      environment: { i18n: { lang: 'ru' } },
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
    expect(platform.getPlatformLanguage()).toBe('ru');
    expect(platform.gameReady()).toBe(true);
    expect(platform.gameReady()).toBe(false);
    expect(sdk.features.LoadingAPI.ready).toHaveBeenCalledTimes(1);
  });

  it('waits for a late SDK global without injecting a second loader', async () => {
    vi.useFakeTimers();
    const sdk = {
      on: vi.fn(),
      getPlayer: vi.fn().mockResolvedValue(null),
      environment: { i18n: { lang: 'en' } },
      features: { LoadingAPI: { ready: vi.fn() }, GameplayAPI: { start: vi.fn(), stop: vi.fn() } },
    };
    const init = vi.fn().mockResolvedValue(sdk);
    const windowStub = { location: { hostname: 'games.yandex.ru' }, setTimeout, clearTimeout };
    vi.stubGlobal('window', windowStub);

    const platform = await import('./yandex.js');
    const pending = platform.initPlatform({});
    await vi.advanceTimersByTimeAsync(50);
    windowStub.YaGames = { init };
    await vi.advanceTimersByTimeAsync(50);
    await pending;

    expect(init).toHaveBeenCalledTimes(1);
    expect(platform.getPlatformLanguage()).toBe('en');
    expect(windowStub.document).toBeUndefined();
  });
});
