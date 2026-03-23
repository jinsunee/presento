#!/usr/bin/env bash
set -euo pipefail

REPO="jinsunee/presento"
BINARY_NAME="presento"
INSTALL_DIR="${XDG_DATA_HOME:-$HOME/.local}/bin"

OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)
case "$ARCH" in
  x86_64) ARCH="x64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac
PLATFORM="${OS}-${ARCH}"

echo "Installing Presento for ${PLATFORM}..."

LATEST=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')
if [ -z "$LATEST" ]; then
  echo "Failed to fetch latest release"
  exit 1
fi

ASSET_NAME="${BINARY_NAME}-${PLATFORM}"
URL="https://github.com/${REPO}/releases/download/${LATEST}/${ASSET_NAME}"
echo "Downloading ${URL}..."
curl -fsSL -o "/tmp/${ASSET_NAME}" "$URL"

CHECKSUM_URL="${URL}.sha256"
curl -fsSL -o "/tmp/${ASSET_NAME}.sha256" "$CHECKSUM_URL"
cd /tmp && shasum -a 256 -c "${ASSET_NAME}.sha256"

mkdir -p "$INSTALL_DIR"
mv "/tmp/${ASSET_NAME}" "${INSTALL_DIR}/${BINARY_NAME}"
chmod +x "${INSTALL_DIR}/${BINARY_NAME}"

echo "Installed to ${INSTALL_DIR}/${BINARY_NAME}"

if ! echo "$PATH" | grep -q "$INSTALL_DIR"; then
  echo ""
  echo "WARNING: ${INSTALL_DIR} is not in your PATH. Add it:"
  echo "  export PATH=\"${INSTALL_DIR}:\$PATH\""
fi

echo ""
echo "Presento installed! Next steps:"
echo "  1. In Claude Code: /plugin marketplace add jinsunee/presento"
echo "  2. In Claude Code: /plugin install presento@presento"
echo "  3. Use /presentation in any conversation"
