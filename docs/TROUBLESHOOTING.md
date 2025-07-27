# 🔧 Guide de Dépannage - Bonjour Network

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
export DEBUG=bonjour-network:*
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

## 🔍 **Nouvelles Erreurs - Fonctionnalités Récentes**

### **4. Erreur `arping: command not found` (macOS)**

#### **Symptômes :**

```
CommandValidator - Échec: arping -c 1 -W 1000 192.168.1.1 - Command failed: arping: command not found
```

#### **Cause :**

`arping` n'est pas installé par défaut sur macOS.

#### **Solutions :**

**A. Utilisation automatique de nmap (Recommandé)**

```bash
# Le scanner détecte automatiquement macOS et utilise nmap
# Aucune action requise - fonctionne automatiquement
```

**B. Installation manuelle (Optionnel)**

```bash
# Essayer d'installer arping (peut ne pas être disponible)
brew install iputils

# Vérifier si nmap est disponible
which nmap
```

**C. Vérification**

```bash
# Tester le scan
node -e "const scanner = require('./improved-device-scanner.js'); new scanner().scanWithArping().then(console.log)"
```

### **5. Erreur `networksetup` rejetée par CommandValidator**

#### **Symptômes :**

```
CommandValidator - Échec: networksetup -getinfo "AX88179A" - Command failed: networksetup -getinfo "AX88179A"
🚫 Paramètre non autorisé pour networksetup: "AX88179A"
```

#### **Cause :**

Le nom d'interface n'est pas dans la liste des services autorisés.

#### **Solutions :**

**A. Vérifier les interfaces disponibles**

```bash
# Lister toutes les interfaces
networksetup -listallnetworkservices

# Tester une interface spécifique
networksetup -getinfo "Wi-Fi"
```

**B. Ajouter l'interface manuellement**

```javascript
// Dans server/security/command-validator.js
const allowedServices = [
    'Wi-Fi', 'AirPort', 'Ethernet', 
    'Thunderbolt Ethernet', 'Thunderbolt Bridge',
    'iPhone USB', 'Tailscale', 'AX88179A'  // Ajouter ici
];
```

**C. Vérification**

```bash
# Tester la détection d'interfaces
node -e "const detector = require('./utils/network-detector.js'); new detector().getNetworkInterfaces().then(console.log)"
```

### **6. Pas d'appareils Bonjour détectés**

#### **Symptômes :**

```
Message: Scan Bonjour: 0 appareils
```

#### **Causes Possibles :**

- Service Bonjour non actif
- Permissions réseau insuffisantes
- Aucun appareil Bonjour sur le réseau
- Timeout trop court

#### **Solutions :**

**A. Vérifier le service Bonjour**

```bash
# Tester manuellement
dns-sd -B _http._tcp local

# Vérifier les permissions
ls -la /usr/bin/dns-sd
```

**B. Augmenter le timeout**

```javascript
// Dans improved-device-scanner.js
const BONJOUR_TIMEOUT = 10000; // Augmenter à 10 secondes
```

**C. Tester les services spécifiques**

```bash
# Tester HTTP
dns-sd -B _http._tcp local

# Tester SSH
dns-sd -B _ssh._tcp local

# Tester HTTPS
dns-sd -B _https._tcp local
```

### **7. Appareils Shelly non détectés**

#### **Symptômes :**

```
# Shelly découvert par Bonjour mais pas dans la liste finale
Message: Scan Bonjour: 1 appareils (shellycolorbulb-3494546E3BB2)
# Mais pas dans les résultats finaux
```

#### **Causes :**

- IP `Unknown` ou `undefined`
- MAC non extraite correctement
- Filtrage trop strict

#### **Solutions :**

**A. Vérifier l'extraction MAC**

```javascript
// Dans improved-device-scanner.js
// Vérifier que la MAC est extraite correctement
console.log('🔍 MAC extraite:', mac);
```

**B. Vérifier le filtrage**

```javascript
// S'assurer que les appareils Bonjour ne sont pas filtrés
if (device.source === 'bonjour') {
    // Accepter même sans IP valide
}
```

**C. Test manuel**

```bash
# Tester l'extraction MAC
node -e "
const deviceName = 'shellycolorbulb-3494546E3BB2';
const macMatch = deviceName.match(/([0-9A-Fa-f]{2}){3,6}/);
if (macMatch) {
    const mac = macMatch[0].match(/.{1,2}/g).join(':').toLowerCase();
    console.log('MAC extraite:', mac);
}
"
```

### **8. Erreur `ping: command not found` (Linux/Raspberry Pi)**

#### **Symptômes :**

```
CommandValidator - Échec: ping -c 1 -W 300 192.168.1.174 - Command failed: ping -c 1 -W 300 192.168.1.174
```

#### **Cause :**

Paramètre `-W` non supporté sur certaines versions de `ping`.

#### **Solutions :**

**A. Installation des outils réseau**

```bash
# Sur Raspberry Pi
sudo apt-get update
sudo apt-get install -y iputils-ping nmap arp-scan

# Vérifier les permissions
sudo setcap cap_net_raw+ep /usr/bin/ping
```

**B. Alternative avec nmap**

```bash
# Utiliser nmap au lieu de ping
nmap -sn 192.168.1.0/24
```

