const core = require('@actions/core');
const github = require('@actions/github');
const {exec} = require('@actions/exec');

(async (): Promise<void> => {
  try {
    const {head_commit: {message}} = github.context.payload;

    const releaseCommitMessagePattern = core.getInput('release-commit-message-pattern');
    const releaseCommitMessagePatternMatch = message.match(new RegExp(`^${releaseCommitMessagePattern}$`, 'm'));
    const isReleaseCommit = releaseCommitMessagePatternMatch != null;

    if (!isReleaseCommit) {
      core.setOutput('is-release-commit', false);
      core.info(`Skip release tag. The commit message does not match the release commit pattern: '${message}'`);
      return;
    }

    const releaseVersion = releaseCommitMessagePatternMatch[1];

    const expectedVersion = core.getInput('expected-version', {required: false});
    if (expectedVersion && expectedVersion !== releaseVersion) {
      core.setFailed(`Version mismatch. Expected version in commit message to be '${expectedVersion}', but was '${releaseVersion}'.`);
      return;
    }

    const gitTag = core.getInput('git-tag') ? core.getInput('git-tag').replace(new RegExp('%v', 'g'), releaseVersion) : releaseVersion;

    core.info(`The commit message maches the release commit pattern. Pushing release tag: ${gitTag}.`);

    // Delete the release tag, if present.
    await exec('git', ['push', 'origin', `:refs/tags/${gitTag}`]);

    // Add the release tag.
    await exec('git', ['tag', gitTag]);

    // Push the release tag.
    await exec('git', ['push', 'origin', 'tag', gitTag]);

    core.setOutput('is-release-commit', true);
    core.setOutput('version', releaseVersion);
    core.setOutput('tag', gitTag);
  }
  catch (error) {
    core.setFailed(error.message);
  }
})();
