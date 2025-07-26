# 📡 Bonjour Network

> **Application moderne de surveillance et gestion de réseau WiFi**  
> Découvrez, surveillez et gérez tous les appareils connectés à votre réseau WiFi avec une interface intuitive et des fonctionnalités avancées.

## 🌟 Fonctionnalités

Bonjour Network offre une **interface moderne et complète** pour gérer votre réseau WiFi :

### 🔍 **Détection Intelligente**

- **Scan rapide** : Détection en quelques secondes
- **Scan complet** : Analyse approfondie avec identification des fabricants
- **Détection multi-méthodes** : ARP, ping, nmap, Bonjour, DNS inversé
- **Identification automatique** : Fabricants détectés via IA (Mistral AI)

### 📊 **Interface Moderne**

- **Design responsive** : Compatible mobile, tablette, desktop
- **Temps réel** : Mises à jour en direct via WebSocket
- **Progression visuelle** : Suivi en temps réel des scans
- **Filtres avancés** : Recherche et tri des appareils

### 🔒 **Sécurité Renforcée**

- **Validation stricte** : Commandes système whitelistées
- **Authentification JWT** : Sessions sécurisées
- **CORS configuré** : Protection contre les attaques
- **Logs détaillés** : Traçabilité complète

### 🚀 **Performance Optimisée**

- **Architecture monorepo** : Backend Node.js + Frontend React
- **Communication WebSocket** : Mises à jour instantanées
- **Cache intelligent** : Optimisation des requêtes
- **Gestion d'erreurs** : Récupération automatique

## 🛠️ Technologies

### **Backend**

- **Node.js** + **Express.js** : API REST performante
- **Socket.IO** : Communication temps réel
- **JWT** : Authentification sécurisée
- **Command Validator** : Sécurité des commandes système

### **Frontend**

- **React** + **Hooks** : Interface moderne
- **Tailwind CSS** : Design responsive
- **Socket.IO Client** : Connexion temps réel
- **React Icons** : Icônes cohérentes

### **Détection Réseau**

- **ARP** : Table de routage locale
- **Ping Sweep** : Découverte active
- **Nmap** : Scan de ports (optionnel)
- **Bonjour/mDNS** : Services réseau
- **DNS inversé** : Résolution d'hôtes

## 🚀 Installation Rapide

### **Option 1 : Docker (Recommandé)**

```bash
# Cloner le projet
git clone https://github.com/magikcypress/bonjour-network.git
cd bonjour-network

# Démarrer avec Docker Compose
docker-compose up -d

# Accéder à l'application
open http://localhost:3000
```

### **Option 2 : Installation Locale**

```bash
# Cloner le projet
git clone https://github.com/magikcypress/bonjour-network.git
cd bonjour-network

# Installer les dépendances
npm install
cd client && npm install && cd ..

# Démarrer en mode développement
npm run dev
```

### **Option 3 : Raspberry Pi**

```bash
# Installation automatique
curl -fsSL https://raw.githubusercontent.com/magikcypress/bonjour-network/main/scripts/raspberry-pi-setup.sh | bash
```

## 📖 Documentation

- **[Guide Docker](DOCKER.md)** : Déploiement avec Docker
- **[Raspberry Pi](docs/RASPBERRY_PI.md)** : Installation sur Pi
- **[Sécurité](SECURITY.md)** : Mesures de sécurité
- **[Dépannage](docs/TROUBLESHOOTING.md)** : Guide de résolution

## 🔧 Configuration

### **Variables d'Environnement**

```bash
# Serveur
PORT=5001
NODE_ENV=development
JWT_SECRET=your-secret-key

# Client
REACT_APP_API_URL=http://localhost:5001
REACT_APP_WS_URL=ws://localhost:5001
```

### **Permissions Système**

L'application nécessite des **permissions réseau** pour scanner votre réseau :

```bash
# macOS
sudo chmod +s /usr/bin/ping
sudo chmod +s /usr/bin/arp

# Linux
sudo setcap cap_net_raw+ep /usr/bin/ping
sudo setcap cap_net_raw+ep /usr/bin/arp
```

## 🎯 Utilisation

### **1. Démarrer l'Application**

```bash
# Mode développement
npm run dev

# Mode production
npm start
```

### **2. Accéder à l'Interface**

- **URL** : `http://localhost:3000`
- **API** : `http://localhost:5001`

### **3. Lancer un Scan**

- **Scan Rapide** : Détection en quelques secondes
- **Scan Complet** : Analyse approfondie avec identification

### **4. Surveiller le Réseau**

- **Temps réel** : Mises à jour automatiques
- **Historique** : Logs détaillés
- **Alertes** : Notifications d'événements

## 🔍 API Endpoints

### **Réseaux WiFi**

```bash
GET  /api/networks          # Liste des réseaux
POST /api/networks/scan     # Lancer un scan
GET  /api/networks/status   # Statut du scan
```

### **Appareils Connectés**

