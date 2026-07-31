# HORUS - Plataforma de Vigilancia Ciudadana Colaborativa

![Estado](https://img.shields.io/badge/Estado-Local%20%2F%20Docker%20%2F%20Kubernetes-blue)
![Laravel](https://img.shields.io/badge/Laravel-12.0-red)
![React](https://img.shields.io/badge/React-19.0-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)
![PHP](https://img.shields.io/badge/PHP-8.3-777BB4)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Minikube-326CE5)
![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-Jaeger%20%2F%20Prometheus%20%2F%20Grafana-000000)

**HORUS** es una aplicación web de reportes ciudadanos geolocalizados que permite a los ciudadanos reportar, validar y comentar zonas de peligro en su ciudad mediante un sistema de verificación comunitaria basado en proximidad geográfica.

---

## Tabla de Contenidos

- [Arquitectura de Microservicios](#arquitectura-de-microservicios)
- [Microservicios](#microservicios)
- [Tecnologías](#tecnologías)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Ejecución Local](#instalación-y-ejecución-local)
- [Despliegue en Kubernetes (Minikube)](#despliegue-en-kubernetes-minikube)
- [Puertos del Sistema](#puertos-del-sistema)
- [Variables de Entorno](#variables-de-entorno)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Endpoints de la API](#endpoints-de-la-api)
- [Características Principales](#características-principales)

---

## Arquitectura de Microservicios

HORUS migró de un monolito Laravel a una **arquitectura de microservicios distribuidos**, donde cada dominio del negocio opera como un servicio independiente con su propia base de datos PostgreSQL.

```
Frontend React (localhost:5173)
         │
         ▼
 ┌──────────────────┐
 │   API Gateway    │  :8000  ← único punto de entrada
 │  (Laravel 12)    │         valida token, inyecta X-User-Id
 └──┬───┬───┬───┬───┘
    │   │   │   │
    ▼   ▼   ▼   ▼
 ┌──────────────────────────────────────────────┐
 │  auth      reports    votes     comments     │
 │  :8001     :8002      :8003     :8004        │
 │    │           │         │          │        │
 │ auth_db  reports_db  votes_db  comments_db  │
 │  :5433     :5434      :5435      :5436       │
 └──────────────────────────────────────────────┘
          (PostgreSQL 15 — una BD por servicio)
```

### Patrón de comunicación entre servicios

- **Gateway → auth-service:** valida el token Bearer antes de enrutar cualquier petición protegida.
- **reports-service → votes-service:** consulta el conteo de votos de cada reporte al listar.
- **votes-service → reports-service:** obtiene las coordenadas del reporte para calcular distancia (Haversine).
- **comments-service → reports-service:** verifica que el reporte exista antes de crear un comentario.

---

## Microservicios

| Servicio | Puerto | Base de Datos | Responsabilidad |
|---|---|---|---|
| **api-gateway** | 8000 | — | Enrutamiento, autenticación centralizada |
| **auth-service** | 8001 | horus_auth_db (5437) | Usuarios, tokens Sanctum, recuperación de contraseña |
| **reports-service** | 8002 | horus_reports_db (5434) | Reportes geolocalizados |
| **votes-service** | 8003 | horus_votes_db (5435) | Votos con validación de distancia (Haversine) |
| **comments-service** | 8004 | horus_comments_db (5436) | Comentarios anidados |

---

## Tecnologías

### Backend (microservicios)
- **Laravel 12** — Framework PHP para cada microservicio
- **PHP 8.3** — Lenguaje del servidor
- **Laravel Sanctum 4** — Autenticación stateless con tokens Bearer
- **PostgreSQL 15** — Una base de datos por microservicio
- **Laravel Http Client** — Comunicación REST entre servicios

### Frontend
- **React 19** — Biblioteca UI
- **Vite 7** — Build tool
- **React Router 7** — Enrutamiento SPA
- **Leaflet + React-Leaflet** — Mapas interactivos
- **Axios** — Cliente HTTP con interceptores
- **Tailwind CSS 4** — Framework CSS

### Infraestructura
- **Docker** — Contenedores para cada servicio
- **Docker Compose** — Orquestación de los 9 contenedores (entorno local simple)
- **Kubernetes (Minikube)** — Orquestación alternativa con Deployments, Services, ConfigMaps/Secrets, PVCs y NetworkPolicies
- **OpenTelemetry** — Instrumentación zero-code (HTTP, PDO, Guzzle) exportando vía OTLP
- **Jaeger** — Trazas distribuidas entre microservicios
- **Prometheus + Grafana** — Métricas y dashboards
- **GitHub** — Control de versiones

---

## Requisitos Previos

Solo necesitas tener instalado:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (incluye Docker Compose)
- [Node.js 18+](https://nodejs.org/) (solo para el frontend)
- [Git](https://git-scm.com/)

No necesitas PHP, Composer ni PostgreSQL instalados localmente — Docker los provee.

---

## Instalación y Ejecución Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/DarwinToapanta01/horus.git
cd horus
```

### 2. Levantar todos los microservicios con Docker

```bash
docker-compose up --build
```

Este comando:
- Descarga las imágenes base (PHP 8.3 + PostgreSQL 15)
- Instala dependencias de Composer en cada servicio
- Genera las APP_KEY de cada servicio
- Ejecuta las migraciones en cada base de datos
- Levanta los 9 contenedores (5 servicios + 4 BDs)

> La primera ejecución tarda varios minutos por la descarga de imágenes. Las siguientes son mucho más rápidas.

### 3. Levantar el frontend

En una terminal separada:

```bash
cd horus-client
npm install
npm run dev
```

### 4. Abrir la aplicación

```
http://localhost:5173
```

### Detener el sistema

```bash
docker-compose down
```

Para detener y eliminar también los volúmenes (borra los datos de las BDs):

```bash
docker-compose down -v
```

---

## Despliegue en Kubernetes (Minikube)

Además de Docker Compose, HORUS puede desplegarse completo en un clúster de Kubernetes local (Minikube), con los 5 microservicios, las 4 bases de datos y un stack de observabilidad (**OpenTelemetry Collector + Jaeger + Prometheus + Grafana**) instrumentado de forma *zero-code* en cada servicio Laravel.

### Requisitos adicionales

- [Minikube](https://minikube.sigs.k8s.io/docs/start/)
- `kubectl` (se instala junto con Docker Desktop o por separado)
- Docker Desktop corriendo (Minikube usa su daemon como driver `docker`)

### 1. Iniciar Minikube

```powershell
minikube start
```

### 2. Construir las imágenes dentro del daemon Docker de Minikube

Minikube usa su **propio** daemon Docker, aislado del de Docker Desktop. Hay que apuntar la shell hacia él antes de construir las imágenes, para que los Deployments (que usan `imagePullPolicy: Never`) las encuentren localmente sin necesidad de un registry:

```powershell
minikube docker-env | Invoke-Expression

docker build -t horus/auth-service:otel     ./auth-service
docker build -t horus/reports-service:otel  ./reports-service
docker build -t horus/votes-service:otel    ./votes-service
docker build -t horus/comments-service:otel ./comments-service
docker build -t horus/api-gateway:otel      ./api-gateway
```

> Cada Dockerfile instala la extensión PECL `opentelemetry` y los paquetes Composer `open-telemetry/sdk`, `open-telemetry/exporter-otlp` y los paquetes `opentelemetry-auto-*` (Laravel, Guzzle, PDO). Esto instrumenta HTTP, consultas SQL y llamadas salientes entre microservicios **sin tocar el código de la aplicación**, exportando trazas vía OTLP/HTTP al collector.

### 3. Desplegar todos los manifiestos

El script `k8s/deploy.ps1` aplica los recursos respetando el orden de dependencias (namespaces → secrets/configmaps → storage → deployments → services → networking → observabilidad):

```powershell
.\k8s\deploy.ps1
```

Verifica que todo quede en estado `Running`:

```powershell
kubectl get pods -n horus
kubectl get pods -n observability
```

### 4. Exponer los servicios (port-forward)

```powershell
# Frontend -> API Gateway
kubectl port-forward -n horus svc/api-gateway 8000:8000

# Trazas distribuidas
kubectl port-forward -n observability svc/jaeger 16686:16686

# Métricas
kubectl port-forward -n observability svc/prometheus 9090:9090

# Dashboards
kubectl port-forward -n observability svc/grafana 3000:3000
```

| Herramienta | URL | Credenciales |
|---|---|---|
| API Gateway | http://localhost:8000 | — |
| Jaeger UI (trazas) | http://localhost:16686 | — |
| Prometheus | http://localhost:9090 | — |
| Grafana | http://localhost:3000 | `admin` / `admin` |

En Jaeger, selecciona cualquiera de los 5 servicios (`api-gateway`, `auth-service`, `reports-service`, `votes-service`, `comments-service`) para ver trazas con spans anidados de HTTP, consultas PDO y llamadas Guzzle entre microservicios.

### 5. Eliminar el despliegue

```powershell
.\k8s\destroy.ps1
```

Esto borra los namespaces `horus` y `observability` (y todo lo que contienen), pero **conserva los PersistentVolumes** (los datos de Postgres sobreviven) porque tienen `reclaimPolicy: Retain`. Para borrarlos también:

```powershell
.\k8s\destroy.ps1 -DeleteVolumes
```

### Notas de la migración a Kubernetes

- Los manifiestos `Deployment` usan el tag `:otel` de cada imagen y variables `OTEL_*` inyectadas vía ConfigMap (`OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector.observability.svc.cluster.local:4318`, etc.).
- El `CMD` de cada Dockerfile ejecuta `php artisan serve --no-reload ...`. La bandera `--no-reload` es necesaria: sin ella, Laravel filtra el entorno del proceso que sirve las peticiones HTTP a una lista blanca fija (ver `ServeCommand::$passthroughVariables`) cuando detecta un `.env` en el proyecto, descartando `DB_HOST`, `DB_PASSWORD` y el resto de variables inyectadas por Kubernetes.

### Guía Rápida: Encender, Verificar y Apagar (para la exposición)

Antes que nada, entender **quién es quién**, porque es justo lo que suele preguntar el docente:

- **Docker Desktop** — el motor de contenedores de tu PC. No corre Kubernetes directamente; solo hospeda contenedores.
- **Minikube** — tu clúster de Kubernetes de un solo nodo. En realidad **es un contenedor Docker** (se ve como `minikube` en `docker ps`), que por dentro simula un servidor completo de Kubernetes.
- **kubectl** — el comando con el que le hablas al clúster (desplegar, listar, borrar recursos).
- Los 9 pods de HORUS (5 microservicios + 4 BDs) y los 4 de observabilidad corren **dentro** de Minikube, no como contenedores sueltos de Docker Desktop.

> Por eso: **el clúster no se apaga desde la interfaz gráfica de Docker Desktop** (ahí solo verías el contenedor `minikube` corriendo, sin control sobre lo que hay adentro). Se apaga con comandos de `minikube`/`kubectl`.

#### Encender todo (orden recomendado)

```powershell
# 1. Abrir Docker Desktop y esperar a que el ícono quede estable (GUI)

# 2. Encender el clúster (si ya existía, lo reanuda tal cual quedó)
minikube start

# 3. Solo si cambiaste código de algún servicio, reconstruir su imagen:
minikube docker-env | Invoke-Expression
docker build -t horus/auth-service:otel ./auth-service   # repetir por servicio si aplica

# 4. Aplicar los manifiestos (es seguro repetirlo, no rompe nada si ya estaba desplegado)
.\k8s\deploy.ps1

# 5. Exponer los servicios (cada uno en su propia terminal, deben quedar abiertas)
kubectl port-forward -n horus svc/api-gateway 8080:8000
kubectl port-forward -n observability svc/jaeger 16686:16686
kubectl port-forward -n observability svc/grafana 3000:3000
kubectl port-forward -n observability svc/prometheus 9090:9090

# 6. Frontend (otra terminal más)
cd horus-client
npm run dev
```

#### Verificar que está corriendo (si el docente pregunta "¿está activo?")

```powershell
minikube status              # Estado del clúster
kubectl get pods -n horus    # Los 9 pods de la aplicación
kubectl get pods -n observability   # Los 4 pods de telemetría
kubectl get all -n horus     # Deployments + Services + Pods juntos
```

Todos los pods deben mostrar `Running` en la columna `STATUS`.

#### Apagar (de más suave a más destructivo)

| Quiero... | Comando | Qué pasa |
|---|---|---|
| Cerrar solo las ventanas de demo entre pruebas | `Ctrl+C` en cada `port-forward` y en `npm run dev` | El clúster sigue corriendo en segundo plano, no pierdes nada |
| **Apagar el clúster** (respuesta correcta si piden "apaga el clúster") | `minikube stop` | Detiene todos los pods pero conserva el estado en disco; `minikube start` lo devuelve exactamente igual, sin repetir `deploy.ps1` |
| Reiniciar solo la app, sin apagar Minikube | `.\k8s\destroy.ps1` | Borra los namespaces `horus` y `observability` (y todo lo que contienen); Minikube sigue encendido |
| Borrar el clúster por completo | `minikube delete` | Elimina Minikube entero; hay que volver a `minikube start` + build + `deploy.ps1` desde cero |
| Apagar Docker Desktop | Cerrar la app | Apaga TODO de golpe (incluye Minikube y cualquier otro contenedor tuyo, como un stack de Docker Compose que tengas activo aparte) — no es necesario para apagar solo el clúster |

**Respuesta corta para el docente:** *"El clúster se apaga con `minikube stop`, no desde Docker Desktop. Docker Desktop es solo el motor que hospeda el contenedor de Minikube; `minikube stop` apaga el clúster de Kubernetes completo (todos los pods) mientras conserva su estado, y `minikube start` lo reanuda tal como estaba."*

---

## Puertos del Sistema

| Servicio | URL local | Descripción |
|---|---|---|
| Frontend | http://localhost:5173 | Aplicación React |
| API Gateway | http://localhost:8000 | Entrada única de la API |
| auth-service | http://localhost:8001 | (directo, solo desarrollo) |
| reports-service | http://localhost:8002 | (directo, solo desarrollo) |
| votes-service | http://localhost:8003 | (directo, solo desarrollo) |
| comments-service | http://localhost:8004 | (directo, solo desarrollo) |
| horus_auth_db | localhost:5437 | PostgreSQL — usuarios |
| horus_reports_db | localhost:5434 | PostgreSQL — reportes |
| horus_votes_db | localhost:5435 | PostgreSQL — votos |
| horus_comments_db | localhost:5436 | PostgreSQL — comentarios |

### Conectar las BDs en pgAdmin

Crea una conexión por cada base de datos:

| Campo | Valor |
|---|---|
| Host | `localhost` |
| Usuario | `postgres` |
| Contraseña | `1234` |
| Puerto | Ver tabla de puertos arriba |

---

## Variables de Entorno

Cada microservicio tiene su propio `.env`. Los valores críticos son inyectados por Docker Compose y no necesitan modificarse para el entorno local.

### Frontend (horus-client/.env)

```env
VITE_API_URL=http://localhost:8000/api
```

### Ejemplo — auth-service/.env

```env
APP_NAME=Horus-Auth
APP_PORT=8001
DB_CONNECTION=pgsql
DB_HOST=auth_db        # nombre del contenedor Docker
DB_PORT=5432
DB_DATABASE=horus_auth_db
DB_USERNAME=postgres
DB_PASSWORD=****
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

> Los demás servicios siguen la misma estructura cambiando el nombre de la BD y el host.

---

## Estructura del Proyecto

```
horus-project/
│
├── docker-compose.yml          ← orquesta los 9 contenedores
├── .gitignore
│
├── k8s/                         ← manifiestos de Kubernetes (alternativa a Docker Compose)
│   ├── namespaces/, configmaps/, secrets/
│   ├── persistent-volumes(-claims)/  ← almacenamiento de las 4 BDs
│   ├── deployments/, services/       ← los 5 microservicios + las 4 BDs
│   ├── network-policies/, ingress/
│   ├── otel/                         ← OTel Collector + Jaeger
│   ├── monitoring/                   ← Prometheus + Grafana
│   └── deploy.ps1 / destroy.ps1
│
├── api-gateway/                ← Puerto 8000 — entrada única
│   ├── app/Http/Controllers/Api/GatewayController.php
│   ├── app/Http/Middleware/GatewayAuth.php
│   ├── config/services.php     ← URLs internas de cada servicio
│   ├── routes/api.php
│   └── Dockerfile
│
├── auth-service/               ← Puerto 8001 — autenticación
│   ├── app/Http/Controllers/Api/AuthController.php
│   ├── app/Models/User.php
│   ├── app/Mail/RecuperarPasswordMail.php
│   ├── database/migrations/
│   ├── routes/api.php
│   └── Dockerfile
│
├── reports-service/            ← Puerto 8002 — reportes
│   ├── app/Http/Controllers/Api/ReportController.php
│   ├── app/Models/Report.php
│   ├── database/migrations/
│   ├── routes/api.php
│   └── Dockerfile
│
├── votes-service/              ← Puerto 8003 — votos + Haversine
│   ├── app/Http/Controllers/Api/VoteController.php
│   ├── app/Models/Vote.php
│   ├── database/migrations/
│   ├── routes/api.php
│   └── Dockerfile
│
├── comments-service/           ← Puerto 8004 — comentarios
│   ├── app/Http/Controllers/Api/CommentController.php
│   ├── app/Models/Comment.php
│   ├── database/migrations/
│   ├── routes/api.php
│   └── Dockerfile
│
└── horus-client/               ← Frontend React + Vite
    ├── src/
    │   ├── api/axios.js
    │   ├── views/
    │   └── components/
    ├── .env
    └── package.json
```

---

## Endpoints de la API

Todos los endpoints se consumen a través del **API Gateway en `http://localhost:8000`**.

### Públicos (sin token)

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/register` | Registrar nuevo usuario |
| `POST` | `/api/login` | Iniciar sesión — retorna token Bearer |
| `POST` | `/api/forgot-password` | Enviar contraseña temporal por email |

### Protegidos (`Authorization: Bearer <token>`)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/user` | Datos del usuario autenticado |
| `GET` | `/api/reports` | Listar reportes activos con votos |
| `POST` | `/api/reports` | Crear nuevo reporte |
| `GET` | `/api/reports/{id}` | Detalle de un reporte |
| `POST` | `/api/votes` | Votar (valida distancia ≤ 20 km) |
| `POST` | `/api/change-password` | Cambiar contraseña |
| `GET` | `/api/reports/{id}/comments` | Comentarios de un reporte |
| `POST` | `/api/comments` | Crear comentario o respuesta |

---

## Características Principales

### Autenticación
- Registro e inicio de sesión con tokens Bearer (Laravel Sanctum)
- Recuperación de contraseña por correo electrónico con clave temporal
- Cifrado de contraseñas con bcrypt

### Reportes Geolocalizados
- Coordenadas geográficas (latitud/longitud), radio de impacto (100–5000 m) y nivel de peligro (0–100)
- Mapa interactivo con Leaflet.js en modo oscuro
- Círculos de colores según nivel de riesgo (verde / naranja / rojo)
- Los reportes expiran automáticamente a las 48 horas

### Validación Comunitaria
- Votos de confirmación o rechazo por reporte
- Validación de proximidad con **fórmula de Haversine** (máximo 20 km)
- Un usuario = un voto por reporte (restricción a nivel de base de datos)

### Comentarios
- Comentarios anidados con soporte para respuestas (campo `parent_id`)
- Ordenados del más reciente al más antiguo

---

## Autor

**Darwin Toapanta**
- **Email:** datoapanta11@espe.edu.ec
