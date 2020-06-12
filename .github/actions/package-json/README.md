# Package JSON

Reads values from the package.json.

## Inputs

### `path`

**Required** 
The path to the `package.json` file.

## Outputs

### `name`

Module name as contained in `package.json`.

### `version`

Module version as contained in `package.json`.


## Example usage

```
  - uses: actions/checkout@v2
  - name: 'Read version of package.json'
    uses: ./.github/actions/package-json
    id: package-json
    with:
      path: package.json
  - run: echo ${{ steps.package-json.outputs.name }}
  - run: echo ${{ steps.package-json.outputs.version }}
```