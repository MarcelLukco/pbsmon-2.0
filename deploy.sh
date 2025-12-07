#!/bin/bash

# PBSMON 2.0 Deployment Script
# This script pulls the latest code and restarts Docker containers
# Usage: ./deploy.sh [--skip-pull]
# --skip-pull: Skip pulling the latest code from git
# it should be run on the production server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"


# Check if --skip-pull flag is present
SKIP_PULL=false
for arg in "$@"; do
    if [ "$arg" = "--skip-pull" ]; then
        SKIP_PULL=true
        break
    fi
done

# Check if git is available
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: git is not installed${NC}"
    exit 1
fi


# Pull latest code (unless --skip-pull flag is set)
if [ "$SKIP_PULL" = false ]; then
    echo -e "${YELLOW}Pulling latest code from git...${NC}"
    if git pull; then
        echo -e "${GREEN}✓ Code updated successfully${NC}"
        echo -e "${YELLOW}Restarting script with --skip-pull flag...${NC}"
        # Kill current process and restart script with --skip-pull
        exec "$0" --skip-pull
    else
        echo -e "${RED}✗ Failed to pull code from git${NC}"
        exit 1
    fi
fi


# Load environment variables from .env file if it exists
ENV_FILE="$SCRIPT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Loading environment variables from .env file...${NC}"
    # Export variables from .env file (handles comments and empty lines)
    set -a
    source "$ENV_FILE"
    set +a
    echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
    echo -e "${YELLOW}⚠️  No .env file found at $ENV_FILE${NC}"
    echo -e "${YELLOW}   Make sure API_AUTH_USERNAME and API_AUTH_PASSWORD are set${NC}"
fi

echo -e "${GREEN}Starting deployment...${NC}"

# Check if docker-compose or docker compose is available
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo -e "${RED}Error: docker-compose is not installed${NC}"
    exit 1
fi

# Set the docker compose file
COMPOSE_FILE="docker-compose.prod.yml"


# Build pbscaller binary first (requires PBS libraries from host)
echo -e "${YELLOW}Building pbscaller binary (requires PBS libraries from host)...${NC}"
mkdir -p api/bin

# Try to build pbscaller directly on the host first (simpler, no Docker needed)
if command -v gcc &> /dev/null; then
    echo -e "${YELLOW}Building pbscaller directly on host...${NC}"
    if cd api/src/cli && gcc -g -L/usr/lib -I/usr/include pbscaller.c -o ../../bin/pbsprocaller -lpbs && chmod +x ../../bin/pbsprocaller; then
        cd ../../..
        # Verify the binary was created
        if [ -f "api/bin/pbsprocaller" ] && [ -x "api/bin/pbsprocaller" ]; then
            echo -e "${GREEN}✓ pbscaller binary built successfully${NC}"
        else
            echo -e "${RED}✗ pbscaller binary was not created or is not executable${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}Direct build failed, trying Docker approach...${NC}"
        cd ../../..
        # Fall back to Docker build if direct build fails
        if sudo docker build -f api/Dockerfile.pbscaller -t pbscaller-builder api/ 2>/dev/null; then
            if sudo docker run --rm \
                -v /usr/lib:/host/usr/lib:ro \
                -v /usr/include:/host/usr/include:ro \
                -v "$(pwd)/api/bin:/output" \
                pbscaller-builder; then
                # Verify the binary was created
                if [ -f "api/bin/pbsprocaller" ] && [ -x "api/bin/pbsprocaller" ]; then
                    echo -e "${GREEN}✓ pbscaller binary built successfully using Docker${NC}"
                else
                    echo -e "${RED}✗ pbscaller binary was not created or is not executable${NC}"
                    exit 1
                fi
            else
                echo -e "${RED}✗ Failed to build pbscaller binary${NC}"
                echo -e "${YELLOW}Make sure PBS Pro libraries are installed on the host${NC}"
                exit 1
            fi
        else
            echo -e "${RED}✗ Failed to build pbscaller binary${NC}"
            echo -e "${YELLOW}Make sure PBS Pro libraries are installed on the host${NC}"
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}gcc not found, using Docker to build pbscaller...${NC}"
    # Build using Docker
    if sudo docker build -f api/Dockerfile.pbscaller -t pbscaller-builder api/; then
        if sudo docker run --rm \
            -v /usr/lib:/host/usr/lib:ro \
            -v /usr/include:/host/usr/include:ro \
            -v "$(pwd)/api/bin:/output" \
            pbscaller-builder; then
            # Verify the binary was created
            if [ -f "api/bin/pbsprocaller" ] && [ -x "api/bin/pbsprocaller" ]; then
                echo -e "${GREEN}✓ pbscaller binary built successfully using Docker${NC}"
            else
                echo -e "${RED}✗ pbscaller binary was not created or is not executable${NC}"
                exit 1
            fi
        else
            echo -e "${RED}✗ Failed to build pbscaller binary${NC}"
            echo -e "${YELLOW}Make sure PBS Pro libraries are installed on the host${NC}"
            exit 1
        fi
    else
        echo -e "${RED}✗ Failed to build pbscaller binary${NC}"
        echo -e "${YELLOW}Make sure PBS Pro libraries are installed on the host${NC}"
        exit 1
    fi
fi

# Verify pbscaller binary exists before starting containers
if [ ! -f "api/bin/pbsprocaller" ]; then
    echo -e "${RED}✗ Error: pbscaller binary not found at api/bin/pbsprocaller${NC}"
    echo -e "${YELLOW}The binary must exist before starting containers${NC}"
    echo -e "${YELLOW}Please ensure the build step completed successfully${NC}"
    exit 1
