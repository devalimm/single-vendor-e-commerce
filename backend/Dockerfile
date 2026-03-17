# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

# ---- Production Stage ----
FROM node:20-alpine

WORKDIR /app

# Sadece üretim bağımlılıklarını ve kaynak kodunu kopyala
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# uploads klasörü runtime'da oluşturulur (CapRover volume ile mount edilmeli)
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "server.js"]
