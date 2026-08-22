# syntax=docker/dockerfile:1
FROM node:lts-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:lts-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG VITE_API_URL
RUN VITE_API_URL="${VITE_API_URL:-http://localhost:3011/api/v1}" npx vite build

FROM nginx:1.27-alpine AS runner
COPY deploy/nginx/spa.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
