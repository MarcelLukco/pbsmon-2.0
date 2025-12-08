#!/bin/bash

# PBS Data Collection Script
# This script runs periodically to collect PBS data from the server
# and store it in the configured output directory
# Uses file locking to prevent concurrent runs

set -e

# Configuration from environment variables
SERVER_NAME="${PBS_SERVER_NAME:-pbs-m1}"
FULL_SERVER_NAME="${SERVER_NAME}.metacentrum.cz"
OUTPUT_DIR="${PBS_DATA_PATH:-/app/data/pbs}"
PBSCALLER_PATH=/app/pbscollector
KEYTAB_PATH="${KEYTAB_PATH:-/pbsmon.keytab}"
KEYTAB_USER="${KEYTAB_USER:-karilub@META}"

# Lock file to prevent concurrent runs
LOCK_FILE="/var/log/pbs-collector/pbs-collector.lock"
LOCK_TIMEOUT=120  # Consider lock stale after 2 minutes

# Create output directory for this server
SERVER_OUTPUT_DIR="${OUTPUT_DIR}/${SERVER_NAME}"
mkdir -p "${SERVER_OUTPUT_DIR}"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# Cleanup function to remove lock file on exit
cleanup() {
    if [ -f "${LOCK_FILE}" ]; then
        rm -f "${LOCK_FILE}"
        log "Lock file removed"
    fi
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Check for existing lock file
if [ -f "${LOCK_FILE}" ]; then
    # Get lock file modification time (seconds since epoch)
    if command -v stat >/dev/null 2>&1; then
        # Try GNU stat first (stat -c)
        LOCK_MTIME=$(stat -c %Y "${LOCK_FILE}" 2>/dev/null || stat -f %m "${LOCK_FILE}" 2>/dev/null || echo 0)
    else
        LOCK_MTIME=0
    fi
    
    if [ "${LOCK_MTIME}" -gt 0 ]; then
        CURRENT_TIME=$(date +%s)
        LOCK_AGE=$((CURRENT_TIME - LOCK_MTIME))
        
        if [ "${LOCK_AGE}" -lt "${LOCK_TIMEOUT}" ]; then
            log "Another collection is already running (lock file exists, age: ${LOCK_AGE}s). Skipping this run."
            exit 0
        else
            log "Stale lock file detected (age: ${LOCK_AGE}s). Removing and continuing..."
            rm -f "${LOCK_FILE}"
        fi
    else
        # Can't determine age, but file exists - assume it's recent and skip
        log "Lock file exists but cannot determine age. Skipping this run to be safe."
        exit 0
    fi
fi

# Create lock file
touch "${LOCK_FILE}"
log "Lock file created"

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

