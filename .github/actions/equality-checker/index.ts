import {getInput, info, setFailed} from '@actions/core';

void (async (): Promise<void> => {
  try {
    const input = getInput('values') || '';
    if (!input.length) {
      return;
    }

    const values = input.split(',').map(value => value.trim());
    const distinctSet = new Set<string>(values);
    if (distinctSet.size > 1) {
      setFailed(`Expecting all values to be equal, but they were different: ${Array.from(distinctSet).join(', ')}`);
      return;
    }
    info(`Equality check passed. All values are equal to ${Array.from(distinctSet)[0]}.`);
  }
  catch (error: unknown) {
    setFailed((error as Error).message);
  }
})();
