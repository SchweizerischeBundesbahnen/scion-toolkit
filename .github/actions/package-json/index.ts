import {existsSync, readFileSync} from 'fs';
import {getInput, setOutput, info, setFailed} from '@actions/core';

void (async (): Promise<void> => {
  try {
    const packageJsonPath = getInput('path', {required: true});
    const {name, version} = readPackageJson(packageJsonPath);

    info(`Reading '${packageJsonPath}': { name=${name}, version=${version} }`);
    setOutput('name', name);
    setOutput('version', version);
    setOutput('version-dasherized', dasherizedVersion(version));
  }
  catch (error: unknown) {
    setFailed((error as Error).message);
  }
})();

function readPackageJson(path: string): {name: string; version: string} {
  if (!existsSync(path)) {
    throw Error(`Package.json not found: ${path}`);
  }
  return JSON.parse(readFileSync(path, 'utf8')) as {name: string; version: string};
}

function dasherizedVersion(version: string): string {
  return version ? version.replace(/[\\.]/g, '-') : version;
}
