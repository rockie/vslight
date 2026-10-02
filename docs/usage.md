<!-- order: 25 -->

# Usage

## Table of Contents

- [VSLight usage changes](#vslight-usage)
   - [Links and browser previews](#vslight-links)
   - [Mermaid diagrams](#vslight-mermaid)
   - [Chat and MCP command-line requests](#vslight-cli)
   - [Native and workbench languages](#vslight-languages)
- [Sign in with GitHub](#signin-github)
- [Accounts authentication](https://github.com/VSCodium/vscodium/blob/master/docs/accounts-authentication.md)
- [How do I run VSCodium in portable mode?](#portable)
- [How do I fix the default file manager?](#file-manager)
- [How do I press and hold a key and have it repeat in VSCodium?](#press-and-hold)
- [How do I open VSCodium from the terminal?](#terminal-support)
   - [From Linux .tar.gz](#from-linux-targz)

## <a id="vslight-usage"></a>VSLight usage changes

The sections below this VSLight section retain upstream VSCodium instructions. VSLight uses the `vslight` command; its data directories and removed features are described in the [migration guide](vslight-migration.md).

Host Chat, MCP, speech and agent-host services are removed. Stored Chat history and MCP configuration are not deleted, but VSLight no longer provides their host access or execution features. Extensions with their own AI implementation may still offer AI features; see [extension compatibility](extensions-compatibility.md#vslight-host-limits).

### <a id="vslight-links"></a>Links and browser previews

Integrated Browser and Simple Browser are removed. Ordinary HTTP(S) and localhost links use the existing external opener, which defaults to the system browser. Registered third-party openers can still handle links. An old Simple Browser opener preference does not restore it; an unmatched opener falls back through the normal external-opening path. Ordinary extension Webviews remain available.

### <a id="vslight-mermaid"></a>Mermaid diagrams

Write a fenced `mermaid` block in Markdown and open the Markdown preview. Use **Open Diagram in Editor** to open a diagram separately, **Reset Pan and Zoom** to reset its position, and **Copy Diagram Source** to copy its original Mermaid text. Diagram source, theme and pan/zoom values survive a normal restart.

Flowchart, sequence, state, ELK, tidy-tree and ZenUML diagrams remain available. Invalid syntax displays an error; long errors wrap in the diagram editor. ZenUML retains its add-on's white canvas in a dark theme.

### <a id="vslight-cli"></a>Chat and MCP command-line requests

The packaged CLI rejects both requests with exit code 1 and a readable message:

```sh
vslight chat
# chat is unavailable in this product.
vslight --add-mcp '{"name":"example","command":"node"}'
# --add-mcp is unavailable in this product.
```

To pass a file named `chat` as a normal file argument, use the explicit argument separator:

```sh
vslight -- chat
```

Ordinary version reporting and extension installation remain available.

### <a id="vslight-languages"></a>Native and workbench languages

The macOS native resources retain English (`en`, `en_GB`), Simplified Chinese (`zh_CN`) and Traditional Chinese (`zh_TW`). Other native languages fall back to English. This applies to native resources; the workbench language-pack mechanism remains available for editor and workbench text. Install a language pack and restart VSLight to apply its workbench language.

## <a id="signin-github"></a>Sign in with GitHub

In VSCodium, `Sign in with GitHub` is using a Personal Access Token.<br />
Follow the documentation https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token to create your token.<br />
Select the scopes dependending on the extension which needs access to GitHub. (GitLens requires the `repo` scope.)

### Linux

If you are getting the error `Writing login information to the keychain failed with error 'The name org.freedesktop.secrets was not provided by any .service files'.`, you need to install the package `gnome-keyring`.

## <a id="portable"></a>How do I run VSCodium in portable mode?
You can follow the [Portable Mode instructions](https://code.visualstudio.com/docs/editor/portable) from the Visual Studio Code website.
- **Windows** / **Linux** : the instructions can be followed as written.
- **macOS** : portable mode is enabled by the existence of a specially named folder. For Visual Studio Code that folder name is `code-portable-data`. For VSCodium, that folder name is `codium-portable-data`. So to enable portable mode for VSCodium on Mac OS, follow the instructions outlined in the [link above](https://code.visualstudio.com/docs/editor/portable), but create a folder named `codium-portable-data` instead of `code-portable-data`.

## <a id="file-manager"></a>How do I fix the default file manager (Linux)?

In some cases, VSCodium becomes the file manager used to open directories (instead of apps like Dolphin or Nautilus).<br />
It's due to that no application was defined as the default file manager and so the system is using the latest capable application.

To set the default app, create the file `~/.config/mimeapps.list` with the content like:
```
[Default Applications]
inode/directory=org.gnome.Nautilus.desktop;
```

You can find your regular file manager with the command:
```
> grep directory /usr/share/applications/mimeinfo.cache
inode/directory=codium.desktop;org.gnome.Nautilus.desktop;
```

## <a id="press-and-hold"></a>How do I press and hold a key and have it repeat in VSCodium (Mac)?

This is a common question for Visual Studio Code and the procedure is slightly different in VSCodium because the `defaults` path is different.

```bash
$ defaults write com.vscodium ApplePressAndHoldEnabled -bool false
```

## <a id="terminal-support"></a>How do I open VSCodium from the terminal?

For macOS and Windows:
- Go to the command palette (View | Command Palette...)
- Choose `Shell command: Install 'codium' command in PATH`.

![](https://user-images.githubusercontent.com/2707340/60140295-18338a00-9766-11e9-8fda-b525b6f15c13.png)

This allows you to open files or directories in VSCodium directly from your terminal:

```bash
~/in-my-project $ codium . # open this directory
~/in-my-project $ codium file.txt # open this file
```

Feel free to alias this command to something easier to type in your shell profile (e.g. `alias code=codium`).

On Linux, when installed with a package manager, `codium` has been installed in your `PATH`.

### <a id="from-linux-targz"></a>From Linux .tar.gz

When the archive `VSCodium-linux-<arch>-<version>.tar.gz` is extracted, run the VSCodium entry point from the extracted directory:

```sh
./bin/codium
```
