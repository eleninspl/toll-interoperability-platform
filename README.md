# TollTrax: Highway Toll Interoperability Platform

A web application for sharing toll data between Greek highway operators. When a vehicle with one operator's tag (transceiver) passes a toll station run by another operator, the station operator charges the pass and the tag's operator owes it the money. TollTrax stores the toll stations and passes, works out how much each operator owes the others, and offers pass queries and simple analytics. It has three parts: a REST API (Node.js, Express, PostgreSQL), a command-line client, and a React web front end.

This was the semester project for **Software Engineering** (Τεχνολογία Λογισμικού), a 7th-semester course at the School of Electrical and Computer Engineering, National Technical University of Athens (ECE NTUA), academic year 2024–25.

It was a team project by six students (team 12, `softeng24-12`). Christos Karvelas, Pantelis Petrakis and Ioannis-Panagiotis Koutras appear by name in the commit history; the other members committed under NTUA accounts that show no name. My own part was mainly authentication (JWT login and logout), the JSON/CSV response formats of the admin and pass endpoints, and the CLI client and its tests.

| Part | Folder | Technology |
|------|--------|------------|
| [REST API](#rest-api) | `back-end/` | Node.js, Express 4, PostgreSQL (`pg`), JWT, bcrypt, multer |
| [CLI client](#cli-client) | `cli-client/` | Node.js, Commander, Axios |
| [Web front end](#web-front-end) | `front-end/` | React 19 (Create React App), React Bootstrap, Chart.js |
| [Documentation](#documentation) | `documentation/` | SRS (Greek), Visual Paradigm UML and ER models, OpenAPI 3.0, Postman |
| AI-usage logs | `ai-log/` | The logs of AI-tool use that the course asked each team member to keep |

## The assignment

The course asked each team to build an interoperability system for highway tolls, using real station data from eight Greek operators (Attiki Odos, Aegean Motorway, Nea Odos, Olympia Odos, Kentriki Odos, Moreas, Egnatia Odos and Gefyra) and sample pass records provided with the assignment. The required deliverables were:

- A **REST API** at `http://localhost:9115/api` with a fixed set of endpoints: administrative operations (health check, reset stations, reset passes, upload passes) and four pass queries. Responses are JSON by default and CSV with `?format=csv`. Users log in to get a JWT, which they send in the `X-OBSERVATORY-AUTH` header.
- A **CLI** named after the team (`se2412`) with one command per API call.
- A **web front end** for a few use cases chosen by the team.
- **Documentation**: a Software Requirements Specification (SRS) and UML models (activity, class, component, deployment and sequence diagrams) plus an ER diagram.

## Data model

![ER diagram: operator, toll_station, transceiver, passthrough, debt_settlement, user and vehicle tables](documentation/ER/Entity%20Relationship%20Diagram.jpg)

An **operator** runs **toll stations** and issues **transceivers** (tags). Each **passthrough** records a tag passing a station, with its time and charge. A **debt settlement** row records what one operator owes another. **Users** have a role (`admin`, `analyst`, `normal`, or an operator code such as `NAO` for operator accounts), and normal users own **vehicles**.

The back end creates the database and tables on start-up (`back-end/routes/db.js`). It loads users and vehicles from the generated test data in `back-end/dummy_data/`. Stations come from `back-end/data/tollstations2024.csv` (253 stations), and passes are uploaded as CSV.

## Getting started

### Prerequisites

- Node.js 20 or later and npm (tested with Node.js 22)
- PostgreSQL (tested with 14), running on `localhost:5432`. The user name and password the API connects with are set in `back-end/.env`; create a matching PostgreSQL user or edit the file.
- `pg_dump` on the `PATH`, only for the database dump endpoint

```bash
git clone https://github.com/eleninspl/toll-interoperability-platform.git
cd toll-interoperability-platform
```

### Start the API

```bash
cd back-end
npm install
npm start          # or: npm run dev (restarts on changes, uses nodemon)
```

On first start the server creates the `tollway_system` database and its tables, loads 61 test users and 50 vehicles, and listens on port 9115.

### Load data with the CLI

The CLI uses code and settings from `back-end/`, so install the back end first. Run the CLI from the `cli-client` folder, because it looks up `token.json` and `../back-end/.env` relative to the current folder. Log in with the `admin` account; its password is listed with the other test accounts in `back-end/dummy_data/passwords.csv`.

```bash
cd cli-client
npm install
node se2412.js login --username admin --passw <admin password>
node se2412.js resetstations --format json
node se2412.js admin --addpasses --source ../back-end/data/passes12.csv
node se2412.js healthcheck --format json
node se2412.js passescost --stationop NAO --tagop AM --from 20220203 --to 20220217
```

The last command prints the passes that tags from operator AM made through Attiki Odos (NAO) stations in that period, and what they cost:

```
tollOpID,tagOpID,requestTimestamp,periodFrom,periodTo,nPasses,passesCost
NAO,AM,2026-10-06 17:35,2022-02-03,2022-02-17,14,35
```

### Start the web front end

```bash
cd front-end
npm install
npm start
```

The app opens at `http://localhost:3001` and expects the API at `http://localhost:9115`. You can log in with any account from `back-end/dummy_data/passwords.csv`: the admin, plus generated normal, analyst and operator users.

## REST API

All paths are relative to `http://localhost:9115/api`. The admin and pass endpoints accept `?format=json` (the default) or `?format=csv`; the analytics endpoints return JSON only.

| Method | Path | Who | Purpose |
|--------|------|-----|---------|
| POST | `/login` | anyone | Takes `username` and `password` (form-encoded or JSON) and returns `{ "token": ... }` |
| POST | `/logout` | logged in | Ends the session; the client simply discards the token |
| GET | `/verify-token` | logged in | Returns the user name and role stored in the token |
| GET | `/admin/healthcheck` | admin | Database connection and counts of stations, tags and passes |
| POST | `/admin/resetstations` | admin | Loads the operators and stations from `data/tollstations2024.csv` |
| POST | `/admin/resetpasses` | admin | Deletes all passes and tags |
| POST | `/admin/addpasses` | admin | Uploads a passes CSV (multipart field `file`), loads the tags and records the debts between operators |
| POST | `/admin/usermod` | admin | Creates a user or changes a password |
| GET | `/admin/users` | admin | Lists user names |
| POST | `/admin/resetusers`, `/admin/resetvehicles` | admin | Reloads the test users or vehicles |
| POST | `/admin/dbdump` | admin | Writes a `pg_dump` file to the folder the server was started from |
| GET | `/tollStationPasses/{stationID}/{from}/{to}` | anyone | All passes through one station, marked `home` or `visitor` |
| GET | `/passAnalysis/{stationOpID}/{tagOpID}/{from}/{to}` | anyone | Passes of one operator's tags through another operator's stations |
| GET | `/passesCost/{tollOpID}/{tagOpID}/{from}/{to}` | anyone | Number and total cost of those passes |
| GET | `/chargesBy/{tollOpID}/{from}/{to}` | anyone | What each visiting operator's tags were charged at one operator's stations |
| GET | `/analytics/user` | logged in | Balance and pass history for the user's vehicles |
| GET | `/analytics/settlements` | logged in | Net amount owed between the user's operator and each other operator |
| GET | `/analytics/operator/station-popularity`, `/analytics/operator/vehicle-type-rank` | operator | Pass counts per station and per vehicle model |
| GET | `/analytics/admin/station-popularity` | admin, analyst | Pass counts per station for all operators |

Dates in the path use the `YYYYMMDD` format. The full description is in [`documentation/openai.yaml`](documentation/openai.yaml) (an OpenAPI 3.0 file, despite its name) and the Postman collection [`documentation/postman_documentation.json`](documentation/postman_documentation.json).

**How it works.** Routes are split by area in `back-end/routes/` (`auth.js`, `admin.js`, `passes.js`, `analytics.js`) and share one `pg` connection pool. Passwords are stored as bcrypt hashes. The `authenticateToken` and `checkRole` middleware check the JWT and the user's role; any role that is not `admin`, `analyst` or `normal` is treated as an operator code. Multi-step operations such as uploading passes run inside a transaction, so a failed upload leaves the database unchanged. Uploading passes also computes, for each pair of operators, the total charged to one operator's tags at the other operator's stations, and stores it as a debt settlement.

## CLI client

`cli-client/se2412.js` wraps the API. Each command prints the API response, as CSV by default or as JSON with `--format json`.

| Command | API call |
|---------|----------|
| `login --username U --passw P`, `logout` | `/login`; the token is saved in `token.json` |
| `healthcheck`, `resetpasses`, `resetstations` | admin endpoints |
| `admin --addpasses --source FILE` | `/admin/addpasses` |
| `admin --usermod --username U --passw P`, `admin --users` | `/admin/usermod`, `/admin/users` |
| `tollstationpasses --station ID --from D --to D` | `/tollStationPasses` |
| `passanalysis --stationop OP --tagop OP --from D --to D` | `/passAnalysis` |
| `passescost --stationop OP --tagop OP --from D --to D` | `/passesCost` |
| `chargesby --opid OP --from D --to D` | `/chargesBy` |

Two shell scripts exercise it against a running API (run them from `cli-client/`):

- `cli_test.sh`: functional tests. It checks failed and successful logins, runs each admin command, and checks that admin commands fail after logout. It resets stations and passes and creates a `testuser` account, so run it on test data only.
- `12.sh`: the script the team prepared for the project exam. It logs in, resets the data, uploads `back-end/data/passes12.csv`, and runs every query command for several operators, including invalid input.

`back-end/postman_api_test.json` holds the matching Postman API tests.

## Web front end

After login, the app shows a different dashboard for each role:

- **Admin**: buttons for reset stations, reset passes, add passes (CSV upload) and health check; forms for the four pass queries; a bar chart of passes per station.
- **Normal user**: the four pass queries, and the balance and pass history of the user's own vehicles.
- **Operator**: the net amount owed to or by each other operator, and passes per station and per vehicle model over a chosen date range.
- **Analyst**: a bar chart of passes per station.

The front end is a Create React App project with React Router and React Bootstrap. It calls the API with Axios and `fetch`, and stores the JWT in `localStorage`.

## Documentation

- [`documentation/srs_softeng24-12.docx`](documentation/srs_softeng24-12.docx): Software Requirements Specification following ISO/IEC/IEEE 29148, with nine use cases (in Greek)
- [`documentation/softeng24-12.vpp`](documentation/softeng24-12.vpp): Visual Paradigm project with the UML activity, class, component, deployment and sequence diagrams and the ER model
- [`documentation/ER/`](documentation/ER/): the ER diagram as an image and as a Visual Paradigm XML export
- [`back-end/dummy_data/generator.py`](back-end/dummy_data/generator.py): the script that generated the test users, vehicles and tags (needs Python 3 and `bcrypt`)

## Known limitations

The code is kept as it was submitted. While writing this README I ran the API against a local PostgreSQL, ran both CLI scripts and built the front end. These are the issues I found:

- **Timestamps shift by the server's UTC offset.** `tollStationPasses` and `passAnalysis` convert pass times to UTC before printing them. On a machine set to Greek time, a pass recorded at 06:33 is reported as 04:33, and its `passID` changes with it. The results are correct only when the server runs in UTC.
- **`tollStationPasses` never returns `tagProvider`.** The query names the column `tagoperator` but the code reads `tagprovider`, so the field is missing from every pass.
- **The web app logs you out when you reload the page.** On start-up it checks the saved token at `/api/auth/verify-token`, but the route is `/api/verify-token`. The check fails and the token is deleted.
- **The four pass queries need no login**, although the CLI asks for one first.
- **Uploading the same passes file twice doubles the debts.** Duplicate passes are skipped, but the debt settlements are computed from every row in the file. `resetpasses` does not clear the settlements either.
- **Uploaded passes must use known tags.** Tags are loaded from the fixed file `back-end/dummy_data/transceiver.csv`. A pass with any other tag breaks a foreign-key constraint, and the whole upload is rejected.
- **The health check exposes the database password** as part of the connection string it returns.
- **CSV output for lists is one very wide row.** Nested lists are flattened into columns such as `passList_0_tagID`, instead of one row per pass.
- Errors such as an unknown station, an unknown route or an invalid token return HTTP 500 rather than 400, 404 or 401.
- The CLI imports the back end's `auth.js` and reads `JWT_SECRET` from `back-end/.env` to check the admin role locally, so it works only next to the back-end folder.
- `back-end/.env` is committed with a local development database password and a placeholder JWT secret. Change both before running this anywhere but your own machine.
- The front end's `npm test` runs the Create React App sample test, which fails: the testing libraries are not installed and the app has no "learn react" link.

## For students taking the course

This repository is here to help you understand the material: how the API, the CLI, the front end and the documentation fit together, and what a finished project of this kind looks like. Build your own project with your team. The point of the course is to learn how to specify, design, document and build software together, and that only happens if you do the work yourselves.
