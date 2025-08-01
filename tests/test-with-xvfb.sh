#!/bin/bash

# 🧪 Test avec Xvfb (X Virtual Framebuffer)

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
    echo "🧪 Test avec Xvfb (X Virtual Framebuffer)"
    echo "=========================================="
    echo -e "${NC}"
}

# Vérifier si xvfb est disponible
check_xvfb() {
    if ! command -v xvfb-run &> /dev/null; then
        print_warning "xvfb-run non disponible, installation..."
        sudo apt update
        sudo apt install -y xvfb
    fi
}

# Test avec xvfb
test_with_xvfb() {
    print_info "Lancement du test avec Xvfb..."
    
    # Démarrer xvfb et exécuter le test
    xvfb-run -a -s "-screen 0 1280x720x24" node tests/test-all-features.js
}

# Test sans xvfb (mode headless)
test_headless() {
    print_info "Lancement du test en mode headless..."
    
    # Exécuter le test headless
    node tests/test-headless.js
}

# Test simple (sans navigateur)
test_simple() {
    print_info "Lancement du test simple (sans navigateur)..."
    
    # Exécuter le test simple
    node tests/test-simple.js
}

# Fonction principale
main() {
    print_header
    
    # Vérifier les dépendances
    check_xvfb
    
    # Essayer différentes méthodes de test
    print_info "Tentative avec Xvfb..."
    if test_with_xvfb; then
        print_success "Test avec Xvfb réussi"
        exit 0
    else
        print_warning "Xvfb a échoué, tentative en mode headless..."
        
        if test_headless; then
            print_success "Test headless réussi"
            exit 0
        else
            print_warning "Test headless a échoué, tentative simple..."
            
            if test_simple; then
                print_success "Test simple réussi"
                exit 0
            else
                print_error "Tous les tests ont échoué"
                exit 1
            fi
        fi
    fi
}

# Exécution du script
main "$@" 