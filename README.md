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
  Debug subsystem, Notebooks, sessions/agent host, and the Rust tunnel CLI

## Download/Install

Releases: <https://github.com/rockie/vslight/releases>

macOS (Apple Silicon) is the verified platform; Linux and Windows keep build
capability but are not part of the acceptance scope of this release.

## Migration

VSLight is a separate product with its own data directories — nothing is migrated
in place. See [docs/vslight-migration.md](docs/vslight-migration.md) for how to move
settings, keybindings, snippets and extensions from VS Code–based editors.

## Build

```bash
./dev/run-build.sh        # full build (clone upstream, patch, build, package)
./dev/run-build.sh -s     # reuse existing vscode/ tree
```

See [docs/howto-build.md](docs/howto-build.md) for details. Acceptance smoke:
`./dev/smoke.sh` (see its header for the spec).

## Why

Editor-only footprint: faster builds (no reh/CLI), smaller install, no remote/AI
surface. Telemetry is fully disabled.

## Notice

VSLight is a fork of [VSCodium](https://github.com/VSCodium/vscodium), the
community-driven, freely-licensed binary distribution of Microsoft's VS Code.

## License

[MIT](LICENSE)
