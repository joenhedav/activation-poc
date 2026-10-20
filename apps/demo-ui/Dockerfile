# demo-ui: se compila con Vite y se sirve con nginx.
# El contexto es apps/demo-ui (la UI tiene su propio package.json).
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# URL de la API tal como la ve el NAVEGADOR (no el contenedor).
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
