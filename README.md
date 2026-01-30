# Tldraw Docker with Persistent Storage

Self-hosted tldraw whiteboard with SQLite backend for persistent storage across containers and computers.

## Features

- **Persistent Storage**: All drawings saved to SQLite database
- **Shared Across Computers**: Access your work from any computer
- **Auto-save**: Changes automatically saved every second
- **Docker Volume**: Data persists across container restarts
- **Lightweight**: Uses SQLite instead of heavy databases

## Setup

```bash
docker compose up -d --build
```

Open **http://tldraw.localhost**

> If `tldraw.localhost` doesn't resolve, add to `/etc/hosts`:
> ```
> 127.0.0.1 tldraw.localhost
> ```

## How It Works

### Storage Architecture

1. **Frontend** (React + Tldraw): Creates and edits drawings
2. **Backend** (Node.js + Express): Serves static files + REST API
3. **Database** (SQLite): Stores document snapshots in `./data/tldraw.db`
4. **Local Directory Mount**: Database persists in your project folder

```
User Browser → Single Node.js Server (port 80) → SQLite DB
               ├─ Serves static files                ↓
               └─ REST API (/api/*)           ./data/tldraw.db
```

### Data Persistence

- Drawings are stored in a SQLite database file: `./data/tldraw.db`
- The database file is in your project's `data` folder (not inside the container)
- To move to another computer, just copy the entire project folder
- No need to export/import Docker volumes

## Configuration

**Change domain** — edit `docker-compose.yml`:
```yaml
- "traefik.http.routers.tldraw.rule=Host(`whiteboard.yourdomain.com`)"
```

**Change port** — if port 80 is in use:
```yaml
ports:
  - "8080:80"
```

## Data Management

### Backup Your Data

Your database is stored locally at `./data/tldraw.db`. Just copy this file or the entire project folder.

```bash
# Backup the database file
cp ./data/tldraw.db ./tldraw-backup.db

# Or backup entire project
tar czf tldraw-backup.tar.gz .
```

### Move to Another Computer

Simply copy your entire project folder to the new computer. The `data` directory contains your database.

```bash
# On Computer A
tar czf tldraw-project.tar.gz /path/to/tldraw

# Transfer tldraw-project.tar.gz to Computer B

# On Computer B
tar xzf tldraw-project.tar.gz
cd tldraw
docker compose up -d --build
```

### Reset All Data

```bash
rm -rf ./data
docker compose restart
```

## Architecture

```
├── Dockerfile              # Single container build
├── docker-compose.yml      # Traefik + app
├── server.js               # Serves static files + REST API
├── src/
│   ├── App.jsx             # Tldraw with backend sync
│   ├── main.jsx
│   └── utils.js            # Throttle helper
├── data/
│   └── tldraw.db           # SQLite database (auto-created)
├── package.json            # All dependencies
└── vite.config.js
```

## API Endpoints

- `GET /api/document/:id` - Load document snapshot
- `POST /api/document/:id` - Save document snapshot
- `GET /api/documents` - List all documents
- `GET /health` - Backend health check
