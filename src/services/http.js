// Every request in this app is an HTTP GET: we only *read* data from Open-Meteo,
// we never create, update or delete anything on a server, so POST/PUT/PATCH/DELETE
// are never needed.

export class WeatherError extends Error {
  constructor(kind, message, cause) {
    super(message);
    this.name = 'WeatherError';
    this.kind = kind; // 'not-found' | 'api' | 'network' | 'malformed' | 'empty'
    this.cause = cause;
  }
}

export const ERROR_MESSAGES = {
  'not-found': "We couldn't find that location. Try another city.",
  api: 'Weather service is currently unavailable. Please try again.',
  rateLimited: 'Weather service is temporarily rate-limited. Please try again later.',
  network: 'Unable to connect to the weather service. Check your internet connection.',
  malformed: 'The weather service sent an unexpected response. Please try again.',
  empty: 'Type a city name to search.',
  searchUnavailable: 'Location search is currently unavailable. Please try again.',
  searchIncomplete: "Couldn't complete the location search because a search service didn't respond. Please try again.",
};

// Builds "https://host/path?key=value&..." — arrays become comma-separated lists,
// which is how Open-Meteo expects variable lists such as `daily=a,b,c`.
export function buildUrl(base, params) {
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    url.searchParams.set(key, Array.isArray(value) ? value.join(',') : String(value));
  });
  return url.toString();
}

// Every request gets a time limit, so a server that never answers can't leave
// the dashboard loading forever (or hold up a search another source answered).
const DEFAULT_TIMEOUT_MS = 15000;

// Aborts when the caller aborts (a newer search) or when the time limit passes.
function withTimeout(signal, ms) {
  if (typeof AbortSignal.any !== 'function' || typeof AbortSignal.timeout !== 'function') return signal;
  return signal ? AbortSignal.any([signal, AbortSignal.timeout(ms)]) : AbortSignal.timeout(ms);
}

// Sends a GET request and returns the parsed JSON body.
// Failures are converted into a WeatherError with a `kind` the UI can explain:
//   fetch() rejects or times out → 'network'   (offline, DNS, CORS, no answer…)
//   response.ok is false         → 'api'       (HTTP 4xx / 5xx)
//   body is not valid JSON       → 'malformed'
// AbortErrors (the caller cancelled) are rethrown untouched so callers can
// ignore superseded requests; a timeout is a 'TimeoutError', not an AbortError.
export async function httpGet(url, { signal, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const requestSignal = withTimeout(signal, timeoutMs);
  let response;
  try {
    response = await fetch(url, { method: 'GET', signal: requestSignal, headers: { Accept: 'application/json' } });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new WeatherError('network', ERROR_MESSAGES.network, err);
  }

  if (!response.ok) {
    const rateLimited = response.status === 429;
    const error = new WeatherError('api', rateLimited ? ERROR_MESSAGES.rateLimited : ERROR_MESSAGES.api, new Error(`HTTP ${response.status}`));
    error.status = response.status;
    throw error;
  }

  try {
    return await response.json();
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    if (err.name === 'TimeoutError') throw new WeatherError('network', ERROR_MESSAGES.network, err);
    throw new WeatherError('malformed', ERROR_MESSAGES.malformed, err);
  }
}
