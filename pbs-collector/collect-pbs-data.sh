#!/bin/bash

# PBS Data Collection Script
# This script runs every minute to collect PBS data from the server
# and store it in the configured output directory

set -e

# Configuration from environment variables
SERVER_NAME="${PBS_SERVER_NAME:-pbs-m1}"
FULL_SERVER_NAME="${SERVER_NAME}.metacentrum.cz"
OUTPUT_DIR="${PBS_DATA_PATH:-/app/data/pbs}"
PBSCALLER_PATH=/app/pbscollector
KEYTAB_PATH="${KEYTAB_PATH:-/pbsmon.keytab}"
KEYTAB_USER="${KEYTAB_USER:-karilub@META}"

# Create output directory for this server
SERVER_OUTPUT_DIR="${OUTPUT_DIR}/${SERVER_NAME}"
mkdir -p "${SERVER_OUTPUT_DIR}"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

log "Starting PBS data collection for server: ${FULL_SERVER_NAME}"

# Check if pbscaller binary exists
if [ ! -f "${PBSCALLER_PATH}" ]; then
    log "ERROR: pbscaller binary not found at ${PBSCALLER_PATH}"
    exit 1
fi

# Check if pbscaller is executable
if [ ! -x "${PBSCALLER_PATH}" ]; then
    log "ERROR: pbscaller binary is not executable: ${PBSCALLER_PATH}"
    exit 1
fi

# Authenticate with Kerberos if keytab is available
if [ -f "${KEYTAB_PATH}" ]; then
    log "Authenticating with Kerberos using keytab..."
    if kinit -t "${KEYTAB_PATH}" "${KEYTAB_USER}"; then
        log "Kerberos authentication successful"
    else
        log "WARNING: Kerberos authentication failed, continuing anyway"
    fi
else
    log "WARNING: Keytab file not found at ${KEYTAB_PATH}, skipping authentication"
fi

# Run pbscaller to collect data
log "Executing pbscaller for ${FULL_SERVER_NAME} -> ${SERVER_OUTPUT_DIR}"
if "${PBSCALLER_PATH}" "${FULL_SERVER_NAME}" "${SERVER_OUTPUT_DIR}"; then
    log "PBS data collection completed successfully"
else
    log "ERROR: PBS data collection failed with exit code $?"
    exit 1
fi

log "PBS data collection finished"

