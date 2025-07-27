# 🔌 API Endpoints - Bonjour Network

## 📊 **Endpoints Principaux**

### **1. Scan des Appareils Rapide**

```http
GET /api/devices/fast
```

**Description** : Scan rapide avec le scanner amélioré pour une meilleure cohérence
**Réponse** : Liste d'appareils avec identification fabricant et score qualité

### **2. Scan des Appareils Complet**

```http
GET /api/devices/complete
```

**Description** : Scan complet avec le scanner amélioré
**Réponse** : Liste complète d'appareils avec toutes les informations

### **3. Scan des Appareils Par Défaut**

```http
GET /api/devices
```

**Description** : Scan complet par défaut (utilise le scanner amélioré)
**Réponse** : Même que scan complet

### **4. Scan des Réseaux WiFi**

```http
GET /api/networks
```

**Description** : Scan des réseaux WiFi extérieurs disponibles
**Réponse** : Liste des réseaux WiFi avec informations complètes

**Exemple de réponse** :

```json
[
  {
    "ssid": "Freebox-5FFE9F",
    "bssid": "Unknown",
    "mode": "infrastructure",
    "channel": "85",
    "frequency": 5425,
    "signal_level": "-67",
    "signalStrength": 60,
    "quality": 60,
    "security": "WPA3 Personal",
    "security_flags": ["WPA3 Personal"]
  },
  {
    "ssid": "DEUS-EX-INVITE",
    "bssid": "Unknown",
    "mode": "infrastructure",
    "channel": "108",
    "frequency": 5540,
    "signal_level": "Unknown",
    "signalStrength": 50,
    "quality": 50,
    "security": "WPA2 Personal",
    "security_flags": ["WPA2 Personal"]
  }
]
```

## 🎯 **Endpoints Avancés**

### **4. Scan avec Choix du Scanner**

```http
GET /api/devices/scan/{mode}/{scanner}
```

**Paramètres** :

- `mode` : `fast` ou `complete`
- `scanner` : `original` ou `improved`

**Exemples** :

```bash
# Scan rapide avec scanner original
GET /api/devices/scan/fast/original

# Scan complet avec scanner amélioré
GET /api/devices/scan/complete/improved
```

**Réponse** :

```json
{
  "devices": [...],
  "metadata": {
    "mode": "fast",
    "scanner": "improved",
    "scanTime": 5381,
    "deviceCount": 10,
    "timestamp": "2025-07-20T10:10:42.432Z"
  }
}
```

### **5. Comparaison des Scanners**

```http
GET /api/devices/compare
```

**Description** : Compare les performances et qualité des deux scanners

**Réponse** :

```json
{
  "comparison": {
    "original": {
      "count": 17,
      "time": 2226,
      "devices": [...],
      "quality": {
        "total": 17,
        "withMac": 17,
        "withHostname": 17,
        "withManufacturer": 0,
        "withDeviceType": 0,
        "avgQualityScore": 8.0
      }
    },
    "improved": {
      "count": 10,
      "time": 5381,
      "devices": [...],
      "quality": {
        "total": 10,
        "withMac": 10,
        "withHostname": 8,
        "withManufacturer": 4,
        "withDeviceType": 4,
        "avgQualityScore": 34.2
      }
    },
    "totalTime": 7607,
    "improvements": {
      "qualityScore": 26.2,
      "manufacturerImprovement": 4,
      "hostnameImprovement": -9
    }
  }
}
```

## 🔍 **Améliorations de Cohérence**

### **Fusion Intelligente des Données**

- **Priorité MAC** : Garde la MAC la plus complète
- **Priorité Hostname** : Privilégie les noms non-génériques
- **Priorité DeviceType** : Évite l'écrasement par les fabricants
- **Sources Multiples** : Préserve toutes les sources de découverte

### **Système de Score Qualité**

```javascript
// Score basé sur les sources
ARP: +10 points (très fiable)
Ping: +8 points (fiable)
Nmap: +7 points (fiable)
Netstat: +5 points (moyen)
Bonjour: +4 points (limité)
DNS: +3 points (variable)

// Score basé sur les informations
MAC valide: +5 points
Hostname spécifique: +3 points
Fabricant identifié: +2 points
Type d'appareil: +2 points
Confiance fabricant: +3 points
```

### **Filtrage Intelligent**

- **IPs valides** : Ne filtre plus les IPs `.0` et `.255`
- **Validation MAC** : Optionnelle, ne bloque pas
- **Hostnames suspects** : Logging sans exclusion

## 📱 **Format de Réponse Amélioré**

### **Appareil Standard**

