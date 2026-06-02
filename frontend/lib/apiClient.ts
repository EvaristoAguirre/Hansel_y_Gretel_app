/**
 * Helper centralizado para fetch con timeout y cache deshabilitada.
 *
 * - Lanza Error('TIMEOUT') si el servidor no responde en `timeoutMs`.
 * - Lanza Error con el mensaje del backend si la respuesta no es ok.
 * - Siempre envía `cache: 'no-store'` para evitar datos stale en Chrome/tablet.
 */
export async function apiFetch(
  url: string,
  init: RequestInit = {},
  timeoutMs = 8000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message ?? `Error HTTP ${response.status}`);
    }

    return response;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('TIMEOUT');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
