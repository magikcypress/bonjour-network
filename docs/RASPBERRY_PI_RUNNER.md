# 🍓 Runner GitHub Actions sur Raspberry Pi

## 📋 Vue d'ensemble

Ce guide explique comment configurer un runner GitHub Actions auto-hébergé sur Raspberry Pi pour des tests natifs.

## 🎯 Avantages

### ✅ **Tests natifs**

- **Hardware réel** Raspberry Pi
- **Performance réelle** (pas d'émulation)
- **Outils système natifs** (iwlist, nmap, etc.)

### ✅ **Environnement réel**

- **Raspberry Pi OS** (Raspbian)
- **Architecture ARM** native
- **Réseau WiFi** réel

## 🔧 Configuration du runner

### **1. Prérequis**

```bash
# Raspberry Pi 4 (recommandé)
# Raspberry Pi OS (Bullseye ou plus récent)
# Connexion Internet stable
# Au moins 4GB de RAM
```

### **2. Installation du runner**

```bash
# Se connecter en SSH sur le Raspberry Pi
ssh pi@raspberrypi.local

# Créer un répertoire pour le runner
mkdir -p ~/actions-runner
cd ~/actions-runner

# Télécharger le runner (ARM64)
wget https://github.com/actions/runner/releases/download/v3.1.0/actions-runner-linux-arm64-3.1.0.tar.gz

# Extraire
tar xzf actions-runner-linux-arm64-3.1.0.tar.gz

# Configurer le runner
./config.sh --url https://github.com/votre-username/bonjour-network --token VOTRE_TOKEN
```

### **3. Installation des dépendances**

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Installer les outils réseau
sudo apt install -y \
    net-tools \
    iputils-ping \
    nmap \
    wireless-tools \
    wpasupplicant \
    network-manager \
    iw \
    iwconfig

# Installer les outils de développement
sudo apt install -y \
    git \
    curl \
    wget \
    build-essential \
    python3 \
    python3-pip
```

### **4. Configuration du runner**

```bash
# Créer un service systemd
sudo nano /etc/systemd/system/github-runner.service
```

**Contenu du service :**

```ini
[Unit]
Description=GitHub Actions Runner
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/actions-runner
ExecStart=/home/pi/actions-runner/run.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### **5. Activer le service**

```bash
# Recharger systemd
sudo systemctl daemon-reload

# Activer le service
sudo systemctl enable github-runner

# Démarrer le service
sudo systemctl start github-runner

# Vérifier le statut
sudo systemctl status github-runner
```

## 🚀 Configuration GitHub

### **1. Ajouter le runner au repository**

1. Aller sur GitHub → Settings → Actions → Runners
2. Cliquer sur "New self-hosted runner"
3. Suivre les instructions pour configurer le runner

### **2. Étiquettes du runner**

```bash
# Étiquettes recommandées
raspberry-pi
arm64
linux
self-hosted
```

## 🧪 Tests spécifiques Raspberry Pi

### **1. Test de l'environnement**

```bash
# Vérifier l'architecture
uname -a
# Linux raspberrypi 5.15.0-rpi-* arm64 GNU/Linux

# Vérifier Node.js
node --version
npm --version

# Vérifier Docker
docker --version
docker run --rm hello-world
```

### **2. Test des outils réseau**

```bash
# Test des interfaces réseau
ip link show

# Test des outils WiFi
iwlist wlan0 scan | head -20

# Test de nmap
sudo nmap -sn 192.168.1.0/24

# Test de ping
ping -c 3 8.8.8.8
```

### **3. Test de l'application**

```bash
# Cloner le repository
git clone https://github.com/votre-username/bonjour-network.git
cd bonjour-network

# Installer les dépendances
npm ci
cd client && npm ci
cd ../server && npm ci

# Tester le serveur
cd ../server
npm start &
sleep 10
curl http://localhost:5001/api/health
```

## 🔧 Workflow spécifique Raspberry Pi

### **Configuration dans `.github/workflows/raspberry-pi-test.yml` :**

```yaml
jobs:
  raspberry-self-hosted:
    runs-on: self-hosted
    if: ${{ github.repository == 'votre-username/bonjour-network' }}
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Check Raspberry Pi environment
      run: |
        echo "🍓 Environnement Raspberry Pi détecté"
        uname -a
        cat /etc/os-release
        node --version
        npm --version
```

## 📊 Monitoring et maintenance

### **1. Surveillance du runner**

```bash
# Vérifier le statut
sudo systemctl status github-runner

# Voir les logs
sudo journalctl -u github-runner -f

# Vérifier l'espace disque
df -h

# Vérifier la mémoire
free -h
```

### **2. Mise à jour du runner**

```bash
# Arrêter le service
sudo systemctl stop github-runner

# Mettre à jour le runner
cd ~/actions-runner
./run.sh --once --update

# Redémarrer le service
sudo systemctl start github-runner
```

### **3. Nettoyage automatique**

```bash
# Script de nettoyage
cat > ~/cleanup-runner.sh << 'EOF'
#!/bin/bash
# Nettoyer les containers Docker
docker system prune -f

# Nettoyer les logs
sudo journalctl --vacuum-time=7d

# Nettoyer les packages
sudo apt autoremove -y
sudo apt autoclean
EOF

chmod +x ~/cleanup-runner.sh

# Ajouter au crontab
crontab -e
# Ajouter : 0 2 * * * /home/pi/cleanup-runner.sh
```

## 🚨 Dépannage

### **Problèmes courants :**

#### **1. Runner ne se connecte pas**

```bash
# Vérifier la connectivité
ping github.com

# Vérifier le token
./config.sh --url https://github.com/votre-username/bonjour-network --token VOTRE_TOKEN

# Redémarrer le service
sudo systemctl restart github-runner
```

#### **2. Problèmes de permissions**

```bash
# Vérifier les permissions
ls -la ~/actions-runner/

# Corriger les permissions
sudo chown -R pi:pi ~/actions-runner/
chmod +x ~/actions-runner/run.sh
```

#### **3. Problèmes de mémoire**

```bash
# Vérifier l'utilisation mémoire
free -h

# Augmenter le swap si nécessaire
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

## 📈 Optimisations

### **1. Performance**

```bash
# Overclock modéré (Raspberry Pi 4)
sudo nano /boot/config.txt
# Ajouter : over_voltage=2
# Ajouter : arm_freq=1750

# Optimiser le système de fichiers
sudo nano /etc/fstab
# Ajouter : noatime,nodiratime
```

### **2. Réseau**

```bash
# Optimiser le WiFi
sudo nano /etc/wpa_supplicant/wpa_supplicant.conf
# Ajouter : country=FR

# Optimiser Ethernet
sudo nano /etc/network/interfaces
# Ajouter : eth0: speed=1000
```

## 🎯 Avantages vs Limitations

### ✅ **Avantages :**

- **Tests natifs** sur hardware réel
- **Performance réelle** (pas d'émulation)
- **Outils système** complets
- **Réseau WiFi** réel
- **Architecture ARM** native

### ⚠️ **Limitations :**

- **Ressources limitées** (RAM, CPU)
- **Connexion Internet** requise
- **Maintenance** du runner
- **Sécurité** (exposer le Pi)
- **Coût** (électricité, hardware)

## 🚀 Conclusion

Un runner auto-hébergé sur Raspberry Pi offre des tests natifs précieux pour votre application, mais nécessite une configuration et une maintenance appropriées.
