# 📡 WiFi Tracker

**Scanner et gérer les réseaux WiFi de votre appartement en temps réel**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🚀 Fonctionnalités

### 🔍 **Scan WiFi Avancé**

- **Détection en temps réel** des réseaux WiFi environnants
- **Informations détaillées** : SSID, canal, fréquence, sécurité
- **Force du signal** avec indicateurs visuels
- **Scan sans privilèges** administrateur (macOS)

### 📊 **Visualisation des Réseaux**

- **Affichage détaillé** des informations réseau
- **Interface intuitive** avec design moderne
- **Informations en temps réel** sur chaque réseau

### 📊 **Statistiques et Optimisation**

- **Statistiques en temps réel** : nombre de réseaux, types de sécurité
- **Analyse des canaux** pour éviter les interférences
- **Recommandations d'optimisation** WiFi
- **Répartition par fréquence** (2.4GHz, 5GHz, 6GHz)

### ⚡ **Temps Réel**

- **Mises à jour automatiques** toutes les 30 secondes
- **Socket.IO** pour les communications en temps réel
- **Interface réactive** sans rechargement

## 🛠️ Technologies

### **Backend**

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Socket.IO** - Communication temps réel
- **system_profiler** - Scan WiFi macOS

### **Frontend**

- **React 18** - Interface utilisateur
- **Tailwind CSS** - Styling moderne
- **Lucide React** - Icônes
- **Axios** - Requêtes HTTP

### **Architecture**

- **Monorepo** - Backend + Frontend
- **API REST** - Endpoints standards
- **WebSocket** - Mises à jour temps réel
- **CORS** - Sécurité cross-origin

## 📋 Prérequis

### **Système**

- **macOS** 10.15+ (recommandé)
- **Node.js** 18+
- **npm** 8+

### **Permissions**

- **Accès réseau** (automatique)
- **Aucun sudo** requis
- **Permissions WiFi** standard

## 🚀 Installation

### **1. Cloner le projet**

```bash
git clone https://github.com/magikcypress/wifi-tracker.git
cd wifi-tracker
```

### **2. Installer les dépendances**

```bash
# Installation automatique (recommandé)
npm run install-all

# Ou installation manuelle
npm install
cd server && npm install
cd ../client && npm install
```

### **3. Configuration macOS (optionnel)**

```bash
# Script de configuration automatique
chmod +x scripts/setup-macos.sh
./scripts/setup-macos.sh
```

## 🎯 Utilisation

### **Démarrage rapide**

```bash
# Démarrer l'application complète
npm run dev

# Ou démarrage manuel
npm run server  # Backend (port 5001)
npm run client  # Frontend (port 3000)
```

### **Accès à l'application**

- **Interface web** : <http://localhost:3000>
- **API REST** : <http://localhost:5001>
- **Documentation API** : <http://localhost:5001/api>

### **Fonctionnalités principales**

#### 🔍 **Scanner les réseaux**

1. Cliquez sur **"Scanner maintenant"** pour un scan immédiat
2. Utilisez **"Scan temps réel"** pour les mises à jour automatiques
3. Les réseaux se mettent à jour automatiquement toutes les 30 secondes

#### 📊 **Consulter les statistiques**

- **Nombre total** de réseaux détectés
- **Répartition par sécurité** (WPA2, WPA3, etc.)
- **Analyse des canaux** et recommandations
- **Optimisation WiFi** automatique

## 📁 Structure du Projet

```
wifi-tracker/
├── 📁 client/                 # Frontend React
│   ├── 📁 public/            # Assets statiques
│   ├── 📁 src/               # Code source
│   │   ├── 📁 components/    # Composants React
│   │   ├── App.js           # Application principale
│   │   └── index.js         # Point d'entrée
│   └── package.json         # Dépendances frontend
├── 📁 server/                # Backend Node.js
│   ├── 📁 docs/             # Documentation avancée
│   ├── index.js             # Serveur principal
│   ├── real-no-sudo-scanner.js  # Scanner WiFi
│   ├── optimization.js       # Optimisation WiFi
│   └── package.json         # Dépendances backend
├── 📁 scripts/              # Scripts utilitaires
├── 📁 docs/                 # Documentation complète
├── package.json             # Configuration racine
└── README.md               # Ce fichier
```

## 🔌 API Endpoints

### **Réseaux WiFi**

```http
GET    /api/networks          # Liste des réseaux
```

### **Optimisation**

```http
GET    /api/optimization      # Recommandations WiFi
```

### **WebSocket Events**

```javascript
// Client → Serveur
socket.emit('request-scan')   // Demander un scan

// Serveur → Client
socket.on('networks-updated') // Mise à jour réseaux
```

## 🔧 Configuration

### **Variables d'environnement**

```bash
# .env (optionnel)
PORT=5001                    # Port du serveur
NODE_ENV=development         # Environnement
```

### **Ports par défaut**

- **Frontend** : 3000 (React)
- **Backend** : 5001 (Express)
- **API** : <http://localhost:5001/api>

## 🐛 Dépannage

### **Problèmes courants**

#### **"Aucun réseau détecté"**

```bash
# Vérifier les permissions WiFi
system_profiler SPAirPortDataType

# Redémarrer l'application
npm run dev
```

#### **"Erreur de connexion"**

```bash
# Vérifier les ports
lsof -i :3000
lsof -i :5001

# Redémarrer les services
pkill -f "node.*index.js"
npm run dev
```

#### **"Socket.IO ne fonctionne pas"**

```bash
# Vérifier la connexion WebSocket
curl -I http://localhost:5001

# Tester Socket.IO
node test-socket.js
```

### **Logs de débogage**

```bash
# Backend
cd server && npm start

# Frontend
cd client && npm start
```

## 🚀 Déploiement

### **Développement**

```bash
npm run dev          # Démarrage complet
npm run server       # Backend uniquement
npm run client       # Frontend uniquement
```

### **Production**

```bash
npm run build        # Build frontend
npm start           # Démarrage production
```

### **Docker (optionnel)**

```bash
# Build image
docker build -t wifi-tracker .

# Run container
docker run -p 3000:3000 -p 5001:5001 wifi-tracker
```

## 🤝 Contribution

### **Comment contribuer**

1. **Fork** le projet
2. **Créer** une branche feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'Add AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrir** une Pull Request

### **Standards de code**

- **ESLint** pour la qualité du code
- **Prettier** pour le formatage
- **Tests** pour les nouvelles fonctionnalités
- **Documentation** pour les APIs

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- **React** pour l'interface utilisateur
- **Express.js** pour l'API backend
- **Socket.IO** pour le temps réel
- **Tailwind CSS** pour le design
- **Lucide** pour les icônes

## 📞 Support

### **Aide et support**

- **Issues GitHub** : [Signaler un bug](https://github.com/magikcypress/wifi-tracker/issues)
- **Discussions** : [Forum communautaire](https://github.com/magikcypress/wifi-tracker/discussions)
- **Documentation** : [Wiki du projet](https://github.com/magikcypress/wifi-tracker/wiki)

---

**⭐ N'oubliez pas de mettre une étoile si ce projet vous a aidé !**

*Développé avec ❤️ pour la communauté WiFi*
