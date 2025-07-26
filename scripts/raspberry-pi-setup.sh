#!/bin/bash

# Script d'installation Bonjour Network pour Raspberry Pi

set -e

echo "🍓 Installation Bonjour Network sur Raspberry Pi"
echo "============================================="

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier que c'est bien un Raspberry Pi
check_raspberry_pi() {
    print_status "Vérification du matériel..."
    
    if [ -f /proc/cpuinfo ] && grep -q "Raspberry Pi" /proc/cpuinfo; then
        print_success "Raspberry Pi détecté"
        MODEL=$(grep "Model" /proc/cpuinfo | cut -d: -f2 | xargs)
        print_status "Modèle: $MODEL"
    else
        print_warning "Ce script est optimisé pour Raspberry Pi"
    fi
}

# Mise à jour du système
update_system() {
    print_status "Mise à jour du système..."
    sudo apt update && sudo apt upgrade -y
    print_success "Système mis à jour"
}

# Installation de Node.js
install_nodejs() {
    print_status "Installation de Node.js..."
    
    # Vérifier si Node.js est déjà installé
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js déjà installé: $NODE_VERSION"
    else
        # Installation de Node.js 18+
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
        print_success "Node.js installé"
    fi
    
    # Vérifier la version
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    print_status "Node.js: $NODE_VERSION, npm: $NPM_VERSION"
}

# Installation de Docker (optionnel)
install_docker() {
    print_status "Installation de Docker..."
    
    if command -v docker &> /dev/null; then
        print_status "Docker déjà installé"
    else
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        print_success "Docker installé"
        print_warning "Redémarrez votre session pour utiliser Docker"
    fi
}

# Installation des outils réseau
install_network_tools() {
    print_status "Installation des outils réseau..."
    
    sudo apt install -y \
        net-tools \
        nmap \
        arping \
        iputils-ping \
        wireless-tools \
        wpasupplicant \
        htop \
        iotop
    
    print_success "Outils réseau installés"
}

# Configuration des permissions réseau
setup_network_permissions() {
    print_status "Configuration des permissions réseau..."
    
    # Donner les permissions pour le scan réseau
    sudo setcap cap_net_raw,cap_net_admin=eip $(which nmap) 2>/dev/null || true
    sudo setcap cap_net_raw,cap_net_admin=eip $(which arping) 2>/dev/null || true
    
    print_success "Permissions réseau configurées"
}

# Optimisation du système
optimize_system() {
    print_status "Optimisation du système..."
    
    # Augmenter la mémoire swap
    if [ -f /etc/dphys-swapfile ]; then
        sudo dphys-swapfile swapoff
        sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
        sudo dphys-swapfile setup
        sudo dphys-swapfile swapon
        print_success "Swap configuré à 2GB"
    fi
    
    # Optimiser la mémoire
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    
    # Désactiver les services inutiles
    sudo systemctl disable bluetooth 2>/dev/null || true
    sudo systemctl disable avahi-daemon 2>/dev/null || true
    
    print_success "Système optimisé"
}

# Installation de Bonjour Network
install_wifi_tracker() {
    print_status "Installation de Bonjour Network..."
    
    # Vérifier si le projet existe déjà
    if [ -d "bonjour-network" ]; then
        print_status "Projet existant détecté, mise à jour..."
        cd bonjour-network
        git pull
    else
        # Cloner le projet
        git clone https://github.com/magikcypress/bonjour-network.git
        cd bonjour-network
    fi
    
    # Installation des dépendances
    npm run install-all
    
    # Créer les dossiers nécessaires
    mkdir -p logs
    mkdir -p data
    
    print_success "Bonjour Network installé"
}

# Configuration de l'environnement
setup_environment() {
    print_status "Configuration de l'environnement..."
    
    # Créer le fichier .env
    if [ ! -f "server/.env" ]; then
        cat > server/.env << EOF
NODE_ENV=production
PORT=5001
CORS_ORIGIN=http://localhost:3001
REQUEST_TIMEOUT=60000
SCAN_TIMEOUT=30000
WIFI_SCAN_INTERVAL=60000
DEVICE_SCAN_INTERVAL=120000
LOG_LEVEL=warn
NODE_OPTIONS=--max-old-space-size=512
EOF
        print_success "Fichier .env créé"
    else
        print_status "Fichier .env existe déjà"
    fi
}

