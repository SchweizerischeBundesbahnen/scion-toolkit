<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| [SCION Toolkit][menu-home] | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | Contributing | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## Contributing
We encourage other developers to join the project and contribute to making SCION products constantly better and more stable. If you are missing a feature, please create a feature request so we can discuss it and coordinate further development. To report a bug, please check existing issues first, and if found, leave a comment on the issue. Otherwise, file a bug or create a pull request with a proposed fix.

<details>
  <summary><strong>Submitting a Pull Request</strong></summary>
  <br>

This section explains how to submit a pull request.

1. Login to your GitHub account and fork the `SchweizerischeBundesbahnen/scion-toolkit` repo.
1. Make your changes in a new Git branch. Name your branch in the form `issue/123` with `123` as the related GitHub issue number. Before submitting the pull request, please make sure that you comply with our coding and commit guidelines.
1. Run the command `npm run before-push` to make sure that the project builds, passes all tests, and has no lint violations. Alternatively, you can also run the commands one by one, as following:
  - `npm run test:headless`\
    Runs all unit tests.
  - `npm run e2e:headless`\
    Runs all e2e tests.
  - `npm run lint`\
    Lints all project files.
  - `npm run build`\
    Builds the project and related artifacts.
1. Commit your changes using a descriptive commit message that follows our commit guidelines.
1. Before submitting the pull request, ensure to have rebased your branch based on the master branch as we stick to the rebase policy to keep the repository history linear.
1. Push your branch to your fork on GitHub. In GitHub, send a pull request to `scion-toolkit:master`.
1. If we suggest changes, please amend your commit and force push it to your GitHub repository.

> When we receive a pull request, we will carefully review it and suggest changes if necessary. This may require triage and several iterations. Therefore, we kindly ask you to discuss proposed changes with us in advance via the GitHub issue.

</details>

<details>
  <summary><strong>Development</strong></summary>
  <br>

