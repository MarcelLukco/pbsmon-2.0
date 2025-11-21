#!/bin/bash

# Script to set up HTTP Basic Authentication for nginx
# This creates or updates the .htpasswd file

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
HTPASSWD_FILE="$SCRIPT_DIR/.htpasswd"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up HTTP Basic Authentication${NC}"

# Check if htpasswd is available
if ! command -v htpasswd &> /dev/null; then
    echo -e "${RED}Error: htpasswd is not installed${NC}"
    echo -e "${YELLOW}On Debian/Ubuntu, install it with: apt-get install apache2-utils${NC}"
    echo -e "${YELLOW}On macOS, install it with: brew install httpd${NC}"
    exit 1
fi

# Check if .htpasswd file exists
if [ -f "$HTPASSWD_FILE" ]; then
    echo -e "${YELLOW}Existing .htpasswd file found.${NC}"
    read -p "Do you want to add a new user? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Exiting...${NC}"
        exit 0
    fi
else
    echo -e "${YELLOW}Creating new .htpasswd file...${NC}"
fi

# Get username
read -p "Enter username: " username
if [ -z "$username" ]; then
    echo -e "${RED}Error: Username cannot be empty${NC}"
    exit 1
fi

# Get password (hidden input)
read -sp "Enter password: " password
echo
if [ -z "$password" ]; then
    echo -e "${RED}Error: Password cannot be empty${NC}"
    exit 1
fi

# Create or update .htpasswd file
if [ -f "$HTPASSWD_FILE" ]; then
    # Add user to existing file
    htpasswd -b "$HTPASSWD_FILE" "$username" "$password"
    echo -e "${GREEN}✓ User '$username' added to existing .htpasswd file${NC}"
else
    # Create new file
    htpasswd -b -c "$HTPASSWD_FILE" "$username" "$password"
    echo -e "${GREEN}✓ Created .htpasswd file with user '$username'${NC}"
fi

# Set appropriate permissions
chmod 644 "$HTPASSWD_FILE"
echo -e "${GREEN}✓ File permissions set${NC}"

echo -e "${GREEN}Setup complete!${NC}"
echo -e "${YELLOW}Note: Make sure to uncomment the auth_basic lines in nginx/conf.d/default.conf${NC}"
echo -e "${YELLOW}Then restart nginx: docker-compose restart nginx${NC}"

