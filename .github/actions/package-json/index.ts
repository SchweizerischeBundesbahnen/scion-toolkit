const core = require('@actions/core');
const {readFileSync, existsSync} = require('fs');

(async (): Promise<void> => {
  try {
    const packageJsonPath = core.getInput('path', {required: true});
    const {name, version} = readPackageJson(packageJsonPath);

    core.info(`Reading '${packageJsonPath}': { name=${name}, version=${version} }`);
    core.setOutput('name', name);
    core.setOutput('version', version);
  }
  catch (error) {
    core.setFailed(error.message);
  }
})();

function readPackageJson(path: string): any {
  if (!existsSync(path)) {
    throw Error(`Package.json not found: ${path}`);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}
