# Dockerfile pour Bonjour Network
# Multi-stage build pour optimiser la taille de l'image

# Stage 1: Build du frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/client

# Copier les fichiers de configuration
COPY client/package*.json ./
COPY client/public ./public
COPY client/src ./src

# Installer les dépendances et builder
RUN npm ci --only=production
RUN npm run build

# Stage 2: Build du backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/server

# Copier les fichiers de configuration
COPY server/package*.json ./
COPY server/security ./security
COPY server/middleware ./middleware
COPY server/config ./config
COPY server/*.js ./
COPY server/data/manufacturers.json ./

# Installer les dépendances
RUN npm ci --only=production

# Stage 3: Image finale
FROM node:18-alpine AS production

# Installer les outils système nécessaires pour le scan WiFi
RUN apk add --no-cache \
    net-tools \
    iputils \
    nmap \
    arping \
    && rm -rf /var/cache/apk/*

# Créer l'utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs
RUN adduser -S bonjour-network -u 1001

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers du backend
COPY --from=backend-builder --chown=bonjour-network:nodejs /app/server ./server

# Copier les fichiers du frontend buildés
COPY --from=frontend-builder --chown=bonjour-network:nodejs /app/client/build ./client/build

# Créer les dossiers nécessaires
RUN mkdir -p /app/logs && chown -R bonjour-network:nodejs /app/logs

# Exposer le port
EXPOSE 5001

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=5001
ENV CORS_ORIGIN=http://localhost:3001

# Changer vers l'utilisateur non-root
USER bonjour-network

# Script de démarrage
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Point d'entrée
ENTRYPOINT ["docker-entrypoint.sh"] 