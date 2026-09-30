#!/usr/bin/env bash
# =============================================================================
# dev/smoke.sh —— vslight 验收冒烟脚本（规格 + 实现）
#
# 【驱动方式】
#   L1 静态层：直接断言 .app 包内文件存在/不存在（确定性最强）
#   L2 CLI 层：bin/vslight --version / --list-extensions / --install-extension（open-vsx）
#   L3 UI 层：macOS AppleScript —— open -na 启动、System Events 快捷键注入
#             （Cmd+Shift+P 命令面板、Ctrl+` 终端、Cmd+S 保存）+ 窗口截图 Vision OCR
#             文本断言（macOS 26 的 System Events 读不到 Electron 内容 AX 树，
#             entire contents 聚合失效，AX 文本断言不可行）
#             安全硬保险：①每组按键前 frontmost 闸门，VSLight 不在最前立即 exit 2，
#             一行键不再发；②全部按键 tell process 定向，不裸发 System Events；
#             ③L3 入口备份剪贴板，trap EXIT 无条件恢复；④启动 3s 拉不到前台
#             则跳过 L3 并提示需机器空闲窗口（SKIP 不算失败）
#
# 【退出码】0=全部通过；1=静态/CLI 硬断言失败；2=UI 层断言失败（含焦点闸门中止）；3=用法/环境错误
#           （含未授予「辅助功能」权限、缺 swiftc、app 不存在等）
#
# 【超时】启动 90s；窗口就绪 60s；单步按键注入 20s；扩展安装 120s
#
# 【用法】
#   ./dev/smoke.sh [--app PATH] [--phase N] [--skip-ui] [--keep]
#     --app     .app 路径，默认 VSCode-darwin-arm64/VSLight.app，
#               不存在则回退 VSCodium.app（基线回归用）
#     --phase   启用到第 N 阶段为止的负向断言（默认 8=全部）：
#               >=2 品牌（vslight 二进制/无 tunnel 二进制/无 reh 产物/bundle id）
#               >=3 remote.* 前缀为 0 + 无 Remote Explorer 入口
#               >=4 debug.*/chat.*/notebook.* 前缀为 0 + 无 sessions/agentHost 产物
#               >=5 Copilot 配置面（product.json 键/schema 计数/asar/命令面板）
#               >=6 深度瘦身（rg/mxc 平台目录、1ds、notebook-out、telemetry.* 保留）
#               >=8 Electron 运行时（CFBundleVersion/.npmrc target 一致、LSMinimumSystemVersion、
#                  剪贴板机器断言、下载落盘 ~/Downloads）
#     --skip-ui 只跑 L1+L2（无 GUI 环境/CI 用）
#     --keep    保留临时 profile/workspace（排查用）
#
# 【正向清单】窗口启动 → workbench 渲染完成（窗口截图 OCR 文本计数，防空白窗假绿）→
#   编辑文件并保存（磁盘内容断言）→ 命令面板可用 →
#   终端可开（命令产物文件断言）→ Git（vscode.git 内置 + Source Control 入口 OCR 检出）→
#   open-vsx 装/卸扩展
# 【负向清单】无 tunnel 二进制；无 reh 产物；无 sessions.desktop.main/agentHostMain 产物；
#   workbench 产物中 "remote."/"debug."/"chat."/"notebook." 前缀计数为 0；
#   命令面板无 Remote Explorer / Debug: / Chat: 入口（OCR 检出「无匹配命令」空态）
# 【保留面回归】终端 ✓ Git ✓ open-vsx ✓ 主题扩展安装 ✓ zh-CN 语言包（菜单出现「文件」）✓
# =============================================================================
set -u

APP_PATH=""
PHASE=8
SKIP_UI=0
KEEP=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --app) APP_PATH="$2"; shift 2 ;;
    --phase) PHASE="$2"; shift 2 ;;
    --skip-ui) SKIP_UI=1; shift ;;
    --keep) KEEP=1; shift ;;
    *) echo "unknown arg: $1" >&2; exit 3 ;;
  esac
done

cd "$(dirname "$0")/.."

if [[ -z "${APP_PATH}" ]]; then
  if [[ -d "VSCode-darwin-arm64/VSLight.app" ]]; then
    APP_PATH="VSCode-darwin-arm64/VSLight.app"
  elif [[ -d "VSCode-darwin-arm64/VSCodium.app" ]]; then
    APP_PATH="VSCode-darwin-arm64/VSCodium.app"
  else
    echo "ERROR: no .app found under VSCode-darwin-arm64/" >&2; exit 3
  fi
fi
[[ -d "${APP_PATH}" ]] || { echo "ERROR: app not found: ${APP_PATH}" >&2; exit 3; }

