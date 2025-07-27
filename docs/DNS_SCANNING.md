# 🌐 Scan DNS & Services

> **Guide complet des fonctionnalités DNS et services réseau**  
> Découvrez et analysez la résolution DNS de votre réseau avec des messages d'erreur intelligents et une interface intuitive.

## 📋 Vue d'ensemble

Le module **DNS & Services** permet d'analyser la résolution DNS de votre réseau local et de détecter les services réseau actifs. Contrairement aux autres modules qui utilisent WebSocket, le scan DNS utilise des requêtes API REST directes pour une réponse immédiate.

## 🔍 Fonctionnalités

### **Résolution DNS Intelligente**

- **Test de 100+ hôtes** : router, nas, printer, camera, tv, xbox, etc.
- **Suffixes multiples** : `.local`, `.home`, `.lan`, `.network`
- **Classification automatique** : Identification du type d'appareil
- **Messages d'erreur clairs** : Explications en français compréhensible

### **Organisation Visuelle**

- **Hôtes résolus** : Section verte avec détails de succès (affichés par défaut)
- **Hôtes en échec** : Section rouge avec explications d'échec (optionnelle)
- **Toggle d'affichage** : Bouton pour afficher/masquer les hôtes en échec
- **Statistiques détaillées** : Total, résolus, échecs, temps moyen (toujours visibles)
- **Scan manuel** : Contrôle total via bouton "Scanner DNS & Services"

### **Services Réseau**

- **Services standards** : HTTP, SSH, FTP, etc.
- **Services Bonjour** : mDNS et services locaux
- **Historique DNS** : Cache et résolutions récentes

### **Interface Adaptative**

- **Mode sombre/clair** : Adaptation automatique avec persistance
- **Design cohérent** : Tous les éléments adaptés au thème
- **Transitions fluides** : Changement de thème sans rechargement
- **Métriques persistantes** : Statistiques sauvegardées automatiquement

## 🎯 Types d'Hôtes Testés

### **Appareils Réseau**

- **Routeur** : `router`, `gateway`, `freebox`, `livebox`
- **Serveur/NAS** : `nas`, `server`, `192.168.1.100`
- **Pi-hole** : `pi.hole`, `pihole`

### **Périphériques**

- **Imprimante** : `printer`, `print`
- **Caméra** : `camera`, `cam`
- **Télévision** : `tv`, `apple-tv`

### **Consoles & Médias**

- **Console de jeu** : `xbox`, `ps4`, `switch`
- **Dongle média** : `chromecast`, `firestick`

### **IoT & Smart Home**

- **Assistant vocal** : `homepod`, `echo`, `nest`
- **Appareil IoT** : `hue`, `shelly`

## 📊 Messages d'Erreur Compréhensibles

### **Avant (Messages Techniques)**

```
❌ "Erreur: Command failed: nslookup router"
❌ "Timeout - Hôte non accessible"
❌ "Nom d'hôte inconnu du serveur DNS"
```

### **Maintenant (Messages Clairs)**

```
✅ "Routeur non configuré ou non disponible"
✅ "Délai d'attente dépassé - Routeur non accessible"
✅ "Console de jeu non trouvée sur ce réseau"
✅ "Imprimante non disponible sur ce réseau"
```

### **Types d'Erreurs Gérées**

| Erreur Technique | Message Utilisateur |
|------------------|-------------------|
| **timeout** | `"Délai d'attente dépassé - [Type] non accessible"` |
| **ENOTFOUND** | `"[Type] non trouvé sur ce réseau"` |
| **Command failed** | `"[Type] non configuré ou non disponible"` |
| **ECONNREFUSED** | `"Connexion refusée - [Type] non accessible"` |
| **ENETUNREACH** | `"Réseau inaccessible - [Type] non trouvé"` |
| **DNS *** | `"[Type] non enregistré dans le DNS"` |
| **can't find** | `"[Type] non trouvé sur ce réseau"` |

## 🔧 Utilisation

### **Accès à l'Onglet**

1. Ouvrir l'application Bonjour Network
2. Cliquer sur l'onglet **"DNS & Services"**
3. **Note** : Le scan ne se lance plus automatiquement (contrôle manuel uniquement)

### **Lancement Manuel**

1. Cliquer sur **"Scanner DNS & Services"**
2. Attendre 5-10 secondes pour le scan complet
3. Consulter les résultats organisés par statut
4. Utiliser le toggle pour afficher/masquer les hôtes en échec

### **Interface Utilisateur**

#### **Affichage par défaut (propre)**

- ✅ **Hôtes résolus uniquement** : Interface focalisée sur les succès
- 📊 **Statistiques complètes** : Total, résolus, échecs, temps moyen
- 💡 **Message d'aide** : Indication du nombre d'échecs masqués

#### **Toggle d'affichage**

- 👁️ **"Voir tous les hôtes"** : Affiche les hôtes en échec pour diagnostic
- 👁️‍🗨️ **"Masquer les échecs"** : Retour à l'affichage propre
- 📈 **Compteur mis à jour** : "X hôtes résolus, Y échecs"

### **Interprétation des Résultats**

#### **Hôtes Résolus (Vert) - Affichés par défaut**

- ✅ **Succès** : Appareil trouvé et résolu
- 📍 **IP** : Adresse IP résolue
- ⏱️ **Temps** : Temps de résolution en millisecondes
- 📝 **Explication** : "Routeur trouvé sur le réseau"

