# 📡 WiFi Tracker

**Scanner et gérer les réseaux WiFi de votre appartement en temps réel**

> 🚀 **Projet d'apprentissage** : Ce projet a été développé avec l'aide de **Cursor AI** pour explorer les bonnes pratiques de développement full-stack et de sécurité. Une excellente façon d'apprendre en pratiquant ! 🤖✨

## 🎯 **Pourquoi ce projet ?**

### **Problème initial**

Les interfaces des routeurs fournis par les FAI sont souvent :

- **🔴 Basiques et peu intuitives** - Interface datée et difficile à naviguer
- **🔴 Limitées en fonctionnalités** - Pas de détection avancée des appareils
- **🔴 Peu d'informations détaillées** - Impossible de voir les fabricants, types d'appareils
- **🔴 Pas d'optimisation intelligente** - Aucune recommandation pour améliorer le WiFi
- **🔴 Interface non responsive** - Difficile à utiliser sur mobile

### **Solution proposée**

WiFi Tracker offre une **interface moderne et complète** pour gérer votre réseau WiFi :

#### **✨ Avantages par rapport aux routeurs classiques :**

- **🎨 Interface moderne** - Design épuré et intuitif avec Tailwind CSS
- **📱 Responsive** - Fonctionne parfaitement sur mobile, tablette et desktop
- **🤖 IA intégrée** - Identification automatique des fabricants avec Mistral AI
- **📊 Visualisations avancées** - Graphiques et statistiques détaillées
- **⚡ Temps réel** - Mises à jour automatiques sans rechargement
- **🔍 Scan approfondi** - Détection de tous les appareils connectés
- **💡 Optimisation intelligente** - Recommandations pour améliorer le WiFi
- **🔒 Sécurisé** - Contrôle total sur vos données, pas de cloud externe

#### **🏠 Parfait pour votre appartement :**

- **Surveillance en temps réel** de tous vos appareils connectés
- **Identification automatique** des fabricants (Samsung, Apple, etc.)
- **Optimisation WiFi** pour éviter les interférences
- **Interface intuitive** accessible à tous les membres de la famille
- **Pas de dépendance** aux interfaces basiques des FAI

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🚀 Fonctionnalités

### 🎯 **Cas d'usage concrets**

#### **🏠 Pour votre appartement :**

- **"Qui est connecté ?"** - Voir tous les appareils de votre famille en temps réel
- **"C'est quoi cet appareil ?"** - Identification automatique des fabricants (Samsung TV, iPhone, etc.)
- **"Pourquoi mon WiFi est lent ?"** - Analyse des interférences et recommandations
- **"Y a-t-il des intrus ?"** - Détection d'appareils non autorisés sur votre réseau
- **"Comment optimiser ?"** - Conseils pour améliorer la performance WiFi

#### **💼 Pour les petits bureaux :**

- **Gestion des appareils** - Suivi de tous les équipements connectés
- **Sécurité réseau** - Détection d'appareils non autorisés
- **Optimisation WiFi** - Amélioration de la couverture réseau
- **Monitoring temps réel** - Surveillance continue de l'infrastructure

### 🔍 **Scan WiFi Avancé**

- **Détection en temps réel** des réseaux WiFi environnants
- **Informations détaillées** : SSID, canal, fréquence, sécurité
- **Force du signal** avec indicateurs visuels
- **Scan sans privilèges** administrateur (macOS)

### 📱 **Appareils Connectés**

- **Détection automatique** des appareils connectés au WiFi
- **Scan approfondi** avec 7 méthodes de découverte différentes
- **Modes de scan** : Rapide (4 étapes) et Complet (8 étapes)
- **Progression en temps réel** avec étapes visuelles élégantes
- **Timer intégré** pour le scan complet avec temps écoulé
- **Identification Mistral AI** automatique des fabricants
- **Adresses MAC** et IP des appareils
- **Types d'appareils** identifiés (Raspberry Pi, Synology NAS, etc.)
- **Confiance d'identification** (70-95% pour les appareils connus)
- **Statut en ligne** en temps réel
- **Historique** des connexions

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

### **💡 Pourquoi ces technologies ?**

#### **🎯 Choix techniques :**

