# Rapport TODO - Accessibilité (a11y)

## Résultats pa11y-ci (résumé)

### Page d’accueil (`/`)

- 26 erreurs (contraste insuffisant)
- Exemples :
  - text-yellow-600 : contraste 2.84:1 (recommandé >3:1)
  - text-green-600 : contraste 3.15:1 (recommandé >4.5:1)
  - text-red-500 : contraste 3.76:1 (recommandé >4.5:1)
  - text-orange-500 : contraste 2.8:1 (recommandé >4.5:1)

### Page Appareils (`/appareils`)

- ✅ 0 erreur

### Page Réseaux (`/reseaux`)

- 41 erreurs (contraste insuffisant)
- Problèmes similaires à la page d’accueil

## TODO

- [ ] Corriger les couleurs de texte pour améliorer le contraste sur `/` et `/reseaux`
- [ ] Relancer le test pa11y-ci après correction

---

*Généré automatiquement à partir du dernier test pa11y-ci.*
