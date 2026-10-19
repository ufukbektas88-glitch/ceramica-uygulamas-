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
flutter build apk --release --target-platform android-arm64,android-arm --no-pub
install -m 644 build/app/outputs/flutter-apk/app-release.apk /workspace/CERAMICA-katalog.apk
"$ANDROID_HOME/build-tools/36.0.0/apksigner" verify --verbose /workspace/CERAMICA-katalog.apk
flutter build web --release --no-web-resources-cdn --no-pub
cd ../..
python3 scripts/package-showroom.py