- **Node.js + Express** - Performance et simplicité pour les APIs
- **React + Tailwind** - Interface moderne et responsive
- **Socket.IO** - Communication temps réel sans rechargement
- **Mistral AI** - Identification intelligente des fabricants
- **macOS system commands** - Accès direct aux données réseau

#### **🔒 Avantages sécurité :**

- **Données locales** - Tout reste sur votre machine, pas de cloud
- **Pas de tracking** - Aucune collecte de données personnelles
- **Contrôle total** - Vous maîtrisez complètement l'application
- **Open source** - Code transparent et auditable

### **🤖 Apprentissage avec Cursor AI**

Ce projet a été développé en collaboration avec **Cursor AI** pour explorer et maîtriser :

#### **🔒 Bonnes pratiques de sécurité :**

- **Validation stricte des entrées** - Regex pour MAC/IP, sanitisation
- **Configuration CORS sécurisée** - Origines strictes, headers de sécurité
- **Rate limiting** - Protection contre DoS (100 req/IP/15min)
- **Logging sécurisé** - Winston avec rotation, pas d'exposition de données sensibles
- **Validation des commandes système** - Liste blanche, blocage des commandes dangereuses
- **Headers de sécurité** - XSS Protection, Content-Type, Frame Options
- **Tests de sécurité automatisés** - 29 tests, 95% de réussite

#### **⚡ Bonnes pratiques de développement full-stack :**

- **Architecture monorepo** - Backend + Frontend dans un seul projet
- **API REST** - Endpoints standards et documentés
- **Communication temps réel** - Socket.IO pour les mises à jour
- **Gestion d'état** - React hooks, context API
- **Styling moderne** - Tailwind CSS avec composants réutilisables
- **Validation des données** - Middleware Express, validation côté client
- **Gestion d'erreurs** - Try/catch, messages appropriés
- **Performance** - Lazy loading, optimisations React
- **Code propre** - ESLint, Prettier, commentaires explicatifs

#### **🎯 Curiosité et exploration :**

- **Découverte de nouvelles technologies** - Mistral AI, Socket.IO
- **Expérimentation avec les APIs système** - Commandes macOS
- **Apprentissage par la pratique** - Développement itératif
- **Documentation complète** - README, commentaires, guides
- **Tests et validation** - Tests automatisés, validation manuelle

### **Backend**

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Socket.IO** - Communication temps réel
- **system_profiler** - Scan WiFi macOS
- **Mistral AI** - Identification des fabricants d'appareils

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

### **🤖 Pour l'apprentissage**

- **Cursor AI** - Pour l'assistance au développement et l'apprentissage
- **Curiosité** - Pour explorer et comprendre le code
- **Patience** - Pour itérer et améliorer progressivement

## 🚀 Installation

### **🐳 Installation avec Docker (Recommandé)**

#### **Option 1 : Docker Compose (Facile)**

```bash
# Cloner le projet
git clone https://github.com/magikcypress/wifi-tracker.git
cd wifi-tracker

# Démarrer avec Docker Compose
docker-compose up -d

# Accéder à l'application
# http://localhost:5001
```

#### **Option 2 : Docker seul**

```bash
# Cloner le projet
git clone https://github.com/magikcypress/wifi-tracker.git
cd wifi-tracker

# Builder l'image
docker build -t wifi-tracker .

# Démarrer le conteneur
docker run -d \
  --name wifi-tracker \
  --network host \
  --privileged \
  -p 5001:5001 \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/data:/app/data \
  wifi-tracker

# Accéder à l'application
# http://localhost:5001
```

#### **🔧 Configuration Docker**

```bash
# Variables d'environnement personnalisées
docker run -d \
  --name wifi-tracker \
  --network host \
  --privileged \
  -p 5001:5001 \
  -e MISTRAL_AI_KEY=your-api-key \
  -e LOG_LEVEL=debug \
  -v $(pwd)/logs:/app/logs \
  wifi-tracker
```

#### **🚀 Installation automatique avec script**

```bash
# Installation automatique
./scripts/docker-setup.sh --auto

# Ou mode interactif
./scripts/docker-setup.sh
```

### **💻 Installation locale (Développement)**

#### **1. Cloner le projet**

