#!/bin/bash

# 🔍 Vérification des fichiers Docker

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
    echo "🔍 Vérification des fichiers Docker"
    echo "=========================================="
    echo -e "${NC}"
}

# Vérifier les fichiers du serveur
check_server_files() {
    print_info "Vérification des fichiers serveur..."
    
    local server_files=(
        "server/package.json"
        "server/package-lock.json"
        "server/index.js"
        "server/App.js"
        "server/device-scanner.js"
        "server/improved-device-scanner.js"
        "server/real-wifi-scanner.js"
        "server/real-no-sudo-scanner.js"
        "server/raspberry-wifi-scanner.js"
        "server/manufacturer-service.js"
        "server/mistral-ai-service.js"
        "server/data/manufacturers.json"
        "server/data/manufacturers-initial.json"
        "server/config/environment.js"
        "server/config/cors.js"
        "server/middleware/validation.js"
        "server/security/command-validator.js"
        "server/security/security-test.js"
        "server/services/api-service.js"
        "server/services/endpoint-manager.js"
        "server/services/socket-service.js"
        "server/utils/logger.js"
        "server/utils/network-detector.js"
        "server/utils/os-detector.js"
        "server/utils/data-formatter.js"
        "server/utils/dns-scanner.js"
        "server/utils/wifi-scanner.js"
        "server/utils/wifi-scanner-extended.js"
        "server/utils/wifi-system-profiler.js"
    )
    
    local missing_files=()
    
    for file in "${server_files[@]}"; do
        if [ -f "$file" ]; then
            print_success "$file"
        else
            print_error "$file manquant"
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -eq 0 ]; then
        print_success "Tous les fichiers serveur sont présents"
        return 0
    else
        print_error "${#missing_files[@]} fichiers serveur manquants"
        return 1
    fi
}

# Vérifier les fichiers du client
check_client_files() {
    print_info "Vérification des fichiers client..."
    
    local client_files=(
        "client/package.json"
        "client/package-lock.json"
        "client/public/index.html"
        "client/public/manifest.json"
        "client/src/App.js"
        "client/src/index.js"
        "client/src/index.css"
        "client/src/components/DeviceList.js"
        "client/src/components/Footer.js"
        "client/src/components/Navigation.js"
        "client/src/components/NetworkList.js"
        "client/src/components/NetworkStats.js"
        "client/src/components/ScanProgress.jsx"
        "client/src/hooks/useDataManager.js"
        "client/src/services/api-service.js"
        "client/src/services/socket-service.js"
        "client/src/utils/validation.js"
        "client/tailwind.config.js"
        "client/postcss.config.js"
    )
    
    local missing_files=()
    
    for file in "${client_files[@]}"; do
        if [ -f "$file" ]; then
            print_success "$file"
        else
            print_error "$file manquant"
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -eq 0 ]; then
        print_success "Tous les fichiers client sont présents"
        return 0
    else
        print_error "${#missing_files[@]} fichiers client manquants"
        return 1
    fi
}

# Vérifier les fichiers Docker
check_docker_files() {
    print_info "Vérification des fichiers Docker..."
    
    local docker_files=(
        "Dockerfile"
        "Dockerfile.raspberry-pi"
        "docker-compose.yml"
        "docker-compose.raspberry-pi.yml"
        "docker-entrypoint.sh"
        ".dockerignore"
    )
    
    local missing_files=()
    
    for file in "${docker_files[@]}"; do
        if [ -f "$file" ]; then
            print_success "$file"
        else
            print_error "$file manquant"
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -eq 0 ]; then
        print_success "Tous les fichiers Docker sont présents"
        return 0
    else
        print_error "${#missing_files[@]} fichiers Docker manquants"
        return 1
    fi
}

# Vérifier les permissions
check_permissions() {
    print_info "Vérification des permissions..."
    
    local executable_files=(
        "docker-entrypoint.sh"
        "scripts/test-docker-build.sh"
        "scripts/test-accessibility-system.js"
        "scripts/test-accessibility.js"
    )
    
    local missing_permissions=()
    
    for file in "${executable_files[@]}"; do
        if [ -x "$file" ]; then
            print_success "$file (exécutable)"
        else
            print_error "$file (non exécutable)"
            missing_permissions+=("$file")
        fi
    done
    
    if [ ${#missing_permissions[@]} -eq 0 ]; then
        print_success "Toutes les permissions sont correctes"
        return 0
    else
        print_error "${#missing_permissions[@]} fichiers sans permissions d'exécution"
        return 1
    fi
}

# Vérifier le .dockerignore
check_dockerignore() {
    print_info "Vérification du .dockerignore..."
    
    if grep -q "docker-entrypoint.sh" .dockerignore && ! grep -q "!docker-entrypoint.sh" .dockerignore; then
        print_error "docker-entrypoint.sh est ignoré par .dockerignore"
        return 1
    else
        print_success "docker-entrypoint.sh n'est pas ignoré (correctement exclu)"
        return 0
    fi
}

# Fonction principale
main() {
    print_header
    
    local exit_code=0
    
    # Vérifications
    if ! check_server_files; then
        exit_code=1
    fi
    
    if ! check_client_files; then
        exit_code=1
    fi
    
    if ! check_docker_files; then
        exit_code=1
    fi
    
    if ! check_permissions; then
        exit_code=1
    fi
    
    if ! check_dockerignore; then
        exit_code=1
    fi
    
    # Résumé
    echo ""
    if [ $exit_code -eq 0 ]; then
        print_success "Toutes les vérifications sont passées !"
        print_info "Le build Docker devrait fonctionner correctement."
    else
        print_error "Certaines vérifications ont échoué."
        print_info "Corrigez les problèmes avant de lancer le build Docker."
    fi
    
    exit $exit_code
}

# Exécution du script
main "$@" 