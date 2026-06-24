const REFERENCE_PATTERN = /MD\d{4}\/\d{6}/i;

export function parseDossierReference(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const param = url.searchParams.get('ref') ?? url.searchParams.get('reference');
      if (param) return normalizeReference(param);

      const parts = url.pathname.split('/').filter(Boolean);
      const trackIndex = parts.findIndex(part => part.toLowerCase() === 'suivre-dossier');
      if (trackIndex >= 0 && parts[trackIndex + 1]) {
        return normalizeReference(decodeURIComponent(parts.slice(trackIndex + 1).join('/')));
      }
    } catch {
      // Not a valid URL, fall through.
    }
  }

  const match = trimmed.match(REFERENCE_PATTERN);
  if (match) return normalizeReference(match[0]);

  return normalizeReference(trimmed);
}

function normalizeReference(value: string): string {
  const match = value.trim().match(REFERENCE_PATTERN);
  return match ? match[0].toUpperCase() : value.trim().toUpperCase();
}

export function buildDossierTrackUrl(reference: string, origin = ''): string {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : '');
  const params = new URLSearchParams({ ref: reference });
  return `${base}/suivre-dossier?${params}`;
}
