# 🍓 Raspberry Pi - WiFi Tracker

Guide d'installation et de configuration de WiFi Tracker sur Raspberry Pi.

## 🎯 **Compatible ? OUI !** ✅

WiFi Tracker est **parfaitement compatible** avec Raspberry Pi, avec quelques ajustements spécifiques.

## 📋 **Prérequis Raspberry Pi**

### **Matériel recommandé**

- **Raspberry Pi 4** (2GB RAM minimum, 4GB recommandé)
- **Carte SD** 16GB+ (Classe 10 recommandée)
- **Alimentation** 5V/3A minimum
- **Câble réseau** ou WiFi intégré

### **Système d'exploitation**

- **Raspberry Pi OS** (anciennement Raspbian) - Recommandé
- **Ubuntu Server** pour Raspberry Pi
- **DietPi** - Version légère

### **Logiciels requis**

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation de Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installation de Docker (optionnel)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Outils réseau nécessaires
sudo apt install -y \
    net-tools \
    nmap \
    arping \
    iputils-ping \
    wireless-tools \
    wpasupplicant
```

## 🚀 **Installation**

### **Option 1 : Installation native (Recommandée)**

```bash
# Cloner le projet
git clone https://github.com/magikcypress/wifi-tracker.git
cd wifi-tracker

# Installation des dépendances
npm run install-all

# Configuration des variables d'environnement
cp server/env-template.txt server/.env
# Éditer server/.env

# Démarrer l'application
npm run dev
```

### **Option 2 : Installation Docker**

```bash
# Cloner le projet
git clone https://github.com/magikcypress/wifi-tracker.git
cd wifi-tracker

# Démarrer avec Docker
docker-compose up -d

# Accéder à l'application
# http://raspberry-pi-ip:5001
```

## 🔧 **Configuration Spécifique Raspberry Pi**

### **1. Optimisation des performances**

```bash
# Augmenter la mémoire swap
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Modifier CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon

# Optimiser le système de fichiers
sudo nano /boot/cmdline.txt
# Ajouter : fsck.mode=force fsck.repair=yes
```

### **2. Configuration réseau**

```bash
# Vérifier les interfaces WiFi
iwconfig

# Configuration WiFi statique (optionnel)
sudo nano /etc/dhcpcd.conf
# Ajouter :
# interface wlan0
# static ip_address=192.168.1.100/24
# static routers=192.168.1.1
# static domain_name_servers=8.8.8.8
```

### **3. Permissions réseau**

```bash
# Donner les permissions pour le scan réseau
sudo setcap cap_net_raw,cap_net_admin=eip $(which nmap)
sudo setcap cap_net_raw,cap_net_admin=eip $(which arping)

# Vérifier les permissions
getcap $(which nmap)
getcap $(which arping)
```

## 🐳 **Docker sur Raspberry Pi**

### **Dockerfile optimisé pour ARM**

```dockerfile
# Dockerfile.raspberry-pi
FROM arm32v7/node:18-alpine

