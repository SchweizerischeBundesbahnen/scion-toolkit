# Vercel Deploy Action

Deploys an application to Vercel (https://vercel.com).

Note:
- The dist folder MUST NOT contain a `vercel.json` file as it is created on the fly. 
- You can specify alias names under which to deploy the application.
- You can reference the application version in alias names using the placeholder `%v`.

## Inputs

### `dist-folder`

**Required** 
The dist folder which to deploy. Must not contain a `vercel.json` file as it is created on the fly.

### `vercel-token`

**Required** 
The Vercel token to log into Vercel to deploy the package.
 
### `org-id`

**Required** 
The ID of the user or team your Vercel project is owned by. 

### `project-id`

**Required** 
The ID of the Vercel project where you want to deploy the application. 

### `aliases`

A comma separated list of aliases under which you want to deploy the application. 

NOTE: 
- Aliases will be ignored if you configured domains on the project.
- If providing a version as action input, you can reference it in alias names using the placeholder `%v`. Example: `your-application-%v`

### `version`

Version that you can reference in an alias name using the `%v` placeholder. Dots are replaced by the dash character. The other characters must be valid URL characters.


### `prod`

Set to create a deployment for production domains specified on the project. Default: `true`.

## Outputs

This action has no outputs.

## Usage

```
- name: Deploy to Vercel
  uses: ./.github/actions/vercel-deploy
  with:
    dist-folder: dist
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    org-id: ${{ secrets.VERCEL_ORG_ID }}
    project-id: ${{ secrets.VERCEL_PROJECT_ID }}
    aliases: your-project, your-project-%v
    version: 2.0.0
```