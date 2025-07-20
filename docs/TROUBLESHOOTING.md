# 🔧 Guide de Dépannage - WiFi Tracker

## 🚨 **Erreurs Courantes et Solutions**

### **1. Erreur "Network Error" dans le Frontend**

#### **Symptômes :**

```
Object { message: "Network Error", name: "AxiosError", code: "ERR_NETWORK" }
```

#### **Causes Possibles :**

- Serveur backend non démarré
- Ports bloqués ou utilisés
- Problème CORS
- Timeout de connexion

#### **Solutions :**

**A. Vérifier que le serveur est démarré**

```bash
# Vérifier les processus Node.js
ps aux | grep "node index.js"

# Démarrer le serveur si nécessaire
cd server && node index.js
```

**B. Vérifier les ports**

```bash
# Vérifier le port 5001 (backend)
lsof -i :5001

# Vérifier le port 3000 (frontend)
lsof -i :3000

# Tuer les processus si nécessaire
kill -9 $(lsof -ti:5001)
kill -9 $(lsof -ti:3000)
```

**C. Tester la connectivité**

```bash
# Tester le backend
curl http://localhost:5001/api/networks

# Tester le frontend
curl http://localhost:3000
```

### **2. Erreur "Connection Refused"**

#### **Symptômes :**

```
Failed to connect to localhost port 5001 after 0 ms: Couldn't connect to server
```

#### **Solutions :**

**A. Redémarrer le serveur**

```bash
# Arrêter tous les processus Node.js
pkill -f node

# Redémarrer le serveur
cd server && node index.js
```

**B. Utiliser le script de démarrage automatique**

```bash
# Démarrer avec le script automatique
./start-dev.sh
```

### **3. Erreur CORS**

#### **Symptômes :**

```
Access to XMLHttpRequest at 'http://localhost:5001/api/devices' from origin 'http://localhost:3000' has been blocked by CORS policy
```

#### **Solutions :**

**A. Vérifier la configuration CORS**

```javascript
// Dans server/config/cors.js
origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
]
```

**B. Redémarrer le serveur**

```bash
# Le serveur charge automatiquement la config CORS
cd server && node index.js
```

### **4. Timeout des Scans**

#### **Symptômes :**

```
Scan timeout - 120 secondes dépassées
```

#### **Solutions :**

**A. Augmenter les timeouts**

```bash
# Variables d'environnement
export SCAN_TIMEOUT=180000  # 3 minutes
export FAST_SCAN_TIMEOUT=60000  # 1 minute
```

**B. Utiliser le scan rapide**

```bash
# Endpoint pour scan rapide
curl http://localhost:5001/api/devices/fast
```

### **5. Erreur "Cannot find module"**

#### **Symptômes :**

```
Error: Cannot find module '/path/to/module'
```

#### **Solutions :**

**A. Installer les dépendances**

```bash
# Backend
cd server && npm install

# Frontend
cd client && npm install
```

**B. Vérifier les chemins**

```bash
# Vérifier la structure des fichiers
ls -la server/
ls -la client/
```

## 🛠️ **Scripts de Diagnostic**

### **1. Script de Vérification Complète**

```bash
#!/bin/bash
echo "🔍 Diagnostic WiFi Tracker..."

# Vérifier les processus
echo "📊 Processus Node.js:"
ps aux | grep node | grep -v grep

# Vérifier les ports
echo "🔌 Ports utilisés:"
lsof -i :5001
lsof -i :3000

# Tester les endpoints
echo "🌐 Test des endpoints:"
curl -s http://localhost:5001/api/networks | jq '.length' 2>/dev/null || echo "❌ Backend non accessible"
curl -s http://localhost:3000 | head -c 50 2>/dev/null || echo "❌ Frontend non accessible"

echo "✅ Diagnostic terminé"
```

### **2. Script de Redémarrage Automatique**

```bash
#!/bin/bash
echo "🔄 Redémarrage automatique..."

# Arrêter tous les processus
pkill -f node
sleep 2

# Démarrer le serveur
cd server && node index.js &
sleep 5

# Démarrer le frontend
cd ../client && npm start &
sleep 10

echo "✅ Redémarrage terminé"
```

## 📊 **Métriques de Diagnostic**

### **1. Vérification des Endpoints**

```bash
# Test rapide des endpoints principaux
curl -s http://localhost:5001/api/networks | jq '.length'
curl -s http://localhost:5001/api/devices/fast | jq '.length'
curl -s http://localhost:5001/api/devices/compare | jq '.comparison.improvements'
```

### **2. Vérification des Logs**

```bash
# Suivre les logs du serveur
tail -f server/logs/app.log

# Logs en temps réel
node server/index.js 2>&1 | tee server.log
```

## 🚀 **Démarrage Rapide**

### **1. Démarrage Manuel**

```bash
# Terminal 1 - Backend
cd server && node index.js

# Terminal 2 - Frontend
cd client && npm start
```

### **2. Démarrage Automatique**

```bash
# Utiliser le script automatique
./start-dev.sh
```

### **3. Démarrage avec Docker**

```bash
# Si Docker est configuré
docker-compose up
```

## 🔧 **Configuration Avancée**

### **1. Variables d'Environnement**

```bash
# Configuration de développement
export NODE_ENV=development
export PORT=5001
export CORS_ORIGIN=http://localhost:3000
export SCAN_TIMEOUT=120000
export FAST_SCAN_TIMEOUT=30000
```

### **2. Logs Détaillés**

```bash
# Activer les logs détaillés
export DEBUG=wifi-tracker:*
export LOG_LEVEL=debug
```

### **3. Mode Debug**

```bash
# Démarrer en mode debug
node --inspect server/index.js
```

## 📞 **Support**

### **1. Logs d'Erreur**

```bash
# Capturer les erreurs
node server/index.js 2>&1 | tee error.log
```

### **2. Informations Système**

```bash
# Informations système
node --version
npm --version
system_profiler SPNetworkDataType
```

### **3. Test de Connectivité**

```bash
# Test réseau complet
ping -c 3 localhost
curl -v http://localhost:5001/api/networks
```

## ✅ **Checklist de Diagnostic**

- [ ] Serveur backend démarré sur le port 5001
- [ ] Frontend React démarré sur le port 3000
- [ ] Endpoint `/api/networks` répond
- [ ] Endpoint `/api/devices/fast` répond
- [ ] Configuration CORS correcte
- [ ] Pas de conflit de ports
- [ ] Dépendances installées
- [ ] Variables d'environnement configurées

**Si tous les points sont cochés, l'application devrait fonctionner correctement !** 🎉
