#!/usr/bin/env sh
set -eu

ZOLA_VERSION="${ZOLA_VERSION:-0.22.1}"

case "$(uname -s)-$(uname -m)" in
  Linux-x86_64)
    target="x86_64-unknown-linux-musl"
    ;;
  Darwin-arm64)
    target="aarch64-apple-darwin"
    ;;
  Darwin-x86_64)
    target="x86_64-apple-darwin"
    ;;
  *)
    echo "Unsupported platform: $(uname -s)-$(uname -m)" >&2
    exit 1
    ;;
esac

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

url="https://github.com/getzola/zola/releases/download/v${ZOLA_VERSION}/zola-v${ZOLA_VERSION}-${target}.tar.gz"

curl -sSL "$url" | tar -xz -C "$tmp_dir"
"$tmp_dir/zola" --version
"$tmp_dir/zola" build
