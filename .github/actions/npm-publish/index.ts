import {getInput, getBooleanInput, setFailed, info} from '@actions/core';
import {exec} from '@actions/exec';
import {existsSync, readFileSync, writeFileSync} from 'fs';

void (async (): Promise<void> => {
  try {
    const distFolder = getInput('dist-folder', {required: true});
    const {name, version} = readPackageJson(distFolder);

    if (!name) {
      setFailed(`Failed to publish the package to NPM. Package must have a name in package.json.`);
      return;
    }

    if (!version) {
      setFailed(`Failed to publish the package to NPM. Package must have a version in package.json.`);
      return;
    }

    await publishToNpm({
      npmToken: getInput('npm-token', {required: true}),
      distFolder: distFolder,
      dryRun: getBooleanInput('dry-run'),
      name: name,
      version: version,
    });
  }
  catch (error: unknown) {
    setFailed((error as Error).message);
  }
})();

async function publishToNpm(config: PublishConfig): Promise<void> {
  const {name, version, dryRun, distFolder, npmToken} = config;

  // Write .npmrc to authenticate with NPM registry.
  writeFileSync(`${process.env.HOME}/.npmrc`, `//registry.npmjs.org/:_authToken=${npmToken}`);

  const prerelease = (config.version.includes('alpha') || version.includes('beta') || version.includes('rc'));
  const command: string[] = new Array<string>()
    .concat('publish')
    .concat(...(dryRun ? ['--dry-run'] : [])) // set dry-run mode
    .concat(...(prerelease ? ['--tag', 'next'] : ['--tag', 'latest'])); // set NPM distribution tag

  // Publish
  info(`${dryRun ? '[DRY-RUN]' : ''} Publishing ${name}@${version} package to NPM registry: npm ${command.join(' ')}`);
  await exec(
    'npm', command,
    {cwd: `${process.env.GITHUB_WORKSPACE}/${distFolder}`},
  );
}

function readPackageJson(distFolder: string): {name: string; version: string} {
  const packageJsonPath = `${distFolder}/package.json`;
  if (!existsSync(packageJsonPath)) {
    throw Error(`Failed to publish the package to NPM. Package.json not found in dist-folder: ${distFolder}`);
  }
  return JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {name: string; version: string};
}

interface PublishConfig {
  npmToken: string;
  dryRun: boolean;
  distFolder: string;
  name: string;
  version: string;
}