# Installation des outils système pour ARM
RUN apk add --no-cache \
    net-tools \
    iputils \
    nmap \
    arping \
    wireless-tools \
    && rm -rf /var/cache/apk/*

# Configuration spécifique ARM
ENV NODE_OPTIONS="--max-old-space-size=512"

# ... reste du Dockerfile identique
```

### **docker-compose.raspberry-pi.yml**

```yaml
version: '3.8'

services:
  wifi-tracker:
    build:
      context: .
      dockerfile: Dockerfile.raspberry-pi
    container_name: wifi-tracker-pi
    ports:
      - "5001:5001"
    environment:
      - NODE_ENV=production
      - PORT=5001
      - NODE_OPTIONS=--max-old-space-size=512
    volumes:
      - ./logs:/app/logs
      - ./data:/app/data
    restart: unless-stopped
    network_mode: host
    privileged: true
    user: "1001:1001"
```

## 🔒 **Sécurité Raspberry Pi**

### **1. Configuration firewall**

```bash
# Installation d'ufw
sudo apt install ufw

# Configuration de base
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 5001/tcp
sudo ufw enable
```

### **2. Utilisateur dédié**

```bash
# Créer un utilisateur pour l'application
sudo adduser wifi-tracker
sudo usermod -aG docker wifi-tracker

# Changer les permissions
sudo chown -R wifi-tracker:wifi-tracker /home/wifi-tracker/wifi-tracker
```

### **3. Service systemd**

```bash
# Créer le service
sudo nano /etc/systemd/system/wifi-tracker.service

[Unit]
Description=WiFi Tracker
After=network.target

[Service]
Type=simple
User=wifi-tracker
WorkingDirectory=/home/wifi-tracker/wifi-tracker
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target

# Activer le service
sudo systemctl enable wifi-tracker
sudo systemctl start wifi-tracker
```

## 📊 **Monitoring et Performance**

### **1. Surveillance des ressources**

```bash
# Vérifier l'utilisation CPU/RAM
htop

# Vérifier l'espace disque
df -h

# Vérifier la température
vcgencmd measure_temp

# Vérifier la fréquence CPU
vcgencmd measure_clock arm
```

### **2. Optimisations**

```bash
# Désactiver les services inutiles
sudo systemctl disable bluetooth
sudo systemctl disable avahi-daemon

# Optimiser la mémoire
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf

# Optimiser le stockage
echo 'noatime' | sudo tee -a /etc/fstab
```

## 🔍 **Dépannage**

### **Problèmes courants**

#### **1. Permissions réseau**

```bash
# Vérifier les permissions
sudo setcap cap_net_raw,cap_net_admin=eip $(which nmap)
sudo setcap cap_net_raw,cap_net_admin=eip $(which arping)

# Tester le scan
sudo nmap -sn 192.168.1.0/24
```

#### **2. Mémoire insuffisante**

```bash
# Augmenter la swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Ajouter à fstab
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

#### **3. Performance lente**

```bash
# Optimiser Node.js
export NODE_OPTIONS="--max-old-space-size=512"

# Réduire les intervalles de scan
export WIFI_SCAN_INTERVAL=60000
export DEVICE_SCAN_INTERVAL=120000
```

## 🎯 **Configuration Recommandée**

### **Variables d'environnement optimisées**

```bash
# server/.env
NODE_ENV=production
PORT=5001
CORS_ORIGIN=http://raspberry-pi-ip:3001
REQUEST_TIMEOUT=60000
SCAN_TIMEOUT=30000
WIFI_SCAN_INTERVAL=60000
DEVICE_SCAN_INTERVAL=120000
LOG_LEVEL=warn
NODE_OPTIONS=--max-old-space-size=512
```

### **Script de démarrage automatique**

```bash
#!/bin/bash
# /home/wifi-tracker/start-wifi-tracker.sh

cd /home/wifi-tracker/wifi-tracker
export NODE_OPTIONS="--max-old-space-size=512"
npm start
```

## 📱 **Accès distant**

### **1. Accès par IP**

```bash
# Trouver l'IP du Raspberry Pi
hostname -I

# Accéder à l'application
# http://192.168.1.100:5001
```

### **2. Configuration DNS local**

```bash
# Ajouter dans /etc/hosts sur les autres appareils
192.168.1.100 wifi-tracker.local

# Accéder via
# http://wifi-tracker.local:5001
```

### **3. Reverse proxy avec Nginx**

```bash
# Installation
sudo apt install nginx

# Configuration
sudo nano /etc/nginx/sites-available/wifi-tracker

server {
    listen 80;
    server_name wifi-tracker.local;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Activer
sudo ln -s /etc/nginx/sites-available/wifi-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🚀 **Déploiement en Production**

### **1. Installation automatique**

```bash
# Script d'installation complète
curl -fsSL https://raw.githubusercontent.com/magikcypress/wifi-tracker/main/scripts/raspberry-pi-setup.sh | bash
```

### **2. Monitoring**

```bash
# Installation de monitoring
sudo apt install htop iotop

# Surveillance automatique
watch -n 5 'free -h && df -h && vcgencmd measure_temp'
```

## ✅ **Vérification de l'installation**

```bash
# Tester l'API
curl http://localhost:5001/api/networks

# Vérifier les logs
tail -f logs/combined.log

# Vérifier les processus
ps aux | grep node

# Vérifier les ports
netstat -tlnp | grep 5001
```

---

## 🎯 **Conclusion**

**WiFi Tracker fonctionne parfaitement sur Raspberry Pi !**

### **✅ Avantages :**

- **Faible consommation** - Idéal pour un serveur 24/7
- **Coût réduit** - Solution économique
- **Silencieux** - Pas de ventilateur
- **Compact** - Prend peu de place
- **Énergétiquement efficace** - 5W de consommation

### **⚠️ Points d'attention :**

- **Performance** - Plus lent qu'un serveur dédié
- **Mémoire** - Limité à 4GB max sur Pi 4
- **Stockage** - Carte SD moins rapide qu'un SSD
- **Réseau** - WiFi intégré peut être limité

### **🚀 Recommandations :**

1. **Utiliser un Pi 4** avec 4GB RAM
2. **Carte SD classe 10** ou SSD externe
3. **Connexion Ethernet** pour de meilleures performances
4. **Monitoring** des ressources
5. **Backup** régulier de la configuration

---

**Dernière mise à jour :** 19 Juillet 2025  
**Testé sur :** Raspberry Pi 4 (4GB RAM)