```bash
git clone https://github.com/magikcypress/wifi-tracker.git
cd wifi-tracker
```

#### **2. Configurer les variables d'environnement**

```bash
# Configuration du serveur
cd server
cp env-template.txt .env
# Éditer le fichier .env avec vos clés API

# Configuration du client (optionnel)
cd ../client
cp env-template.txt .env
```

#### **3. Installer les dépendances**

```bash
# Installation automatique (recommandé)
npm run install-all

# Ou installation manuelle
npm install
cd server && npm install
cd ../client && npm install
```

#### **4. Configuration macOS (optionnel)**

```bash
# Script de configuration automatique
chmod +x scripts/setup-macos.sh
./scripts/setup-macos.sh
```

## 🎯 Utilisation

### **🚀 Démarrage rapide**

#### **🐳 Avec Docker**

```bash
# Démarrer l'application
docker-compose up -d

# Vérifier le statut
docker-compose ps

# Voir les logs
docker-compose logs -f

# Accéder à l'interface
# http://localhost:5001
```

#### **💻 Installation locale**

```bash
# Démarrer l'application
npm run dev

# Accéder à l'interface
# http://localhost:3001
```

### **🤖 Conseils pour l'apprentissage**

1. **Explorez le code** - Chaque fichier contient des commentaires explicatifs
2. **Testez les fonctionnalités** - Essayez les différents modes de scan
3. **Modifiez et expérimentez** - Changez des paramètres, ajoutez des fonctionnalités
4. **Posez des questions** - Utilisez Cursor AI pour comprendre le code
5. **Documentez vos découvertes** - Notez ce que vous apprenez

### **🔍 Points d'intérêt pour l'apprentissage**

- **`server/security/`** - Implémentation des mesures de sécurité
- **`server/middleware/`** - Validation des données et middleware Express
- **`client/src/components/`** - Composants React et gestion d'état
- **`server/device-scanner.js`** - Logique métier et intégration système
- **`SECURITY_AUDIT_REPORT.md`** - Audit complet de sécurité
- **`Dockerfile`** - Configuration Docker multi-stage
- **`docker-compose.yml`** - Orchestration des services
- **`Dockerfile.raspberry-pi`** - Configuration Docker pour ARM
- **`RASPBERRY_PI.md`** - Guide d'installation sur Raspberry Pi

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

#### 📱 **Appareils connectés**

1. **Onglet "Appareils Connectés"** pour voir tous les appareils
2. **Modes de scan** : Rapide (30s) ou Complet (1-2min)
3. **Progression visuelle** des étapes de scan en temps réel
4. **Timer intégré** affichant le temps écoulé pour le scan complet
5. **Identification automatique** des fabricants avec Mistral AI
6. **Informations détaillées** : fabricant, type, confiance, méthode de découverte
7. **Statut en temps réel** des appareils connectés

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
│   │   │   ├── Navigation.js # Navigation avec onglets
│   │   │   ├── NetworkList.js # Liste des réseaux WiFi
│   │   │   ├── DeviceList.js # Liste des appareils connectés
│   │   │   ├── NetworkStats.js # Statistiques des réseaux
│   │   │   └── WiFiOptimizer.js # Optimisation WiFi
│   │   ├── App.js           # Application principale
│   │   └── index.js         # Point d'entrée
│   └── package.json         # Dépendances frontend
├── 📁 server/                # Backend Node.js
│   ├── 📁 docs/             # Documentation avancée
│   ├── index.js             # Serveur principal
│   ├── real-no-sudo-scanner.js  # Scanner WiFi
│   ├── device-scanner.js    # Scanner d'appareils connectés
│   ├── mistral-ai-service.js # Service Mistral AI
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

### **Appareils Connectés**

```http
GET    /api/devices           # Liste des appareils (scan complet par défaut)
GET    /api/devices/fast      # Scan rapide (4 étapes)
GET    /api/devices/complete  # Scan complet (8 étapes)
POST   /api/devices/identify # Identifier un appareil avec Mistral AI
POST   /api/devices/identify-batch # Identification en lot
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

#### **Serveur (.env)**

```bash
# Configuration du serveur
PORT=5001
JWT_SECRET=votre_secret_jwt_tres_securise_ici

