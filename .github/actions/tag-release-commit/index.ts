const core = require('@actions/core');
const github = require('@actions/github');
const {exec} = require('@actions/exec');

(async (): Promise<void> => {
  try {
    const {head_commit: {message}} = github.context.payload;

    const pattern = core.getInput('release-commit-message-pattern');
    const patternMatch = message.match(new RegExp(`^${pattern}$`, 'm'));
    const isReleaseCommit = patternMatch != null;

    if (!isReleaseCommit) {
      core.info(`Skip release tag. The commit message does not match the release commit pattern: '${message}'`);
      return;
    }

    const releaseVersion = patternMatch[1];
    core.info(`The commit message maches the release commit pattern. Pushing release tag: ${releaseVersion}.`);

    // Delete the release tag, if present.
    await exec('git', ['push', 'origin', `:refs/tags/${releaseVersion}`]);

    // Add the release tag.
    await exec('git', ['tag', releaseVersion]);

    // Push the release tag.
    await exec('git', ['push', 'origin', 'tag', releaseVersion]);

    core.setOutput('version', releaseVersion);
  }
  catch (error) {
    core.setFailed(error.message);
  }
})();
