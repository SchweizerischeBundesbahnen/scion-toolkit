# NPM Publish Action

Publishes a package to the NPM registry (https://registry.npmjs.org).

If the package contains a prerelease tag in its version (for example, 1.2.3-beta.3), the package distribution tag `next` is set. A prerelease contains either the tag `alpha`, `beta`, or `rc`.

## Inputs

### `dist-folder`

**Required** 
The dist folder which to publish. Must contain a package.json.

### `npm-token`

**Required** 
The NPM token to log into the NPM registry to publish the package. 

### `dry-run`

Whether to perform a dry run without actually publishing the package to the NPM registry. If `true`, `npm publish` is invoked with the `--dry-run` flag set. Default: `false`.

## Outputs

This action has no outputs.

## Example usage

```
- name: Deploy to NPM
  uses: ./.github/actions/npm-publish
  with:
    npm-token: ${{ secrets.NPM_TOKEN }}
    dist-folder: dist
    dry-run: true
```