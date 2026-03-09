const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://campus-api-cuut-9w0avwlsv-bassh331s-projects.vercel.app';
const SHOULD_INCLUDE_CREDENTIALS = (process.env.EXPO_PUBLIC_INCLUDE_CREDENTIALS || 'false').toLowerCase() === 'true';

function resolveApiPath(path = '') {
  if (!path) return API_BASE_URL;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function apiFetch(path, options = {}) {
  const resolvedUrl = resolveApiPath(path);
  const headers = { ...(options.headers || {}) };

  const fetchOptions = {
    ...options,
    headers,
  };

  if (SHOULD_INCLUDE_CREDENTIALS && !fetchOptions.credentials) {
    fetchOptions.credentials = 'include';
  }

  return fetch(resolvedUrl, fetchOptions);
}

export async function apiFetchJson(path, options = {}) {
  const response = await apiFetch(path, options);
  let payload = null;

  try {
    payload = await response.json();
  } catch (error) {
    // If parsing fails, keep payload null but still handle response.ok below
  }

  if (!response.ok) {
    const message = payload?.error || response.statusText || 'Request failed';
    const err = new Error(message);
    err.status = response.status;
    if (payload) {
      err.data = payload;
    }
    throw err;
  }

  return payload;
}

export { API_BASE_URL, SHOULD_INCLUDE_CREDENTIALS };
