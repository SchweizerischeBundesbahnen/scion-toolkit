const core = require('@actions/core');
const {exec} = require('@actions/exec');
const {writeFileSync} = require('fs');

(async (): Promise<void> => {
  try {
    const distFolder = core.getInput('dist-folder', {required: true});
    const aliases = parseAliases(core.getInput('aliases'), core.getInput('version'));

    // Write vercel.json
    writeFileSync(`${(process.env.GITHUB_WORKSPACE)}/${distFolder}/vercel.json`, JSON.stringify({
      version: 2,
      alias: aliases,
      github: {
        enabled: false,
      },
    }));

    // Link to the project
    const orgId = core.getInput('org-id', {required: true});
    core.exportVariable('VERCEL_ORG_ID', orgId);
    core.setSecret(orgId);

    const projectId = core.getInput('project-id', {required: true});
    core.exportVariable('VERCEL_PROJECT_ID', projectId);
    core.setSecret(projectId);

    // Deploy to Vercel
    const command: string[] = []
      .concat('vercel')
      .concat('--token')
      .concat(core.getInput('vercel-token', {required: true}))
      .concat('--confirm')
      .concat(...(core.getInput('prod') === 'true' ? ['--prod'] : []));

    core.info(`Deploying ${distFolder} to Vercel: ${command.join(' ')} [aliases=${aliases.join(',')}]`);
    await exec(
      'npx', command,
      {cwd: `${process.env.GITHUB_WORKSPACE}/${distFolder}`},
    );
  }
  catch (error) {
    core.setFailed(error.message);
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