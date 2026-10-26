# 1) Compilar la app con Vite
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Direcciones de los servicios tal como las ve el navegador
ARG VITE_AUTH_URL=http://localhost:4000
ARG VITE_API_URL=http://localhost:3000
ENV VITE_AUTH_URL=$VITE_AUTH_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# 2) Servir los archivos con nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
