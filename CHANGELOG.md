# 📝 CHANGELOG - Bonjour Network

## [2.1.0] - 2025-01-19

### 🎨 **Améliorations UI/UX**

#### **Nouveaux indicateurs visuels**

- ✨ **Icône d'alerte pour réseaux non validés** : Ajout d'une icône orange (AlertTriangle) pour les réseaux détectés mais non validés
- 📊 **Section dédiée aux réseaux invalides** : Affichage séparé avec détails des raisons d'invalidation
- 🎯 **Amélioration des compteurs** : Synchronisation en temps réel des compteurs validés/non validés
- 🔄 **Toggle switch amélioré** : Interface plus intuitive pour l'activation/désactivation du scan automatique

#### **Améliorations de l'affichage**

- 📱 **Signal strength coloré** : Indicateurs visuels par couleur (vert/jaune/rouge) selon la force du signal
- 🏷️ **Gestion des valeurs "N/A"** : Affichage propre des valeurs manquantes
- 📋 **Détails de validation** : Informations détaillées sur pourquoi un réseau n'est pas validé

### 🔧 **Améliorations Backend**

#### **Scanner WiFi optimisé**

- 🍎 **Détection automatique de plateforme** : Utilisation de méthodes appropriées selon macOS/Linux
- 🎯 **Scan cohérent** : Même méthode pour scan manuel et automatique sur macOS
- 🐧 **Support Raspberry Pi** : Utilisation de `node-wifi` pour Linux
- 🧹 **Filtrage intelligent** : Exclusion des réseaux système (awdl0, p2p, direct)

#### **Validation des données améliorée**

- ✅ **Validation plus tolérante** : Acceptation de `bssid: null` et `security: "Unknown"`
- 🔒 **Sécurité renforcée** : Validation des noms de services pour `networksetup`
- 📊 **Données cohérentes** : Format uniforme entre toutes les méthodes de scan

### 🔒 **Sécurité**

#### **Validation des commandes système**

- ✅ **Liste blanche étendue** : Ajout des noms de services autorisés pour `networksetup`
- 🛡️ **Validation des services** : Nouvelle méthode `isValidNetworkService()`
- 🔍 **Logs de sécurité** : Traçabilité des tentatives d'exécution non autorisées
- 🎯 **Protection renforcée** : Validation avant exécution de toutes les commandes

### 🧪 **Tests**

#### **Organisation des tests**

- 📁 **Répertoire dédié** : Tous les tests Puppeteer déplacés dans `tests/`
- 📚 **Documentation complète** : README détaillé pour chaque type de test
- 🔍 **18 tests automatisés** : Couverture complète des fonctionnalités
- 📋 **Tests de validation** : Vérification des réseaux validés/non validés

#### **Nouveaux tests**

- 🧪 `test-invalid-networks.js` : Test de l'affichage des réseaux non validés
- 🧪 `test-auto-scan-missing.js` : Test du scan automatique et perte de réseaux
- 🧪 `test-toggle-auto-invalid.js` : Test du comportement du toggle switch
- 🧪 `test-validation-debug.js` : Test de débogage des validations

### 📚 **Documentation**

#### **README mis à jour**

- 📖 **Section Tests** : Documentation complète des tests automatisés
- 🔗 **Liens cohérents** : Références mises à jour vers le répertoire `tests/`
- 📋 **Exemples pratiques** : Commandes d'exécution des tests
- 🎯 **Structure claire** : Organisation par types de tests

#### **Documentation des tests**

- 📝 **tests/README.md** : Documentation détaillée de tous les tests
- 🏷️ **Catégorisation** : Tests de validation, scan automatique, compteurs, fonctionnalités
- 💡 **Exemples d'utilisation** : Commandes pour exécuter chaque type de test

### 🐛 **Corrections de bugs**

#### **Problèmes résolus**

- 🔧 **Perte de réseaux en mode automatique** : Correction de la cohérence entre scan manuel/automatique
- 🧹 **Réseaux système indésirables** : Filtrage des réseaux awdl0, p2p, direct
- 📊 **Compteurs désynchronisés** : Synchronisation en temps réel des compteurs
- 🔄 **Toggle switch instable** : Amélioration de la détection et activation

#### **Validation des données**

- ✅ **Réseaux rejetés incorrectement** : Acceptation de valeurs `null` et `"Unknown"`
- 🏷️ **Affichage "N/A"** : Gestion propre des valeurs manquantes
- 📋 **Détails de validation** : Informations claires sur les raisons d'invalidation

### 🚀 **Performance**

#### **Optimisations**

- ⚡ **Scan plus rapide** : Utilisation de la méthode optimale selon la plateforme
- 🔄 **Moins de scans inutiles** : Filtrage précoce des réseaux système
- 📊 **Données plus propres** : Réduction des réseaux avec données incomplètes

### 🔄 **Compatibilité**

#### **Multi-plateforme**

- 🍎 **macOS optimisé** : Utilisation de `RealNoSudoWiFiScanner` avec `airport`
- 🐧 **Linux/Raspberry Pi** : Support avec `node-wifi`
- 🔍 **Détection automatique** : Choix de la méthode selon `process.platform`

---

## [2.0.0] - 2025-01-18

### 🎉 **Version majeure précédente**

- Interface moderne avec Tailwind CSS
- Scanner WiFi sans privilèges administrateur
- Identification automatique des fabricants avec Mistral AI
- Support multi-plateforme (macOS, Linux)
- Tests automatisés avec Puppeteer
- Documentation complète

---

## 📋 **Notes de version**

### **Migration depuis 2.0.0**

- ✅ **Aucune migration requise** : Compatible avec les données existantes
- 🔄 **Redémarrage recommandé** : Pour bénéficier des nouvelles fonctionnalités
- 📊 **Données préservées** : Historique et configurations conservées

### **Dépendances**

- Node.js 18+
- React 18+
- Puppeteer (pour les tests)
- Tailwind CSS
- Socket.IO

### **Support**

- 🍎 **macOS** : Testé et optimisé
- 🐧 **Linux/Raspberry Pi** : Support partiel (pas testé)
- 📱 **Responsive** : Mobile, tablette, desktop

---

*Développé avec ❤️ pour remplacer les interfaces basiques des routeurs FAI*