```json
{
  "ip": "192.168.1.100",
  "mac": "48:e1:5c:aa:5c:15",
  "hostname": "iPhone",
  "deviceType": "Smart TV/Mobile",
  "manufacturer": "Samsung Electronics",
  "manufacturerConfidence": 0.8,
  "manufacturerSource": "local",
  "manufacturerIdentified": true,
  "qualityScore": 30,
  "sources": ["arp", "ping"],
  "lastSeen": "2025-07-20T10:10:42.432Z",
  "isActive": true,
  "isLocal": false
}
```

### **Appareil Local**

```json
{
  "ip": "192.168.1.130",
  "mac": "1e:25:f4:4d:78:0c",
  "hostname": "Cet appareil",
  "deviceType": "Appareil local",
  "isLocal": true,
  "qualityScore": 25,
  "sources": ["arp"],
  "lastSeen": "2025-07-20T10:10:42.432Z",
  "isActive": true
}
```

## 🚀 **Utilisation dans le Frontend**

### **React Component Example**

```javascript
import React, { useState, useEffect } from 'react';

function DeviceScanner() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanMode, setScanMode] = useState('fast');
  const [scanner, setScanner] = useState('improved');

  const scanDevices = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/devices/scan/${scanMode}/${scanner}`);
      const data = await response.json();
      setDevices(data.devices);
      console.log('Scan metadata:', data.metadata);
    } catch (error) {
      console.error('Erreur scan:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <select value={scanMode} onChange={(e) => setScanMode(e.target.value)}>
        <option value="fast">Scan Rapide</option>
        <option value="complete">Scan Complet</option>
      </select>
      
      <select value={scanner} onChange={(e) => setScanner(e.target.value)}>
        <option value="improved">Scanner Amélioré</option>
        <option value="original">Scanner Original</option>
      </select>
      
      <button onClick={scanDevices} disabled={loading}>
        {loading ? 'Scan en cours...' : 'Scanner'}
      </button>
      
      <div>
        {devices.map(device => (
          <div key={device.ip} className="device-card">
            <h3>{device.hostname || device.ip}</h3>
            <p>IP: {device.ip}</p>
            <p>MAC: {device.mac}</p>
            <p>Fabricant: {device.manufacturer || 'Inconnu'}</p>
            <p>Type: {device.deviceType || 'Inconnu'}</p>
            <p>Score Qualité: {device.qualityScore}</p>
            {device.isLocal && <span className="local-badge">Appareil Local</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 📊 **Métriques de Performance**

### **Comparaison Typique**

| Métrique | Scanner Original | Scanner Amélioré | Amélioration |
|----------|------------------|------------------|--------------|
| **Temps de scan** | 2.2s | 5.4s | +146% |
| **Appareils détectés** | 17 | 10 | -41% |
| **Score qualité moyen** | 8.0 | 34.2 | +328% |
| **Fabricants identifiés** | 0 | 4 | +∞ |
| **Hostnames spécifiques** | 17 | 8 | -53% |

### **Avantages du Scanner Amélioré**

- ✅ **Qualité supérieure** : Score qualité +328%
- ✅ **Identification fabricant** : 100% d'amélioration
- ✅ **Cohérence des données** : Fusion intelligente
- ✅ **Sources multiples** : Préservation des sources
- ✅ **Priorisation qualité** : Tri par score qualité

### **Inconvénients**

- ⚠️ **Temps de scan** : Plus lent (+146%)
- ⚠️ **Moins d'appareils** : Filtrage plus strict
- ⚠️ **Moins d'hostnames** : Validation plus stricte

## 🔧 **Configuration**

### **Variables d'Environnement**

```bash
# Timeout pour les scans
SCAN_TIMEOUT=120000  # 120 secondes pour scan complet
FAST_SCAN_TIMEOUT=30000  # 30 secondes pour scan rapide

# Configuration Mistral AI
MISTRAL_API_KEY=your_api_key
MISTRAL_MODEL=mistral-large-latest

# Base de données fabricants
MANUFACTURERS_FILE=data/manufacturers.json
MANUFACTURERS_INITIAL_FILE=data/manufacturers-initial.json
```

### **Logs et Debug**

```bash
# Activer les logs détaillés
DEBUG=bonjour-network:scanner

# Logs spécifiques
DEBUG=bonjour-network:fusion
DEBUG=bonjour-network:quality
DEBUG=bonjour-network:mistral
```

## 🎯 **Recommandations d'Utilisation**

### **Pour le Développement**

- Utilisez le **scanner amélioré** pour les tests
- Activez les logs détaillés
- Testez avec l'endpoint de comparaison

### **Pour la Production**

- Utilisez le **scanner amélioré** par défaut
- Configurez des timeouts appropriés
- Surveillez les métriques de qualité

### **Pour les Tests**

- Utilisez l'endpoint `/api/devices/compare`
- Vérifiez les métriques d'amélioration
- Testez les deux scanners en parallèle
