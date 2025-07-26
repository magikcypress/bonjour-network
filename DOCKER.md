# 🐳 Docker - Bonjour Network

Guide complet pour déployer Bonjour Network avec Docker.

## 🚀 Installation Rapide

### **Option 1 : Script automatique (Recommandé)**

```bash
# Cloner le projet
git clone https://github.com/magikcypress/bonjour-network.git
cd bonjour-network

# Installation automatique
./scripts/docker-setup.sh --auto
```

### **Option 2 : Docker Compose**

```bash
# Cloner le projet
git clone https://github.com/magikcypress/bonjour-network.git
cd bonjour-network

# Démarrer
docker-compose up -d

# Accéder à l'application
# http://localhost:5001
```

### **Option 3 : Docker seul**

```bash
# Cloner le projet
git clone https://github.com/magikcypress/bonjour-network.git
cd bonjour-network

# Builder l'image
docker build -t bonjour-network .

# Démarrer le conteneur
docker run -d \
  --name bonjour-network \
  --network host \
  --privileged \
  -p 5001:5001 \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/data:/app/data \
  bonjour-network
```

## 🔧 Configuration

### **Variables d'environnement**

```bash
# Configuration de base
NODE_ENV=production
PORT=5001
CORS_ORIGIN=http://localhost:3001

# Configuration des timeouts
REQUEST_TIMEOUT=30000
SCAN_TIMEOUT=10000

# Configuration des intervalles
WIFI_SCAN_INTERVAL=30000
DEVICE_SCAN_INTERVAL=60000

# Configuration des logs
LOG_LEVEL=info

# Configuration Mistral AI (optionnel)
MISTRAL_AI_URL=https://api.mistral.ai
MISTRAL_AI_KEY=your-api-key-here

# Configuration JWT (optionnel)
JWT_SECRET=your-jwt-secret-here
```

### **Exemple avec variables personnalisées**

```bash
docker run -d \
  --name bonjour-network \
  --network host \
  --privileged \
  -p 5001:5001 \
  -e MISTRAL_AI_KEY=your-api-key \
  -e LOG_LEVEL=debug \
  -e SCAN_TIMEOUT=5000 \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/data:/app/data \
  bonjour-network
```

## 📁 Volumes et Persistance

### **Dossiers montés**

```bash
# Logs de l'application
-v $(pwd)/logs:/app/logs

# Données persistantes
-v $(pwd)/data:/app/data
```

### **Création des dossiers**

```bash
mkdir -p logs
mkdir -p data
```

## 🔒 Sécurité

### **Configuration sécurisée**

- **Utilisateur non-root** : Le conteneur fonctionne avec l'utilisateur `bonjour-network` (UID 1001)
- **Mode privilégié** : Nécessaire pour accéder aux interfaces réseau
- **Network host** : Accès direct au réseau pour le scan WiFi
- **Volumes persistants** : Logs et données sauvegardés

### **Bonnes pratiques**

```bash
# Vérifier les permissions
docker exec bonjour-network id

# Voir les logs de sécurité
docker logs bonjour-network | grep -i security

# Vérifier les processus
docker exec bonjour-network ps aux
```

## 🛠️ Commandes Utiles

### **Gestion des conteneurs**

```bash
# Voir le statut
docker-compose ps

# Voir les logs
docker-compose logs -f

# Redémarrer
docker-compose restart

# Arrêter
docker-compose down

# Mettre à jour
docker-compose pull && docker-compose up -d
```

### **Développement**

```bash
# Mode développement
docker-compose --profile dev up -d

# Rebuilder l'image
docker-compose build --no-cache

# Accéder au conteneur
docker exec -it bonjour-network sh
```

### **Nettoyage**

```bash
# Supprimer conteneurs et images
docker-compose down --rmi all --volumes --remove-orphans

# Nettoyer Docker
docker system prune -f

# Supprimer tout
docker system prune -a --volumes
```

## 🔍 Dépannage

### **Problèmes courants**

#### **1. Port déjà utilisé**

```bash
# Vérifier les ports utilisés
lsof -i :5001

# Changer le port
docker run -p 5002:5001 bonjour-network
```

#### **2. Permissions réseau**

```bash
# Vérifier les permissions
docker exec bonjour-network ifconfig

# Redémarrer avec privilèges
docker run --privileged --network host bonjour-network
```

#### **3. Logs d'erreur**

```bash
# Voir les logs détaillés
docker logs bonjour-network

# Suivre les logs en temps réel
docker logs -f bonjour-network
```

### **Vérification de l'installation**

```bash
# Tester l'API
curl http://localhost:5001/api/networks

# Vérifier la santé
docker exec bonjour-network wget -qO- http://localhost:5001/api/networks
```

## 📊 Monitoring

### **Statistiques du conteneur**

```bash
# Ressources utilisées
docker stats bonjour-network

# Informations détaillées
docker inspect bonjour-network
```

### **Logs structurés**

```bash
# Logs d'application
docker logs bonjour-network | grep "Bonjour Network"

# Logs de sécurité
docker logs bonjour-network | grep -i security

# Logs d'erreur
docker logs bonjour-network | grep -i error
```

## 🚀 Production

### **Configuration recommandée**

```bash
# docker-compose.prod.yml
version: '3.8'
services:
  bonjour-network:
    build: .
    container_name: bonjour-network-prod
    restart: unless-stopped
    network_mode: host
    privileged: true
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=warn
    volumes:
      - ./logs:/app/logs
      - ./data:/app/data
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:5001/api/networks"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### **Déploiement avec Docker Swarm**

```bash
# Initialiser Swarm
docker swarm init

# Déployer le service
docker stack deploy -c docker-compose.yml bonjour-network

# Voir les services
docker service ls
```

## 🤖 Script d'installation

Le script `scripts/docker-setup.sh` offre une interface interactive pour :

- ✅ Vérification de Docker
- ✅ Construction de l'image
- ✅ Démarrage des services
- ✅ Vérification du statut
- ✅ Gestion des logs
- ✅ Nettoyage

### **Utilisation du script**

```bash
# Installation automatique
./scripts/docker-setup.sh --auto

# Mode interactif
./scripts/docker-setup.sh
```

## 📚 Ressources

- [Documentation Docker](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Sécurité Docker](https://docs.docker.com/engine/security/)
- [Bonnes pratiques](https://docs.docker.com/develop/dev-best-practices/)

---

**Dernière mise à jour :** 19 Juillet 2025  
**Version Docker :** 3.8+
