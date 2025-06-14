# Etapa 1: Build
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Instalar dependencias del sistema necesarias para paquetes nativos (opcional)
RUN apk add --no-cache python3 make g++

# Copiar e instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el resto del código y build
COPY . .
RUN npm run build

# Etapa 2: Imagen de producción
FROM node:20-alpine

WORKDIR /app

# Copiar dependencias del sistema necesarias (si tenés módulos nativos como serialport/usb)
RUN apk add --no-cache python3 make g++

# Copiar solo lo necesario desde el builder
COPY --from=frontend-builder /app/package*.json ./
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/public ./public
COPY --from=frontend-builder /app/node_modules ./node_modules

# (Opcional) Si usás TailwindCSS o PostCSS, podés copiar también:
# COPY --from=frontend-builder /app/tailwind.config.js ./tailwind.config.js
# COPY --from=frontend-builder /app/postcss.config.js ./postcss.config.js

# Copiar archivo next.config.js si lo usás
# COPY --from=frontend-builder /app/next.config.js ./next.config.js

ENV NODE_ENV=production

# Puerto en el que escucha la app
EXPOSE 3001

# Comando para levantar Next.js en producción
CMD ["npm", "start"]
