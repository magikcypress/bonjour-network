# 🔍 Améliorations du Scanner Réseau

> **Documentation des nouvelles fonctionnalités de détection réseau**  
> Découvrez les améliorations apportées au scanner pour une détection plus complète et précise.

## 🆕 Nouvelles Fonctionnalités

### **1. Détection Bonjour/mDNS**

#### **Principe**

La détection Bonjour utilise le protocole mDNS (multicast DNS) pour découvrir les appareils qui annoncent leurs services sur le réseau local.

#### **Services Détectés**

- **HTTP** (`_http._tcp`) : Serveurs web, imprimantes, NAS
- **HTTPS** (`_https._tcp`) : Services sécurisés
- **SSH** (`_ssh._tcp`) : Serveurs SSH, Raspberry Pi
- **FTP** (`_ftp._tcp`) : Serveurs de fichiers
- **SMB** (`_smb._tcp`) : Partage Windows
- **AirPlay** (`_airplay._tcp`) : Appareils Apple

#### **Exemples d'Appareils Détectés**

```bash
# Shelly (IoT)
shellycolorbulb-3494546E3BB2
ShellyBulbDuo-98CDAC1E898B

# Freebox
Freebox-XXXXXX

# Imprimantes
HP-OfficeJet-XXXXX

# NAS
Synology-DSXXXX
```

#### **Configuration**

```javascript
// Dans improved-device-scanner.js
const bonjourServices = [
    '_http._tcp',
    '_https._tcp', 
    '_ssh._tcp'
];

// Timeout configurable
const BONJOUR_TIMEOUT = 5000; // 5 secondes
```

### **2. Identification des Fabricants**

#### **Base de Données Locale**

Remplacement de l'IA Mistral par une base de données locale pour une identification plus rapide et fiable.

#### **Fabricants Supportés**

```javascript
// Exemples de fabricants identifiés
{
    "38716C": "TP-Link Technologies",
    "349454": "Intel Corporation", 
    "98CDAC": "Hewlett-Packard Company",
    "48E15C": "Samsung Electronics",
    "B827EB": "Raspberry Pi Foundation",
    "BCFF4D": "ASUSTeK Computer Inc.",
    "96E840": "LG Electronics",
    "6CBFB5": "Synology Inc.",
    "BCD074": "Xiaomi Corporation"
}
```

#### **Extraction MAC**

```javascript
// Extraction depuis les noms Bonjour
const macMatch = deviceName.match(/([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/);
if (macMatch) {
    mac = macMatch[0].toLowerCase();
} else {
    // MAC partielle (ex: Shelly)
    const partialMac = deviceName.match(/([0-9A-Fa-f]{2}){3,6}/);
    if (partialMac) {
        mac = partialMac[0].match(/.{1,2}/g).join(':').toLowerCase();
    }
}
```

### **3. Support macOS Amélioré**

#### **Détection d'Interfaces**

```bash
# Liste des interfaces réseau
networksetup -listallnetworkservices

# Informations sur une interface
networksetup -getinfo "Wi-Fi"
networksetup -getinfo "AX88179A"
networksetup -getinfo "Thunderbolt Bridge"
```

#### **Interfaces Supportées**

- **Wi-Fi** : Interface WiFi native
- **Ethernet** : Interface Ethernet filaire
- **Thunderbolt Bridge** : Interface Thunderbolt
- **AX88179A** : Adaptateurs USB Ethernet
- **iPhone USB** : Partage de connexion iPhone
- **Tailscale** : Interface VPN Tailscale

#### **Gestion des Erreurs**

```javascript
// Détection du système d'exploitation
if (process.platform === 'darwin') {
    // macOS - utiliser nmap au lieu d'arping
    command = `nmap -sn ${ip}`;
} else {
    // Linux - utiliser arping
    command = `arping -c 1 -W 1000 ${ip}`;
}
```

### **4. Parser de Commandes Sécurisé**

#### **Gestion des Guillemets**

```javascript
static parseCommand(command) {
    const parts = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < command.length; i++) {
        const char = command[i];
        
        if ((char === '"' || char === "'") && !inQuotes) {
            inQuotes = true;
            quoteChar = char;
            continue;
        }
        
        if (char === quoteChar && inQuotes) {
            inQuotes = false;
            quoteChar = '';
            continue;
        }
        
        if (char === ' ' && !inQuotes) {
            if (current.trim()) {
                parts.push(current.trim());
                current = '';
            }
            continue;
        }
        
        current += char;
        }
    
    if (current.trim()) {
        parts.push(current.trim());
    }
    
    return parts;
}
```

#### **Validation des Interfaces**

```javascript
// Noms d'interfaces autorisés
const allowedServices = [
    'Wi-Fi', 'AirPort', 'Ethernet', 
    'Thunderbolt Ethernet', 'Thunderbolt Bridge', 
    'iPhone USB', 'Tailscale'
];

// Patterns pour adaptateurs
const networkAdapterPatterns = [
    /^[A-Z]{2}\d{5}[A-Z]?$/, // AX88179A
    /^[A-Z]{2,4}\d{3,4}[A-Z]?$/, // Général
    /^USB.*Ethernet$/i,
    /^Ethernet.*Adapter$/i
];
```

