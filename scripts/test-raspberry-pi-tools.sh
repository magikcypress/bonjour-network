#!/bin/bash

# 🍓 Script de test des outils Bonjour Network sur Raspberry Pi

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
    echo "🍓 Test des outils Bonjour Network - Raspberry Pi"
    echo "=========================================="
    echo -e "${NC}"
}

# Vérifier si on est sur Raspberry Pi
check_raspberry_pi() {
    if [ -f /proc/cpuinfo ] && grep -q "Raspberry Pi" /proc/cpuinfo; then
        print_success "Raspberry Pi détecté"
        return 0
    fi
    
    if [ -f /etc/rpi-issue ]; then
        print_success "Raspberry Pi OS détecté"
        return 0
    fi
    
    print_warning "Pas de Raspberry Pi détecté, mais tests possibles"
    return 0
}

# Test des outils de base
test_basic_tools() {
    print_info "Test des outils de base..."
    
    local tests_passed=0
    local total_tests=0
    
    # Test arp
    total_tests=$((total_tests + 1))
    if arp -a | grep -q "ether"; then
        print_success "arp fonctionne"
        tests_passed=$((tests_passed + 1))
    else
        print_warning "arp ne fonctionne pas correctement"
    fi
    
    # Test netstat
    total_tests=$((total_tests + 1))
    if netstat -i | grep -q "Iface"; then
        print_success "netstat fonctionne"
        tests_passed=$((tests_passed + 1))
    else
        print_warning "netstat ne fonctionne pas correctement"
    fi
    
    # Test ping
    total_tests=$((total_tests + 1))
    if ping -c 1 127.0.0.1 > /dev/null 2>&1; then
        print_success "ping fonctionne"
        tests_passed=$((tests_passed + 1))
    else
        print_warning "ping ne fonctionne pas correctement"
    fi
    
    print_info "Outils de base: $tests_passed/$total_tests réussis"
}

# Test des outils de scan réseau
test_network_scan_tools() {
    print_info "Test des outils de scan réseau..."
    
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
    
    # Test arping
    if command -v arping &> /dev/null; then
        total_tests=$((total_tests + 1))
        if sudo arping -I eth0 -c 1 127.0.0.1 > /dev/null 2>&1; then
            print_success "arping fonctionne"
            tests_passed=$((tests_passed + 1))
        else
            print_warning "arping ne fonctionne pas correctement"
        fi
    else
        print_warning "arping non installé"
    fi
    
    print_info "Outils de scan réseau: $tests_passed/$total_tests réussis"
}

# Test des outils WiFi
test_wifi_tools() {
    print_info "Test des outils WiFi..."
    
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
    
    # Test iwconfig
    if command -v iwconfig &> /dev/null; then
        total_tests=$((total_tests + 1))
        if iwconfig 2>/dev/null | grep -q "IEEE"; then
            print_success "iwconfig fonctionne"
            tests_passed=$((tests_passed + 1))
        else
            print_warning "iwconfig ne fonctionne pas correctement"
        fi
    else
        print_warning "iwconfig non installé"
    fi
    
    print_info "Outils WiFi: $tests_passed/$total_tests réussis"
}

# Test des permissions
test_permissions() {
    print_info "Test des permissions..."
    
    local tests_passed=0
    local total_tests=0
    
    # Test permissions arp-scan
    if command -v arp-scan &> /dev/null; then
        total_tests=$((total_tests + 1))
        if getcap $(which arp-scan) 2>/dev/null | grep -q "cap_net_raw"; then
            print_success "arp-scan a les bonnes permissions"
            tests_passed=$((tests_passed + 1))
        else
            print_warning "arp-scan n'a pas les bonnes permissions"
        fi
    fi
    
    # Test permissions nmap
    if command -v nmap &> /dev/null; then
        total_tests=$((total_tests + 1))
        if getcap $(which nmap) 2>/dev/null | grep -q "cap_net_raw"; then
            print_success "nmap a les bonnes permissions"
            tests_passed=$((tests_passed + 1))
        else
            print_warning "nmap n'a pas les bonnes permissions"
        fi
    fi
    
    # Test permissions arping
    if command -v arping &> /dev/null; then
        total_tests=$((total_tests + 1))
        if getcap $(which arping) 2>/dev/null | grep -q "cap_net_raw"; then
            print_success "arping a les bonnes permissions"
            tests_passed=$((tests_passed + 1))
        else
            print_warning "arping n'a pas les bonnes permissions"
        fi
    fi
    
    print_info "Permissions: $tests_passed/$total_tests réussis"
}

