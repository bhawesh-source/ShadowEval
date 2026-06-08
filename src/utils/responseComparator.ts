export function normalizeResponse(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function compareResponses(primary: string, candidate: string): boolean {
  return normalizeResponse(primary) === normalizeResponse(candidate);
}