# open -na cannot resolve relative app paths
APP_PATH="$( cd "$( dirname "${APP_PATH}" )" && pwd )/$( basename "${APP_PATH}" )"

APP_NAME="$( basename "${APP_PATH}" .app )"
APP_RES="${APP_PATH}/Contents/Resources/app"
BIN="${APP_RES}/bin/vslight"
[[ -x "${BIN}" ]] || BIN="${APP_RES}/bin/codium"
OUT_DIR="${APP_RES}/out"

FAIL_HARD=0
FAIL_UI=0
declare -a RESULTS=()

note() { printf '  %s\n' "$*"; }
pass() { RESULTS+=( "PASS: $1" ); note "[PASS] $1"; }
fail() { RESULTS+=( "FAIL: $1" ); note "[FAIL] $1"; if [[ "${2:-hard}" == "ui" ]]; then FAIL_UI=1; else FAIL_HARD=1; fi; }
skip() { RESULTS+=( "SKIP: $1" ); note "[SKIP] $1"; }

check() { # check <desc> <expected> <actual>
  if [[ "$2" == "$3" ]]; then pass "$1"; else fail "$1 (expected=$2 actual=$3)"; fi
}

# ---- timeout wrapper: run_to <seconds> <cmd...> ; returns 124 on timeout
run_to() {
  local secs="$1"; shift
  "$@" & local pid=$!
  local waited=0
  while kill -0 "${pid}" 2>/dev/null; do
    sleep 1; waited=$(( waited + 1 ))
    if (( waited >= secs )); then kill -9 "${pid}" 2>/dev/null; wait "${pid}" 2>/dev/null; return 124; fi
  done
  wait "${pid}"
}

# =============================================================================
echo "== L1 静态包断言 (${APP_PATH}) =="

[[ -x "${BIN}" ]] && pass "bin 存在 ($( basename "${BIN}" ))" || fail "bin 不存在"

if (( PHASE >= 2 )); then
  if ls "${APP_RES}/bin/" | grep -q -- '-tunnel'; then fail "tunnel 二进制仍存在" ; else pass "无 tunnel 二进制"; fi
  if [[ "${APP_NAME}" == "VSLight" ]]; then
    BID="$( /usr/libexec/PlistBuddy -c 'Print CFBundleIdentifier' "${APP_PATH}/Contents/Info.plist" 2>/dev/null )"
    check "bundle id == com.vslight" "com.vslight" "${BID}"
    BNAME="$( /usr/libexec/PlistBuddy -c 'Print CFBundleName' "${APP_PATH}/Contents/Info.plist" 2>/dev/null )"
    check "bundle name == VSLight" "VSLight" "${BNAME}"
  else
    skip "基线包（非 VSLight.app），品牌断言跳过"
  fi
  if ls -d vscode-reh-* 1>/dev/null 2>&1; then fail "仓库根仍有 vscode-reh-* 产物"; else pass "无 reh 产物"; fi
fi

if (( PHASE >= 4 )); then
  if find "${OUT_DIR}" -name 'sessions.desktop.main.js' | grep -q .; then fail "sessions.desktop.main.js 仍在产物"; else pass "产物无 sessions.desktop.main.js"; fi
  if find "${OUT_DIR}" -name 'agentHostMain.js' | grep -q .; then fail "agentHostMain.js 仍在产物"; else pass "产物无 agentHostMain.js"; fi
fi

# ---- 配置/命令前缀计数（workbench 产物内，schema 属性形 "prefix.key":{ 口径，
#      只计注册用户可见默认设置，不计服务内部使用串；命令面板入口由 L3 层覆盖）
count_prefix() { # count_prefix <prefix-regex> -> stdout count
  grep -rohE "\"$1\"[[:space:]]*:[[:space:]]*\{" "${OUT_DIR}/vs/workbench" 2>/dev/null | wc -l | tr -d ' '
}
if (( PHASE >= 3 )); then check '"remote.*" 注册设置为 0' "0" "$( count_prefix 'remote\.[a-zA-Z]+' )"; fi
if (( PHASE >= 4 )); then
  check '"debug.*" 注册设置为 0' "0" "$( count_prefix 'debug\.[a-zA-Z]+' )"
  check '"notebook.*" 注册设置为 0' "0" "$( count_prefix 'notebook\.[a-zA-Z]+' )"
  # chat: F-12 降级为隐藏入口（全量保留打包，chat.disableAIFeatures 默认 true 隐藏全部 AI 入口）
  # 产物为 minify+nls 外化，无法可靠静态断言默认值 → 源码级断言（构建树内），UI 入口检查归 Phase 7
  CHAT_SRC="vscode/src/vs/workbench/contrib/chat/browser/chat.shared.contribution.ts"
  if [[ -f "${CHAT_SRC}" ]] && grep -A4 'ChatAIDisabledSettingId\]' "${CHAT_SRC}" | grep -q 'default: true'; then
    pass "chat.disableAIFeatures 默认 true（AI 入口全隐藏，源码断言）"
  elif [[ ! -f "${CHAT_SRC}" ]]; then
    skip "源码树不在（仅产物），chat 降级断言归入 Phase 7 UI 检查"
  else
    fail "chat.disableAIFeatures 未默认开启"
  fi
