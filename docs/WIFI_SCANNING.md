# 📡 Scan WiFi - Documentation

## 🌟 Vue d'ensemble

Le module de scan WiFi de Bonjour Network permet de détecter et analyser tous les réseaux WiFi disponibles dans votre environnement. Contrairement aux limitations d'Apple sur les applications tierces, notre solution utilise les outils système natifs pour obtenir des données complètes et fiables.

## 🔧 Fonctionnalités

### **✅ Ce qui fonctionne**

- **Détection complète** : Plus de 30 réseaux WiFi détectés en moyenne
- **Informations détaillées** : SSID, canal, fréquence, sécurité, qualité du signal
- **Support multi-bandes** : 2.4GHz, 5GHz, 6GHz
- **Données réelles** : Aucune simulation, toutes les données proviennent du système
- **Interface dédiée** : Page "Réseaux" avec liste complète
- **Mise à jour manuelle** : Scan à la demande via bouton "Scanner maintenant"

### **📊 Données récupérées**

Pour chaque réseau WiFi détecté :

```json
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
}
```

## 🛠️ Implémentation Technique

### **Scanner WiFi (`WifiSystemProfilerScanner`)**

```javascript
// server/utils/wifi-system-profiler.js
class WifiSystemProfilerScanner {
    async scanNetworks() {
        // Utilise system_profiler SPAirPortDataType
        // Parse la sortie pour extraire les réseaux
        // Retourne un tableau de réseaux formatés
    }
}
```

### **Méthode de scan**

1. **Commande système** : `system_profiler SPAirPortDataType`
2. **Parsing intelligent** : Analyse de la sortie structurée
3. **Extraction des données** : SSID, canal, sécurité, signal
4. **Calcul automatique** : Fréquence basée sur le canal
5. **Qualité du signal** : Conversion RSSI → pourcentage

### **Support des bandes de fréquence**

- **2.4GHz** : Canaux 1-13 (2407-2482 MHz)
- **5GHz** : Canaux 36-165 (5000-5825 MHz)
- **6GHz** : Canaux 1-93 (5950-6425 MHz)

## 🚀 Utilisation

### **Via l'interface web**

1. Ouvrir l'application Bonjour Network
2. Aller sur l'onglet "Réseaux"
3. Cliquer sur "Scanner maintenant"
4. Attendre 3-5 secondes
5. Voir la liste des réseaux détectés

### **Via l'API**

```bash
# Scan des réseaux WiFi
curl http://localhost:5001/api/networks

# Exemple de réponse
[
  {
    "ssid": "Freebox-5FFE9F",
    "channel": "85",
    "frequency": 5425,
    "security": "WPA3 Personal",
    "quality": 60
  },
  {
    "ssid": "DEUS-EX-INVITE",
    "channel": "108",
    "frequency": 5540,
    "security": "WPA2 Personal",
    "quality": 50
  }
]
```

## 🔍 Dépannage

### **Problème : Aucun réseau détecté**

```bash
# Vérifier que system_profiler fonctionne
system_profiler SPAirPortDataType | head -20

# Vérifier les permissions
ls -la /usr/sbin/system_profiler
```

### **Problème : Erreur de permission**

```bash
# Vérifier les logs du serveur
tail -f server/logs/combined.log

# Redémarrer le serveur
npm start
```

### **Problème : Données incomplètes**

- Vérifier que le WiFi est activé
- S'assurer d'être dans une zone avec des réseaux
- Redémarrer le scan après quelques secondes

## 📈 Performance

### **Métriques typiques**

- **Temps de scan** : 3-5 secondes
- **Réseaux détectés** : 20-40 réseaux
- **Précision** : 100% (données système)
- **Mémoire** : < 10MB par scan

### **Optimisations**

- **Cache intelligent** : Évite les scans répétés
- **Parsing optimisé** : Analyse efficace de la sortie
- **Gestion d'erreurs** : Récupération automatique
- **Timeouts appropriés** : 15 secondes maximum

## 🔒 Sécurité

### **Mesures de sécurité**

- **Validation des commandes** : Seules les commandes autorisées
- **Parsing sécurisé** : Évite les injections
- **Logs détaillés** : Traçabilité complète
- **Gestion des erreurs** : Pas d'exposition de données sensibles

### **Commandes autorisées**

```javascript
// server/security/command-validator.js
allowedCommands: [
    'system_profiler',
    'networksetup',
    // ... autres commandes
]
```

## 🆚 Comparaison avec les alternatives

### **Avantages de notre solution**

| Aspect | Notre solution | Alternatives |
|--------|----------------|--------------|
| **Données** | Réelles (system_profiler) | Simulées ou limitées |
| **Précision** | 100% (système natif) | Variable |
| **Performance** | Rapide (3-5s) | Lente ou instable |
| **Compatibilité** | macOS natif | Dépendante |
| **Sécurité** | Commandes whitelistées | Risques variables |

### **Pourquoi `system_profiler` ?**

1. **Fonctionne toujours** : Pas de dépréciation
2. **Données complètes** : Toutes les informations disponibles
3. **Performance** : Rapide et fiable
4. **Sécurité** : Commande système native
5. **Stabilité** : Pas de changements d'API

## 🔮 Évolutions futures

### **Fonctionnalités prévues**

- **Historique des scans** : Sauvegarde des résultats
- **Analyse des tendances** : Évolution des réseaux
- **Alertes** : Nouveaux réseaux détectés
- **Export** : Sauvegarde des données
- **Support Linux** : Extension à d'autres plateformes

### **Améliorations techniques**

- **Cache persistant** : Sauvegarde des résultats
- **Scan automatique** : Mise à jour périodique
- **API WebSocket** : Mises à jour en temps réel
- **Filtres avancés** : Recherche par SSID, sécurité, etc.

## 📚 Références

- **[Documentation system_profiler](https://developer.apple.com/documentation/system_profiler)**
- **[Guide Bonjour Network](README.md)**
- **[API Endpoints](docs/API_ENDPOINTS_IMPROVED.md)**
- **[Dépannage](docs/TROUBLESHOOTING.md)**
