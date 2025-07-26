#!/bin/bash

# 🍓 Script d'installation Bonjour Network pour Raspberry Pi
# Compatible avec Raspberry Pi OS et Ubuntu Server

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "🍓 Installation Bonjour Network - Raspberry Pi"
    echo "=========================================="
    echo -e "${NC}"
}

# Vérifier si on est sur un Raspberry Pi
check_raspberry_pi() {
    if [ -f /proc/cpuinfo ]; then
        if grep -q "Raspberry Pi" /proc/cpuinfo; then
            print_success "Raspberry Pi détecté"
            return 0
        fi
    fi
    
    if [ -f /etc/rpi-issue ]; then
        print_success "Raspberry Pi OS détecté"
        return 0
    fi
    
    print_warning "Pas de Raspberry Pi détecté, mais installation possible"
    return 0
}

# Mise à jour du système
update_system() {
    print_info "Mise à jour du système..."
    sudo apt update
    sudo apt upgrade -y
    print_success "Système mis à jour"
}

# Installation des dépendances système
install_system_dependencies() {
    print_info "Installation des dépendances système..."
    
    # Outils de base
    sudo apt install -y \
        curl \
        wget \
        git \
        build-essential \
        python3 \
        python3-pip
    
    # Outils réseau essentiels
    sudo apt install -y \
        net-tools \
        iputils-ping \
        iputils-arping \
        nmap \
        arp-scan \
        wireless-tools \
        wpasupplicant \
        network-manager \
        iw
    
    print_success "Dépendances système installées"
}

# Installation de Node.js
install_nodejs() {
    print_info "Installation de Node.js..."
    
    # Vérifier si Node.js est déjà installé
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_info "Node.js déjà installé: $NODE_VERSION"
        
        # Vérifier la version
        if [[ "$NODE_VERSION" == v18* ]] || [[ "$NODE_VERSION" == v20* ]]; then
            print_success "Version Node.js compatible"
            return 0
        else
            print_warning "Version Node.js ancienne, mise à jour..."
        fi
    fi
    
    # Installation de Node.js 18+
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    print_success "Node.js installé: $(node --version)"
}

# Installation de Docker (optionnel)
install_docker() {
    print_info "Installation de Docker..."
    
    if command -v docker &> /dev/null; then
        print_info "Docker déjà installé"
        return 0
    fi
    
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    
    print_success "Docker installé"
}

# Configuration des permissions réseau
setup_network_permissions() {
    print_info "Configuration des permissions réseau..."
    
    # Permissions pour les outils de scan
    if command -v nmap &> /dev/null; then
        sudo setcap cap_net_raw,cap_net_admin=eip $(which nmap)
    fi
    
    if command -v arping &> /dev/null; then
        sudo setcap cap_net_raw,cap_net_admin=eip $(which arping)
    fi
    
    if command -v arp-scan &> /dev/null; then
        sudo setcap cap_net_raw,cap_net_admin=eip $(which arp-scan)
    fi
    
    # Permissions utilisateur
    sudo usermod -aG netdev $USER
    sudo usermod -aG dialout $USER
    
    print_success "Permissions réseau configurées"
}

# Configuration des variables d'environnement
setup_environment() {
    print_info "Configuration des variables d'environnement..."
    
    # Obtenir l'IP du Raspberry Pi
    RASPBERRY_PI_IP=$(hostname -I | awk '{print $1}')
    
    # Configuration serveur
    cat > server/.env << EOF
NODE_ENV=production
PORT=5001
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:5001,http://${RASPBERRY_PI_IP}:3000,http://${RASPBERRY_PI_IP}:3001
REQUEST_TIMEOUT=60000
SCAN_TIMEOUT=30000
WIFI_SCAN_INTERVAL=60000
DEVICE_SCAN_INTERVAL=120000
LOG_LEVEL=warn
NODE_OPTIONS=--max-old-space-size=512
EOF

    # Configuration client
    cat > client/.env << EOF
REACT_APP_API_URL=http://${RASPBERRY_PI_IP}:5001/api
REACT_APP_SOCKET_URL=http://${RASPBERRY_PI_IP}:5001
EOF

    print_success "Variables d'environnement configurées pour IP: $RASPBERRY_PI_IP"
}

# Installation des dépendances Node.js
install_node_dependencies() {
    print_info "Installation des dépendances Node.js..."
    
    # Installation des dépendances serveur
    cd server
    npm install
    cd ..
    
    # Installation des dépendances client
    cd client
    npm install
    cd ..
    
    # Installation des dépendances racine
    npm install
    
    print_success "Dépendances Node.js installées"
}

