<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| [SCION Toolkit][menu-home] | [Projects Overview][menu-projects-overview] | Changelog | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [Changelog][menu-changelog] > @scion/components


# [15.0.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/components-14.0.2...components-15.0.0) (2022-12-07)


### Dependencies

* **components:** update `@scion/components` to Angular 15 ([2dd75b5](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/2dd75b5e77e19fec95e4b97b846df7bfe3e2ddfb)), closes [#112](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/issues/112)


### BREAKING CHANGES

* **components:** Updating `@scion/components` to Angular 15 introduced a breaking change.

  To migrate:
  - update your application to Angular 15; for detailed migration instructions, refer to https://v15.angular.io/guide/update-to-latest-version;



## [14.0.2](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/components-14.0.1...components-14.0.2) (2022-09-09)


### Bug Fixes

* **components/viewport:** fix offset computation of slotted content ([8e287f0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/8e287f0d2a05eb56bb05b8c59a65f4ef3ae44ee0))



## [14.0.1](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/components-14.0.0...components-14.0.1) (2022-08-26)


### Bug Fixes

* **components/viewport:** focus elements of slotted content via sequential keyboard navigation ([5dd5a5d](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/5dd5a5da1dc2de043489b7fe614400a265eca40b)), closes [#108](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/issues/108)
* **components:** fix resolution of SASS modules when linking the library via `tsconfig` path overrides ([522eba3](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/522eba30d50dd347df4db680da49d1ae27173722))



# [14.0.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/components-13.0.0...components-14.0.0) (2022-08-16)


### Bug Fixes

* **components/sashbox:** allow to reset the size of the sash ([ea2185e](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/ea2185e40afa3c746a1b72c30085b246552d8e09))


### Dependencies

* **components:** update @scion/components to Angular 14 ([1089d2a](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/1089d2aa042759168fe867a47c338edb99593de4)), closes [#96](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/issues/96)


### Features

* **components/viewport:** allow full control over the layout of slotted content ([2c1f714](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/2c1f714e74b2c0eafe04bd9322c0c8b70d2c354b)), closes [#97](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/issues/97)


### BREAKING CHANGES

* **components:** Updating `@scion/components` to Angular 14 introduced a breaking change.

  To migrate:
  - update your application to Angular 14; for detailed migration instructions, refer to https://v14.angular.io/guide/update-to-latest-version;
  - update @scion/components to version 14; for detailed migration instructions, refer to https://github.com/SchweizerischeBundesbahnen/scion-toolkit/blob/master/CHANGELOG_COMPONENTS.md;


### DEPRECATIONS

* **components/viewport:** The flexible definition of the layout of the viewport's slotted content introduced a deprecation.

  The layout of slotted content can now be configured using the `::part(content)` pseudo-element selector instead of custom CSS variables. We have deprecated related CSS variables and will discontinue support in version 15.
  
  To migrate, change the following custom CSS variables to styles of the `sci-viewport::part(content)` pseudo element selector:
  - `--sci-viewport-content-grid-template-columns` ➜ `grid-template-columns`
  - `--sci-viewport-content-grid-template-rows` ➜ `grid-template-rows`
  - `--sci-viewport-content-grid-auto-columns` ➜ `grid-auto-columns`
  - `--sci-viewport-content-grid-auto-rows` ➜ `grid-auto-rows`
  - `--sci-viewport-content-grid-gap` ➜ `gap`

  #### Migration Example:
  
  **Before migration:**
  ```css
  sci-viewport {
    --sci-viewport-content-grid-template-columns: 1fr 1fr;
    --sci-viewport-content-grid-gap: 1em;
  }
  ```
  
  **After migration:**
  ```css
  sci-viewport::part(content) {
    grid-template-columns: 1fr 1fr;
    gap: 1em;
  }
  ```

# [13.0.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/13.0.0-beta.2...components-13.0.0) (2022-05-17)


### Features

* **toolkit:** separate toolkit into `@scion/toolkit` and `@scion/components` ([b8845d1](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/b8845d1aad38f9e1e8c3b4b9ad61966987a6cb75)), closes [#77](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/issues/77)


### BREAKING CHANGES

* **toolkit:** Separating the toolkit into `@scion/toolkit` and `@scion/components` introduced a breaking change.

  #### Migration of framework-agnostic tools
  
  Below is the list of framework-agnostic tools:
  - `@scion/toolkit/bean-manager`
  - `@scion/toolkit/observable`
  - `@scion/toolkit/operators`
  - `@scion/toolkit/storage`
  - `@scion/toolkit/util`
  - `@scion/toolkit/uuid`
  
  To migrate:
  - Install the NPM module `@scion/toolkit` in version `1.0.0` using the following command: `npm install @scion/toolkit --save`. Note that the toolkit was previously released as pre-releases of version `13.0.0` or older.
  
  #### Migration of Angular-specific components and directives
  
  The following Angular-specific tools have been moved from `@scion/toolkit` to `@scion/components`:
  - `@scion/toolkit/dimension`
  - `@scion/toolkit/sashbox`
  - `@scion/toolkit/splitter`
  - `@scion/toolkit/throbber`
  - `@scion/toolkit/viewport`
  
  To migrate:
  - Install the NPM module `@scion/components` in version `13.0.0` using the following command: `npm install @scion/components @scion/toolkit @angular/cdk --save`
  - Search and replace the following imports:
    - `@scion/toolkit/dimension` ➜ `@scion/components/dimension`
    - `@scion/toolkit/sashbox` ➜ `@scion/components/sashbox`
    - `@scion/toolkit/splitter` ➜ `@scion/components/splitter`
    - `@scion/toolkit/throbber` ➜ `@scion/components/throbber`
    - `@scion/toolkit/viewport` ➜ `@scion/components/viewport`
  - If you use the viewport scrollbar in other viewport implementations, such as CDK's virtual scroll viewport, follow these steps:
    - Load SASS mixins as SASS module via the `@use` rule instead of the `@import` rule, as follows:
      - `@import '~@scion/toolkit/viewport/scrollbar';` ➜ `@use '@scion/components' as sci-components;`
    - We have renamed the scrollbar style mixins. See  [viewport description](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/blob/master/docs/site/tools/viewport.md) for a full example. Migrate as follows:
      - `@include hide-scrollbars-when-inactive();` ➜ `@include sci-components.scrollbar-hide-when-inactive();`
      - `@include scrollbar();` ➜ `@include sci-components.scrollbar-position();`



***
**SEPARATION OF @SCION/TOOLKIT INTO @SCION/TOOLKIT@1.0.0 AND @SCION/COMPONENTS@13.0.0**

Previously, framework-agnostic and Angular-specific tools were published as a single NPM package, which often led to confusion and prevented framework-agnostic tools from having a release cycle independent of the Angular project.

Therefore, we have moved Angular-specific components and directives to the NPM package `@scion/components`. It will continue to be versioned according to the Angular major release train. On the other hand, framework-agnostic tools will continue to be released under `@scion/toolkit`, but now starting with version `1.0.0` instead of pre-release versions.

The changelog before the separation into `@scion/toolkit` and `@scion/components` can be found [here](/docs/site/changelog-toolkit/changelog.md).

***

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md
