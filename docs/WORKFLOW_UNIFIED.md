# 🚀 Workflow GitHub Actions Unifié

## 📋 Vue d'ensemble

Le workflow unifié combine tous les tests et le déploiement en une seule action GitHub Actions, offrant une approche plus efficace et plus facile à maintenir.

## 🎯 Avantages

### ✅ **Simplicité**

- **Un seul workflow** au lieu de plusieurs
- **Configuration centralisée** et facile à maintenir
- **Moins de duplication** de code

### ✅ **Efficacité**

- **Tests parallèles** quand possible
- **Exécution séquentielle** pour les dépendances
- **Nettoyage automatique** des ressources

### ✅ **Robustesse**

- **Fallback automatique** pour les tests qui échouent
- **Gestion d'erreurs** complète
- **Rapports détaillés** de chaque étape

## 🔧 Configuration

### **Fichier :** `.github/workflows/unified-test.yml`

### **Déclencheurs :**

```yaml
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:
```

### **Matrice de tests :**

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
```

## 📊 Étapes du workflow

### **1. 🔧 Configuration initiale**

- ✅ **Checkout** du code
- ✅ **Setup Node.js** (18.x et 20.x)
- ✅ **Setup Docker Buildx**
- ✅ **Installation des dépendances**

### **2. 🧪 Tests de base**

- ✅ **Vérification des fichiers Docker**
- ✅ **Démarrage du serveur et client**
- ✅ **Test des endpoints API**
- ✅ **Test de fonctionnalité API**

### **3. 🎯 Tests d'accessibilité**

- ✅ **Test système** (curl + grep)
- ✅ **Test fallback** (pa11y-ci si disponible)
- ✅ **Test navigateur headless**

### **4. 🐳 Tests Docker**

- ✅ **Build Docker principal**
- ✅ **Build Docker Raspberry Pi**
- ✅ **Test Docker Compose**
- ✅ **Test Docker Compose Raspberry Pi**

### **5. 🔒 Tests de sécurité**

- ✅ **Audit npm** (moderate level)
- ✅ **Tests de sécurité personnalisés**
- ✅ **Vérification des secrets**

### **6. 📄 Tests spécifiques**

- ✅ **Test des pages** (/, /appareils, /reseaux, /dns)
- ✅ **Test des fonctionnalités complètes** (si Xvfb disponible)

### **7. ⚡ Tests de performance**

- ✅ **Temps de réponse API**
- ✅ **Utilisation mémoire**

### **8. 🚀 Déploiement (main branch uniquement)**

- ✅ **Build des images de production**
- ✅ **Test des builds de production**
- ✅ **Préparation du déploiement**

## 🎯 Tests inclus

### **Tests API :**

- Endpoints de santé
- Fonctionnalité complète
- Temps de réponse

### **Tests d'accessibilité :**

- Structure HTML
- Attributs d'accessibilité
- Contraste et responsive

### **Tests Docker :**

- Build des images
- Runtime des containers
- Docker Compose

### **Tests de sécurité :**

- Audit des vulnérabilités
- Tests personnalisés
- Vérification des secrets

### **Tests de performance :**

- Temps de réponse
- Utilisation mémoire
- Tests de charge

## 🔄 Gestion des erreurs

### **Fallback automatique :**

1. **pa11y-ci** → **script système** → **curl basique**
2. **Xvfb** → **headless** → **skip si non disponible**
3. **Tests complets** → **tests basiques** → **tests minimaux**

### **Nettoyage automatique :**

```yaml
- name: Cleanup
  if: always()
  run: |
    docker stop test-container test-raspberry-container 2>/dev/null || true
    docker-compose down 2>/dev/null || true
    pkill -f "npm start" 2>/dev/null || true
```

## 📈 Métriques et rapports

### **Résumé automatique :**

```
🎉 Tests unifiés terminés !
📊 Résumé:
  ✅ API endpoints
  ✅ Fonctionnalité API
  ✅ Accessibilité
  ✅ Navigateur headless
  ✅ Build Docker
  ✅ Docker Compose
  ✅ Audit de sécurité
  ✅ Tests de sécurité
  ✅ Vérification secrets
  ✅ Pages spécifiques
  ✅ Performance
  ✅ Utilisation mémoire
  ✅ Déploiement production (si main)
```

## 🚀 Utilisation

### **Déclenchement automatique :**

- **Push** sur `main` ou `develop`
- **Pull Request** vers `main`
- **Déclenchement manuel** via GitHub UI

### **Déploiement automatique :**

- **Uniquement** sur la branche `main`
- **Build des images** de production
- **Tests de validation** avant déploiement

## 🔧 Personnalisation

### **Ajouter un nouveau test :**

```yaml
- name: Nouveau test
  run: |
    echo "🧪 Nouveau test..."
    # Votre commande de test
```

### **Modifier les seuils de performance :**

```yaml
if (( $(echo "$response_time > 5.0" | bc -l) )); then
  echo "⚠️ Temps de réponse élevé"
fi
```

### **Ajouter des dépendances :**

```yaml
- name: Install custom dependencies
  run: |
    npm install votre-package
```

## 📋 Maintenance

### **Vérification locale :**

```bash
# Test du workflow localement
./scripts/verify-docker-files.sh
./scripts/test-docker-build.sh
node scripts/test-accessibility-system.js
```

### **Debugging :**

- **Logs détaillés** dans chaque étape
- **Messages d'erreur** explicites
- **Nettoyage automatique** en cas d'échec

## 🎯 Avantages par rapport aux workflows séparés

| Aspect | Workflows séparés | Workflow unifié |
|--------|------------------|-----------------|
| **Complexité** | ❌ Multiple fichiers | ✅ Un seul fichier |
| **Maintenance** | ❌ Duplication de code | ✅ Configuration centralisée |
| **Performance** | ❌ Surcharge des runners | ✅ Optimisation des ressources |
| **Debugging** | ❌ Logs dispersés | ✅ Logs centralisés |
| **Déploiement** | ❌ Coordination complexe | ✅ Pipeline intégré |

## 🚀 Conclusion

Le workflow unifié offre une solution complète, efficace et maintenable pour tous les tests et le déploiement de l'application Bonjour Network.