# Configuration Mistral AI
MISTRAL_AI_URL=https://api.mistral.ai
MISTRAL_AI_KEY=votre_cle_api_mistral_ici

# Configuration des scans
WIFI_SCAN_INTERVAL=30000
DEVICE_SCAN_INTERVAL=60000

# Configuration de l'environnement
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001
```

#### **Sécurité Mistral AI**

L'application utilise des restrictions strictes pour éviter l'utilisation des données pour l'entraînement :

```javascript
// Headers de sécurité
'X-No-Training': 'true',
'X-Data-Usage': 'inference-only'

// Paramètres API
usage_metadata: {
    purpose: "device_identification",
    no_training: true,
    data_usage: "inference_only"
}
```

#### **Client (.env)**

```bash
# Configuration de l'API
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_SOCKET_URL=http://localhost:5001

# Configuration de l'environnement
REACT_APP_NODE_ENV=development
```

### **Ports par défaut**

- **Frontend** : 3000 (React)
- **Backend** : 5001 (Express)
- **API** : <http://localhost:5001/api>

## 🤖 Identification Mistral AI

### **Fonctionnement automatique**

L'application identifie automatiquement les fabricants d'appareils connectés :

1. **Scan des appareils** → Détection ARP/netstat
2. **Identification Mistral AI** → Pour chaque adresse MAC
3. **Mise à jour des données** → Fabricant + type + confiance
4. **Affichage en temps réel** → Interface utilisateur

### **Méthodes de découverte**

#### **🚀 Scan rapide (4 étapes) :**

- **Scan ARP** - Détection via table ARP
- **Scan netstat** - Connexions réseau actives
- **Scan ifconfig** - Interfaces réseau
- **Identification Mistral AI** - Identification des fabricants

#### **🔍 Scan complet (8 étapes) :**

- **Scan ARP** - Détection via table ARP
- **Scan netstat** - Connexions réseau actives
- **Scan ifconfig** - Interfaces réseau
- **Ping sweep** - Découverte active sur 254 adresses
- **Scan nmap** - Découverte avec nmap (si disponible)
- **Scan Bonjour** - Services réseau (HTTP, SSH, etc.)
- **Scan arping** - Découverte ARP active (si disponible)
- **Identification Mistral AI** - Identification des fabricants

### **Appareils identifiés**

- **Samsung Electronics** (Smart TV) - 80% confiance
- **Apple Inc.** (Mobile Device) - 85% confiance  
- **Raspberry Pi Foundation** (Single Board Computer) - 95% confiance
- **Synology Inc.** (Network Attached Storage) - 90% confiance
- **LG Electronics** (Smart Device) - 75% confiance
- **Xiaomi Corporation** (IoT Device) - 70% confiance

### **Interface utilisateur avancée**

- ✅ **Progression visuelle** : Étapes du scan affichées en temps réel
- ✅ **Timer intégré** : Temps écoulé pour le scan complet
- ✅ **États visuels** : Terminé (vert), En cours (bleu), En attente (gris)
- ✅ **Modes de scan** : Basculement entre rapide et complet
- ✅ **Indicateurs de performance** : Temps de scan et nombre d'appareils

### **Sécurité des données**

- ✅ **Aucun entraînement** : Restrictions strictes sur l'API Mistral AI
- ✅ **Inférence uniquement** : Usage limité à l'identification
- ✅ **Protection des données** : Headers de sécurité configurés
- ✅ **Simulation en développement** : Pas d'appels à l'API réelle

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

#### **"Erreur Mistral AI"**

```bash
# Vérifier la configuration
cat server/.env | grep MISTRAL

# Tester l'API directement
curl -X POST http://localhost:5001/api/devices/identify \
  -H "Content-Type: application/json" \
  -d '{"mac":"b8:27:eb:e6:42:2d"}'
```

#### **"Scan trop lent"**

```bash
# Utiliser le scan rapide
curl -X GET http://localhost:5001/api/devices/fast

# Vérifier les méthodes disponibles
node server/test-scan-comparison.js
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

## 🚀 **Installation et Déploiement**

### **🍓 Installation sur Raspberry Pi**

