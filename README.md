<div align="center">
  <img src="icons/stable/vslight-1024.png" alt="VSLight app icon" width="128">
  <h1>VSLight</h1>
  <h3>A pure local code editor — edit / files / search / Git / terminal / extensions</h3>
</div>

VSLight is a lightweight build of the VS Code source, stripped of everything
that is not local editing:

- **kept**: editor, file explorer, search, Git, integrated terminal (+ tasks), the
  extension mechanism with the open-vsx marketplace, languages/themes/auth extensions
- **removed**: remote development (reh server, tunnels, Remote Explorer), AI Chat,
  built-in language-model/MCP/speech services, both built-in browsers, Debug
  subsystem, Notebooks, sessions/agent host, and the Rust tunnel CLI

The built-in AI services and their background processes are physically removed.
Stable Chat/LM/MCP API objects remain as local compatibility shells: model and
tool lists are empty, registrations are inert, and tool invocation rejects with
`LanguageModelError.NotFound`. Retired proposed APIs retain permission checks and
report unavailable when authorized. Ordinary extension APIs, Webviews, Markdown
and third-party external URL openers remain available. Extensions that depend on
the removed services lose those features; extensions can still supply their own
AI implementation.

## Download/Install

Releases: <https://github.com/rockie/vslight/releases>

macOS (Apple Silicon) is the local acceptance platform; Linux and Windows keep build
capability but are not part of the acceptance scope of this release.
The current lean-core build has not been released. See the
[release checklist](docs/vslight-release.md) for its validation status.

## Migration

VSLight is a separate product with its own data directories — nothing is migrated
in place. See [docs/vslight-migration.md](docs/vslight-migration.md) for how to move
settings, keybindings, snippets and extensions from VS Code–based editors.
Upgrading an existing VSLight installation keeps its user data, including old
Chat history and MCP configuration/credentials, but removes access through the
built-in AI interfaces. The migration guide also covers browser fallback, retired
CLI commands and native language support.

## Build

```bash
./dev/run-build.sh        # full build (clone upstream, patch, build, package)
./dev/run-build.sh -s     # reuse existing vscode/ tree
```

See [docs/howto-build.md](docs/howto-build.md) for details. Current lean-core
acceptance uses packaged-artifact and CLI assertions, isolated real extension-host
fixtures, and native GUI checks scoped to the test app's PID, as recorded in the
[lean-core plan](docs/plan/lean-core.md#92-必要自动验证与现有入口).
The previous `dev/smoke.sh` acceptance entry is no longer used.

## Why

Editor-only footprint: faster builds (no reh/Rust tunnel CLI), smaller install,
no built-in remote or AI runtime. Telemetry is fully disabled.

## Notice

VSLight is a fork of [VSCodium](https://github.com/VSCodium/vscodium), the
community-driven, freely-licensed binary distribution of Microsoft's VS Code.

## License

[MIT](LICENSE)