```bash
GET  /api/devices           # Liste des appareils
POST /api/devices/scan      # Scanner les appareils
GET  /api/devices/:id       # Détails d'un appareil
```

### **WebSocket Events**

```javascript
// Connexion
socket.on('connect', () => {
  console.log('Connecté au serveur');
});

// Progression du scan
socket.on('scan-progress', (data) => {
  console.log('Progression:', data);
});

// Résultats du scan
socket.on('scan-complete', (data) => {
  console.log('Scan terminé:', data.devices);
});
```

## 🐳 Docker

### **Déploiement Simple**

```bash
# Build et démarrage
docker-compose up -d

# Logs en temps réel
docker-compose logs -f

# Arrêt
docker-compose down
```

### **Configuration Avancée**

```yaml
# docker-compose.yml
version: '3.8'
services:
  bonjour-network:
    build: .
    ports:
      - "3000:3000"  # Frontend
      - "5001:5001"  # Backend
    environment:
      - NODE_ENV=production
    volumes:
      - ./logs:/app/logs
```

## 🍓 Raspberry Pi

### **Installation Automatique**

```bash
# Script d'installation
wget https://raw.githubusercontent.com/magikcypress/bonjour-network/main/scripts/raspberry-pi-setup.sh
chmod +x raspberry-pi-setup.sh
./raspberry-pi-setup.sh
```

### **Configuration Manuel**

```bash
# Cloner le projet
git clone https://github.com/magikcypress/bonjour-network.git
cd bonjour-network

# Installation des dépendances
npm install
cd client && npm install && cd ..

# Service systemd
sudo cp scripts/bonjour-network.service /etc/systemd/system/
sudo systemctl enable bonjour-network
sudo systemctl start bonjour-network
```

## 🔒 Sécurité

### **Mesures Implémentées**

- ✅ **Validation des commandes** : Whitelist stricte
- ✅ **Authentification JWT** : Sessions sécurisées
- ✅ **CORS configuré** : Protection contre les attaques
- ✅ **Logs de sécurité** : Traçabilité complète
- ✅ **Permissions minimales** : Principe du moindre privilège

### **Bonnes Pratiques**

```bash
# Vérifier les permissions
ls -la /usr/bin/ping
ls -la /usr/bin/arp

# Tester la sécurité
npm run test:security

# Vérifier les logs
tail -f logs/security.log
```

## 🧪 Tests

### **Tests Automatisés**

```bash
# Tests unitaires
npm test

# Tests d'intégration
npm run test:integration

# Tests de sécurité
npm run test:security

# Tests de performance
npm run test:performance
```

### **Tests Manuels**

```bash
# Test de connectivité
curl http://localhost:5001/api/health

# Test WebSocket
node tests/test-websocket.js

# Test de scan
node tests/test-scan.js
```

## 📊 Monitoring

### **Logs**

```bash
# Logs applicatifs
tail -f logs/app.log

# Logs d'erreur
tail -f logs/error.log

# Logs de sécurité
tail -f logs/security.log
```

### **Métriques**

```bash
# Statut du service
systemctl status bonjour-network

# Utilisation mémoire
ps aux | grep bonjour-network

# Connexions réseau
netstat -an | grep :5001
```

## 🤝 Contribution

### **Comment Contribuer**

1. **Fork** le projet
2. **Créer** une branche feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'Add AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrir** une Pull Request

### **Standards de Code**

```bash
# Linting
npm run lint

# Formatage
npm run format

# Tests avant commit
npm run pre-commit
```

## 📝 Changelog

Voir [CHANGELOG.md](CHANGELOG.md) pour l'historique des versions.

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🆘 Support

### **Ressources**

- **Issues GitHub** : [Signaler un bug](https://github.com/magikcypress/bonjour-network/issues)
- **Discussions** : [Forum communautaire](https://github.com/magikcypress/bonjour-network/discussions)
- **Documentation** : [Wiki du projet](https://github.com/magikcypress/bonjour-network/wiki)

### **Contact**

- **Email** : <support@bonjour-network.com>
- **Discord** : [Serveur communautaire](https://discord.gg/bonjour-network)
- **Twitter** : [@BonjourNetwork](https://twitter.com/BonjourNetwork)

---

<div align="center">

**Bonjour Network** - Découvrez votre réseau WiFi avec élégance 🚀

[![GitHub stars](https://img.shields.io/github/stars/magikcypress/bonjour-network?style=social)](https://github.com/magikcypress/bonjour-network/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/magikcypress/bonjour-network?style=social)](https://github.com/magikcypress/bonjour-network/network/members)
[![GitHub issues](https://img.shields.io/github/issues/magikcypress/bonjour-network)](https://github.com/magikcypress/bonjour-network/issues)
[![GitHub license](https://img.shields.io/github/license/magikcypress/bonjour-network)](https://github.com/magikcypress/bonjour-network/blob/main/LICENSE)

</div>