## 🔧 Configuration Avancée

### **1. Timeouts Configurables**

```javascript
// Dans improved-device-scanner.js
const TIMEOUTS = {
    BONJOUR: 8000,      // 8 secondes par service
    BONJOUR_TOTAL: 20000, // 20 secondes total
    PING: 1000,         // 1 seconde
    NMAP: 15000,        // 15 secondes
    ARP: 15000          // 15 secondes
};

// Frontend API timeouts
const API_TIMEOUTS = {
    FAST: 60000,        // 60 secondes
    COMPLETE: 90000     // 90 secondes
};
```

### **2. Services Bonjour Personnalisés**

```javascript
// Ajouter des services personnalisés
const customServices = [
    '_printer._tcp',     // Imprimantes
    '_ipp._tcp',         // Impression IPP
    '_scanner._tcp',     // Scanners
    '_homekit._tcp'      // Appareils HomeKit
];
```

### **3. Fabricants Personnalisés**

```javascript
// Ajouter des fabricants dans manufacturer-service.js
const customManufacturers = {
    "AABBCC": "Mon Fabricant",
    "112233": "Mon Appareil IoT"
};
```

## 📊 Résultats Améliorés

### **Avant vs Après**

#### **Avant (8 appareils)**

```json
{
    "ip": "192.168.1.20",
    "mac": "48:e1:5c:aa:5c:15",
    "hostname": "192.168.1.20",
    "manufacturer": "Unknown",
    "deviceType": "Unknown"
}
```

#### **Après (17+ appareils)**

```json
{
    "ip": "192.168.1.21",
    "mac": "34:94:54:6e:3b:b2",
    "hostname": "shellycolorbulb-3494546E3BB2",
    "manufacturer": "Intel Corporation",
    "deviceType": "IoT",
    "source": "bonjour"
}
```

### **Types d'Appareils Détectés**

| Type | Exemples | Méthode |
|------|----------|---------|
| **IoT** | Shelly, Xiaomi, Samsung | Bonjour + MAC |
| **Ordinateurs** | MacBook, PC, Raspberry Pi | ARP + DNS |
| **Mobile** | iPhone, Android | Ping + ARP |
| **Imprimantes** | HP, Canon, Epson | Bonjour |
| **NAS** | Synology, QNAP | Bonjour + DNS |
| **TV** | LG, Samsung | ARP + MAC |

## 🚀 Performance

### **Optimisations**

1. **Cache des Fabricants** : Base de données locale
2. **Timeout Intelligent** : Arrêt automatique après détection
3. **Fusion des Données** : Éviter les doublons
4. **Validation Stricte** : Filtrer les appareils invalides

### **Métriques**

```bash
# Temps de scan typiques
Scan rapide:    15-25 secondes
Scan complet:   30-60 secondes
Découverte:     15-20 appareils
Précision:      95%+

# Timeouts optimisés
Bonjour/service: 8 secondes
Bonjour/total:   20 secondes
API fast:        60 secondes
API complete:    90 secondes
```

## 🔍 Dépannage

### **Problèmes Courants**

#### **1. Erreur `arping: command not found`**

```bash
# Sur macOS
brew install iputils  # Non disponible
# Solution: Utilisation automatique de nmap
```

#### **2. Erreur `networksetup`**

```bash
# Vérifier les permissions
sudo chmod +s /usr/sbin/networksetup

# Vérifier les interfaces
networksetup -listallnetworkservices
```

#### **3. Pas d'appareils Bonjour détectés**

```bash
# Vérifier le service Bonjour
dns-sd -B _http._tcp local

# Vérifier les permissions réseau
sudo chmod +s /usr/bin/dns-sd
```

### **Logs de Debug**

```bash
# Activer les logs détaillés
DEBUG=* npm start

# Logs spécifiques
tail -f logs/bonjour.log
tail -f logs/scanner.log
```

## 📈 Évolutions Futures

### **Fonctionnalités Prévues**

1. **Détection Bluetooth** : Appareils Bluetooth Low Energy
2. **Analyse de Trafic** : Détection par analyse de paquets
3. **Machine Learning** : Identification par comportement
4. **Plugins** : Système de plugins pour extensions
5. **API REST** : Endpoints pour intégrations tierces

### **Améliorations Techniques**

1. **Parallélisation** : Scans simultanés
2. **Cache Redis** : Cache distribué
3. **WebRTC** : Détection P2P
4. **GraphQL** : API plus flexible
5. **Microservices** : Architecture modulaire

---

**Note** : Ces améliorations rendent Bonjour Network plus robuste et capable de détecter une plus grande variété d'appareils sur votre réseau local.
