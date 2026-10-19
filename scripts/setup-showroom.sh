#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python3 scripts/install-mobile-sdk.py
python3 scripts/install-mobile-jdk.py
python3 scripts/configure-mobile-build.py
source scripts/mobile-env.sh
cd apps/mobile
flutter pub get --enforce-lockfile
flutter analyze
flutter test
