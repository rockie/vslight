<!-- order: 0 -->

# Extensions compatibility

## Table of Contents

- [VSLight host feature limits](#vslight-host-limits)
- [Incompatibility](#incompatibility)
- [Replacements](#replacements)
   - [C/C++](#cc)
   - [Python](#python)
   - [Remote](#remote)

## <a id="vslight-host-limits"></a>VSLight host feature limits

VSLight removes the host Chat, language-model, MCP, speech and agent-host runtime, together with Integrated Browser and Simple Browser. Extensions that depend on these host services cannot use those features, even if the extension itself loads.

| Extension interface | VSLight behavior |
| --- | --- |
| Stable chat / language-model / MCP data types | Pure data constructors and declarations remain available. |
| `chat.createChatParticipant` | Returns a local participant object with its ordinary writable properties and an idempotent `dispose`; the host never calls its handler or creates Chat UI. |
| `lm.selectChatModels`, `lm.tools` | Resolve to an empty model list and expose a fixed, readonly empty tool list. |
| Stable model/tool/MCP provider registration and events | Registrations return local, inert Disposables; providers are never called or subscribed to. Events never fire; disposal is idempotent. |
| `ExtensionContext.languageModelAccessInformation` | Returns a local object; `canSendRequest` returns `undefined`, and its change event never fires. It does not request consent. |
| `lm.invokeTool` | Returns a Promise rejected with `LanguageModelError.NotFound`; it does not throw synchronously or return an empty successful result. |
| Retired proposed APIs, including browser and speech APIs | Existing proposal permission checks run first. Authorized calls still report unavailable; granting permission cannot restore the removed service. Other proposed APIs retain their own checks and behavior. |
| Ordinary Webviews and external URI openers | Retained, including third-party opener registration. |
| Local profiling | Retained, including its chrome-remote-interface dependency. The production Playwright browser chain is removed; Playwright used by development tests remains. |

An extension that supplies its own AI client or service may still provide AI features. Removing VSLight's host services does not guarantee that third-party AI implementations are disabled.

The upstream VSCodium recommendations below do not restore VSLight's removed Remote, Debug or Notebook runtime. In particular, Native Debug and the Remote replacements cannot provide those host features in VSLight. See the [VSLight migration guide](vslight-migration.md).

## <a id="incompatibility"></a>Incompatibility

Most Microsoft extensions are limited to run on only MS products by their license and by running additional checks in their proprietary code.

Extensions incompatible with VSCodium **include**:

- [C/C++](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools)
- [LaTeX Workshop](https://marketplace.visualstudio.com/items?itemName=James-Yu.latex-workshop) (explicitly unsupported, as [indicated in the FAQ](https://github.com/James-Yu/LaTeX-Workshop/wiki/FAQ#vscodium-is-not-officially-supported))
- [Live Share](https://marketplace.visualstudio.com/items?itemName=MS-vsliveshare.vsliveshare)
- [Python](https://marketplace.visualstudio.com/items?itemName=ms-python.python)
- [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
- [Remote - SSH](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-ssh)
- [Remote - SSH: Editing Configuration Files](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-ssh-edit)
- [Remote - WSL](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl)

## <a id="replacements"></a>Replacements

The following extensions are functional replacements for incompatible extensions:

### <a id="cc"></a>C/C++

- [clangd](https://open-vsx.org/extension/llvm-vs-code-extensions/vscode-clangd) for full featured editing (including IntelliSense)
- [Native Debug](https://open-vsx.org/extension/webfreak/debug) for Debugging with GDB + LLDB in upstream VSCodium. VSLight has no Debug runtime, so this recommendation does not apply to VSLight.

### <a id="python"></a>Python

- [BasedPyright](https://open-vsx.org/extension/detachhead/basedpyright)

### <a id="remote"></a>Remote Development

These upstream VSCodium replacements require Remote runtime support, which VSLight removes.

- [Open Remote - SSH](https://open-vsx.org/extension/jeanp413/open-remote-ssh) (SSH server must be configured with the setting `AllowTcpForwarding yes`.)
- [Open Remote - WSL](https://open-vsx.org/extension/jeanp413/open-remote-wsl)
