# 🚗 Galaga Travel Service

Microservicio REST para la gestión de viajes compartidos, parte de la plataforma **RIDECI LEGACY**.

Construido con **NestJS**, **MongoDB** (a través de Prisma ORM) y **RabbitMQ** para la comunicación asíncrona entre microservicios.

---

# 🛠️ Tecnologías Principales

| Tecnología                  | Uso                                 |
| --------------------------- | ----------------------------------- |
| 🚀 NestJS 11                | Framework principal                 |
| 🍃 MongoDB + Prisma 6       | Base de datos y ORM                 |
| 📨 RabbitMQ (amqplib)       | Mensajería basada en eventos        |
| 📖 Swagger / OpenAPI        | Documentación interactiva de la API |
| 📊 Prometheus (prom-client) | Monitoreo y métricas                |
| ✅ class-validator           | Validación de DTOs                  |

---

# 🏗️ Arquitectura

El servicio implementa **Arquitectura Hexagonal (Ports & Adapters)** para mantener desacoplada la lógica de negocio de los detalles de infraestructura.

```text
src/
├── travels/
│   ├── domain/              # 🧠 Entidades y enums del negocio
│   ├── application/
│   │   ├── service/         # ⚙️ Casos de uso y lógica de negocio
│   │   ├── ports/out/       # 🔌 Interfaces (repositorios y publicadores)
│   │   └── events/          # 📡 Eventos de dominio
│   └── infrastructure/
│       ├── controller/      # 🌐 Controladores HTTP + DTOs
│       ├── persistence/     # 💾 Adaptador Prisma/MongoDB
│       └── rabbit/          # 🐇 Adaptador RabbitMQ
└── metrics/                 # 📈 Métricas Prometheus
```

---

# ⚙️ Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto usando `.env.example` como referencia:

```env
DATABASE_URL=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/<database>
RABBITMQ_URL=amqp://localhost
PORT=3000
```

> ⚠️ Si RabbitMQ no está disponible, el servicio iniciará normalmente, pero no publicará eventos.

---

# 🚀 Instalación y Ejecución

## 📋 Prerequisitos

* Node.js 18 o superior
* pnpm
* MongoDB (local o Atlas)
* RabbitMQ (opcional)

---

## 1️⃣ Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd galaga-travel-service
```

## 2️⃣ Instalar dependencias

```bash
pnpm install
```

## 3️⃣ Configurar variables de entorno

```bash
cp .env.example .env
```

Editar el archivo `.env` con las credenciales correspondientes.

## 4️⃣ Generar cliente Prisma

```bash
pnpm exec prisma generate
```

## 5️⃣ Ejecutar el servicio

### 🔥 Desarrollo

```bash
pnpm run start:dev
```

### 📦 Producción

```bash
pnpm run build
pnpm run start:prod
```

---

## ✅ Verificar funcionamiento

| Recurso                | URL                           |
| ---------------------- | ----------------------------- |
| 🌐 API                 | http://localhost:3000         |
| 📖 Swagger UI          | http://localhost:3000/docs    |
| 📈 Métricas Prometheus | http://localhost:3000/metrics |

---

# 🛣️ Endpoints

**Base URL:** `/travels`

| Método       | Endpoint                          | Descripción                  | Evento RabbitMQ             |
| ------------ | --------------------------------- | ---------------------------- | --------------------------- |
| ➕ POST       | `/travels`                        | Crear un viaje               | `travel.created`            |
| 📋 GET       | `/travels/all`                    | Obtener todos los viajes     | —                           |
| 🔍 GET       | `/travels/:id`                    | Obtener viaje por ID         | —                           |
| 🚗 GET       | `/travels/driver/:driverId`       | Viajes por conductor         | —                           |
| 👤 GET       | `/travels/organizer/:organizerId` | Viajes por organizador       | —                           |
| 🧑‍🤝‍🧑 GET | `/travels/passenger/:passengerId` | Viajes por pasajero          | —                           |
| 📄 GET       | `/travels/occupantList/:id`       | Lista de pasajeros del viaje | —                           |
| ✏️ PUT       | `/travels/:id`                    | Actualizar viaje completo    | `travel.updated`            |
| 🔄 PATCH     | `/travels/:id`                    | Cambiar estado del viaje     | `travel.completed`          |
| 🎫 PATCH     | `/travels/:id/slots`              | Actualizar cupos disponibles | —                           |
| 👥 PATCH     | `/travels/:id/passengers`         | Actualizar pasajeros         | `travel.passengers.updated` |
| ❌ DELETE     | `/travels/:id`                    | Eliminar viaje               | `travel.cancelled`          |
| 📈 GET       | `/metrics`                        | Métricas Prometheus          | —                           |

---

# 📦 Modelo Principal

## CreateTravelDto

```json
{
  "organizerId": 1,
  "driverId": 2,
  "availableSlots": 3,
  "status": "CREATED",
  "travelType": "DAILY",
  "vehicleType": "CAR",
  "estimatedCost": 5000,
  "departureDateAndTime": "2025-06-10T08:00:00.000Z",
  "passengersId": [10, 11],
  "conditions": "No mascotas",
  "origin": {
    "latitude": 6.2442,
    "longitude": -75.5812,
    "direction": "Calle 50 # 40-20, Medellín"
  },
  "destination": {
    "latitude": 6.2530,
    "longitude": -75.5749,
    "direction": "Carrera 70 # 45-10, Medellín"
  },
  "durationMinutes": 25
}
```

---

# 📑 Enumeraciones

| Campo          | Valores Permitidos                                    |
| -------------- | ----------------------------------------------------- |
| 🚦 Status      | `CREATED` · `IN_PROGRESS` · `COMPLETED` · `CANCELLED` |
| 🗓️ TravelType | `DAILY` · `OCCASIONAL`                                |
| 🚘 VehicleType | `CAR` · `MOTORCYCLE` · `BUS` · `BICYCLE`              |

---

# 📨 Eventos Publicados en RabbitMQ

**Exchange:** `travel.exchange` *(tipo: topic)*

| Evento                 | Routing Key                 | Descripción           |
| ---------------------- | --------------------------- | --------------------- |
| 🎉 TravelCreatedEvent  | `travel.created`            | Se crea un viaje      |
| ✏️ TravelUpdatedEvent  | `travel.updated`            | Se actualiza un viaje |
| ✅ TravelCompletedEvent | `travel.completed`          | El viaje finaliza     |
| ❌ TravelCancelledEvent | `travel.cancelled`          | El viaje es cancelado |
| 👥 TravelUpdatedEvent  | `travel.passengers.updated` | Cambian los pasajeros |

---

# 📖 Documentación Swagger

![Swagger](docs/img/swagger.png)

---

# 📊 Métricas Prometheus

![Métricas](docs/img/metricas.png)

---

# Mas imagenes
