import { describe, expect, it, vi } from 'vitest';
import { InflightSlot, shareInflight } from './inflightByToken';

describe('shareInflight', () => {
  it('reutiliza la promesa mientras el mismo token sigue en curso', async () => {
    let slot: InflightSlot<string> = null;
    const factory = vi.fn(
      () => new Promise<string>((resolve) => setTimeout(() => resolve('ok'), 10)),
    );

    const first = shareInflight(
      () => slot,
      (next) => {
        slot = next;
      },
      'token-a',
      factory,
    );
    const second = shareInflight(
      () => slot,
      (next) => {
        slot = next;
      },
      'token-a',
      factory,
    );

    expect(second).toBe(first);
    expect(factory).toHaveBeenCalledTimes(1);
    await expect(first).resolves.toBe('ok');
  });

  it('vuelve a pedir cuando la anterior ya terminó', async () => {
    let slot: InflightSlot<number> = null;
    const factory = vi
      .fn()
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);

    const first = await shareInflight(
      () => slot,
      (next) => {
        slot = next;
      },
      'token-a',
      factory,
    );
    const second = await shareInflight(
      () => slot,
      (next) => {
        slot = next;
      },
      'token-a',
      factory,
    );

    expect(first).toBe(1);
    expect(second).toBe(2);
    expect(factory).toHaveBeenCalledTimes(2);
  });
});
