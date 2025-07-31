#!/bin/bash

# 🍓 Configuration des permissions WiFi pour Raspberry Pi

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
    echo "🍓 Configuration des permissions WiFi"
    echo "=========================================="
    echo -e "${NC}"
}

# Vérifier si on est sur Raspberry Pi
check_raspberry_pi() {
    if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
        print_warning "Ce script est optimisé pour Raspberry Pi"
        read -p "Continuer quand même ? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Installer les outils WiFi
install_wifi_tools() {
    print_info "Installation des outils WiFi..."
    
    sudo apt update
    sudo apt install -y \
        wireless-tools \
        wpasupplicant \
        network-manager \
        iw \
        arp-scan \
        nmap \
        iputils-arping
    
    print_success "Outils WiFi installés"
}

# Configurer les permissions
setup_permissions() {
    print_info "Configuration des permissions..."
    
    # Permissions pour les outils de scan
    if command -v arp-scan &> /dev/null; then
        sudo setcap cap_net_raw,cap_net_admin=eip $(which arp-scan)
        print_success "Permissions arp-scan configurées"
    fi
    
    if command -v nmap &> /dev/null; then
        sudo setcap cap_net_raw,cap_net_admin=eip $(which nmap)
        print_success "Permissions nmap configurées"
    fi
    
    if command -v arping &> /dev/null; then
        sudo setcap cap_net_raw,cap_net_admin=eip $(which arping)
        print_success "Permissions arping configurées"
    fi
    
    # Permissions pour iwlist et iw
    if command -v iwlist &> /dev/null; then
        sudo setcap cap_net_raw,cap_net_admin=eip $(which iwlist)
        print_success "Permissions iwlist configurées"
    fi
    
    if command -v iw &> /dev/null; then
        sudo setcap cap_net_raw,cap_net_admin=eip $(which iw)
        print_success "Permissions iw configurées"
    fi
}

# Configurer l'interface WiFi
setup_wifi_interface() {
    print_info "Configuration de l'interface WiFi..."
    
    # Détecter l'interface WiFi
    local wifi_interface=$(iw dev | grep Interface | head -1 | awk '{print $2}')
    
    if [[ -z "$wifi_interface" ]]; then
        print_warning "Aucune interface WiFi détectée"
        return
    fi
    
    print_info "Interface WiFi détectée: $wifi_interface"
    
    # Configurer les permissions pour l'interface
    sudo setcap cap_net_raw,cap_net_admin=eip $(which iwlist)
    sudo setcap cap_net_raw,cap_net_admin=eip $(which iw)
    
    print_success "Permissions configurées pour $wifi_interface"
}

# Tester les outils
test_tools() {
    print_info "Test des outils WiFi..."
    
    local tests_passed=0
    local total_tests=0
    
    # Test iwlist
    if command -v iwlist &> /dev/null; then
        total_tests=$((total_tests + 1))
        print_info "Test iwlist..."
        if sudo iwlist scan 2>/dev/null | grep -q "Cell"; then
            print_success "iwlist fonctionne"
            tests_passed=$((tests_passed + 1))
        else
            print_warning "iwlist ne détecte pas de réseaux"
        fi
    else
        print_warning "iwlist non installé"
    fi
    
    # Test nmcli
    if command -v nmcli &> /dev/null; then
        total_tests=$((total_tests + 1))
        print_info "Test nmcli..."
        if nmcli device wifi list 2>/dev/null | grep -q "SSID"; then
            print_success "nmcli fonctionne"
            tests_passed=$((tests_passed + 1))
        else
            print_warning "nmcli ne détecte pas de réseaux"
        fi
    else
        print_warning "nmcli non installé"
    fi
    
    # Test iw
    if command -v iw &> /dev/null; then
        total_tests=$((total_tests + 1))
        print_info "Test iw..."
        if sudo iw dev 2>/dev/null | grep -q "Interface"; then
            print_success "iw fonctionne"
            tests_passed=$((tests_passed + 1))
        else
            print_warning "iw ne fonctionne pas correctement"
        fi
    else
        print_warning "iw non installé"
    fi
    
    print_info "Tests: $tests_passed/$total_tests réussis"
}

# Démarrer les services réseau
start_network_services() {
    print_info "Démarrage des services réseau..."
    
    sudo systemctl enable NetworkManager 2>/dev/null || true
    sudo systemctl start NetworkManager 2>/dev/null || true
    
    sudo systemctl enable wpa_supplicant 2>/dev/null || true
    sudo systemctl start wpa_supplicant 2>/dev/null || true
    
    print_success "Services réseau démarrés"
}

# Afficher les informations finales
show_final_info() {
    print_header
    print_success "Configuration terminée !"
    
    echo ""
    echo "📋 Outils configurés:"
    echo "   - iwlist: $(which iwlist 2>/dev/null || echo 'Non installé')"
    echo "   - nmcli: $(which nmcli 2>/dev/null || echo 'Non installé')"
    echo "   - iw: $(which iw 2>/dev/null || echo 'Non installé')"
    echo "   - arp-scan: $(which arp-scan 2>/dev/null || echo 'Non installé')"
    echo "   - nmap: $(which nmap 2>/dev/null || echo 'Non installé')"
    echo ""
    echo "🔧 Commandes de test:"
    echo "   - sudo iwlist scan"
    echo "   - nmcli device wifi list"
    echo "   - sudo iw dev"
    echo "   - sudo iw dev wlan0 scan"
    echo ""
    echo "⚠️  Note: Le scan des réseaux environnants peut nécessiter:"
    echo "   - Un adaptateur WiFi compatible"
    echo "   - Une configuration en mode monitor (avancé)"
    echo ""
    echo "🚀 Redémarrez l'application pour tester le scan !"
}

# Fonction principale
main() {
    print_header
    check_raspberry_pi
    install_wifi_tools
    setup_permissions
    setup_wifi_interface
    start_network_services
    test_tools
    show_final_info
}

# Exécution du script
main "$@" 