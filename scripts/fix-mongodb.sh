#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
VOLUME_NAME="retrohub_mongodb_data"

if [[ "${OS:-}" == "Windows_NT" ]]; then
  cat <<'POWERSHELL'
Detected Windows. Run the following in PowerShell (as Administrator if needed):
  docker-compose down
  docker volume rm retrohub_mongodb_data
  docker-compose up -d
  Start-Sleep -Seconds 10
  node scripts/test-mongodb.js
If issues persist: verify MONGODB_URI in your .env files, ensure Docker Desktop is running, and check firewall/antivirus rules on ports 27017/8081.
POWERSHELL
  exit 0
fi

cd "${PROJECT_ROOT}"

echo "Stopping containers..."
docker-compose down

echo "Removing MongoDB volume (${VOLUME_NAME})..."
read -r -p "Delete volume ${VOLUME_NAME}? [y/N] " confirm
if [[ "${confirm}" =~ ^[Yy]$ ]]; then
  docker volume rm "${VOLUME_NAME}" || true
else
  echo "Skipped volume removal."
fi

echo "Starting containers..."
docker-compose up -d

echo "Waiting 10 seconds for services to stabilize..."
sleep 10

echo "Running MongoDB connection test..."
node "${SCRIPT_DIR}/test-mongodb.js"

cat <<'EOF'
If the test still fails, check the following:
 - Ensure MONGODB_URI is correct in all .env files.
 - Verify Docker is running and containers are healthy.
 - Check firewall/antivirus rules for ports 27017 (MongoDB) and 8081 (mongo-express).
 - Try restarting Docker Desktop or the Docker daemon.
For more help: https://docs.docker.com/config/daemon/
EOF
