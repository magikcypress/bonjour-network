# 📁 Structure du Projet Bonjour Network (Nettoyée)

## 🎯 **Vue d'Ensemble**

Le projet a été nettoyé pour ne conserver que les fichiers essentiels et fonctionnels.

## 📂 **Structure Principale**

```
bonjour-network/
├── 🚀 Scripts de Gestion
│   ├── start-app.sh          # Démarrage complet de l'application
│   ├── stop-app.sh           # Arrêt propre de l'application
│   └── restart-app.sh        # Redémarrage complet
│
├── 📖 Documentation Principale
│   ├── README.md             # Documentation principale du projet
│   ├── SECURITY.md           # Guide de sécurité
│   ├── DOCKER.md             # Guide Docker
│   └── API_SYNC_REFACTORING_SUMMARY.md  # Documentation de refactoring
│
├── 🐳 Configuration Docker
│   ├── docker-compose.yml    # Configuration Docker principale
│   ├── docker-compose.raspberry-pi.yml  # Configuration Raspberry Pi
│   ├── Dockerfile            # Image Docker principale
│   ├── Dockerfile.raspberry-pi  # Image Docker Raspberry Pi
│   └── docker-entrypoint.sh  # Script d'entrée Docker
│
├── 🔧 Configuration Projet
│   ├── package.json          # Configuration Node.js
│   ├── package-lock.json     # Verrouillage des dépendances
│   ├── .gitignore           # Fichiers ignorés par Git
│   └── .dockerignore        # Fichiers ignorés par Docker
│
├── 📊 Logs et Données
│   └── logs/                # Dossier des logs de l'application
│
├── 🖥️ Application Backend
│   └── server/              # Serveur Node.js/Express
│
├── 🎨 Application Frontend
│   └── client/              # Application React
│
├── 📚 Documentation Supplémentaire
│   ├── docs/                # Documentation détaillée
│   ├── scripts/             # Scripts utilitaires
│   └── SECURITY_AUDIT_REPORT.md  # Rapport d'audit de sécurité
│
└── 🧹 Nettoyage
    ├── CLEANUP_SUMMARY.md   # Résumé du nettoyage effectué
    └── DEPRECATION_FIX_SUMMARY.md  # Correction des dépréciations
```

## 🚀 **Scripts de Gestion Principaux**

### **Démarrage de l'Application**

```bash
./start-app.sh
```

- ✅ Vérifie les ports
- ✅ Installe les dépendances si nécessaire
- ✅ Démarre le backend (port 5001)
- ✅ Démarre le frontend (port 3000)
- ✅ Vérifie la connectivité

### **Arrêt de l'Application**

```bash
./stop-app.sh
```

- ✅ Arrête le backend
- ✅ Arrête le frontend
- ✅ Nettoie les processus
- ✅ Libère les ports

### **Redémarrage de l'Application**

```bash
./restart-app.sh
```

- ✅ Arrête proprement l'application
- ✅ Redémarre tout automatiquement

## 📖 **Documentation Essentielle**

| Fichier | Description |
|---------|-------------|
| `README.md` | Documentation principale du projet |
| `SECURITY.md` | Guide de sécurité et bonnes pratiques |
| `DOCKER.md` | Guide d'utilisation Docker |
| `API_SYNC_REFACTORING_SUMMARY.md` | Documentation de refactoring API |

## 🐳 **Configuration Docker**

| Fichier | Description |
|---------|-------------|
| `docker-compose.yml` | Configuration Docker principale |
| `docker-compose.raspberry-pi.yml` | Configuration Raspberry Pi |
| `Dockerfile` | Image Docker principale |
| `Dockerfile.raspberry-pi` | Image Docker Raspberry Pi |

## 🔧 **Configuration Projet**

| Fichier | Description |
|---------|-------------|
| `package.json` | Configuration Node.js et dépendances |
| `.gitignore` | Fichiers ignorés par Git |
| `.dockerignore`