fi

if [ ! -x "api/bin/pbsprocaller" ]; then
    echo -e "${YELLOW}Making pbscaller binary executable...${NC}"
    chmod +x api/bin/pbsprocaller
fi

# Check if the mount point might be a directory (Docker created it instead of mounting)
# This can happen if the container was started before the binary existed
if [ -d "api/bin/pbsprocaller" ]; then
    echo -e "${RED}✗ Error: api/bin/pbsprocaller is a directory, not a file${NC}"
    echo -e "${YELLOW}This happens when Docker creates a directory instead of mounting the file${NC}"
    echo -e "${YELLOW}Removing the directory...${NC}"
    rm -rf api/bin/pbsprocaller
    echo -e "${YELLOW}Please ensure the binary is built and restart the container${NC}"
    exit 1
fi

echo -e "${GREEN}✓ pbscaller binary verified: $(ls -lh api/bin/pbsprocaller | awk '{print $5}')${NC}"

# Build and start API first (web depends on API for OpenAPI spec generation)
echo -e "${YELLOW}Building and starting API container first...${NC}"
if sudo $DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d --build api; then
    echo -e "${GREEN}✓ API container started${NC}"
else
    echo -e "${RED}✗ Failed to start API container${NC}"
    exit 1
fi

# Wait for API to be ready (check health endpoint)
echo -e "${YELLOW}Waiting for API to be ready...${NC}"
API_READY=false
MAX_ATTEMPTS=30
ATTEMPT=0

# Try to connect to API health endpoint
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    echo -e "${YELLOW}Attempt $ATTEMPT/$MAX_ATTEMPTS: Checking API health...${NC}"
    
    # Check if API container is running
    if sudo docker ps | grep -q pbsmon-api; then
        # Try to hit the health endpoint inside the container
        if sudo docker exec pbsmon-api node -e "require('http').get('http://localhost:3000/status', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" 2>/dev/null; then
            API_READY=true
            echo -e "${GREEN}✓ API is ready${NC}"
            break
        fi
    fi
    
    if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
        sleep 2
    fi
done

if [ "$API_READY" = false ]; then
    echo -e "${YELLOW}⚠️  API health check failed after $MAX_ATTEMPTS attempts${NC}"
    echo -e "${YELLOW}   Continuing anyway - web build will try to fetch OpenAPI spec${NC}"
fi

# Generate API client locally before building web Docker image
# This ensures the types are available during the Docker build
echo -e "${YELLOW}Generating API client for web build...${NC}"

# Check if Node.js is available on the host
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js/npm not found on host, skipping pre-generation${NC}"
    echo -e "${YELLOW}   Docker build will generate API client during build${NC}"
    echo -e "${YELLOW}   Make sure API_BASE_URL is set correctly for Docker build${NC}"
else
    # Get API URL - prefer API_BASE_URL from env, fallback to default
    # The API should be accessible through the configured API_BASE_URL
    API_URL_FOR_CLIENT="${API_BASE_URL:-http://localhost:3000}"
    
    # If API_BASE_URL is not set and API is running in Docker, try to construct URL
    if [ -z "$API_BASE_URL" ]; then
        # Check if we can access API through nginx (common setup)
        # Try the production URL format
        if [ -n "$FRONTEND_URL" ]; then
            API_URL_FOR_CLIENT="${FRONTEND_URL}/api"
        else
            # Fallback: try to access API directly (if exposed)
            API_URL_FOR_CLIENT="http://localhost:3000"
        fi
    fi
    
    echo -e "${YELLOW}Using API URL: ${API_URL_FOR_CLIENT}${NC}"
    
    # Set environment variables for API client generation
    export API_BASE_URL="$API_URL_FOR_CLIENT"
    export API_AUTH_USERNAME="${API_AUTH_USERNAME:-}"
    export API_AUTH_PASSWORD="${API_AUTH_PASSWORD:-}"
    
    # Generate API client in web directory
    if [ -d "web" ]; then
        cd web
        
        # Check if node_modules exists, if not install dependencies first
        if [ ! -d "node_modules" ]; then
            echo -e "${YELLOW}Installing web dependencies...${NC}"
            npm ci
        fi
        
        if npm run generate:api; then
            echo -e "${GREEN}✓ API client generated successfully on host${NC}"
            cd ..
        else
            echo -e "${YELLOW}⚠️  Failed to generate API client on host${NC}"
            echo -e "${YELLOW}   Docker build will try to generate it during build${NC}"
            echo -e "${YELLOW}   Make sure API is accessible at: ${API_URL_FOR_CLIENT}/docs-json${NC}"
            cd ..
        fi
    else
        echo -e "${YELLOW}⚠️  web directory not found, skipping pre-generation${NC}"
    fi
fi

# Now build and start web service
echo -e "${YELLOW}Building and starting web container...${NC}"
if sudo $DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d --build web; then
    echo -e "${GREEN}✓ Web container started${NC}"
else
    echo -e "${RED}✗ Failed to start web container${NC}"
    exit 1
fi

# Wait a moment for containers to start
sleep 5

# Check container status
echo -e "${YELLOW}Checking container status...${NC}"
sudo $DOCKER_COMPOSE -f "$COMPOSE_FILE" ps

# Show logs for the last 20 lines
echo -e "${YELLOW}Recent logs:${NC}"
sudo $DOCKER_COMPOSE -f "$COMPOSE_FILE" logs --tail=20

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}Services should be available at:${NC}"
echo -e "  - Frontend: http://localhost"
echo -e "  - API: http://localhost/api"
echo -e "  - Swagger: http://localhost/api/docs"

