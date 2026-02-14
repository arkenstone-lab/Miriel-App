export function generateId(): string {
  return crypto.randomUUID();
}

export function now(): string {
  return new Date().toISOString().replace('T', ' ').replace('Z', '');
}

export function parseJsonField(value: string | null | undefined): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function parseJsonFields<T extends object>(
  row: T,
  fields: string[],
): T {
  const result = { ...row } as Record<string, unknown>;
  for (const field of fields) {
    if (field in result && typeof result[field] === 'string') {
      result[field] = parseJsonField(result[field] as string);
    }
  }
  return result as T;
}

export function stringifyJsonField(value: unknown): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value ?? null);
}
