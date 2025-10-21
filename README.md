# Magic Mirror Docker Setup

This project bundles the [MagicMirror²](https://github.com/MichMich/MagicMirror) dashboard inside a container that can be orchestrated with Docker Compose on the pre-existing `fortress-phronesis-net` network.

## Prerequisites
- Docker and Docker Compose installed locally
- External Docker network named `fortress-phronesis-net`
- OpenWeather API key for weather modules (update `config/config.js`)

Create the external network once if it does not already exist:

```bash
docker network create fortress-phronesis-net
```

## Build the image

```bash
docker compose build
```

The build clones the latest MagicMirror² source, installs dependencies, and copies the local `config/config.js` into the image. Adjust the build by supplying alternative repository details:

```bash
docker compose build --build-arg MAGICMIRROR_BRANCH=develop
```

## Run Magic Mirror

```bash
docker compose up -d
```

The service listens on port `8080` inside the container and is published to `8080` on the host. Visit `http://localhost:8080` to view the dashboard.

Logs can be tailed with:

```bash
docker compose logs -f
```

## Customizing the dashboard

- Update `config/config.js` before rebuilding to modify modules, locations, or API keys.
- Mount additional modules by extending `docker-compose.yml` with extra bind volumes (e.g., `./modules:/opt/magic_mirror/modules`).

Redeploy changes with `docker compose up -d --build`.