fi

# ---- M2 · Copilot 配置面（lean-dist §9.1 M2）：产物 product.json 键、api proposal 子键、
#      schema 计数（chat.* 隐藏面 ≤10、copilot 系为 0）、asar 包路径、docs 树
if (( PHASE >= 5 )); then
  PROD_JSON="${APP_RES}/product.json"
  for K in defaultChatAgent trustedExtensionAuthAccess builtInExtensionsEnabledWithAutoUpdates extensionTips extensionImportantTips; do
    if jq -e "has(\"${K}\")" "${PROD_JSON}" >/dev/null 2>&1; then
      fail "产物 product.json 仍有 ${K}"
    else
      pass "产物 product.json 无 ${K}"
    fi
  done
  COPILOT_KEYS="$( jq -r '[(.extensionEnabledApiProposals // {} | keys[]), (.extensionsEnabledWithApiProposalVersion // [] | .[])] | .[]' "${PROD_JSON}" 2>/dev/null | grep -i copilot || true )"
  if [[ -n "${COPILOT_KEYS}" ]]; then fail "api proposal 列表仍有 copilot 条目: ${COPILOT_KEYS}"; else pass "api proposal 列表无 copilot 条目"; fi
  check '"copilot.*" 注册设置为 0' "0" "$( count_prefix 'copilot\.[a-zA-Z]+' )"
  check '"github.copilot.*" 注册设置为 0' "0" "$( count_prefix 'github\.copilot\.' )"
  CHAT_N="$( count_prefix 'chat\.[a-zA-Z]+' )"
  if (( CHAT_N <= 10 )); then pass '"chat.*" 注册设置 '"${CHAT_N}"' ≤ 10（隐藏面基线）'; else fail '"chat.*" 注册设置 '"${CHAT_N}"' > 10'; fi
  ASAR="${APP_RES}/node_modules.asar"
  if [[ -f "${ASAR}" ]]; then
    if grep -aq '@github/copilot\|@vscode/copilot-api' "${ASAR}"; then fail "asar 内仍有 @github/copilot*/@vscode/copilot-api"; else pass "asar 无 @github/copilot*/@vscode/copilot-api"; fi
  fi
  if [[ -f "docs/ext-github-copilot.md" ]]; then fail "docs/ext-github-copilot.md 仍存在"; else pass "docs 树无 ext-github-copilot.md"; fi
fi

# ---- M3 · 深度瘦身（lean-dist §9.1 M3）：rg/mxc 平台目录、1ds、notebook-out、telemetry.* 保留。
#      平台按本 fork 唯一产物 darwin-arm64 断言
if (( PHASE >= 6 )); then
  RG_BIN="${APP_RES}/node_modules.asar.unpacked/@vscode/ripgrep-universal/bin"
  if [[ -x "${RG_BIN}/darwin-arm64/rg" ]]; then pass "rg 二进制在 (darwin-arm64)"; else fail "rg 二进制缺失 (${RG_BIN}/darwin-arm64/rg)"; fi
  RG_DIRS="$( ls "${RG_BIN}" 2>/dev/null | tr '\n' ' ' | sed 's/ $//' )"
  check "rg bin/ 仅本机平台目录" "darwin-arm64" "${RG_DIRS}"
  MXC_BIN="${APP_RES}/node_modules.asar.unpacked/@microsoft/mxc-sdk/bin"
  MXC_DIRS="$( ls "${MXC_BIN}" 2>/dev/null | tr '\n' ' ' | sed 's/ $//' )"
  check "mxc-sdk bin/ 仅 arm64" "arm64" "${MXC_DIRS}"
  if [[ -f "${ASAR}" ]]; then
    if grep -aq '1ds-post-js\|1ds-core-js\|applicationinsights-core-js' "${ASAR}"; then fail "asar 内仍有 1ds 遥测 SDK"; else pass "asar 无 1ds 遥测 SDK"; fi
  fi
  if find "${APP_RES}/extensions/mermaid-markdown-features" -maxdepth 1 -name 'notebook-out' 2>/dev/null | grep -q .; then fail "mermaid notebook-out 仍在产物"; else pass "产物无 mermaid notebook-out"; fi
  TELEMETRY_N="$( count_prefix 'telemetry\.[a-zA-Z]+' )"
  if (( TELEMETRY_N >= 1 )); then pass '"telemetry.*" 注册设置 '"${TELEMETRY_N}"' ≥ 1'; else fail '"telemetry.*" 注册设置丢失'; fi
  if [[ -d "vscode/src" ]]; then
    # 代码引用口径；uri.perf.data.txt 是 URI 解析性能夹具（内含遥测域名样本串），非引用
    if grep -rl --include='*.ts' 'OneDataSystemAppender\|@microsoft/1ds' vscode/src/ 2>/dev/null | grep -q .; then fail "源码树仍有 1ds 引用"; else pass "源码树无 1ds 引用"; fi
  else
    skip "源码树不在，1ds 源码断言跳过"
  fi