Make sure to use Node.js version 22.16.0 for contributing to SCION. We suggest using [Node Version Manager](https://github.com/nvm-sh/nvm) if you need different Node.js versions for other projects.

For development, you can uncomment the section `PATH-OVERRIDE-FOR-DEVELOPMENT` in `tsconfig.json`. This allows running tests or serving applications without having to build dependent modules first.

The following is a summary of commands useful for development of `scion-toolkit`. See file `package.json` for a complete list of available NPM scripts.

### Commands for working on the @scion/components library

- **`npm run components:lint`**\
  Lints *@scion/components* library.

- **`npm run components:build`**\
  Builds *@scion/components* library.

- **`npm run components:test`**\
  Runs unit tests of *@scion/components* library.

- **`npm run components:e2e:run`**\
  Runs end-to-end tests of the *@scion/components* library. Prior to test execution, starts the testing app `components-testing-app`.

- **`npm run components:e2e:debug`**\
  Runs end-to-end tests of the *@scion/components* library in debug mode. Prior to test execution, starts the testing app `components-testing-app`.

- **`npm run components:changelog`**\
  Generates the changelog for *@scion/components* based on the commit history. The output is written to `CHANGELOG_COMPONENTS.md`, which will be included in `docs/site/changelog-components/changelog/changelog.md`.

### Commands for working on the @scion/toolkit library

- `npm run toolkit:lint`\
  Lints *@scion/toolkit* library.

- `npm run toolkit:build`\
  Builds *@scion/toolkit* library.

- `npm run toolkit:test`\
  Runs unit tests of *@scion/toolkit* library.

- `npm run toolkit:changelog`\
  Generates the changelog for *@scion/toolkit* based on the commit history. The output is written to `CHANGELOG_TOOLKIT.md`, which will be included in `docs/site/changelog-toolkit/changelog/changelog.md`.

### Commands for working on the @scion/components.internal library

- `npm run components.internal:lint`\
  Lints *@scion/components.internal* library.

- `npm run components.internal:build`\
  Builds *@scion/components.internal* library.

- `npm run components.internal:test`\
  Runs unit tests of *@scion/components.internal* library.

- `npm run components.internal:changelog`\
  Generates the changelog for *@scion/components.internal* based on the commit history. The output is written to `CHANGELOG_COMPONENTS_INTERNAL`, which will be included in `docs/site/changelog-components.internal/changelog/changelog.md`.

### Commands for working on the components application

- `npm run components-app:serve` or `npm run start`\
  Serves the components app on [http://localhost:4200](http://localhost:4200).\
  Uncomment the section `PATH-OVERRIDE-FOR-DEVELOPMENT` in `tsconfig.json` to have hot module reloading support.

- `npm run components-app:build`\
  Builds the components app into `dist` folder using the productive config.

- `npm run components-app:lint`\
  Lints the components app.

### Command for building GitHub Actions

- `run-s github-actions:*:build`\
  Generates GitHub Actions that are used in SCION projects.

</details>

<details>
  <summary><strong>Code Formatting</strong></summary>
  <br>

To ensure consistency within our code base, please use the following formatting settings.

- **For IntelliJ IDEA**\
  Import the code style settings of `.editorconfig.intellij.xml` located in the project root.

- **For other IDEs**\
  Import the code style settings of `.editorconfig` located in the project root.

</details>

<details>
  <summary><strong>Coding Guidelines</strong></summary>
  <br>

In additional to the linting rules, we have the following conventions:

- We believe in the [Best practices for a clean and performant Angular application](https://medium.freecodecamp.org/best-practices-for-a-clean-and-performant-angular-application-288e7b39eb6f) and the [Angular Style Guide](https://angular.io/guide/styleguide).
- We expect line endings to be Unix style (LF) only. Please check your Git settings to not convert line endings to CRLF. You can run the following command to find files with `windows-style` line endings: `find . -type f | xargs file | grep CRLF`.
- Observable names are suffixed with the dollar sign (`$`) to indicate that it is an `Observable` which we must subscribe to and unsubscribe from.
- We use explicit public and private visibility modifiers (except for constructors) to make the code more explicit.
- We prefix private members with an underscore.
- We write each RxJS operator on a separate line, except when piping a single RxJS operator. Then, we write it on the same line as the pipe method.
- We avoid nested RxJS subscriptions.
- We document all public API methods, constants, functions, classes or interfaces.
- We structure the CSS selectors in CSS files similar to the structure of the companion HTML file and favor the direct descendant selector (`>`) over the non-restrictive descendant selector (` `), except if there are good reasons not to do it. This gives us a visual by only reading the CSS file.
- When referencing CSS classes from within E2E tests, we always prefix them with `e2e-`. We never reference e2e prefixed CSS classes in stylesheets.

</details>

<details>
  <summary><strong>Commit Guidelines</strong></summary>
  <br>

We believe in a compact and well written Git commit history. Every commit should be a logically separated changeset. We use the commit messages to generate the changelog.

Each commit message consists of a **header**, a **summary** and a **footer**. The header has a special format that includes a **type**, an optional **scope**, and a **subject**, as following:

```
<type>(<scope>): <subject>

[optional summary]

[optional footer]
```

<details>
  <summary><strong>Type</strong></summary>

- `feat`: new feature
- `fix`: bug fix
- `docs`: changes to the documentation
- `refactor`: changes that neither fixes a bug nor adds a feature
- `perf`: changes that improve performance
- `test`: adding missing tests, refactoring tests; no production code change
- `chore`: other changes like formatting, updating the license, removal of deprecations, etc
- `deps`: changes related to updating dependencies
- `ci`: changes to our CI configuration files and scripts
- `revert`: revert of a previous commit
- `release`: publish a new release
</details>

<details>
  <summary><strong>Scope</strong></summary>

The scope should be the name of the NPM package affected by the change. Optionally, you can also add the secondary entry point, separated by a forward slash.

- `toolkit`: If the change affects the `@scion/toolkit` NPM package.
- `toolkit/<module>`: If the change affects the `@scion/toolkit/<module>` entry point.
- `components`: If the change affects the `@scion/components` NPM package.
- `components/<module>`: If the change affects the `@scion/components/<module>` entry point.
- `ɵcomponents`: If the change affects the `@scion/components.internal` NPM package. We use the Theta (`ɵ`) symbol to have a shorter scope name.
- `ɵcomponents/<module>`: If the change affects the `@scion/components.internal/<module>` entry point.
- `components-app`: If the change affects the demo app for `@scion/components`.
- `components-testing-app`: If the change affects the testing app for `@scion/components` or `@scion/components.internal`.

</details>


<details>
  <summary><strong>Subject</strong></summary>

The subject contains a succinct description of the change and follows the following rules:
- written in the imperative, present tense ("change" not "changed" nor "changes")
- starts with a lowercase letter
- has no punctuation at the end
</details>

<details>
  <summary><strong>Summary</strong></summary>

The summary describes the change. You can include the motivation for the change and contrast this with previous behavior.
</details>

<details>
  <summary><strong>Footer</strong></summary>

In the footer, reference the GitHub issue and optionally close it with the `Closes` keyword, as following:

```
closes #123
```

And finally, add notes about breaking changes, if there are any. Breaking changes start with the keyword `BREAKING CHANGE: `. The rest of the commit message is then used to describe the breaking change and should contain information about the migration.

```
BREAKING CHANGE: Removed deprecated API for xy.

To migrate:
- do xy
- do xy
  ```
</details>

</details>


<details>
  <summary><strong>Deprecation Policy</strong></summary>
  <br>

You can deprecate API in any version. However, it will still be present in the next major release. Removal of deprecated API will occur only in a major release.

When deprecating API, mark it with the `@deprecated` JSDoc comment tag and include the current library version. Optionally, you can also specify which API to use instead, as following:

```ts
/**
 * @deprecated since version 2.0. Use {@link otherMethod} instead.
 */
function someMethod(): void {
}

```  

</details>

<details>
  <summary><strong>Deployments</strong></summary>
  <br>

We deploy our documentations and applications to [Vercel](https://vercel.com). Vercel is a cloud platform for static sites and serverless functions. Applications are deployed using the SCION collaborator account (scion.collaborator@gmail.com) under the [SCION](https://vercel.com/scion) scope.

We have the following toolkit related deployments:

| Deployment             | Vercel Project                            | URL                                 |
|------------------------|-------------------------------------------|-------------------------------------|
| Components Application | https://vercel.com/scion/scion-components | https://components.scion.vercel.app |

</details>

<details>
  <summary><strong>NPM Packages</strong></summary>
  <br>

We publish our packages to the [NPM registry](https://www.npmjs.com/). Packages are published using the SCION collaborator account (scion.collaborator) under the [SCION](https://www.npmjs.com/org/scion) organization.

We have the following toolkit related packages:
- https://www.npmjs.com/package/@scion/toolkit
- https://www.npmjs.com/package/@scion/components
- https://www.npmjs.com/package/@scion/components.internal

</details>

<details>
  <summary><strong>Versioning</strong></summary>
  <br>  

Releases of SCION Toolkit are versioned according to the SemVer (Semantic Versioning) versioning scheme.

**Major Version:**\
Major versions contain breaking changes.

**Minor Version**\
Minor versions add new features or deprecate existing features without breaking changes.

**Patch Level**\
Patch versions fix bugs or optimize existing features without breaking changes.

> The module `@scion/components` is based on the Angular framework and thus follows the major versions of Angular, i.e., when Angular releases a new major version, we will also release a new major version compatible with that Angular version.

</details>

<details>
  <summary><strong>Release Checklist for @scion/toolkit and related artifacts</strong></summary>

Instructions for releasing the `@scion/toolkit` module.

1. Update `/projects/scion/toolkit/package.json` with the new version.
2. Run `npm run toolkit:changelog` to generate the changelog. Then, review the generated changelog carefully and correct typos and formatting errors, if any.
3. Commit the changed files using the following commit message: `release(toolkit): vX.X.X`. Replace `X.X.X` with the current version. Later, when merging the branch into the master branch, a commit message of this format triggers the release action in our [GitHub Actions workflow][link-github-actions-workflow].
4. Push the commit to the branch `release/toolkit-X.X.X` and submit a pull request to the master branch. Replace `X.X.X` with the current version.
5. When merged into the master branch, the release action in our [GitHub Actions workflow][link-github-actions-workflow] does the following:
  - Creates a Git release tag
  - Publishes `@scion/toolkit` package to NPM (https://www.npmjs.com/package/@scion/toolkit)
  - Creates a release on GitHub (https://github.com/SchweizerischeBundesbahnen/scion-toolkit/releases)

</details>

<details>
  <summary><strong>Release Checklist for @scion/components and related artifacts</strong></summary>

Instructions for releasing the `@scion/components` module.

1. Update `/projects/scion/components/package.json` with the new version.
2. Run `npm run components:changelog` to generate the changelog. Then, review the generated changelog carefully and correct typos and formatting errors, if any.
3. Commit the changed files using the following commit message: `release(components): vX.X.X`. Replace `X.X.X` with the current version. Later, when merging the branch into the master branch, a commit message of this format triggers the release action in our [GitHub Actions workflow][link-github-actions-workflow].
4. Push the commit to the branch `release/components-X.X.X` and submit a pull request to the master branch. Replace `X.X.X` with the current version.
5. When merged into the master branch, the release action in our [GitHub Actions workflow][link-github-actions-workflow] does the following.
  - Creates a Git release tag
  - Publishes `@scion/components` package to NPM (https://www.npmjs.com/package/@scion/components)
  - Creates a release on GitHub (https://github.com/SchweizerischeBundesbahnen/scion-toolkit/releases)
  - Deploys following apps to Vercel:
     - https://components.scion.vercel.app
     - https://components-vX-X-X.scion.vercel.app

</details>

<details>
  <summary><strong>Release Checklist for @scion/components.internal and related artifacts</strong></summary>

Instructions for releasing the `@scion/components.internal` module.

1. Update `/projects/scion/components.internal/package.json` with the new version.
2. Run `npm run components.internal:changelog` to generate the changelog. Then, review the generated changelog carefully and correct typos and formatting errors, if any.
3. Commit the changed files using the following commit message: `release(ɵcomponents): vX.X.X`. Replace `X.X.X` with the current version. Later, when merging the branch into the master branch, a commit message of this format triggers the release action in our [GitHub Actions workflow][link-github-actions-workflow].
4. Push the commit to the branch `release/ɵcomponents-X.X.X` and submit a pull request to the master branch. Replace `X.X.X` with the current version.
5. When merged into the master branch, the release action in our [GitHub Actions workflow][link-github-actions-workflow] creates a Git release tag, publishes the package to NPM, and deploys related applications.
6. Verify that:
  - `@scion/components.internal` is published to: https://www.npmjs.com/package/@scion/components.internal.
  - `Components App` is deployed to: https://components.scion.vercel.app and https://components-vX-X-X.scion.vercel.app.

</details>

[link-github-actions-workflow]: https://github.com/SchweizerischeBundesbahnen/scion-toolkit/actions

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md
