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

## Run Magic Mirror

```bash
docker compose up -d
```

The Compose file pulls the prebuilt [`karsten13/magicmirror`](https://gitlab.com/khassel/magicmirror) image and mounts the local `config` directory. The service listens on port `8081` inside the container and is published to `8081` on the host. Visit `http://localhost:8081` to view the dashboard.

Logs can be tailed with:

```bash
docker compose logs -f
```

## Customizing the dashboard

- Update `config/config.js` before rebuilding to modify modules, locations, or API keys.
- Third-party modules are vendored under `modules/` (e.g., `MMM-Dad-Jokes`, `MMM-SolarPicture`, `MMM-PreciousMetals`). After cloning new modules, add matching bind mounts in `docker-compose.yml` and run `docker compose run --rm magic-mirror npm install --prefix modules/<ModuleName>` when a module ships a `package.json`.
- `MMM-PreciousMetals` requires a [metals.dev](https://metals.dev) API key. Set it via `config/config.js`.

Redeploy changes with `docker compose up -d`.
