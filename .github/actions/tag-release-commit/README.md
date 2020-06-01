# Tag Release Commit Action

Adds a release tag to the head commit if its commit message matches the pattern of a release commit. The action uses the version contained in the commit message as tag name. In case of a release commit, the action returns the version as output parameter.

Note:
- This action is idempotent. If the tag already exists, the tag is replaced. 
- This action requires prior Git checkout via `actions/checkout` action.

## Inputs

### `release-commit-message-pattern`

**Required** 
Pattern to identify a release commit. The pattern is interpreted as regular expression. This action expects the release version to be captured in the first capturing group. Default: `release: v(\d+\S+)`.

*Example:*\
If using the pattern `release: v(.*)`, this action identifies a commit with the message `release: v1.2.3` as a release commit, but not a commit with the message `chore: updating license headers`. In the first, the commit is tagged with the tag: `1.2.3`.

## Outputs

### `version`

The release version if a release commit, or empty otherwise.

## Example usage

```
- uses: actions/checkout@v2
- uses: ./.github/actions/tag-release-commit
  with:
    release-commit-message-pattern: 'release: v(.*)'
```
