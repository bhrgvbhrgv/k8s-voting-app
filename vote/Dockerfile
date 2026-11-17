# Build React client
FROM node:20-alpine AS build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Production server
FROM node:20-alpine AS final
WORKDIR /usr/local/app
COPY package*.json ./
RUN npm ci --only=production
COPY server.js ./
COPY --from=build /app/dist ./dist

EXPOSE 80
ENV PORT=80
CMD ["node", "server.js"]
