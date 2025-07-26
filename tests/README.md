# 🧪 Tests - Bonjour Network

Ce répertoire contient tous les tests automatisés pour valider les fonctionnalités et les fonctionnalités de l'application Bonjour Network.

## Tests de validation des réseaux

### `test-invalid-networks.js`

Test l'affichage des réseaux détectés mais non validés avec l'icône d'alerte.

### `test-validation-debug.js`

Test de débogage pour analyser les détails de validation des réseaux.

### `test-validation-details.js`

Test des détails de validation des réseaux WiFi.

### `test-validation-details-auto.js`

Test des détails de validation en mode scan automatique.

### `test-validation-details-auto-fixed.js`

Version corrigée du test de validation en mode automatique.

## Tests du scan automatique

### `test-auto-scan-missing.js`

Test du problème de perte de réseaux lors de l'activation du scan automatique.

### `test-auto-scan-invalid.js`

Test de l'apparition de réseaux non validés en mode scan automatique.

### `test-toggle-auto-invalid.js`

Test du comportement du toggle switch et des réseaux non validés.

## Tests des compteurs

### `test-counters.js`

Test général des compteurs de réseaux.

### `test-precise-counter.js`

Test précis des compteurs de réseaux validés/non validés.

### `test-simple-counter.js`

Test simple des compteurs.

### `test-html-counter.js`

Test des compteurs dans le HTML.

## Tests des fonctionnalités

### `test-toggle-switch.js`

Test du bouton toggle pour activer/désactiver le scan automatique.

### `test-websocket.js`

Test de la communication WebSocket.

### `test-frontend-websocket.js`

Test de la communication WebSocket côté frontend.

### `test-force-invalid.js`

Test de forçage de l'affichage des réseaux non validés.

### `test-server-data.js`

Test de capture des données envoyées par le serveur via WebSocket.

## Utilisation

Pour exécuter un test spécifique :

```bash
node tests/nom-du-test.js
```

Exemple :

```bash
node tests/test-auto-scan-missing.js
```

## Structure des tests

Chaque test suit généralement cette structure :

1. Lancement du navigateur avec Puppeteer
2. Navigation vers l'application
3. Attente du chargement
4. Exécution des actions de test
5. Vérification des résultats
6. Fermeture du navigateur

## Notes importantes

- Les tests nécessitent que l'application soit en cours d'exécution
- Certains tests peuvent prendre du temps selon la vitesse de l'application
- Les tests utilisent des sélecteurs CSS pour interagir avec l'interface
- Les logs détaillés sont affichés pour faciliter le débogage
