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

### `expected-version`

Allows specifying the version expected for the release commit. If the specified version and the version of the release commit do not match, then this action sets its status to failed, resulting in concurrent actions being cancelled and future actions being skipped. Has no effect if not a release commit.

### `git-tag`

Name of the Git tag to add to the release commit. You can reference the release version using the placeholder `%v`. If not set, uses the version as tag name.

## Outputs

### `is-release-commit`

True if identified the head commit as release commit, or false otherwise.

### `version`

The release version, or empty if not identified the head commit as release commit.

### `tag`

The release tag, or empty if not identified the head commit as release commit.


## Usage

```
- uses: actions/checkout@v2
- uses: ./.github/actions/tag-release-commit
  with:
    release-commit-message-pattern: 'release: v(.*)'
```