fi

# ---- M4 · Electron 运行时（lean-dist §9.1 M4）：期望版本动态读自 vscode/.npmrc
#      target=（103 号 patch 改版本点后自动跟随），macOS 地板不抬
if (( PHASE >= 8 )); then
  ELECTRON_PLIST="${APP_PATH}/Contents/Frameworks/Electron Framework.framework/Resources/Info.plist"
  if [[ -f "vscode/.npmrc" ]]; then
    EXPECTED_ELECTRON="$( grep '^target=' vscode/.npmrc | head -1 | cut -d= -f2 | tr -d ' \r"' )"
    CFV="$( /usr/libexec/PlistBuddy -c 'Print CFBundleVersion' "${ELECTRON_PLIST}" 2>/dev/null )"
    check "Electron Framework 版本 == .npmrc ${EXPECTED_ELECTRON}" "${EXPECTED_ELECTRON}" "${CFV}"
  else
    skip "vscode/.npmrc 不在，Electron 版本断言跳过"
  fi
  MINOS="$( /usr/libexec/PlistBuddy -c 'Print LSMinimumSystemVersion' "${APP_PATH}/Contents/Info.plist" 2>/dev/null )"
  check "LSMinimumSystemVersion == 12.0（macOS 地板不抬）" "12.0" "${MINOS}"
fi

# =============================================================================
echo "== L2 CLI 断言 =="

SMOKE_ROOT="$( mktemp -d /tmp/vslight-smoke.XXXXXX )"
UDIR="${SMOKE_ROOT}/user-data"
EDIR="${SMOKE_ROOT}/extensions"
WS="${SMOKE_ROOT}/ws"
mkdir -p "${WS}"
cleanup() {
  # L3 的剪贴板机器断言会覆写用户剪贴板；已备份则无条件恢复
  if (( ${CLIP_SAVED:-0} == 1 )); then printf '%s' "${CLIP_BACKUP}" | pbcopy; fi
  if (( KEEP == 0 )); then
    pkill -f "${APP_NAME}.*${SMOKE_ROOT}" 2>/dev/null
    rm -rf "${SMOKE_ROOT}"
  else
    note "保留现场: ${SMOKE_ROOT}"
  fi
}
trap cleanup EXIT

echo 'hello vslight' > "${WS}/a.txt"
echo 'the quick brown fox' > "${WS}/b.txt"
git -C "${WS}" init -q && git -C "${WS}" add -A && git -C "${WS}" -c user.email=s@moke -c user.name=smoke commit -qm init

VER_OUT="$( run_to 30 "${BIN}" --user-data-dir "${UDIR}" --extensions-dir "${EDIR}" --version 2>/dev/null )"
if [[ -n "${VER_OUT}" ]]; then pass "--version => $( head -1 <<< "${VER_OUT}" )"; else fail "--version 无输出"; fi

if [[ "${APP_NAME}" == "VSLight" ]] && (( PHASE >= 2 )); then
  TUNNEL_OUT="$( "${BIN}" tunnel 2>&1 )"
  if grep -q 'not supported' <<< "${TUNNEL_OUT}"; then
    pass "vslight tunnel 给出可读报错: $( head -1 <<< "${TUNNEL_OUT}" )"
  else
    fail "vslight tunnel 未给出预期报错: $( head -1 <<< "${TUNNEL_OUT}" )"
  fi
fi

if [[ -d "${APP_RES}/extensions/git" && -d "${APP_RES}/extensions/git-base" ]]; then
  pass "内置 Git 扩展在包内 (git, git-base)"
else
  fail "内置 Git 扩展缺失"
