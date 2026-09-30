#!/usr/bin/env bash
# 更新 rockie/vslight `versions` 分支的 stable/darwin/arm64/latest.json
# （dev/seed-versions-feed.sh 的通用化；参数：RELEASE_VERSION，默认读 dev/build.env）
set -e
cd "$(dirname "$0")/.."

RELEASE_VERSION="${1:-$( grep RELEASE_VERSION dev/build.env | cut -d'"' -f2 )}"
COMMIT=$( grep BUILD_SOURCEVERSION dev/build.env | cut -d'"' -f2 )
ZIP="VSLight-darwin-arm64-${RELEASE_VERSION}.zip"

TS=$( node -e 'console.log(Date.now())' )
SHA1=$( awk '{print $1}' "assets/${ZIP}.sha1" )
SHA256=$( awk '{print $1}' "assets/${ZIP}.sha256" )
PRODUCT_VERSION=$( awk -F. '{ printf "%s.%s.%d.0", $1, $2, $3 }' <<< "${RELEASE_VERSION}" )

rm -rf /tmp/vslight-feed
git clone --single-branch --branch versions "https://github.com/rockie/vslight.git" /tmp/vslight-feed
cd /tmp/vslight-feed

mkdir -p stable/darwin/arm64
jq -n \
  --arg url "https://github.com/rockie/vslight/releases/download/${RELEASE_VERSION}/${ZIP}" \
  --arg name "${RELEASE_VERSION}" \
  --arg version "${COMMIT}" \
  --arg productVersion "${PRODUCT_VERSION}" \
  --arg hash "${SHA1}" \
  --arg timestamp "${TS}" \
  --arg sha256hash "${SHA256}" \
  '. | .url=$url | .name=$name | .version=$version | .productVersion=$productVersion | .hash=$hash | .timestamp=$timestamp | .sha256hash=$sha256hash' \
  > stable/darwin/arm64/latest.json

git add -A
git -c user.name="vslight-bot" -c user.email="noreply@localhost" commit -q -m "update latest.json for ${RELEASE_VERSION} (darwin/arm64)"
git push origin versions

echo "=== verify raw URL ==="
sleep 3
curl -fsSL "https://raw.githubusercontent.com/rockie/vslight/refs/heads/versions/stable/darwin/arm64/latest.json"
