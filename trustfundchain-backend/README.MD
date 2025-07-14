# TRUSTFUNDCHAIN Backend

## Descripción
Backend para la plataforma TRUSTFUNDCHAIN, que permite la gestión de identidades digitales, donaciones y transparencia.

## Instalación
1. Clona el repositorio.
2. Ejecuta `npm install` para instalar las dependencias.
3. Configura el archivo `.env` basado en `.env.example`.
4. Inicia el servidor con `npm run dev`.

## Rutas
- `POST /api/identity/create`: Crear una nueva identidad.
- `GET /api/transparency`: Obtener datos de transparencia.
- `POST /api/donations`: Crear una nueva donación.