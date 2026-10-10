export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

/** The server identifies the user from its HttpOnly session cookie. */
export async function requestApi<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`/api${path}`, {
      method,
      credentials: 'include',
      headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new ApiError(data?.message ?? 'No se pudo completar la solicitud. Inténtalo nuevamente.', response.status);
    }
    if (data === null) throw new ApiError('El servidor devolvió una respuesta no válida.', response.status);
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('No se pudo conectar con RentRoom. Inténtalo nuevamente.', 0);
  } finally {
    clearTimeout(timeout);
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo completar la operación.';
}
