# Install MITEN with Docker

This is the self-hosted copy of MITEN: the website, API, and MySQL in three
containers. You do not need Python or Node on your machine.

If you only want to look at the public snapshot, skip this file and open
https://aghilhooshmand.github.io/MITEN/

## What you need

1. [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Mac or Windows)
   or Docker Engine + Docker Compose (Linux).
2. Git.
3. About 2 GB of disk for images and the database.

Confirm Docker works:

```bash
docker --version
docker compose version
```

## Install

Open a terminal.

```bash
git clone https://github.com/aghilhooshmand/MITEN.git
cd MITEN
docker compose up --build
```

The first start builds images and loads the MIT lists into MySQL. Wait until
the log shows `Uvicorn running on http://0.0.0.0:8000`.

Then open:

**http://localhost:8080**

That is the full app (not the CSV-only GitHub Pages copy).

Leave the terminal open. To stop:

```bash
docker compose down
```

Data stays in a Docker volume. The next `docker compose up` is faster and does
not re-seed.

## Optional: download live prices

The default install (`SEED_MODE=static`) shows every MIT list and the company
mappings. Charts and scores vs SPY stay empty until prices are loaded.

To fetch Yahoo Finance history and compute scores (several minutes, internet
required), start from an empty database:

```bash
docker compose down -v
SEED_MODE=full docker compose up --build
```

`-v` deletes the MySQL volume so seed runs again. Use this only when you want
a fresh download.

On Windows Command Prompt:

```bat
set SEED_MODE=full
docker compose up --build
```

## Optional: change the port

Copy `.env.example` to `.env` and set `MITEN_PORT=3000`, then:

```bash
docker compose up --build
```

Open http://localhost:3000

## Update

```bash
git pull
docker compose up --build
```

## Uninstall

```bash
docker compose down -v
```

This removes containers and the MySQL volume. Images remain until you prune
Docker yourself.

## If something fails

| Symptom | What to try |
| --- | --- |
| Port 8080 is already in use | Set `MITEN_PORT=8081` in `.env` |
| `MySQL did not become ready` | Wait and run `docker compose up` again; first MySQL init is slow |
| Website loads but `/api` errors | `docker compose logs backend` |
| Empty scores / empty chart | You are on `SEED_MODE=static`. Use `SEED_MODE=full` as above |
| Permission denied on Linux | Add your user to the `docker` group, or prefix commands with `sudo` |

## What the containers are

| Name | Role |
| --- | --- |
| `miten-web` | Nginx: the React UI, proxies `/api` to the backend |
| `miten-api` | FastAPI scoring API |
| `miten-mysql` | MySQL 8 with MIT lists, mappings, and (if seeded) prices |
