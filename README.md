# Mobile Libraries API

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

REST API providing access to mobile library services, timetables, routes, stops, road trips, and live/estimated vehicle locations across the UK.

Upstream database schema and data creation scripts are maintained in [LibrariesHacked/mobilelibraries-database](https://github.com/LibrariesHacked/mobilelibraries-database), with data source files conforming to the national UK mobile library data standard: [schema.librarydata.uk/mobile-library-stops.json](https://schema.librarydata.uk/mobile-library-stops.json) (v2.0.0).

Interactive Swagger/OpenAPI documentation is available at the root URL `/` and raw OpenAPI 3.0 JSON specification at `/openapi.json`.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- PostgreSQL with [PostGIS](https://postgis.net/) extension installed (database populated via `mobilelibraries-database`)

### Configuration

Create a `.env` file in the project root:

```ini
PORT=8080
PGHOST=localhost
PGPORT=5432
PGDATABASE=mobiles
PGUSER=postgres
PGPASSWORD=yourpassword
```

### Installation

```bash
npm install
```

### Running the API

```bash
npm start
```

The API will start at `http://localhost:8080`.

### Running Tests and Linting

```bash
npm test
npm run lint
```

---

## API Endpoints

### 1. Local Authorities (`/api/localauthorities`)

- **`GET /api/localauthorities`**: List all UK local library authorities operating mobile services.
- **`GET /api/localauthorities/:id`**: Get details of a local authority by numeric database ID or 9-character GSS code (e.g. `S12000041`, `E06000004`).

### 2. Mobiles (`/api/mobiles`)

- **`GET /api/mobiles?local_authority_id=`**: List mobile library vehicles, optionally filtered by local authority ID.
- **`GET /api/mobiles/:id`**: Get a single mobile library vehicle by ID.
- **`GET /api/mobiles/locations`**: Get current, previous, and next stops with estimated vehicle coordinates and route sections for services active today.
- **`GET /api/mobiles/nearest?longitude=&latitude=&distance=`**: Find mobile libraries near given WGS84 coordinates within distance in metres.

### 3. Routes (`/api/routes`)

- **`GET /api/routes?local_authority_id=&mobile_id=`**: List recurring service routes and frequencies, optionally filtered by authority or vehicle.
- **`GET /api/routes/:id`**: Get route details by ID.

### 4. Stops (`/api/stops`)

- **`GET /api/stops`**: Search and filter physical stop locations.
  - Query parameters:
    - `local_authority_ids`: Pipe-separated authority IDs (e.g. `44|56`)
    - `local_authority_codes`: Pipe-separated 9-char GSS codes (e.g. `S12000041|E06000004`)
    - `mobile_ids`: Pipe-separated mobile vehicle IDs
    - `route_ids`: Pipe-separated route IDs
    - `longitude`, `latitude`, `distance`: Coordinates and buffer in metres for proximity filtering
    - `limit`, `page`: Pagination controls (defaults: limit 1000, page 1)
    - `sort`, `direction`: Sort column and direction (`asc`/`desc`)
  - Response headers: `X-Total-Count`, `X-Page`
  - Formats:
    - `Accept: application/json`: JSON array of Stop objects
    - `Accept: application/geo+json`: GeoJSON Point FeatureCollection
- **`GET /api/stops/nearest?longitude=&latitude=&limit=`**: Return the closest stops to coordinates.
- **`GET /api/stops/:id`**: Get a stop by numeric ID.
- **`GET /api/stops/:id/pdf`**: Download a printable timetable flyer for the stop in PDF format.
- **`GET /api/stops/:id/ics`**: Download an iCalendar (`.ics`) file containing upcoming scheduled visits.
- **`GET /api/stops/:z/:x/:y.mvt`**: Mapbox Vector Tile (MVT) for stop point visualization.

### 5. Trips (`/api/trips`)

- **`GET /api/trips`**: List driving trips between consecutive stops with road route linestrings, duration, and distance.
  - `Accept: application/json` or `Accept: application/geo+json` (GeoJSON LineString FeatureCollection).
- **`GET /api/trips/:id`**: Get trip details by ID.
- **`GET /api/trips/:z/:x/:y.mvt`**: Mapbox Vector Tile (MVT) for trip road linestrings.

### 6. Schema (`/api/schema`)

Conforms strictly to the UK national standard: [schema.librarydata.uk/mobile-library-stops.json](https://schema.librarydata.uk/mobile-library-stops.json) (v2.0.0).

- **`GET /api/schema`**: Export entire stop timetable dataset (`Accept: application/json` or `Accept: text/csv`).
- **`GET /api/schema/:local_authority`**: Export stops for a specified authority name or GSS code (`Accept: application/json` or `Accept: text/csv`).
- **`POST /api/schema`**: Import or bulk update stops into staging. Accepts JSON array or raw CSV.

---

## Authors

- **Dave Rowe** - [Libraries Hacked](https://www.librarieshacked.org)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