**C. Vérification**

```bash
# Tester ping
ping -c 1 8.8.8.8

# Tester nmap
nmap -sn 192.168.1.1
```

### **9. Fabricants non identifiés**

#### **Symptômes :**

```
"manufacturer": "Unknown",
"manufacturerInfo": { "identified": false }
```

#### **Causes :**

- MAC address manquante
- Fabricant non dans la base de données
- Erreur dans l'identification

#### **Solutions :**

**A. Vérifier la base de données**

```bash
# Vérifier le fichier des fabricants
cat server/data/manufacturers.json | head -20
```

**B. Ajouter un fabricant manuellement**

```javascript
// Dans server/data/manufacturers.json
{
    "AABBCC": "Mon Fabricant",
    "112233": "Mon Appareil IoT"
}
```

**C. Test d'identification**

```bash
# Tester l'identification d'une MAC
node -e "
const ManufacturerService = require('./manufacturer-service.js');
const service = new ManufacturerService();
const result = service.identifyManufacturer('48:e1:5c:aa:5c:15');
console.log('Résultat:', result);
"
```

### **10. Noms d'appareils non affichés dans le frontend**

#### **Symptômes :**

```
# Dans le frontend, affichage des IPs au lieu des noms
<h3>192.168.1.20</h3>  # Au lieu de "Samsung TV"
```

#### **Causes :**

- Fonction `getDisplayName` non appelée
- Données manquantes (hostname, manufacturer, deviceType)
- Erreur dans la logique d'affichage

#### **Solutions :**

**A. Vérifier les données reçues**

```javascript
// Dans le frontend, vérifier les données
console.log('🔍 Appareils reçus:', devices);
```

**B. Tester la fonction getDisplayName**

```javascript
// Dans DeviceList.js
const getDisplayName = (device) => {
    console.log('🔍 Device pour affichage:', device);
    // ... logique d'affichage
};
```

**C. Vérifier la priorité d'affichage**

```javascript
// Priorité : Bonjour hostname > manufacturer+type > manufacturer > type > IP
if (device.hostname && device.hostname !== 'Unknown' && device.hostname !== device.ip) {
    return device.hostname;
}
```

## 🔧 **Tests de Diagnostic**

### **Test Complet du Scanner**

```bash
# Test complet avec logs détaillés
node -e "
const ImprovedDeviceScanner = require('./improved-device-scanner.js');
const scanner = new ImprovedDeviceScanner();

console.log('🚀 Démarrage du test complet...');

scanner.performImprovedScan('complete')
    .then(devices => {
        console.log('✅ Test réussi !');
        console.log('📊 Résultats:');
        devices.forEach(device => {
            console.log(`- ${device.ip} -> ${device.hostname} (${device.manufacturer})`);
        });
        console.log(`Total: ${devices.length} appareils`);
    })
    .catch(err => {
        console.error('❌ Erreur:', err.message);
        console.error('Stack:', err.stack);
    });
"
```

### **Test des Services Bonjour**

```bash
# Tester les services Bonjour manuellement
for service in _http._tcp _https._tcp _ssh._tcp; do
    echo "🔍 Test du service: $service"
    timeout 8 dns-sd -B $service local || echo "❌ Service $service non disponible"
done

# Test des timeouts API
echo "🔍 Test des timeouts API..."
curl -m 60 http://localhost:5001/api/devices/fast && echo "✅ API fast OK"
curl -m 90 http://localhost:5001/api/devices/complete && echo "✅ API complete OK"
```

### **Test des Permissions Réseau**

```bash
# Vérifier les permissions des outils réseau
echo "🔍 Vérification des permissions..."

# Ping
if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
    echo "✅ ping fonctionne"
else
    echo "❌ ping ne fonctionne pas"
fi

# ARP
if arp -a >/dev/null 2>&1; then
    echo "✅ arp fonctionne"
else
    echo "❌ arp ne fonctionne pas"
fi

# DNS-SD (macOS)
if which dns-sd >/dev/null 2>&1; then
    echo "✅ dns-sd disponible"
else
    echo "❌ dns-sd non disponible"
fi

# Nmap
if which nmap >/dev/null 2>&1; then
    echo "✅ nmap disponible"
else
    echo "❌ nmap non disponible"
fi
```

## 📞 **Support**

### **Logs Utiles**

```bash
# Logs du serveur
tail -f server/logs/app.log

# Logs d'erreur
tail -f server/logs/error.log

# Logs de sécurité
tail -f server/logs/security.log
```

### **Commandes de Debug**

```bash
# État du réseau
ifconfig
netstat -rn

# Processus en cours
ps aux | grep node

# Ports utilisés
lsof -i :3000
lsof -i :5001
```

### **Contact**

- **Issues GitHub** : [Signaler un bug](https://github.com/magikcypress/bonjour-network/issues)
- **Documentation** : [Wiki du projet](https://github.com/magikcypress/bonjour-network/wiki)
- **Discussions** : [Forum communautaire](https://github.com/magikcypress/bonjour-network/discussions)

---

**💡 Conseil** : Commencez toujours par vérifier les logs du serveur pour identifier la cause exacte du problème avant d'essayer les solutions.
