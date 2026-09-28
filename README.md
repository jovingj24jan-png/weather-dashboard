# Weather Dashboard

A full-screen React weather dashboard. Every weather value comes live from the
free [Open-Meteo](https://open-meteo.com/) API — nothing is hardcoded.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

The default city is set in `src/config.js` (`DEFAULT_CITY = 'Chennai'`).

## How the data flows

The app only **reads** data, so every request is an HTTP **GET**. Nothing is
created, updated or deleted on a server, which is why POST / PUT / PATCH /
DELETE are never used.

```text
User types "Nagercoil" and presses Enter
        │
        ▼
getCoordinates("Nagercoil")                src/services/geocodingApi.js
  in parallel:
  GET https://geocoding-api.open-meteo.com/v1/search
      ?name=Nagercoil&count=20&language=en&format=json
  GET https://nominatim.openstreetmap.org/search                (src/services/nominatimApi.js)
      ?q=Nagercoil&format=jsonv2&addressdetails=1&limit=10&accept-language=en
        │   → candidate places from both geocoders
        ▼
rankPlaces(candidates, query)              src/utils/placeRanking.js
        │   → best place (latitude, longitude) + other matches,
        │     or "ask the user" when several places are equally likely
        ▼
getWeather({ latitude, longitude })        src/services/weatherApi.js
  GET https://api.open-meteo.com/v1/forecast
      ?latitude=8.18&longitude=77.43
      &current=temperature_2m,relative_humidity_2m,apparent_temperature,
               precipitation,weather_code,wind_speed_10m,visibility,is_day
      &hourly=temperature_2m,relative_humidity_2m,precipitation,weather_code
      &daily=weather_code,temperature_2m_max,temperature_2m_min,
             precipitation_probability_max,precipitation_sum,
             relative_humidity_2m_mean,wind_speed_10m_max,sunrise,sunset
      &forecast_days=7&timezone=auto
        │   → JSON, validated and reshaped into { current, hourly, daily, units }
        ▼
useWeather() stores it in React state      src/hooks/useWeather.js
        │
        ▼
Dashboard components render it            src/components/*
```

Saved cities use one more GET to the same forecast endpoint, passing all their
coordinates at once (`latitude=40.7,51.5&longitude=-74,-0.12`), so the whole
list refreshes in a single request.

### Finding the right place

Open-Meteo's geocoder only matches the *start* of names in its own index, so a
lot of real searches miss: it knows Kanyakumari only as "Kanniyākumāri", maps
"Madras" to a town in Oregon and "Trivandrum" to the airport. The app therefore
also searches OpenStreetMap data, which indexes alternate and former names, and
ranks every candidate from all sources with the same general rules — there are
no per-city special cases:

- **Name match** — exact (ignoring case, accents and punctuation) beats an
  alternate-name match, which beats a name that merely starts with the query
  ("Bangalore Town").
- **Place type** — city > town > suburb > village > district/island > region >
  natural feature ≫ airports, stations and buildings (used only as a fallback).
- **Prominence** — population (Open-Meteo) or importance (Nominatim).
- **Qualifier** — "Springfield, Massachusetts" prefers results in that region
  or country.

Entries for the same place from different sources (same name within 15 km, or
anything within 3 km) are merged. If two or more distant places score almost the
same (e.g. "Springfield", "Kochi", "Adyar"), the search box shows a short
"Which … did you mean?" list and no weather is fetched until one is picked.

### Geocoder fallback

```text
                 ┌─ Open-Meteo geocoding (8 s limit) ──────────────────────┐
query ──parallel─┤                                                          ├─ merge → dedupe → rank
                 └─ Nominatim (6 s) ─ fails, or no answer in 2.5 s ─→ Photon (7 s) ┘
```

- Any single source can fail (error, timeout, bad data) without failing the
  search; whatever the others return is ranked normally.
- Photon is only contacted when Nominatim fails or is slow; the first
  OpenStreetMap answer wins and the other request is cancelled.
- **"City not found"** appears only when every source answered and none had a
  usable place. If a source failed and nothing was found, the message says the
  search couldn't be completed and offers **Try again**; if all failed, it says
  location search is unavailable (or that the connection failed).
- Nominatim is used within its [usage policy](https://operations.osmfoundation.org/policies/nominatim/):
  only on submit and at most one request per second.

### Request handling

All requests go through `httpGet()` in `src/services/http.js`, which gives
every request a time limit (15 s unless a source sets its own) and turns
every failure into a `WeatherError` with a `kind` the UI can explain:

| What happened                          | `kind`      | Message shown                                                            |
| -------------------------------------- | ----------- | ------------------------------------------------------------------------ |
| `fetch()` rejected (offline, DNS…)     | `network`   | Unable to connect to the weather service. Check your internet connection. |
| HTTP status not 2xx                    | `api`       | Weather service is currently unavailable. Please try again.              |
| Body isn't JSON / fields missing       | `malformed` | The weather service sent an unexpected response. Please try again.       |
| Geocoding returned no `results`        | `not-found` | City not found. Try searching for another city.                          |
| Empty search box (no request is sent)  | `empty`     | Type a city name to search.                                              |

Before anything is rendered, `getWeather()` checks the response has
coordinates, a numeric timezone offset, `current.time`/temperature/weather
code, and at least 7 days of daily data; anything missing becomes a
`malformed` error instead of a crash.

Each new search aborts the previous one with an `AbortController`, so a slow
old response can never overwrite a newer city. The last good forecast stays on
screen while a new one loads, and after a failed search. **Try again** repeats
the request that failed (e.g. the failed search), not the previous city.

## Project structure

```text
src/
├── services/          API layer (no React)
│   ├── http.js          httpGet(), WeatherError, messages
│   ├── geocodingApi.js  getCoordinates() — queries both geocoders, returns the ranked result
│   ├── nominatimApi.js  OpenStreetMap Nominatim search
│   ├── photonApi.js     Photon (OpenStreetMap) search, used when Nominatim fails or is slow
│   ├── osmPlaces.js     shared OpenStreetMap place types and ids
│   └── weatherApi.js    getWeather(), getCurrentWeatherForMany()
├── hooks/             React state
│   ├── useWeather.js    selected city + forecast + loading/error
│   ├── useFavorites.js  saved cities (localStorage) + their live temps
│   ├── useHistory.js    recently viewed cities (localStorage)
│   └── useCityClock.js  local time in the selected city
├── utils/
│   ├── weatherCodes.js  WMO weather code → label + icon (used everywhere)
│   ├── placeRanking.js  generic ranking/merging of geocoder results
│   ├── format.js        number/date formatting
│   └── storage.js       safe localStorage access
├── components/        UI (Sidebar, Header, CurrentWeather, Forecast, …)
├── config.js          default city, limits, storage keys
├── App.jsx            layout + wiring
└── styles.css         design tokens, layout, responsive rules
```

No libraries beyond React and Vite: the chart and icons are hand-written SVG,
and the map uses plain OpenStreetMap tile images (© OpenStreetMap
contributors). For heavy production traffic, switch to a tile provider with an
API key, per the OSM tile usage policy.