#### **Hôtes en Échec (Rouge) - Optionnels**

- ❌ **Échec** : Appareil non trouvé
- 📝 **Explication** : Raison claire de l'échec
- 🔍 **Diagnostic** : Aide à comprendre le problème
- 👁️ **Toggle** : Bouton "Voir tous les hôtes" pour afficher

## 📈 Statistiques

### **Métriques Disponibles**

- **Total** : Nombre total d'hôtes testés
- **Résolus** : Nombre d'hôtes résolus avec succès
- **Échecs** : Nombre d'hôtes en échec
- **Temps moyen** : Temps de résolution moyen

### **Exemple de Résultats Typiques**

```
Total: 116 hôtes testés
Résolus: 10 hôtes (8.6%)
Échecs: 106 hôtes (91.4%)
Temps moyen: 103ms
```

## 🚀 Performance

### **Temps de Scan**

- **Scan complet** : 5-10 secondes
- **Hôtes testés** : 100+ hôtes communs
- **Résultats immédiats** : Pas de WebSocket nécessaire

### **Optimisations**

- **Parallélisation** : Tous les hôtes testés simultanément
- **Timeout intelligent** : 5 secondes par hôte
- **Cache DNS** : Utilisation du cache système
- **API REST** : Réponse directe sans WebSocket

## 🔍 Diagnostic

### **Hôtes Communs Résolus**

- `router.network` → 192.168.1.58 (Pi-hole)
- `gateway.network` → 192.168.1.58 (Pi-hole)
- `nas.network` → 192.168.1.58 (Pi-hole)

### **Hôtes Typiquement en Échec**

- `xbox.local` → Console de jeu non trouvée
- `printer.local` → Imprimante non configurée
- `chromecast.local` → Dongle média non trouvé

## 🛠️ Configuration

### **Backend (server/utils/dns-scanner.js)**

```javascript
// Liste des hôtes testés
const commonHosts = [
    'router', 'gateway', 'nas', 'server', 'printer', 'camera',
    'tv', 'xbox', 'ps4', 'switch', 'apple-tv', 'chromecast',
    'homepod', 'echo', 'nest', 'philips-hue', 'shelly',
    'freebox', 'livebox', 'bbox', 'sagem', 'orange'
];

// Suffixes testés
const suffixes = ['', '.local', '.home', '.lan', '.network'];
```

### **Frontend (client/src/components/DnsServicesList.js)**

```javascript
// Organisation par statut
{hosts.filter(host => host.resolved).map(...)} // Hôtes résolus
{hosts.filter(host => !host.resolved).map(...)} // Hôtes en échec
```

## 📚 API Endpoints

### **GET /api/dns-services**

```bash
curl http://localhost:5001/api/dns-services
```

**Réponse :**

```json
{
  "dnsData": {
    "hosts": [
      {
        "name": "router.network",
        "ip": "192.168.1.58",
        "resolved": true,
        "time": 174,
        "details": {
          "status": "success",
          "message": "Hôte résolu avec succès",
          "explanation": "Routeur trouvé sur le réseau",
          "ip": "192.168.1.58",
          "hostType": "Routeur"
        }
      }
    ],
    "statistics": {
      "total": 116,
      "resolved": 10,
      "failed": 106,
      "avgTime": 103
    }
  }
}
```

## 🎯 Cas d'Usage

### **Diagnostic Réseau**

- Vérifier quels appareils répondent au DNS
- Identifier les services manquants
- Analyser la performance DNS

### **Configuration Réseau**

- Valider la configuration DNS
- Vérifier les services Bonjour
- Tester la résolution d'hôtes

### **Maintenance**

- Surveiller les appareils réseau
- Détecter les problèmes DNS
- Optimiser la configuration réseau

## 🔧 Dépannage

### **Problèmes Courants**

#### **Tous les hôtes échouent**

- Vérifier la connectivité réseau
- Contrôler la configuration DNS
- Tester `nslookup` manuellement

#### **Aucun hôte résolu**

- Vérifier que Pi-hole fonctionne
- Contrôler les paramètres DNS
- Tester avec `dig` ou `nslookup`

#### **Scan très lent**

- Vérifier la performance réseau
- Contrôler les timeouts DNS
- Optimiser la configuration

### **Commandes de Test**

```bash
# Test DNS manuel
nslookup router.local

# Test Pi-hole
nslookup google.com 192.168.1.58

# Test Bonjour
dns-sd -B _http._tcp local
```

## 📝 Notes Techniques

### **Architecture**

- **Backend** : `DnsScanner` class avec méthodes spécialisées
- **Frontend** : `DnsServicesList` component avec organisation visuelle
- **API** : Endpoint REST `/api/dns-services`
- **Pas de WebSocket** : Réponse directe pour performance

### **Sécurité**

- **Validation** : Tous les hôtes validés avant test
- **Timeout** : Protection contre les scans infinis
- **Erreurs** : Gestion gracieuse des échecs
- **Logs** : Traçabilité complète des scans

### **Performance**

- **Parallélisation** : `Promise.allSettled()` pour tous les hôtes
- **Timeout** : 5 secondes par hôte maximum
- **Cache** : Utilisation du cache DNS système
- **Optimisation** : Pas de WebSocket pour réponse immédiate