# Configuration du service systemd
setup_systemd_service() {
    print_status "Configuration du service systemd..."
    
    # Créer l'utilisateur si nécessaire
    if ! id "bonjour-network" &>/dev/null; then
        sudo adduser --disabled-password --gecos "" bonjour-network
        print_success "Utilisateur bonjour-network créé"
    fi
    
    # Créer le service systemd
    sudo tee /etc/systemd/system/bonjour-network.service > /dev/null << EOF
[Unit]
Description=WiFi Tracker
After=network.target

[Service]
Type=simple
User=bonjour-network
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=NODE_OPTIONS=--max-old-space-size=512

[Install]
WantedBy=multi-user.target
EOF
    
    # Activer le service
    sudo systemctl daemon-reload
    sudo systemctl enable bonjour-network
    sudo systemctl start bonjour-network
    
    print_success "Service systemd configuré"
}

# Configuration du firewall
setup_firewall() {
    print_status "Configuration du firewall..."
    
    # Installation d'ufw
    sudo apt install -y ufw
    
    # Configuration de base
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow ssh
    sudo ufw allow 5001/tcp
    sudo ufw --force enable
    
    print_success "Firewall configuré"
}

# Test de l'installation
test_installation() {
    print_status "Test de l'installation..."
    
    # Attendre que le service démarre
    sleep 10
    
    # Tester l'API
    if curl -s http://localhost:5001/api/networks > /dev/null; then
        print_success "API accessible"
    else
        print_warning "API non accessible, vérifiez les logs"
    fi
    
    # Vérifier le service
    if sudo systemctl is-active --quiet bonjour-network; then
        print_success "Service actif"
    else
        print_error "Service inactif"
    fi
}

# Affichage des informations finales
show_final_info() {
    echo ""
    echo "🎉 Bonjour Network installé avec succès sur Raspberry Pi !"
    echo "======================================================"
    echo ""
    echo "📱 Accès à l'application:"
    echo "   http://$(hostname -I | awk '{print $1}'):5001"
    echo ""
    echo "🔧 Commandes utiles:"
    echo "   - Voir les logs: sudo journalctl -u bonjour-network -f"
    echo "   - Redémarrer: sudo systemctl restart bonjour-network"
    echo "   - Statut: sudo systemctl status bonjour-network"
    echo "   - Arrêter: sudo systemctl stop bonjour-network"
    echo ""
    echo "📊 Monitoring:"
    echo "   - Ressources: htop"
    echo "   - Température: vcgencmd measure_temp"
    echo "   - Espace disque: df -h"
    echo ""
    echo "🔒 Sécurité:"
    echo "   - Firewall: sudo ufw status"
    echo "   - Logs: tail -f logs/combined.log"
    echo ""
    echo "📁 Dossiers créés:"
    echo "   - $(pwd)/logs/ : Logs de l'application"
    echo "   - $(pwd)/data/ : Données persistantes"
    echo ""
    echo "🚀 Le service démarre automatiquement au boot"
    echo ""
}

# Menu principal
main() {
    echo ""
    echo "Choisissez une option:"
    echo "1) Installation complète (recommandé)"
    echo "2) Installation sans Docker"
    echo "3) Installation Docker uniquement"
    echo "4) Configuration système uniquement"
    echo "5) Vérifier l'installation"
    echo "6) Démarrer le service"
    echo "7) Arrêter le service"
    echo "8) Voir les logs"
    echo "q) Quitter"
    echo ""
    read -p "Votre choix: " choice
    
    case $choice in
        1)
            check_raspberry_pi
            update_system
            install_nodejs
            install_docker
            install_network_tools
            setup_network_permissions
            optimize_system
            install_wifi_tracker
            setup_environment
            setup_systemd_service
            setup_firewall
            test_installation
            show_final_info
            ;;
        2)
            check_raspberry_pi
            update_system
            install_nodejs
            install_network_tools
            setup_network_permissions
            optimize_system
            install_wifi_tracker
            setup_environment
            setup_systemd_service
            test_installation
            show_final_info
            ;;
        3)
            install_docker
            install_wifi_tracker
            setup_environment
            ;;
        4)
            check_raspberry_pi
            update_system
            install_network_tools
            setup_network_permissions
            optimize_system
            setup_firewall
            ;;
        5)
            test_installation
            ;;
        6)
            sudo systemctl start bonjour-network
            print_success "Service démarré"
            ;;
        7)
            sudo systemctl stop bonjour-network
            print_success "Service arrêté"
            ;;
        8)
            sudo journalctl -u bonjour-network -f
            ;;
        q|Q)
            echo "Au revoir !"
            exit 0
            ;;
        *)
            print_error "Option invalide"
            main
            ;;
    esac
}

# Exécution du script
if [[ $1 == "--auto" ]]; then
    # Mode automatique pour l'installation complète
    check_raspberry_pi
    update_system
    install_nodejs
    install_docker
    install_network_tools
    setup_network_permissions
    optimize_system
    install_wifi_tracker
    setup_environment
    setup_systemd_service
    setup_firewall
    test_installation
    show_final_info
else
    # Mode interactif
    main
fi 