#!/bin/bash

# 🐳 Test du build Docker

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
    echo "🐳 Test du build Docker"
    echo "=========================================="
    echo -e "${NC}"
}

# Vérifier que Docker est disponible
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker n'est pas installé"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker n'est pas démarré ou vous n'avez pas les permissions"
        exit 1
    fi
}

# Test du build principal
test_main_build() {
    print_info "Test du build Docker principal..."
    
    # Nettoyer les images existantes
    docker rmi bonjour-network-test 2>/dev/null || true
    
    # Build de l'image
    if docker build -t bonjour-network-test .; then
        print_success "Build principal réussi"
        return 0
    else
        print_error "Build principal échoué"
        return 1
    fi
}

# Test du build Raspberry Pi
test_raspberry_build() {
    print_info "Test du build Docker Raspberry Pi..."
    
    # Nettoyer les images existantes
    docker rmi bonjour-network-raspberry-test 2>/dev/null || true
    
    # Build de l'image Raspberry Pi
    if docker build -f Dockerfile.raspberry-pi -t bonjour-network-raspberry-test .; then
        print_success "Build Raspberry Pi réussi"
        return 0
    else
        print_error "Build Raspberry Pi échoué"
        return 1
    fi
}

# Test du container principal
test_main_container() {
    print_info "Test du container principal..."
    
    # Démarrer le container
    docker run --rm -d --name test-container -p 5001:5001 bonjour-network-test
    
    # Attendre que le serveur démarre
    sleep 10
    
    # Tester l'API
    if curl -f http://localhost:5001/api/health &> /dev/null; then
        print_success "Container principal fonctionne"
        docker stop test-container
        return 0
    else
        print_error "Container principal ne répond pas"
        docker stop test-container
        return 1
    fi
}

# Test du container Raspberry Pi
test_raspberry_container() {
    print_info "Test du container Raspberry Pi..."
    
    # Démarrer le container
    docker run --rm -d --name test-raspberry-container -p 5002:5001 bonjour-network-raspberry-test
    
    # Attendre que le serveur démarre
    sleep 10
    
    # Tester l'API
    if curl -f http://localhost:5002/api/health &> /dev/null; then
        print_success "Container Raspberry Pi fonctionne"
        docker stop test-raspberry-container
        return 0
    else
        print_error "Container Raspberry Pi ne répond pas"
        docker stop test-raspberry-container
        return 1
    fi
}

# Test Docker Compose
test_docker_compose() {
    print_info "Test Docker Compose..."
    
    # Démarrer les services
    docker-compose up -d
    
    # Attendre que les services démarrent
    sleep 15
    
    # Tester les services
    local success=true
    
    if ! curl -f http://localhost:5001/api/health &> /dev/null; then
        print_error "Serveur principal ne répond pas"
        success=false
    fi
    
    if ! curl -f http://localhost:3000 &> /dev/null; then
        print_error "Client ne répond pas"
        success=false
    fi
    
    # Arrêter les services
    docker-compose down
    
    if [ "$success" = true ]; then
        print_success "Docker Compose fonctionne"
        return 0
    else
        print_error "Docker Compose a des problèmes"
        return 1
    fi
}

# Fonction principale
main() {
    print_header
    
    # Vérifier Docker
    check_docker
    
    local exit_code=0
    
    # Tests de build
    print_info "🧪 Tests de build..."
    if ! test_main_build; then
        exit_code=1
    fi
    
    if ! test_raspberry_build; then
        exit_code=1
    fi
    
    # Tests de containers
    if [ $exit_code -eq 0 ]; then
        print_info "🧪 Tests de containers..."
        if ! test_main_container; then
            exit_code=1
        fi
        
        if ! test_raspberry_container; then
            exit_code=1
        fi
    fi
    
    # Test Docker Compose
    if [ $exit_code -eq 0 ]; then
        print_info "🧪 Test Docker Compose..."
        if ! test_docker_compose; then
            exit_code=1
        fi
    fi
    
    # Résumé
    echo ""
    if [ $exit_code -eq 0 ]; then
        print_success "Tous les tests Docker sont passés !"
    else
        print_error "Certains tests Docker ont échoué"
    fi
    
    exit $exit_code
}

# Exécution du script
main "$@" 