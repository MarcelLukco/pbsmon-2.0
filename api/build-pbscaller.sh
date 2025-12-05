#!/bin/bash
# Build script for pbscaller using Docker
# This script builds pbscaller in a Docker container using PBS libraries from the host
# Usage: ./build-pbscaller.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_DIR="${SCRIPT_DIR}/bin"

echo "Building pbscaller using Docker..."

# Create bin directory if it doesn't exist
mkdir -p "${BIN_DIR}"

# Build the pbscaller builder image
echo "Building pbscaller builder image..."
docker build -f "${SCRIPT_DIR}/Dockerfile.pbscaller" -t pbscaller-builder "${SCRIPT_DIR}"

# Run the container to build pbscaller (mounts PBS libraries from host)
echo "Building pbscaller executable..."
docker run --rm \
  -v /usr/lib:/host/usr/lib:ro \
  -v /usr/include:/host/usr/include:ro \
  -v /etc/pbs.conf:/host/etc/pbs.conf:ro \
  -v "${BIN_DIR}:/output" \
  pbscaller-builder

echo ""
echo "pbscaller built successfully: ${BIN_DIR}/pbsprocaller"
echo "You can now build the main Docker image."

