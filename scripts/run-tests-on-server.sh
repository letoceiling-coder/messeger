#!/bin/bash
# Zapusk testov na servere.
# Zapusk: cd /var/www/messager && bash scripts/run-tests-on-server.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ROOT="${MESSAGER_ROOT:-/var/www/messager}"
cd "$ROOT" || { echo -e "${RED}Error: dir $ROOT not found${NC}"; exit 1; }

echo -e "${GREEN}=== Run tests on server ===${NC}"

echo -e "${YELLOW}[1/2] Backend unit tests (Jest)...${NC}"
cd "$ROOT/backend" && npm test && cd "$ROOT" || { echo -e "${RED}Backend tests failed${NC}"; exit 1; }

echo -e "${YELLOW}[2/2] Frontend lint (optional)...${NC}"
(cd "$ROOT/frontend-web" && npm run lint 2>/dev/null) || echo -e "${YELLOW}Frontend has no test script or lint skipped.${NC}"

echo -e "${GREEN}=== Tests OK ===${NC}"