# Test de l'application Node.js
test_nodejs_application() {
    print_info "Test de l'application Node.js..."
    
    # Vérifier si Node.js est installé
    if ! command -v node &> /dev/null; then
        print_error "Node.js non installé"
        return 1
    fi
    
    # Vérifier la version
    NODE_VERSION=$(node --version)
    print_info "Node.js version: $NODE_VERSION"
    
    # Vérifier si les dépendances sont installées
    if [ -f "package.json" ]; then
        if [ -d "node_modules" ]; then
            print_success "Dépendances Node.js installées"
        else
            print_warning "Dépendances Node.js non installées"
        fi
    else
        print_warning "package.json non trouvé"
    fi
    
    # Test de l'API (si le serveur tourne)
    if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
        print_success "API accessible"
    else
        print_warning "API non accessible (serveur peut-être arrêté)"
    fi
}

# Test de connectivité réseau
test_network_connectivity() {
    print_info "Test de connectivité réseau..."
    
    # Obtenir l'IP locale
    LOCAL_IP=$(hostname -I | awk '{print $1}')
    print_info "IP locale: $LOCAL_IP"
    
    # Test ping vers la gateway
    GATEWAY=$(ip route | grep default | awk '{print $3}')
    if [ -n "$GATEWAY" ]; then
        if ping -c 1 "$GATEWAY" > /dev/null 2>&1; then
            print_success "Connectivité vers la gateway OK"
        else
            print_warning "Pas de connectivité vers la gateway"
        fi
    fi
    
    # Test scan du réseau local
    if command -v arp-scan &> /dev/null; then
        print_info "Scan du réseau local avec arp-scan..."
        sudo arp-scan --localnet --timeout=1000 | head -10
    fi
}

# Affichage des informations système
show_system_info() {
    print_info "Informations système..."
    
    echo "OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
    echo "Architecture: $(uname -m)"
    echo "Kernel: $(uname -r)"
    echo "CPU: $(grep 'Model' /proc/cpuinfo | head -1 | cut -d':' -f2 | xargs)"
    echo "Mémoire: $(free -h | grep Mem | awk '{print $2}')"
    echo "Espace disque: $(df -h / | tail -1 | awk '{print $4}') libre"
    
    # Température (si disponible)
    if command -v vcgencmd &> /dev/null; then
        TEMP=$(vcgencmd measure_temp | cut -d'=' -f2)
        echo "Température: $TEMP"
    fi
}

# Fonction principale
main() {
    print_header
    check_raspberry_pi
    show_system_info
    test_basic_tools
    test_network_scan_tools
    test_wifi_tools
    test_permissions
    test_nodejs_application
    test_network_connectivity
    
    echo ""
    print_success "Tests terminés !"
    echo ""
    echo "📋 Résumé des outils installés:"
    echo "   - arp-scan: $(which arp-scan 2>/dev/null || echo 'Non installé')"
    echo "   - nmap: $(which nmap 2>/dev/null || echo 'Non installé')"
    echo "   - iwlist: $(which iwlist 2>/dev/null || echo 'Non installé')"
    echo "   - nmcli: $(which nmcli 2>/dev/null || echo 'Non installé')"
    echo "   - iw: $(which iw 2>/dev/null || echo 'Non installé')"
    echo ""
    echo "🔧 Si des outils manquent, installez-les avec:"
    echo "   sudo apt install -y arp-scan nmap wireless-tools network-manager"
    echo ""
    echo "🔒 Pour les permissions:"
    echo "   sudo setcap cap_net_raw,cap_net_admin=eip \$(which arp-scan)"
    echo "   sudo setcap cap_net_raw,cap_net_admin=eip \$(which nmap)"
}

# Exécution du script
main "$@" 