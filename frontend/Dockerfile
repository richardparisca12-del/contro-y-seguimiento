# Etapa 1: Compilación de la aplicación React con Vite
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar solo package.json para resolver e instalar dependencias limpias dentro del contenedor
COPY package.json ./
RUN npm install

# Copiar el código fuente y compilar el frontend
COPY . .
RUN npm run build

# Etapa 2: Servidor Nginx ultra ligero para producción
FROM nginx:alpine

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar bundle compilado desde la etapa anterior
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
