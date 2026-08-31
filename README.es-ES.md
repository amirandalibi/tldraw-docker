

# Tldraw en Docker con Almacenamiento Persistente

Pizarra tldraw autoalojada con backend SQLite para almacenamiento persistente entre contenedores y computadoras.

## Características

- **Almacenamiento Persistente**: Todos los dibujos se guardan en una base de datos SQLite
- **Compartido entre Computadoras**: Accede a tu trabajo desde cualquier equipo
- **Autoguardado**: Los cambios se guardan automáticamente cada segundo
- **Volumen de Docker**: Los datos persisten entre reinicios del contenedor
- **Ligero**: Utiliza SQLite en lugar de bases de datos pesadas

## Instalación

```bash
docker compose up -d --build
```

Abre **http://tldraw.localhost**

> Si `tldraw.localhost` no se resuelve, añade lo siguiente a `/etc/hosts`:
> ```
> 127.0.0.1 tldraw.localhost
> ```

## Cómo Funciona

### Arquitectura de Almacenamiento

1. **Frontend** (React + Tldraw): Crea y edita dibujos
2. **Backend** (Node.js + Express): Sirve archivos estáticos + API REST
3. **Base de Datos** (SQLite): Almacena instantáneas de documentos en `./data/tldraw.db`
4. **Montaje de Directorio Local**: La base de datos persiste en la carpeta de tu proyecto

```
User Browser → Single Node.js Server (port 80) → SQLite DB
               ├─ Serves static files                ↓
               └─ REST API (/api/*)           ./data/tldraw.db
```

### Persistencia de Datos

- Los dibujos se almacenan en un archivo de base de datos SQLite: `./data/tldraw.db`
- El archivo de la base de datos está en la carpeta `data` de tu proyecto (no dentro del contenedor)
- Para moverlo a otra computadora, simplemente copia toda la carpeta del proyecto
- No es necesario exportar/importar volúmenes de Docker

## Configuración

**Cambiar dominio** — edita `docker-compose.yml`:
```yaml
- "traefik.http.routers.tldraw.rule=Host(`whiteboard.yourdomain.com`)"
```

**Cambiar puerto** — si el puerto 80 está en uso:
```yaml
ports:
  - "8080:80"
```

## Gestión de Datos

### Realizar Copia de Seguridad de tus Datos

Tu base de datos se almacena localmente en `./data/tldraw.db`. Simplemente copia este archivo o la carpeta completa del proyecto.

```bash
# Copia de seguridad del archivo de base de datos
cp ./data/tldraw.db ./tldraw-backup.db

# O copia de seguridad del proyecto completo
tar czf tldraw-backup.tar.gz .
```

### Mover a Otra Computadora

Simplemente copia toda tu carpeta de proyecto a la nueva computadora. El directorio `data` contiene tu base de datos.

```bash
# En la Computadora A
tar czf tldraw-project.tar.gz /path/to/tldraw

# Transfiere tldraw-project.tar.gz a la Computadora B

# En la Computadora B
tar xzf tldraw-project.tar.gz
cd tldraw
docker compose up -d --build
```

### Restablecer Todos los Datos

```bash
rm -rf ./data
docker compose restart
```

## Arquitectura

```
├── Dockerfile              # Construcción en un solo contenedor
├── docker-compose.yml      # Traefik + aplicación
├── server.js               # Sirve archivos estáticos + API REST
├── src/
│   ├── App.jsx             # Tldraw con sincronización de backend
│   ├── main.jsx
│   └── utils.js            # Función auxiliar de throttle
├── data/
│   └── tldraw.db           # Base de datos SQLite (creada automáticamente)
├── package.json            # Todas las dependencias
└── vite.config.js
```

## Endpoints de la API

- `GET /api/document/:id` - Cargar instantánea del documento
- `POST /api/document/:id` - Guardar instantánea del documento
- `GET /api/documents` - Listar todos los documentos
- `GET /health` - Verificación de estado del backend
