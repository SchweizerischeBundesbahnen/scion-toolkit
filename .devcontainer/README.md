# Development container

This container includes Node.js 26.3.0 (matching CI), OpenCode V2, Git, ripgrep, jq, and the Linux dependencies for the repository's Chromium-based tests. Setup runs `npm ci`, including the repository's Playwright browser installation. Tests default to headless mode.

## Start

1. Start Docker and install the VS Code **Dev Containers** extension (`ms-vscode-remote.remote-containers`).
2. Open this repository and run **Dev Containers: Reopen in Container** from the command palette.
3. Wait for dependency installation, then open a terminal in the container:

   ```sh
   opencode
   ```

4. Run `/connect` in OpenCode to sign in to your model provider.

OpenCode's configuration, credentials, and session data live in container-specific Docker volumes and survive container rebuilds. To install a specific OpenCode release, change `OPENCODE_VERSION` in `devcontainer.json` and rebuild the container; the default installs the latest release at image build time.

The repository is bind-mounted, so agent edits appear in your local checkout. `node_modules` uses a separate Docker volume so Linux dependencies and browser binaries do not mix with host installations. Commands run as the `node` user, which has sudo access for installing development tools.

## Build and test

With the default `tsconfig.json`, build the libraries before serving apps or running tests:

```sh
npm run toolkit:build
npm run components:build
npm run components.internal:build
```

Alternatively, enable the development path overrides described in the Development section of [CONTRIBUTING.md](../CONTRIBUTING.md).

```sh
npm run lint
npm run test:headless -- --no-watch
npm run e2e:headless
```

For the complete pre-push checks, run `npm run before-push` with the default TypeScript paths.

## Preview an app

```sh
npm run components-app:serve -- --host 0.0.0.0
```

Open the forwarded port 4200. Ports 4300 and 4400 are also forwarded for the E2E test apps. Stop the preview server before running E2E tests, which start their own app on port 4200.

The container sets `NODE_OPTIONS=--dns-result-order=ipv4first` so Angular's default `localhost` listener works with IDE forwarding that connects over IPv4, including IntelliJ. Rebuild the container after changing its environment settings. To fix an already-running container immediately, stop the app and start it again with an explicit host:

```sh
npm run components-testing-app:serve -- --host 0.0.0.0
```

After dependency changes, run `npm ci` again. If Playwright was upgraded, also run `npx --no-install playwright install-deps chromium` to update its Linux dependencies.