fi

EXT_LIST="$( run_to 60 "${BIN}" --user-data-dir "${UDIR}" --extensions-dir "${EDIR}" --list-extensions 2>/dev/null )"

if run_to 120 "${BIN}" --user-data-dir "${UDIR}" --extensions-dir "${EDIR}" --install-extension zhuangtongfa.material-theme >/dev/null 2>&1; then
  EXT_LIST2="$( "${BIN}" --user-data-dir "${UDIR}" --extensions-dir "${EDIR}" --list-extensions 2>/dev/null )"
  if grep -qi 'zhuangtongfa.material-theme' <<< "${EXT_LIST2}"; then pass "open-vsx 主题扩展安装成功"; else fail "主题扩展装了但 list 不见"; fi
else
  fail "open-vsx 扩展安装失败（网络/市场问题?）"
fi

if run_to 180 "${BIN}" --user-data-dir "${UDIR}" --extensions-dir "${EDIR}" --install-extension MS-CEINTL.vscode-language-pack-zh-hans >/dev/null 2>&1; then
  pass "zh-CN 语言包安装成功"
  ZH_PACK=1
else
  fail "zh-CN 语言包安装失败"
  ZH_PACK=0
fi

# =============================================================================
if (( SKIP_UI == 1 )); then
  echo "== L3 UI 断言（--skip-ui，跳过）=="
