# Fonctionnalités Avancées - WiFi Tracker

## Gestion des Permissions

### macOS

Pour accéder aux informations WiFi sur macOS, vous devez :

1. **Autoriser l'accès aux réseaux WiFi** :
   - Préférences Système > Sécurité et confidentialité > Confidentialité
   - Sélectionner "Accès complet au disque"
   - Ajouter Terminal ou votre éditeur de code
   - Autoriser l'accès aux réseaux WiFi

2. **Permissions réseau** :
   - Préférences Système > Sécurité et confidentialité > Confidentialité
   - Sélectionner "Réseau"
   - Ajouter votre application

### Linux

```bash
# Installer les outils réseau
sudo apt-get install wireless-tools network-manager

# Ajouter l'utilisateur au groupe netdev
sudo usermod -a -G netdev $USER

# Redémarrer la session
sudo reboot
```

### Windows

Exécuter PowerShell en tant qu'administrateur :

```powershell
# Activer les fonctionnalités réseau
Enable-WindowsOptionalFeature -Online -FeatureName "Microsoft-Windows-Subsystem-Linux"
```

## Configuration Avancée

### Variables d'environnement

Créez un fichier `.env` dans le dossier `server/` :

```env
PORT=5001
NODE_ENV=development
WIFI_SCAN_INTERVAL=30000
LOG_LEVEL=info
```

### Configuration du scan WiFi

Dans `server/index.js`, vous pouvez modifier :

```javascript
// Intervalle de scan automatique (en millisecondes)
setInterval(scanNetworks, 30000);

// Interface WiFi à utiliser
wifi.init({
  iface: 'en0' // Spécifier l'interface WiFi
});
```

## Fonctionnalités de Blocage

### Méthodes de blocage

L'application utilise plusieurs méthodes pour bloquer les réseaux :

1. **Liste noire locale** : Stockage en mémoire des réseaux bloqués
2. **Filtrage réseau** : Blocage au niveau du système d'exploitation
3. **Redirection DNS** : Redirection des requêtes DNS

### Configuration du blocage

```javascript
// Dans server/index.js
const blockedNetworks = new Set();

// Ajouter un réseau à la liste noire
blockedNetworks.add('NomDuReseau');

// Vérifier si un réseau est bloqué
const isBlocked = blockedNetworks.has('NomDuReseau');
```

## API REST

### Endpoints disponibles

#### GET /api/networks

Récupère tous les réseaux WiFi détectés.

**Réponse** :

```json
[
  {
    "ssid": "NomDuReseau",
    "frequency": "2412",
    "quality": "85",
    "security": "WPA2",
    "signalStrength": "85",
    "isBlocked": false,
    "lastSeen": "2025-07-18T23:33:10.072Z"
  }
]
```

#### POST /api/networks/block

Bloque un réseau spécifique.

**Corps de la requête** :

```json
{
  "ssid": "NomDuReseau"
}
```

**Réponse** :

```json
{
  "success": true,
  "message": "Réseau NomDuReseau bloqué"
}
```

#### POST /api/networks/unblock

Débloque un réseau spécifique.

**Corps de la requête** :

```json
{
  "ssid": "NomDuReseau"
}
```

#### GET /api/networks/blocked

Récupère la liste des réseaux bloqués.

**Réponse** :

```json
["Reseau1", "Reseau2", "Reseau3"]
```

## WebSocket Events

### Événements Socket.IO

#### `networks-updated`

Émis quand la liste des réseaux est mise à jour.

**Données** :

```json
[
  {
    "ssid": "NomDuReseau",
    "frequency": "2412",
    "quality": "85",
    "security": "WPA2",
    "signalStrength": "85",
    "isBlocked": false,
    "lastSeen": "2025-07-18T23:33:10.072Z"
  }
]
```

#### `request-scan`

Demande un nouveau scan des réseaux.

## Sécurité

### Bonnes pratiques

1. **Permissions minimales** : N'accorder que les permissions nécessaires
2. **Validation des données** : Valider toutes les entrées utilisateur
3. **Chiffrement** : Utiliser HTTPS en production
4. **Audit** : Logger toutes les actions de blocage/déblocage

### Configuration de sécurité

```javascript
// Validation des SSID
function validateSSID(ssid) {
  return typeof ssid === 'string' && 
         ssid.length > 0 && 
         ssid.length <= 32 &&
         /^[a-zA-Z0-9_-]+$/.test(ssid);
}

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite chaque IP à 100 requêtes par fenêtre
});
app.use('/api/', limiter);
```

## Monitoring et Logs

### Configuration des logs

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Métriques importantes

- Nombre de réseaux détectés
- Fréquence des scans
- Temps de réponse de l'API
- Erreurs de scan
- Actions de blocage/déblocage

## Déploiement

### Production

```bash
# Build de l'application
npm run build

# Démarrage en production
NODE_ENV=production npm start
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5001
CMD ["npm", "start"]
```

### Variables d'environnement de production

```env
NODE_ENV=production
PORT=5001
WIFI_SCAN_INTERVAL=60000
LOG_LEVEL=warn
```

## Dépannage

### Problèmes courants

#### Aucun réseau détecté

1. Vérifier les permissions WiFi
2. Redémarrer l'interface réseau
3. Vérifier que la carte WiFi est activée

#### Erreur de permission

```bash
# macOS
sudo chmod +a "user:$(whoami):allow" /dev/bpf*

# Linux
sudo setcap cap_net_raw,cap_net_admin=eip $(which node)
```

#### Performance lente

1. Réduire la fréquence de scan
2. Optimiser les requêtes réseau
3. Utiliser le cache pour les données statiques

## Support

Pour toute question ou problème :

1. Vérifier les logs du serveur
2. Consulter la documentation
3. Ouvrir une issue sur GitHub
