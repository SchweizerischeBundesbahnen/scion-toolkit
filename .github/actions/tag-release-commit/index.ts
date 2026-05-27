import {exec} from '@actions/exec';
import {getInput, info, setFailed, setOutput} from '@actions/core';
import {context} from '@actions/github';

void (async (): Promise<void> => {
  try {
    const {head_commit: {message}} = context.payload;

    const releaseCommitMessagePattern = getInput('release-commit-message-pattern');
    const releaseCommitMessagePatternMatch = new RegExp(`^${releaseCommitMessagePattern}$`, 'm').exec((message as string));
    const isReleaseCommit = releaseCommitMessagePatternMatch != null;

    if (!isReleaseCommit) {
      setOutput('is-release-commit', false);
      info(`Skip release tag. The commit message does not match the release commit pattern: '${message}'`);
      return;
    }

    const releaseVersion = releaseCommitMessagePatternMatch[1];

    const expectedVersion = getInput('expected-version', {required: false});
    if (expectedVersion && expectedVersion !== releaseVersion) {
      setFailed(`Version mismatch. Expected version in commit message to be '${expectedVersion}', but was '${releaseVersion}'.`);
      return;
    }

    const gitTag = getInput('git-tag') ? getInput('git-tag').replace(new RegExp('%v', 'g'), releaseVersion) : releaseVersion;

    info(`The commit message maches the release commit pattern. Pushing release tag: ${gitTag}.`);

    // Delete the release tag, if present.
    await exec('git', ['push', 'origin', `:refs/tags/${gitTag}`]);

    // Add the release tag.
    await exec('git', ['tag', gitTag]);

    // Push the release tag.
    await exec('git', ['push', 'origin', 'tag', gitTag]);

    setOutput('is-release-commit', true);
    setOutput('version', releaseVersion);
    setOutput('tag', gitTag);
  }
  catch (error: unknown) {
    setFailed((error as Error).message);
  }
})();