```bash
# Installation automatique complète
curl -fsSL https://raw.githubusercontent.com/magikcypress/wifi-tracker/main/scripts/raspberry-pi-setup.sh | bash

# Ou installation interactive
wget https://raw.githubusercontent.com/magikcypress/wifi-tracker/main/scripts/raspberry-pi-setup.sh
chmod +x raspberry-pi-setup.sh
./raspberry-pi-setup.sh
```

**📋 Prérequis :**

- Raspberry Pi 4 (2GB RAM minimum, 4GB recommandé)
- Carte SD 16GB+ (Classe 10 recommandée)
- Connexion réseau (Ethernet recommandé)

**🎯 Avantages :**

- ✅ Faible consommation (5W)
- ✅ Coût réduit
- ✅ Silencieux et compact
- ✅ Parfait pour serveur 24/7

**📖 Guide complet :** [RASPBERRY_PI.md](RASPBERRY_PI.md)

### **💻 Installation locale**

```bash
# Cloner le projet
git clone https://github.com/magikcypress/wifi-tracker.git
cd wifi-tracker

# Installation des dépendances
npm run install-all

# Configuration
cp server/env-template.txt server/.env
# Éditer server/.env avec vos clés API

# Démarrage
npm run dev
```

### **🐳 Installation Docker**

```bash
# Cloner le projet
git clone https://github.com/magikcypress/wifi-tracker.git
cd wifi-tracker

# Démarrer avec Docker
docker-compose up -d

# Accéder à l'application
# http://localhost:5001
```

### **🚀 Déploiement**

#### **Développement**

```bash
npm run dev          # Démarrage complet
npm run server       # Backend uniquement
npm run client       # Frontend uniquement
```

#### **Production**

```bash
npm run build        # Build frontend
npm start           # Démarrage production
```

#### **Docker (optionnel)**

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

### **🤖 Apprentissage et partage**

Ce projet est aussi un **espace d'apprentissage** ! N'hésitez pas à :

- **Poser des questions** sur le code et l'architecture
- **Partager vos découvertes** et bonnes pratiques
- **Suggérer des améliorations** basées sur vos expériences
- **Documenter vos apprentissages** pour aider d'autres développeurs

### **🎯 Pourquoi ce projet ?**

- **Apprendre en pratiquant** - Développement full-stack avec Cursor AI
- **Explorer la sécurité** - Bonnes pratiques et tests automatisés
- **Découvrir de nouvelles technologies** - Mistral AI, Socket.IO, etc.
- **Partager ses connaissances** - Code documenté et commenté

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- **React** pour l'interface utilisateur
- **Express.js** pour l'API backend
- **Socket.IO** pour le temps réel
- **Tailwind CSS** pour le design
- **Lucide** pour les icônes
- **Mistral AI** pour l'identification des fabricants d'appareils

## 📞 Support

### **Aide et support**

- **Issues GitHub** : [Signaler un bug](https://github.com/magikcypress/wifi-tracker/issues)
- **Discussions** : [Forum communautaire](https://github.com/magikcypress/wifi-tracker/discussions)
- **Documentation** : [Wiki du projet](https://github.com/magikcypress/wifi-tracker/wiki)

## 🎉 **Résultat final**

### **✨ Ce que vous obtenez :**

- **Interface moderne** remplaçant les interfaces basiques des routeurs
- **Scan approfondi** avec 7 méthodes de découverte différentes
- **Progression visuelle** des étapes de scan en temps réel
- **Modes de scan** : Rapide (30s) et Complet (1-2min)
- **Identification intelligente** des fabricants avec l'IA
- **Optimisation WiFi** automatique pour de meilleures performances
- **Surveillance temps réel** de votre réseau domestique
- **Contrôle total** sur vos données et votre réseau

### **🏠 Parfait pour :**

- **Familles** - Surveiller tous les appareils connectés
- **Petits bureaux** - Gérer l'infrastructure réseau
- **Tech enthusiasts** - Avoir le contrôle total sur leur réseau
- **Curieux** - Comprendre ce qui se passe sur leur WiFi

---

**⭐ N'oubliez pas de mettre une étoile si ce projet vous a aidé !**

*Développé avec ❤️ pour remplacer les interfaces basiques des routeurs FAI*
