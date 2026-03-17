# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# CapRover bu ARG'ı build sırasında geçirir:
# Captain -> App Settings -> Build Args -> VITE_API_URL=https://api.alanadin.com
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Vite production build
RUN npm run build

# ---- Production Stage ----
FROM nginx:alpine

# Nginx config - React Router için history API fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Build çıktısını nginx'e kopyala
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
