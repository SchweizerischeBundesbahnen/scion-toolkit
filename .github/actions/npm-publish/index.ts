const core = require('@actions/core');
const {exec} = require('@actions/exec');
const {readFileSync, writeFileSync, existsSync} = require('fs');

(async (): Promise<void> => {
  try {
    const distFolder = core.getInput('dist-folder', {required: true});
    const {name, version} = readPackageJson(distFolder);

    if (!name) {
      core.setFailed(`Failed to publish the package to NPM. Package must have a name in package.json.`);
      return;
    }

    if (!version) {
      core.setFailed(`Failed to publish the package to NPM. Package must have a version in package.json.`);
      return;
    }

    await publishToNpm({
      npmToken: core.getInput('npm-token', {required: true}),
      distFolder: distFolder,
      dryRun: core.getInput('dry-run') === 'true',
      name: name,
      version: version,
    });
  }
  catch (error) {
    core.setFailed(error.message);
  }
})();

async function publishToNpm(config: PublishConfig): Promise<void> {
  const {name, version, dryRun, distFolder, npmToken} = config;

  // Write .npmrc to authenticate with NPM registry.
  writeFileSync(`${process.env.HOME}/.npmrc`, `//registry.npmjs.org/:_authToken=${npmToken}`);

  const prerelease = (config.version.includes('alpha') || version.includes('beta') || version.includes('rc'));
  const command: string[] = []
    .concat('publish')
    .concat(...(dryRun ? ['--dry-run'] : [])) // set dry-run mode
    .concat(...(prerelease ? ['--tag', 'next'] : ['--tag', 'latest'])); // set NPM distribution tag

  // Publish
  core.info(`${dryRun ? '[DRY-RUN]' : ''} Publishing ${name}@${version} package to NPM registry: npm ${command.join(' ')}`);
  await exec(
    'npm', command,
    {cwd: `${process.env.GITHUB_WORKSPACE}/${distFolder}`},
  );
}

function readPackageJson(distFolder: string): any {
  const packageJsonPath = `${distFolder}/package.json`;
  if (!existsSync(packageJsonPath)) {
    throw Error(`Failed to publish the package to NPM. Package.json not found in dist-folder: ${distFolder}`);
  }
  return JSON.parse(readFileSync(packageJsonPath, 'utf8'));
}

interface PublishConfig {
  npmToken: string;
  dryRun: boolean;
  distFolder: string;
  name: string;
  version: string;
}