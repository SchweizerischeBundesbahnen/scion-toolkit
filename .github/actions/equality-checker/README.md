# Equality Checker

Asserts that given input values are equal.

If not equal, this action sets its status to failed, resulting in concurrent actions being cancelled and future actions being skipped. 

## Inputs

### `values`

Comma-separated list of values to be checked for equality. The check is skipped if no values are given.

## Usage

```
  - name: 'Assert versions to be equal'
    uses: ./.github/actions/equality-checker
    with:
      values: |
        '2.0.0-beta.3',
        '2.0.0-beta.3'
```