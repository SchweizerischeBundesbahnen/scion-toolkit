const core = require('@actions/core');

(async (): Promise<void> => {
  try {
    const input = core.getInput('values') || [];
    if (!input.length) {
      return;
    }

    const values = input.split(',').map(value => value.trim());
    const distinctSet = new Set<string>(values);
    if (distinctSet.size > 1) {
      core.setFailed(`Expecting all values to be equal, but they were different: ${Array.from(distinctSet).join(', ')}`);
      return;
    }
    core.info(`Equality check passed. All values are equal to ${Array.from(distinctSet)[0]}.`);
  }
  catch (error) {
    core.setFailed(error.message);
  }
})();