# Test des outils de scan
test_scan_tools() {
    print_info "Test des outils de scan..."
    
    local tests_passed=0
    local total_tests=0
    
    # Test arp-scan
    if command -v arp-scan &> /dev/null; then
        total_tests=$((total_tests + 1))
        if sudo arp-scan --localnet --timeout=1000 | grep -q "Interface"; then
            print_success "arp-scan fonctionne"
            tests_passed=$((tests_passed + 1))
        else
            print_warning "arp-scan ne fonctionne pas correctement"
        fi
    else
        print_warning "arp-scan non installé"
    fi
    
    # Test nmap
    if command -v nmap &> /dev/null; then
        total_tests=$((total_tests + 1))
        if nmap -sn 127.0.0.1 | grep -q "Nmap scan report"; then
            print_success "nmap fonctionne"
            tests_passed=$((tests_passed + 1))
        else
            print_warning "nmap ne fonctionne pas correctement"
        fi
    else
        print_warning "nmap non installé"
    fi
    
    # Test iwlist
    if command -v iwlist &> /dev/null; then
        total_tests=$((total_tests + 1))
        if iwlist scan 2>/dev/null | grep -q "Cell"; then
            print_success "iwlist fonctionne"
            tests_passed=$((tests_passed + 1))
        else
            print_warning "iwlist ne fonctionne pas correctement"
        fi
    else
        print_warning "iwlist non installé"
    fi
    
    # Test nmcli
    if command -v nmcli &> /dev/null; then
        total_tests=$((total_tests + 1))
        if nmcli device wifi list 2>/dev/null | grep -q "SSID"; then
            print_success "nmcli fonctionne"
            tests_passed=$((tests_passed + 1))
        else
            print_warning "nmcli ne fonctionne pas correctement"
        fi
    else
        print_warning "nmcli non installé"
    fi
    
    print_info "Tests de scan: $tests_passed/$total_tests réussis"
}

# Création du script de démarrage
create_startup_script() {
    print_info "Création du script de démarrage..."
    
    cat > start-bonjour-network.sh << 'EOF'
#!/bin/bash

# Script de démarrage Bonjour Network pour Raspberry Pi
cd "$(dirname "$0")"

# Configuration pour Raspberry Pi
export NODE_OPTIONS="--max-old-space-size=512"
export WIFI_SCAN_INTERVAL=60000
export DEVICE_SCAN_INTERVAL=120000

# Démarrer l'application
npm run dev
EOF

    chmod +x start-bonjour-network.sh
    print_success "Script de démarrage créé"
}

# Configuration du service systemd
setup_systemd_service() {
    print_info "Configuration du service systemd..."
    
    sudo tee /etc/systemd/system/bonjour-network.service > /dev/null << EOF
[Unit]
Description=Bonjour Network
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment=NODE_OPTIONS=--max-old-space-size=512
ExecStart=/usr/bin/npm run dev
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable bonjour-network.service
    
    print_success "Service systemd configuré"
}

# Affichage des informations finales
show_final_info() {
    print_header
    print_success "Installation terminée avec succès !"
    
    RASPBERRY_PI_IP=$(hostname -I | awk '{print $1}')
    
    echo ""
    echo "🌐 Accès à l'application:"
    echo "   - Interface: http://$RASPBERRY_PI_IP:3000"
    echo "   - API: http://$RASPBERRY_PI_IP:5001"
    echo ""
    echo "🚀 Commandes utiles:"
    echo "   - Démarrer: npm run dev"
    echo "   - Service: sudo systemctl start bonjour-network"
    echo "   - Logs: sudo journalctl -u bonjour-network -f"
    echo ""
    echo "📋 Outils installés:"
    echo "   - arp-scan: $(which arp-scan 2>/dev/null || echo 'Non installé')"
    echo "   - nmap: $(which nmap 2>/dev/null || echo 'Non installé')"
    echo "   - iwlist: $(which iwlist 2>/dev/null || echo 'Non installé')"
    echo "   - nmcli: $(which nmcli 2>/dev/null || echo 'Non installé')"
    echo ""
    echo "🔧 Redémarrage recommandé pour appliquer toutes les permissions"
}

# Fonction principale
main() {
    print_header
    check_raspberry_pi
    update_system
    install_system_dependencies
    install_nodejs
    install_docker
    setup_network_permissions
    setup_environment
    install_node_dependencies
    test_scan_tools
    create_startup_script
    setup_systemd_service
    show_final_info
}

# Exécution du script
main "$@" 