else
  echo "== L3 UI 断言 (AppleScript 注入 + 窗口截图 OCR) =="

  AX_OK="$( osascript -e 'tell application "System Events" to return UI elements enabled' 2>/dev/null )"
  if [[ "${AX_OK}" != "true" ]]; then
    echo "ERROR: 未授予辅助功能权限（系统设置 → 隐私与安全性 → 辅助功能 → 终端）" >&2
    exit 3
  fi

  # OCR 文本断言工具链（本机实证：macOS 26 的 System Events 读不到 Electron 内容 AX 树，
  # entire contents 聚合直接失效——改为按 CGWindowID 截窗口 + Vision OCR 读界面文本）
  command -v swiftc >/dev/null || { echo "ERROR: L3 需要 swiftc（Xcode CLT）编译 OCR 断言工具" >&2; exit 3; }
  OCR_BIN="${SMOKE_ROOT}/ocr_text"
  WINID_BIN="${SMOKE_ROOT}/win_id"
  swiftc -O -o "${OCR_BIN}" dev/ocr_text.swift || { echo "ERROR: ocr_text 编译失败" >&2; exit 3; }
  swiftc -O -o "${WINID_BIN}" dev/win_id.swift || { echo "ERROR: win_id 编译失败" >&2; exit 3; }

  # 残留实例会抢焦点/干扰进程名解析（open -na 每发必开新实例）。
  # 优雅退出优先：直接 pkill (SIGTERM) 会让下次启动弹「window terminated unexpectedly
  # (killed, 15)」恢复对话框，遮挡窗口干扰 OCR 与按键
  graceful_kill() { # graceful_kill <pkill-pattern> — 先 quit 等 6s，残余再 SIGTERM
    pgrep -f "$1" >/dev/null 2>&1 || return 0  # AppleEvent 会拉起未运行的 app，空转必须避开
    osascript -e "tell application \"${APP_NAME}\" to quit" 2>/dev/null
    for i in {1..6}; do pgrep -f "$1" >/dev/null 2>&1 || return 0; sleep 1; done
    pkill -f "$1" 2>/dev/null; sleep 1
  }
  graceful_kill "${APP_PATH}"

  # 硬保险③：L3 的剪贴板断言会覆写用户剪贴板，入口先备份，trap EXIT 恢复
  CLIP_BACKUP="$( pbpaste 2>/dev/null )"; CLIP_SAVED=1

  frontmost_ok() { [[ "$( osascript -e "tell application \"System Events\" to tell process \"${APP_NAME}\" to return frontmost" 2>/dev/null )" == "true" ]]; }
  require_frontmost() { # 硬保险①：任何按键发送前的最后闸门；合成按键只进前台应用，失焦即整体中止
    frontmost_ok && return 0
    echo "ERROR: ${APP_NAME} 不在最前，L3 立即中止（后续按键未发送）" >&2
    exit 2
  }

  launch_app() { # launch_app [extra-args...] → rc 0=窗口就绪且前台 1=90s无窗口 2=3s拉不到前台
    graceful_kill "${APP_NAME}.*${SMOKE_ROOT}"
    open -na "${APP_PATH}" --args \
      --user-data-dir "${SMOKE_ROOT}/user-data" \
      --extensions-dir "${SMOKE_ROOT}/extensions" \
      --disable-workspace-trust --skip-welcome --skip-release-notes \
      "$@" "${WS}"
    run_to 90 osascript -e "
      tell application \"System Events\"
        repeat 90 times
          if exists process \"${APP_NAME}\" then
            if (count of windows of process \"${APP_NAME}\") > 0 then return \"ok\"
          end if
          delay 1
        end repeat
        return \"timeout\"
      end tell" | grep -q ok || return 1
    # open -na 不保证前台；按键注入前必须显式拉到最前（硬保险④：拉不到则跳过 L3）
    osascript -e "tell application \"System Events\" to tell process \"${APP_NAME}\" to set frontmost to true" 2>/dev/null
    for i in 1 2 3; do frontmost_ok && return 0; sleep 1; done
    return 2
  }
  quit_app() { graceful_kill "${APP_NAME}.*${SMOKE_ROOT}"; }

  capture_window() { # capture_window <out.png> — 按 CGWindowID 截窗口，不受遮挡与 Retina 缩放影响
    local wid
    wid="$( "${WINID_BIN}" "${APP_NAME}" )" || return 1
    screencapture -l "${wid}" -x "$1"
  }
  # 窗口 OCR 文本行数：渲染完成的 workbench 有侧栏/状态栏等大量文本，空白窗（渲染崩溃）≈0
  ocr_window_count() {
    capture_window "${SMOKE_ROOT}/win.png" || { echo 0; return; }
    "${OCR_BIN}" "${SMOKE_ROOT}/win.png" 2>/dev/null | wc -l | tr -d ' '
  }
  # 界面文本命中（大小写不敏感：VS Code 视图标题经 CSS text-transform 全部大写绘制）
  ocr_window_find() { # ocr_window_find <extended-regex>
    capture_window "${SMOKE_ROOT}/win.png" || return 1
    "${OCR_BIN}" "${SMOKE_ROOT}/win.png" 2>/dev/null | grep -qEi "$1"
  }

  keystroke_cmd() { # keystroke_cmd <key> [shift|ctrl|ctrlshift]（硬保险②：进程定向，不裸发 System Events）
    require_frontmost
    case "${2:-}" in
      shift)     osascript -e "tell application \"System Events\" to tell process \"${APP_NAME}\" to keystroke \"$1\" using {command down, shift down}" ;;
      ctrl)      osascript -e "tell application \"System Events\" to tell process \"${APP_NAME}\" to keystroke \"$1\" using control down" ;;
      ctrlshift) osascript -e "tell application \"System Events\" to tell process \"${APP_NAME}\" to keystroke \"$1\" using {control down, shift down}" ;;
      *)         osascript -e "tell application \"System Events\" to tell process \"${APP_NAME}\" to keystroke \"$1\" using command down" ;;
    esac
  }
  type_str() { # type_str <text>
    require_frontmost
    run_to 20 osascript -e "tell application \"System Events\" to tell process \"${APP_NAME}\" to keystroke \"$1\""
  }
  press_escape() {
    require_frontmost
    osascript -e "tell application \"System Events\" to tell process \"${APP_NAME}\" to key code 53"
  }

  L3_RC=0; launch_app || L3_RC=$?
  if (( L3_RC == 2 )); then
    skip "L3 跳过：3s 内未能拉到前台（需机器空闲且屏幕未锁的窗口）"
  elif (( L3_RC != 0 )); then
    fail "90s 内无窗口" ui
  else
    pass "窗口启动"

    # 渲染机器断言：空白窗回归（workbench 未渲染）在此变红，不再依赖目视。
    # 启动初期可能未绘完，多轮取最大值
    OCRN=0
    for i in 1 2 3; do
      N="$( ocr_window_count )"
      [[ "${N}" =~ ^[0-9]+$ ]] && (( N > OCRN )) && OCRN=${N}
      (( OCRN >= 10 )) && break
      sleep 3
    done
    if (( OCRN >= 10 )); then pass "workbench 渲染完成（窗口 OCR 文本 ${OCRN} 行 ≥ 10）"; else fail "窗口疑似空白：OCR 文本 ${OCRN} 行（workbench 未渲染）" ui; fi

    # 正向：编辑并保存（CLI 把 a.txt 开进运行中实例 → 键入 → Cmd+S → 磁盘内容断言）
    run_to 30 "${BIN}" --user-data-dir "${UDIR}" --extensions-dir "${EDIR}" "${WS}/a.txt" >/dev/null 2>&1
    sleep 3
    type_str "vslight-smoke-edit "
    keystroke_cmd s
    sleep 2
    # 编辑落到哪个文件取决于焦点，断言任一文件被改动即证明编辑链路通
    if grep -rq 'vslight-smoke-edit' "${WS}" 2>/dev/null; then pass "编辑→保存落盘"; else fail "编辑未落盘" ui; fi

    # 剪贴板机器断言（M4）：pbcopy 写入 → Cmd+V 粘贴进编辑器 → Cmd+S 后磁盘读回一致；
    # pbpaste 复核 app 未改写剪贴板
    if (( PHASE >= 8 )); then
      CLIP_STR="vslight-clip-$( date +%s )"
      printf '%s' "${CLIP_STR}" | pbcopy
      keystroke_cmd v
      sleep 1
      PBP="$( pbpaste )"
      [[ "${PBP}" == "${CLIP_STR}" ]] && pass "剪贴板跨进程一致 (pbcopy/pbpaste)" || fail "剪贴板跨进程不一致 (${PBP} != ${CLIP_STR})" ui
      keystroke_cmd s
      sleep 2
      if grep -rq "${CLIP_STR}" "${WS}" 2>/dev/null; then pass "剪贴板粘贴→保存落盘"; else fail "剪贴板粘贴未落盘" ui; fi
    fi

    # 终端面板开合以物理键位发送：key code 50 = 反引号键。
    # keystroke "`" 走字符注入，会被中文输入法（Pinyin/SCIM）吞掉导致 Ctrl+` 失效；
    # key code 发送物理键，IME 不拦截（本机实证：IME 激活时仅前者打不开面板）。
    term_toggle() {
      require_frontmost
      # VSLight terminal 真快捷键是 Ctrl+Shift+`（menu 显示），不是 Ctrl+`——前 fix 漏 shift
      run_to 20 osascript -e "tell application \"System Events\" to tell process \"${APP_NAME}\" to key code 50 using {control down, shift down}"
    }

    # 终端面板开合以 OCR 门控，不用固定 sleep——首开慢时固定 sleep 会把命令打进编辑器
    # 终端面板以文件落盘证明开关：OCR 判 panel 头（"TERMINAL"）在首轮动画里偶发被
    # Vision 漏抓（见 M1 记录 deep-OCR 实测），故面板开关与命令执行判定都用磁盘文件
    term_close_wait() { # 关到面板消失为止（至多两次切换；未开过则第一次切换会打开、第二次关回）
      local a
      for a in 1 2; do
        term_toggle
        sleep 2
        ocr_window_find 'terminal|终端' || return 0
      done
      return 1
    }

    # 正向：终端（macOS 切换终端是 Ctrl+`，Cmd+` 是系统窗口循环键；开终端 → 键入命令 → 产物文件断言）
    rm -f "${WS}/term-proof.txt"
    term_toggle
    sleep 5  # 给面板留出完整动画/渲染窗口，避免「打字进编辑器」的级联失败
    type_str "touch '${WS}/term-proof.txt' && echo TERM_OK || echo TERM_FAIL\r"
    for i in {1..20}; do [[ -f "${WS}/term-proof.txt" ]] && break; sleep 1; done
    if [[ -f "${WS}/term-proof.txt" ]]; then
      pass "终端可开且执行命令（文件落盘证明）"
      OCRN_TERM="$( ocr_window_count )"
      note "终端开后窗口 OCR 文本 ${OCRN_TERM} 行（终端面板已渲染，仅记录）"

      # 下载机器断言（M4）：经 app 内终端把网络文件写入 ~/Downloads，覆盖 Electron 43
      # 下载目录行为变更下的端到端写盘链路（本产物无浏览器/远程/更新下载入口）
      if (( PHASE >= 8 )); then
        DL_FILE="${HOME}/Downloads/vslight-smoke-download.bin"
        rm -f "${DL_FILE}"
        type_str "curl -sfL --max-time 30 -o ${DL_FILE} https://raw.githubusercontent.com/rockie/vslight/master/LICENSE && echo DL_OK || echo DL_FAIL\r"
        for i in {1..35}; do [[ -s "${DL_FILE}" ]] && break; sleep 1; done
        if [[ -s "${DL_FILE}" ]]; then pass "下载落盘 ~/Downloads（$( wc -c < "${DL_FILE}" | tr -d ' ' ) bytes）"; else fail "下载未落盘 ~/Downloads" ui; fi
        rm -f "${DL_FILE}"
      fi
    else
      fail "终端命令未执行（文件未落盘）" ui
    fi

    # 关掉终端面板再测视图/面板类快捷键——终端持焦时按键进 shell，Ctrl+Shift+G 与
    # Cmd+Shift+P 都到不了 workbench（本机实证）
    term_close_wait || note "警告：终端面板未能确认关闭，后续视图断言可能受影响"

    # 正向：Git 视图容器（macOS Source Control 视图是 Ctrl+Shift+G，Cmd+Shift+G 是查找上一个）；
    # OCR 在视图切场动画里偶发漏抓，3 轮取最大（任一轮命中即 PASS）
    keystroke_cmd g ctrlshift
    SCM_OK=0
    for i in 1 2 3; do
      sleep 3
      if ocr_window_find 'source control|源代码管理'; then SCM_OK=1; break; fi
    done
    if (( SCM_OK == 1 )); then pass "Source Control 入口存在"; else fail "Source Control 未检出" ui; fi

    # 负向：命令面板无 Remote Explorer / Debug / Chat / Copilot 入口。
    # VS Code 命令面板是模糊匹配——"Remote Explorer" 也会命中普通 Explorer 命令，
    # 故不能依赖「无匹配命令」空态；改为：确认面板打开（OCR 检出查询回显行）后，
    # 断言结果区（回显行以下）无任何包含禁忌词的行。第一次 chord 可能被刚打开的
    # 视图吞掉，面板未开时重试一次
    no_palette_hits() { # no_palette_hits <query> <forbidden-regex>
      local attempt ocr
      for attempt in 1 2; do
        keystroke_cmd p shift
        sleep 2
        type_str "$1"
        sleep 2
        capture_window "${SMOKE_ROOT}/win.png" || return 1
        ocr="$( "${OCR_BIN}" "${SMOKE_ROOT}/win.png" 2>/dev/null | grep -vE '^\[Type |^Start typing|dismiss|don.t show this again' )"
        if grep -qiF 'No matching commands' <<< "${ocr}"; then
          press_escape; sleep 1
          return 0
        fi
        # OCR 常把回显行渲染成无空格形式（">RemoteExplorer"），回显检测与「丢弃回显行」
        # 都按去空格小写归一化，避免把查询回显当命中或漏检（本机实测两种渲染都会出现）
        if grep -qiF "$1" <<< "${ocr}" || tr -d ' ' <<< "${ocr}" | grep -qiF "${1// /}"; then
          press_escape; sleep 1
          if awk -v q="${1// /}" 'BEGIN{lq=tolower(q)} {line=tolower($0); gsub(/ /, "", line); if (!dropped && index(line, lq)) {dropped=1; next} print}' <<< "${ocr}" | grep -qiE "$2"; then
            return 1
          fi
          return 0
        fi
        press_escape
        sleep 1
      done
      return 1
    }

    if (( PHASE >= 3 )); then
      if no_palette_hits "Remote Explorer" 'remote explorer'; then pass "命令面板无 Remote Explorer"; else fail "命令面板仍有 Remote Explorer" ui; fi
    fi
    if (( PHASE >= 4 )); then
      if no_palette_hits "Debug: Start" 'debug'; then pass "命令面板无 Debug: Start"; else fail "命令面板仍命中 Debug: Start" ui; fi
      if no_palette_hits "Chat:" 'chat'; then pass "命令面板无 Chat:"; else fail "命令面板仍命中 Chat:" ui; fi
      if no_palette_hits "Notebook:" 'notebook'; then pass "命令面板无 Notebook:"; else fail "命令面板仍命中 Notebook:" ui; fi
    fi
    if (( PHASE >= 5 )); then
      if no_palette_hits "Copilot:" 'copilot'; then pass "命令面板无 Copilot:"; else fail "命令面板仍命中 Copilot:" ui; fi
    fi

    quit_app
  fi

  # 保留面：zh-CN 界面
  if (( ZH_PACK == 1 )); then
    ZH_RC=0; launch_app --locale zh-CN || ZH_RC=$?
    if (( ZH_RC == 2 )); then
      skip "zh-CN 走查跳过：3s 内未能拉到前台"
    elif (( ZH_RC != 0 )); then
      fail "zh-CN 模式启动失败" ui
    else
      MENUS="$( run_to 30 osascript -e "tell application \"System Events\" to tell process \"${APP_NAME}\" to get name of menu bar items of menu bar 1" 2>/dev/null )"
      if grep -q '文件' <<< "${MENUS}"; then pass "zh-CN 界面生效（菜单含「文件」）"; else fail "zh-CN 未生效: ${MENUS}" ui; fi
    fi
    quit_app
  fi
fi

# =============================================================================
echo
echo "== 结果汇总 =="
printf '%s\n' "${RESULTS[@]}"
if (( FAIL_HARD == 1 )); then exit 1; fi
if (( FAIL_UI == 1 )); then exit 2; fi
exit 0
