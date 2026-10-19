#!/usr/bin/env bash
# Active product: independent showroom. No database or API services are started.
set -euo pipefail
exec bash "$(dirname "$0")/setup-showroom.sh"
