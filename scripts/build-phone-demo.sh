#!/usr/bin/env bash
# Compatibility entry point. The active product is now the real showroom catalog.
set -euo pipefail
exec bash "$(dirname "$0")/build-showroom.sh"
