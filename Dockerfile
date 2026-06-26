# Stage 1: Build Angular app
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG BUILD_CONFIGURATION=docker
RUN npm run build:${BUILD_CONFIGURATION}

# Stage 2: Serve with Nginx
FROM nginx:1.27-alpine

ENV BACKEND_HOST=pieml-backend \
    BACKEND_PORT=7000

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/pieml-frontend/browser /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
