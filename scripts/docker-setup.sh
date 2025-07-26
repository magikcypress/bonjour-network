#!/bin/bash

# Script de configuration Docker pour Bonjour Network

set -e

echo "🐳 Configuration Docker pour Bonjour Network"
echo "========================================"

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

# Vérifier que Docker est installé
check_docker() {
    print_status "Vérification de Docker..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker n'est pas installé. Veuillez l'installer d'abord."
        echo "  - macOS: https://docs.docker.com/desktop/mac/install/"
        echo "  - Linux: https://docs.docker.com/engine/install/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose n'est pas installé."
        exit 1
    fi
    
    print_success "Docker et Docker Compose sont installés"
}

# Vérifier que Docker daemon fonctionne
check_docker_daemon() {
    print_status "Vérification du daemon Docker..."
    if ! docker info &> /dev/null; then
        print_error "Le daemon Docker ne fonctionne pas. Démarrez Docker Desktop."
        exit 1
    fi
    print_success "Docker daemon fonctionne"
}

# Créer les dossiers nécessaires
create_directories() {
    print_status "Création des dossiers nécessaires..."
    mkdir -p logs
    mkdir -p data
    print_success "Dossiers créés"
}

# Builder l'image Docker
build_image() {
    print_status "Construction de l'image Docker..."
    docker build -t bonjour-network .
    print_success "Image construite avec succès"
}

# Démarrer les services
start_services() {
    print_status "Démarrage des services..."
    docker-compose up -d
    print_success "Services démarrés"
}

# Vérifier le statut
check_status() {
    print_status "Vérification du statut..."
    sleep 5
    if docker-compose ps | grep -q "Up"; then
        print_success "Bonjour Network est démarré et accessible sur http://localhost:5001"
    else
        print_error "Erreur lors du démarrage. Vérifiez les logs avec: docker-compose logs"
        exit 1
    fi
}

# Afficher les informations utiles
show_info() {
    echo ""
    echo "🎉 Bonjour Network est prêt !"
    echo "=========================="
    echo ""
    echo "📱 Accès à l'application:"
    echo "   http://localhost:5001"
    echo ""
    echo "🔧 Commandes utiles:"
    echo "   - Voir les logs: docker-compose logs -f"
    echo "   - Arrêter: docker-compose down"
    echo "   - Redémarrer: docker-compose restart"
    echo "   - Mettre à jour: docker-compose pull && docker-compose up -d"
    echo ""
    echo "📁 Dossiers créés:"
    echo "   - logs/ : Logs de l'application"
    echo "   - data/ : Données persistantes"
    echo ""
    echo "🔒 Sécurité:"
    echo "   - L'application fonctionne en mode privilégié pour accéder au réseau"
    echo "   - Utilise un utilisateur non-root dans le conteneur"
    echo "   - Les logs sont persistants"
}

# Menu principal
main() {
    echo ""
    echo "Choisissez une option:"
    echo "1) Installation complète (recommandé)"
    echo "2) Vérifier l'installation"
    echo "3) Démarrer les services"
    echo "4) Arrêter les services"
    echo "5) Voir les logs"
    echo "6) Nettoyer (supprimer conteneurs et images)"
    echo "q) Quitter"
    echo ""
    read -p "Votre choix: " choice
    
    case $choice in
        1)
            check_docker
            check_docker_daemon
            create_directories
            build_image
            start_services
            check_status
            show_info
            ;;
        2)
            check_docker
            check_docker_daemon
            print_status "Vérification des conteneurs..."
            docker-compose ps
            ;;
        3)
            start_services
            check_status
            ;;
        4)
            print_status "Arrêt des services..."
            docker-compose down
            print_success "Services arrêtés"
            ;;
        5)
            docker-compose logs -f
            ;;
        6)
            print_warning "Cette action supprimera tous les conteneurs et images."
            read -p "Êtes-vous sûr ? (y/N): " confirm
            if [[ $confirm == [yY] ]]; then
                docker-compose down --rmi all --volumes --remove-orphans
                docker system prune -f
                print_success "Nettoyage terminé"
            fi
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
    # Mode automatique pour l'installation
    check_docker
    check_docker_daemon
    create_directories
    build_image
    start_services
    check_status
    show_info
else
    # Mode interactif
    main
fi 