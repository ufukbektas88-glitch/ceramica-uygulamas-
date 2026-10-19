#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ ! -f .env ]; then
 node <<'JS'
const fs=require('fs');const {randomBytes}=require('crypto');const db=randomBytes(24).toString('hex');const admin=randomBytes(24).toString('hex');fs.writeFileSync('.env',`POSTGRES_PASSWORD=${db}\nDATABASE_URL=postgresql://ceramica:${db}@127.0.0.1:5432/ceramica\nDEMO_ADMIN_PASSWORD=${admin}\n`,{mode:0o600,flag:'wx'});
JS
fi
npm ci
npm run db:generate
docker compose up -d --wait
npm run db:migrate
npm run db:seed
npm run build
npm test
