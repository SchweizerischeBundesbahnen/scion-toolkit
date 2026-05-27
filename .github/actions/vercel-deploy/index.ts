import {exec} from '@actions/exec';
import {writeFileSync} from 'fs';
import {exportVariable, getBooleanInput, getInput, info, setFailed, setSecret} from '@actions/core';

void (async (): Promise<void> => {
  try {
    const distFolder = getInput('dist-folder', {required: true});
    const aliases = parseAliases(getInput('aliases'), getInput('version'));

    // Write vercel.json
    writeFileSync(`${(process.env.GITHUB_WORKSPACE)}/${distFolder}/vercel.json`, JSON.stringify({
      version: 2,
      alias: aliases,
      github: {
        enabled: false,
      },
    }));

    // Link to the project
    const orgId = getInput('org-id', {required: true});
    exportVariable('VERCEL_ORG_ID', orgId);
    setSecret(orgId);

    const projectId = getInput('project-id', {required: true});
    exportVariable('VERCEL_PROJECT_ID', projectId);
    setSecret(projectId);

    // Deploy to Vercel
    const command: string[] = new Array<string>()
      .concat('vercel')
      .concat('--token')
      .concat(getInput('vercel-token', {required: true}))
      .concat('--yes')
      .concat(...(getBooleanInput('prod') ? ['--prod'] : []));

    info(`Deploying ${distFolder} to Vercel: ${command.join(' ')} [aliases=${aliases.join(',')}]`);
    await exec(
      'npx', command,
      {cwd: `${process.env.GITHUB_WORKSPACE}/${distFolder}`},
    );
  }
  catch (error: unknown) {
    setFailed((error as Error).message);
  }
})();

function parseAliases(aliases: string, version: string): string[] {
  if (!aliases) {
    return [];
  }

  const versionEscaped = escapeVersion(version);
  return aliases
    .split(',')
    .map(alias => alias.trim())
    .map(alias => versionEscaped ? alias.replace(new RegExp('%v', 'g'), versionEscaped) : alias);
}

function escapeVersion(version: string): string {
  return version ? version.replace(/[\\.]/g, '-') : version;
}
