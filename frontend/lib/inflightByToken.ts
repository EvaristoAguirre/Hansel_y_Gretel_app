export type InflightSlot<T> = { token: string; promise: Promise<T> } | null;

/** Reutiliza la promesa en curso para el mismo token. Al terminar, el siguiente llamado vuelve a pedir. */
export function shareInflight<T>(
  getSlot: () => InflightSlot<T>,
  setSlot: (slot: InflightSlot<T>) => void,
  token: string,
  factory: () => Promise<T>,
): Promise<T> {
  const current = getSlot();
  if (current?.token === token) return current.promise;

  const promise = factory().finally(() => {
    if (getSlot()?.promise === promise) setSlot(null);
  });
  setSlot({ token, promise });
  return promise;
}
