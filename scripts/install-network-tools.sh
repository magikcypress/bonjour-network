#!/bin/bash

# 🔧 Script d'Installation des Outils Réseau - Bonjour Network
# 📅 Version: 2.2.0
# 🎯 Compatible: macOS, Linux, Raspberry Pi

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'affichage
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

# Détection du système d'exploitation
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [[ -f /etc/os-release ]]; then
            . /etc/os-release
            OS="$ID"
        else
            OS="linux"
        fi
    else
        OS="unknown"
    fi
    print_status "Système détecté: $OS"
}

# Vérification des outils réseau
check_network_tools() {
    print_status "Vérification des outils réseau..."
    
    local tools_missing=()
    
    # Outils de base
    if ! command -v ping &> /dev/null; then
        tools_missing+=("ping")
    fi
    
    if ! command -v arp &> /dev/null; then
        tools_missing+=("arp")
    fi
    
    # Outils spécifiques à macOS
    if [[ "$OS" == "macos" ]]; then
        if ! command -v dns-sd &> /dev/null; then
            tools_missing+=("dns-sd")
        fi
        
        if ! command -v networksetup &> /dev/null; then
            tools_missing+=("networksetup")
        fi
    fi
    
    # Outils spécifiques à Linux
    if [[ "$OS" == "linux" ]] || [[ "$OS" == "raspbian" ]]; then
        if ! command -v nmap &> /dev/null; then
            tools_missing+=("nmap")
        fi
        
        if ! command -v arp-scan &> /dev/null; then
            tools_missing+=("arp-scan")
        fi
    fi
    
    if [ ${#tools_missing[@]} -eq 0 ]; then
        print_success "Tous les outils réseau sont disponibles"
        return 0
    else
        print_warning "Outils manquants: ${tools_missing[*]}"
        return 1
    fi
}

# Installation sur macOS
install_macos() {
    print_status "Installation des outils sur macOS..."
    
    # Vérifier si Homebrew est installé
    if ! command -v brew &> /dev/null; then
        print_error "Homebrew n'est pas installé. Veuillez l'installer d'abord:"
        echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
    
    # Mettre à jour Homebrew
    print_status "Mise à jour de Homebrew..."
    brew update
    
    # Installer nmap (alternative à arping)
    if ! command -v nmap &> /dev/null; then
        print_status "Installation de nmap..."
        brew install nmap
    else
        print_success "nmap est déjà installé"
    fi
    
    # Vérifier les outils natifs
    print_status "Vérification des outils natifs macOS..."
    
    if command -v dns-sd &> /dev/null; then
        print_success "dns-sd (Bonjour) est disponible"
    else
        print_warning "dns-sd n'est pas disponible - Bonjour peut ne pas fonctionner"
    fi
    
    if command -v networksetup &> /dev/null; then
        print_success "networksetup est disponible"
    else
        print_warning "networksetup n'est pas disponible - détection d'interfaces limitée"
    fi
    
    # Vérifier les permissions
    print_status "Vérification des permissions réseau..."
    
    if ping -c 1 8.8.8.8 &> /dev/null; then
        print_success "ping fonctionne"
    else
        print_warning "ping peut nécessiter des permissions supplémentaires"
    fi
    
    if arp -a &> /dev/null; then
        print_success "arp fonctionne"
    else
        print_warning "arp peut nécessiter des permissions supplémentaires"
    fi
}

# Installation sur Linux/Raspberry Pi
install_linux() {
    print_status "Installation des outils sur Linux..."
    
    # Détecter le gestionnaire de paquets
    if command -v apt-get &> /dev/null; then
        PKG_MANAGER="apt"
    elif command -v yum &> /dev/null; then
        PKG_MANAGER="yum"
    elif command -v dnf &> /dev/null; then
        PKG_MANAGER="dnf"
    else
        print_error "Gestionnaire de paquets non reconnu"
        exit 1
    fi
    
    print_status "Utilisation de $PKG_MANAGER"
    
    # Mettre à jour les paquets
    print_status "Mise à jour des paquets..."
    if [[ "$PKG_MANAGER" == "apt" ]]; then
        sudo apt-get update
    elif [[ "$PKG_MANAGER" == "yum" ]]; then
        sudo yum update -y
    elif [[ "$PKG_MANAGER" == "dnf" ]]; then
        sudo dnf update -y
    fi
    
    # Installer les outils réseau
    print_status "Installation des outils réseau..."
    
    if [[ "$PKG_MANAGER" == "apt" ]]; then
        sudo apt-get install -y nmap arp-scan iputils-ping net-tools
    elif [[ "$PKG_MANAGER" == "yum" ]]; then
        sudo yum install -y nmap arp-scan iputils net-tools
    elif [[ "$PKG_MANAGER" == "dnf" ]]; then
        sudo dnf install -y nmap arp-scan iputils net-tools
    fi
    
    # Installer avahi-daemon pour Bonjour (optionnel)
    print_status "Installation d'avahi-daemon pour Bonjour (optionnel)..."
    if [[ "$PKG_MANAGER" == "apt" ]]; then
        sudo apt-get install -y avahi-daemon
    elif [[ "$PKG_MANAGER" == "yum" ]]; then
        sudo yum install -y avahi
    elif [[ "$PKG_MANAGER" == "dnf" ]]; then
        sudo dnf install -y avahi
    fi
    
    # Configurer les permissions
    print_status "Configuration des permissions réseau..."
    
    if command -v setcap &> /dev/null; then
        if command -v ping &> /dev/null; then
            sudo setcap cap_net_raw+ep $(which ping)
            print_success "Permissions ping configurées"
        fi
        
        if command -v nmap &> /dev/null; then
            sudo setcap cap_net_raw+ep $(which nmap)
            print_success "Permissions nmap configurées"
        fi
    else
        print_warning "setcap non disponible - les permissions peuvent être limitées"
    fi
}

# Test des outils installés
test_tools() {
    print_status "Test des outils installés..."
    
    local tests_passed=0
    local tests_total=0
    
    # Test ping
    if command -v ping &> /dev/null; then
        tests_total=$((tests_total + 1))
        if ping -c 1 8.8.8.8 &> /dev/null; then
            print_success "✅ ping fonctionne"
            tests_passed=$((tests_passed + 1))
        else
            print_error "❌ ping ne fonctionne pas"
        fi
    fi
    
    # Test arp
    if command -v arp &> /dev/null; then
        tests_total=$((tests_total + 1))
        if arp -a &> /dev/null; then
            print_success "✅ arp fonctionne"
            tests_passed=$((tests_passed + 1))
        else
            print_error "❌ arp ne fonctionne pas"
        fi
    fi
    
    # Test nmap
    if command -v nmap &> /dev/null; then
        tests_total=$((tests_total + 1))
        if nmap -sn 127.0.0.1 &> /dev/null; then
            print_success "✅ nmap fonctionne"
            tests_passed=$((tests_passed + 1))
        else
            print_error "❌ nmap ne fonctionne pas"
        fi
    fi
    
    # Test dns-sd (macOS)
    if [[ "$OS" == "macos" ]] && command -v dns-sd &> /dev/null; then
        tests_total=$((tests_total + 1))
        if timeout 5 dns-sd -B _http._tcp local &> /dev/null; then
            print_success "✅ dns-sd (Bonjour) fonctionne"
            tests_passed=$((tests_passed + 1))
        else
            print_warning "⚠️ dns-sd peut nécessiter des permissions supplémentaires"
        fi
    fi
    
    # Résumé
    print_status "Tests: $tests_passed/$tests_total réussis"
    
    if [ $tests_passed -eq $tests_total ]; then
        print_success "Tous les tests sont passés !"
        return 0
    else
        print_warning "Certains tests ont échoué - vérifiez les permissions"
        return 1
    fi
}

# Affichage des informations système
show_system_info() {
    print_status "Informations système:"
    echo "  - OS: $OS"
    echo "  - Architecture: $(uname -m)"
    echo "  - Kernel: $(uname -r)"
    
    if [[ "$OS" == "macos" ]]; then
        echo "  - Version macOS: $(sw_vers -productVersion)"
    elif [[ "$OS" == "raspbian" ]]; then
        echo "  - Version Raspberry Pi OS: $(cat /etc/os-release | grep VERSION= | cut -d'"' -f2)"
    fi
    
    print_status "Interfaces réseau:"
    if command -v ifconfig &> /dev/null; then
        ifconfig | grep -E "^[a-zA-Z0-9]+:" | awk '{print "  - " $1}'
    elif command -v ip &> /dev/null; then
        ip link show | grep -E "^[0-9]+:" | awk '{print "  - " $2}' | sed 's/://'
    fi
}

# Fonction principale
main() {
    echo "🔧 Installation des Outils Réseau - Bonjour Network"
    echo "=================================================="
    echo ""
    
    # Détecter l'OS
    detect_os
    
    # Vérifier les outils existants
    if check_network_tools; then
        print_success "Tous les outils nécessaires sont déjà installés"
        show_system_info
        test_tools
        exit 0
    fi
    
    # Installer selon l'OS
    case $OS in
        "macos")
            install_macos
            ;;
        "linux"|"raspbian"|"ubuntu"|"debian")
            install_linux
            ;;
        *)
            print_error "Système d'exploitation non supporté: $OS"
            exit 1
            ;;
    esac
    
    # Tester les outils
    test_tools
    
    # Afficher les informations système
    show_system_info
    
    echo ""
    print_success "Installation terminée !"
    print_status "Vous pouvez maintenant utiliser Bonjour Network."
    echo ""
    print_status "Pour démarrer l'application:"
    echo "  npm run dev"
    echo ""
    print_status "Pour tester le scanner:"
    echo "  node -e \"const scanner = require('./improved-device-scanner.js'); new scanner().performImprovedScan('complete').then(console.log)\""
}

# Exécution du script
main "$@" 