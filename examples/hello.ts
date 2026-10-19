type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function getProject<T>(url: string): Promise<Result<T>> {
  const response = await fetch(url);

  if (!response.ok) {
    return { ok: false, error: `HTTP ${response.status}` };
  }

  return { ok: true, data: (await response.json()) as T };
}
