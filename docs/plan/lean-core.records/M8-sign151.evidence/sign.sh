#!/usr/bin/env bash
set -euo pipefail
set +x
umask 077
export VSCODE_ARCH=arm64 AGENT_TEMPDIRECTORY=/private/tmp/sign151-8n2nwj4c
sign_root="$AGENT_TEMPDIRECTORY"
sign_app="$sign_root/VSCode-darwin-arm64/VSLight.app"
sign_keychain="$sign_root/buildagent.keychain"
sign_p12="$sign_root/certificate.p12"
sign_python=/opt/homebrew/bin/python3.12
sign_node=/Users/rockie/.local/share/mise/installs/node/24.18.0/bin/node
export PATH="/Users/rockie/.local/share/mise/installs/node/24.18.0/bin:$PATH"
cleanup() {
  sign_exit=$?
  trap - EXIT
  set +e
  "$sign_python" "$sign_root/cleanup.py"
  cleanup_exit=$?
  "$sign_python" "$sign_root/stage.py" cleanup finished "$cleanup_exit"
  if [[ "$sign_exit" -eq 0 && "$cleanup_exit" -ne 0 ]]; then
    exit "$cleanup_exit"
  fi
  exit "$sign_exit"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
run_step() {
  sign_stage="$1"
  shift
  "$sign_python" "$sign_root/stage.py" "$sign_stage" started
  set +e
  "$@" > "$sign_root/$sign_stage.log" 2>&1
  sign_stage_exit=$?
  set -e
  "$sign_python" "$sign_root/stage.py" "$sign_stage" finished "$sign_stage_exit"
  return "$sign_stage_exit"
}
. /Users/rockie/Documents/gh-xgent/vscodium/dev/osx/macos-codesign.env
for key in CERTIFICATE_OSX_P12_DATA CERTIFICATE_OSX_P12_PASSWORD CERTIFICATE_OSX_APPLE_ID CERTIFICATE_OSX_TEAM_ID CERTIFICATE_OSX_APP_PASSWORD; do
  [[ -n "${!key:-}" ]] || { echo "Missing signing credential field"; exit 1; }
done
sign_keychain_password="$("$sign_python" -c 'import secrets; print(secrets.token_urlsafe(24))')"
printf '%s' "$CERTIFICATE_OSX_P12_DATA" | base64 --decode > "$sign_p12"
run_step keychain-create security create-keychain -p "$sign_keychain_password" "$sign_keychain"
run_step keychain-settings security set-keychain-settings -lut 21600 "$sign_keychain"
run_step keychain-unlock security unlock-keychain -p "$sign_keychain_password" "$sign_keychain"
run_step certificate-import security import "$sign_p12" -k "$sign_keychain" -P "$CERTIFICATE_OSX_P12_PASSWORD" -T /usr/bin/codesign
run_step key-partition security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$sign_keychain_password" "$sign_keychain"
CODESIGN_IDENTITY="$(security find-identity -v -p codesigning "$sign_keychain" | sed -nE 's/.* ([0-9A-F]{40}) .*/\1/p' | head -1)"
[[ -n "$CODESIGN_IDENTITY" ]] || { echo 'No signing identity'; exit 1; }
export CODESIGN_IDENTITY
run_step signing "$sign_node" /private/tmp/lean-core-build151-c480juxs/vscodium/vscode/build/darwin/sign.ts "$sign_root"
run_step codesign-verify codesign --verify --deep --strict --verbose=2 "$sign_app"
run_step codesign-display codesign -dv --verbose=4 "$sign_app"
run_step notarization-zip ditto -c -k --sequesterRsrc --keepParent "$sign_app" "$sign_root/notarization.zip"
run_step notary-store xcrun notarytool store-credentials lean-core-151 --apple-id "$CERTIFICATE_OSX_APPLE_ID" --team-id "$CERTIFICATE_OSX_TEAM_ID" --password "$CERTIFICATE_OSX_APP_PASSWORD" --keychain "$sign_keychain"
run_step notary-submit xcrun notarytool submit "$sign_root/notarization.zip" --keychain-profile lean-core-151 --keychain "$sign_keychain" --wait --output-format json
"$sign_python" - "$sign_root/notary-submit.log" "$sign_root/notary-result.json" <<'VERIFY'
import sys,json
from pathlib import Path
r=json.loads(Path(sys.argv[1]).read_text());Path(sys.argv[2]).write_text(json.dumps(r,indent=2)+'\n')
assert r.get('status')=='Accepted', r.get('status')
print('Notarization accepted:',r.get('id'))
VERIFY
run_step staple xcrun stapler staple "$sign_app"
run_step staple-validate xcrun stapler validate "$sign_app"
run_step spctl spctl --assess --verbose=4 --type execute "$sign_app"
run_step codesign-after-staple codesign --verify --deep --strict --verbose=2 "$sign_app"
run_step signed-zip ditto -c -k --sequesterRsrc --keepParent "$sign_app" "$sign_root/VSLight-151-signed.zip"
run_step signed-zip-crc "$sign_python" -c 'import sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); bad=z.testzip(); print("entries="+str(len(z.infolist()))+" firstBad="+repr(bad)); sys.exit(1 if bad else 0)' "$sign_root/VSLight-151-signed.zip"
run_step signed-runtime "$sign_python" /Users/rockie/Documents/gh-xgent/vscodium/dev/check-lean-runtime.py --signed --app "$sign_app"
run_step content-audit "$sign_python" "$sign_root/audit-content.py"
echo '151 signing, notarization, staple, strict assessment, signed ZIP CRC and runtime audit passed.'

