# TripTailor Backend API

Backend REST API para la plataforma TripTailor - Gestión de usuarios, actividades locales e itinerarios personalizados.

## 🚀 Stack Tecnológico

- **Framework**: NestJS (TypeScript)
- **ORM**: Prisma
- **Base de datos**: PostgreSQL
- **Autenticación**: JWT
- **Documentación**: Swagger/OpenAPI
- **Validación**: class-validator y class-transformer

## 📋 Requisitos Previos

- Node.js (v18 o superior)
- npm o yarn
- PostgreSQL (v15 o superior)
- Docker y Docker Compose (opcional, para levantar PostgreSQL fácilmente)

## 🛠️ Instalación

1. **Clonar el repositorio** (si aplica) o navegar al directorio del proyecto

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   
   Copia el archivo `.env.example` a `.env` y ajusta los valores:
   ```bash
   cp .env.example .env
   ```
   
   Edita `.env` con tus credenciales:
   ```env
   DATABASE_URL="postgresql://trip_tailor_user:password@localhost:5432/trip_tailor_db?schema=public"
   JWT_SECRET="cambiar-por-algo-seguro-en-produccion"
   ```

4. **Levantar PostgreSQL con Docker** (opcional):
   ```bash
   docker-compose up -d
   ```

5. **Configurar Prisma**:
   ```bash
   # Generar el cliente de Prisma
   npm run prisma:generate
   
   # Ejecutar migraciones
   npm run prisma:migrate
   
   # Poblar la base de datos con datos de ejemplo
   npm run prisma:seed
   ```

## 🏃 Ejecución

### Modo desarrollo
```bash
npm run start:dev
```

### Modo producción
```bash
npm run build
npm run start:prod
```

La aplicación estará disponible en `http://localhost:3000`

## 📚 Documentación API

Una vez que la aplicación esté ejecutándose, accede a la documentación Swagger en:

**http://localhost:3000/api/docs**

## 🏗️ Estructura del Proyecto

```
src/
├── auth/              # Módulo de autenticación (JWT, registro, login)
├── users/             # Módulo de usuarios (perfil, actualización)
├── cities/            # Módulo de ciudades
├── activities/        # Módulo de actividades (CRUD con filtros)
├── itineraries/       # Módulo de itinerarios (generación y CRUD)
├── health/            # Módulo de health check
├── prisma/            # Servicio y módulo de Prisma
├── app.module.ts      # Módulo principal
└── main.ts            # Punto de entrada de la aplicación
```

## 🔐 Autenticación

La API utiliza JWT (JSON Web Tokens) para autenticación. Para acceder a endpoints protegidos:

1. Registra un usuario en `POST /api/auth/register`
2. Inicia sesión en `POST /api/auth/login` para obtener un token
3. Incluye el token en las peticiones usando el header:
   ```
   Authorization: Bearer <tu-token>
   ```

## 📝 Endpoints Principales

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión

### Usuarios
- `GET /api/users/me` - Obtener perfil (protegido)
- `PATCH /api/users/me` - Actualizar perfil (protegido)

### Ciudades
- `GET /api/cities` - Listar ciudades activas
- `GET /api/cities/:id` - Obtener detalle de ciudad

### Actividades
- `GET /api/activities` - Listar actividades (con filtros y paginación)
- `GET /api/activities/:id` - Obtener detalle de actividad
- `POST /api/activities` - Crear actividad (protegido)
- `PATCH /api/activities/:id` - Actualizar actividad (protegido)
- `DELETE /api/activities/:id` - Eliminar actividad (protegido)

### Itinerarios
- `POST /api/itineraries/generate` - Generar itinerario (protegido)
- `GET /api/itineraries` - Listar itinerarios del usuario (protegido)
- `GET /api/itineraries/:id` - Obtener detalle de itinerario (protegido)
- `PATCH /api/itineraries/:id` - Actualizar itinerario (protegido)
- `DELETE /api/itineraries/:id` - Eliminar itinerario (protegido)

### Health
- `GET /api/health` - Verificar estado del servicio

## 🗄️ Base de Datos

El proyecto utiliza Prisma como ORM. Los modelos principales son:

- **User**: Usuarios del sistema
- **City**: Ciudades disponibles
- **Activity**: Actividades locales
- **Itinerary**: Itinerarios de usuarios
- **ItineraryDay**: Días de un itinerario
- **ItineraryActivity**: Actividades asignadas a días

### Scripts de Prisma

```bash
# Generar cliente Prisma
npm run prisma:generate

# Crear y aplicar migraciones
npm run prisma:migrate

# Abrir Prisma Studio (interfaz visual)
npm run prisma:studio

# Ejecutar seed
npm run prisma:seed
```

## 🌱 Datos de Ejemplo

El seed incluye:
- Ciudad piloto: **Cusco, Perú**
- 12 actividades de ejemplo (gastronomía, aventura, cultura, etc.)
- Usuario demo: `demo@triptailor.com` / `password123`

## 🔒 Seguridad

- Las contraseñas se hashean con bcrypt
- Los tokens JWT expiran en 7 días
- Validación de datos con class-validator
- Protección de rutas con guards JWT
- Los usuarios solo pueden acceder a sus propios itinerarios

## 🧪 Testing

```bash
# Ejecutar tests unitarios
npm run test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con cobertura
npm run test:cov

# Ejecutar tests e2e
npm run test:e2e
```

## 📦 Scripts Disponibles

- `npm run start:dev` - Iniciar en modo desarrollo (watch)
- `npm run build` - Compilar para producción
- `npm run start:prod` - Iniciar en modo producción
- `npm run prisma:generate` - Generar cliente Prisma
- `npm run prisma:migrate` - Ejecutar migraciones
- `npm run prisma:seed` - Poblar base de datos
- `npm run prisma:studio` - Abrir Prisma Studio

## 🚧 Próximas Mejoras

- Integración con APIs externas (vuelos, hoteles)
- Sistema de roles y permisos
- Recomendaciones más inteligentes
- Soporte para múltiples ciudades
- Sistema de favoritos
- Compartir itinerarios
- Notificaciones

## 📄 Licencia

MIT

## 👤 Autor

TripTailor Team

