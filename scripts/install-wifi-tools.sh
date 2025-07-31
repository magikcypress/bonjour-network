#!/bin/bash

# 🍓 Installation rapide des outils WiFi

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
    echo "🍓 Installation des outils WiFi"
    echo "=========================================="
    echo -e "${NC}"
}

# Installation des outils WiFi
install_wifi_tools() {
    print_info "Installation des outils WiFi..."
    
    # Mise à jour du système
    sudo apt update
    
    # Installation des outils WiFi
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

# Configuration des permissions
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
}

# Test des outils installés
test_tools() {
    print_info "Test des outils installés..."
    
    local tests_passed=0
    local total_tests=0
    
    # Test iwlist
    if command -v iwlist &> /dev/null; then
        total_tests=$((total_tests + 1))
        if sudo iwlist scan 2>/dev/null | grep -q "Cell"; then
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
    
    # Test iw
    if command -v iw &> /dev/null; then
        total_tests=$((total_tests + 1))
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

# Test du scan WiFi
test_wifi_scan() {
    print_info "Test du scan WiFi..."
    
    # Tester avec Node.js
    if command -v node &> /dev/null; then
        print_info "Test avec Node.js..."
        node test-wifi-scan.js 2>/dev/null || print_warning "Test Node.js échoué"
    else
        print_warning "Node.js non installé"
    fi
}

# Affichage des informations finales
show_final_info() {
    print_header
    print_success "Installation terminée !"
    
    echo ""
    echo "📋 Outils installés:"
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
    echo "   - node test-wifi-scan.js"
    echo ""
    echo "🚀 Redémarrez l'application pour tester le scan !"
}

# Fonction principale
main() {
    print_header
    install_wifi_tools
    setup_permissions
    test_tools
    test_wifi_scan
    show_final_info
}

# Exécution du script
main "$@" 