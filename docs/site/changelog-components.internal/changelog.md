<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| [SCION Toolkit][menu-home] | [Projects Overview][menu-projects-overview] | Changelog | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [Changelog][menu-changelog] > @scion/components.internal

## [19.1.1](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/ɵcomponents-19.0.1...ɵcomponents-19.1.1) (2025-04-28)


### Bug Fixes

* **ɵcomponents/form-field:** do not corrupt `focusin` event when clicking on label ([b9c5f60](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/b9c5f6032099056381a86e760c0f6fd6f4b3e610))
* **ɵcomponents/key-value-field:** capitalize tooltips ([bca1d9c](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/bca1d9cb02263049b580f586d1b741bcefa8c5f5))


### Features

* **ɵcomponents:** replace hover cursor with subtle background color ([5b1cdc1](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/5b1cdc1cbb5b45b0a997525350da38476c373432))



## [19.0.1](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/ɵcomponents-19.0.0...ɵcomponents-19.0.1) (2025-02-25)

### Chore

* **ɵcomponents/key-value-field:** parse entries as `string` dictionary ([f636fde](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/f636fde5df16b7589d2a73e2bec5e8c74a37774c))

# [19.0.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/ɵcomponents-18.0.1...ɵcomponents-19.0.0) (2024-11-29)


### Dependencies

* **components:** update `@scion/components` to Angular 19 ([0918769](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/0918769fa37a77e31cd3fe281e11578399ec437c))


### BREAKING CHANGES

* **components:** Updating `@scion/components` to Angular 19 introduced a breaking change.

  To migrate:
  - Update your application to Angular 19; for detailed migration instructions, refer to https://v19.angular.dev/update-guide;



## [18.0.1](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/ɵcomponents-18.0.0...ɵcomponents-18.0.1) (2024-10-03)


### Bug Fixes

* **ɵcomponents/keyvalue:** support `null` properties ([7949ae5](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/7949ae5598858f07076788d21c1ac8c1e48f57b5))



# [18.0.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/ɵcomponents-17.0.0...ɵcomponents-18.0.0) (2024-05-31)


### Dependencies

* **ɵcomponents:** update @scion/components.internal to Angular 18 ([2a53650](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/2a5365070f31e6be0a3b4e9665cd2e34a252b495))


### BREAKING CHANGES

* **ɵcomponents:** Updating `@scion/components.internal` to Angular 18 introduced a breaking change.

  To migrate:
  - Update your application to Angular 18; for detailed migration instructions, refer to https://v18.angular.dev/update-guide;



# [17.0.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/ɵcomponents-16.3.1...ɵcomponents-17.0.0) (2023-11-15)


### Bug Fixes

* **ɵcomponents/design:** do not unset the default appearance of input elements ([4c0a170](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/4c0a1706abe6b46e85ac49f36fedbbcd5f5dbb20))
* **ɵcomponents/design:** use correct background color for menu options of `<select>` HTML element ([a2e4e14](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/a2e4e14e2d5476214c97d3a06d938cdd5435eb82))


### Dependencies

* **ɵcomponents:** update @scion/components.internal to Angular 17 ([ac7f284](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/ac7f28401bbbd76b179cd845929b5f258ffab652)), closes [#174](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/issues/174)


### BREAKING CHANGES

* **ɵcomponents:** Updating `@scion/components.internal` to Angular 17 introduced a breaking change.

  To migrate:
  - Update your application to Angular 17; for detailed migration instructions, refer to https://v17.angular.io/guide/update-to-latest-version;
  - Scrollbar-related mixins have been moved to the `@scion/components/scrollbar` SCSS module; migrate as follows:

    Before migration:
    ```scss
    @use '@scion/components' as sci-components;
    @include sci-components.scrollbar-hide-when-inactive();
    @include sci-components.scrollbar-position();
    ```
    After migration:
    ```scss
    @use '@scion/components/scrollbar' as sci-scrollbar;
    @include sci-scrollbar.scrollbar-hide-when-inactive();
    @include sci-scrollbar.scrollbar-position();
    ```



## [16.3.1](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/ɵcomponents-16.3.0...ɵcomponents-16.3.1) (2023-10-23)


### Bug Fixes

* **ɵcomponents/list:** support for custom padding of list items ([719c627](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/719c627b9b93f636b90d8f88cd081cc77b3d5229))
* **ɵcomponents/qualifier-chip-list:** support for custom background color ([a7f58d3](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/a7f58d3e990795fbd5dea2e0ad78497fd5fbb2aa))
* **ɵcomponents/tabbar:** ensure tabbar grows with tab content until encountering a layout constraint ([f899d3c](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/f899d3ca0d072917207c0c8856f14b4f00822251))



# [16.3.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/ɵcomponents-16.2.0...ɵcomponents-16.3.0) (2023-10-09)


### Features

* **ɵcomponents:** enable theming of SCION components ([e33a358](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/e33a358bfa80b799faf34f1ac6f272f08e007653))
* **ɵcomponents:** add toggle button component ([6fc9edb](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/6fc9edb6bee2ab9e3ecf2b535d1c68d1332b9f68))


# [16.2.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/ɵcomponents-16.1.1...ɵcomponents-16.2.0) (2023-07-19)


### Code Refactoring

* **ɵcomponents:** remove `NgModules` because components are standalone ([217101c](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/217101cb7d627fa4d57d25917ea41076b8d37aee))
* **ɵcomponents:** rename `SciParamsEnterComponent` to `SciKeyValueFieldComponent` ([b591d30](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/b591d30246523e8cd6d469dcf71a4920b714a443))
* **ɵcomponents:** rename `SciPropertyComponent` to `SciKeyValueComponent` ([fec29be](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/fec29be4576f31b7ed43c60a3f88fcf0b8e05178))


### BREAKING CHANGES

* **ɵcomponents:** Renaming `SciParamsEnterComponent` introduced a breaking change.

  To migrate:
  - Import `SciKeyValueFieldComponent` instead of `SciParamsEnterComponent`
  - Change input from `paramsFormArray` to `keyValueFormArray`
  - Use `SciParamsEnterComponent#toMap` instead of `SciParamsEnterComponent#toParamsMap`
  - Use `SciParamsEnterComponent#toDictionary` instead of `SciParamsEnterComponent#toParamsDictionary`

* **ɵcomponents:** Renaming `SciPropertyComponent` introduced a breaking change.

  To migrate:
  - Import `SciKeyValueComponent` instead of `SciPropertyComponent`
  - Change input from `properties` to `object`

* **ɵcomponents:** Removing `NgModules` introduced a breaking change.
  
  To migrate, import the components instead of the modules.



## [16.1.1](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/ɵcomponents-16.1.0...ɵcomponents-16.1.1) (2023-06-14)


### Bug Fixes

* **ɵcomponents/accordion:** stretch header content to full width ([7032730](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/7032730f1d3cc984a0b5983a06933a522b8132b0))



# [16.1.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/ɵcomponents-16.0.0...ɵcomponents-16.1.0) (2023-06-02)


### Bug Fixes

* **ɵcomponents:** include all SASS files, but only if they are not contained in the directory /@scion/ or its subdirectories ([7fc0eb0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/7fc0eb0632932a4cd1683ebe94a8d93717f5dcbe))


### Features

* **ɵcomponents:** accept passing `undefined` in optional inputs ([9fc3b12](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/9fc3b128db56bbf58483b72feeff733357986c82))
* **ɵcomponents:** mark required inputs as required ([71264fa](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/71264faf6ae074b47127beee993e4615b9fa2fa8))
* **ɵcomponents:** migrate to standalone components ([eb79b56](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/eb79b56c8109b9dbc3276963f761977bc982a62f))



# [16.0.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/ɵcomponents-15.0.1...ɵcomponents-16.0.0) (2023-05-15)


### Dependencies

* **ɵcomponents:** update `@scion/components.internal` to Angular 16 ([f1813e6](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/f1813e6440cc44660e7da8d3a71466cd59ee7c7c)), closes [#151](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/issues/151)


### Features

* **ɵcomponents:** improve accessibility of internal components ([5555800](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/5555800704ea9f67dd90d931714972caeecad52a))


### BREAKING CHANGES

* **ɵcomponents:** Updating `@scion/components.internal` to Angular 16 introduced a breaking change.

  To migrate:
  - Update your application to Angular 16; for detailed migration instructions, refer to https://v16.angular.io/guide/update-to-latest-version;



## [15.0.1](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/ɵcomponents-15.0.0...ɵcomponents-15.0.1) (2023-04-19)


### Bug Fixes

* **ɵcomponents/filter-field:** do not stop propagation of mouse events ([87cac1f](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/87cac1fc17ce84514def805d250acabe87db513f))
* **ɵcomponents/filter-field:** ignore keyboard event if its target is equal to the input element ([fe04fd1](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/fe04fd199e32923ba71ee8eafd61bba8fd398dc2))



# [15.0.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/ɵcomponents-14.0.1...ɵcomponents-15.0.0) (2022-12-07)


### Dependencies

* **ɵcomponents:** update `@scion/components.internal` to Angular 15 ([2dd75b5](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/2dd75b5e77e19fec95e4b97b846df7bfe3e2ddfb)), closes [#112](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/issues/112)


### BREAKING CHANGES

* **ɵcomponents:** Updating `@scion/components.internal` to Angular 15 introduced a breaking change.

  To migrate:
  - update your application to Angular 15; for detailed migration instructions, refer to https://v15.angular.io/guide/update-to-latest-version;



## [14.0.1](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/ɵcomponents-14.0.0...ɵcomponents-14.0.1) (2022-09-09)


### Bug Fixes

* **ɵcomponents/params-enter:** make title optional ([744f9e2](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/744f9e2fae5ec2fad1795973bd876fb0355a8ea8))
* **ɵcomponents:** fix resolution of SASS modules when linking the library via `tsconfig` path overrides ([bc63340](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/bc6334038a398f650ffecca9d7280ad04e089e0f))



# [14.0.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/ɵcomponents-13.0.1...ɵcomponents-14.0.0) (2022-08-16)


### Dependencies

* **ɵcomponents:** update @scion/components.internal to Angular 14 ([1089d2a](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/1089d2aa042759168fe867a47c338edb99593de4)), closes [#96](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/issues/96)


### BREAKING CHANGES

* **ɵcomponents:** Updating `@scion/components.internal` to Angular 14 introduced a breaking change.

  To migrate:
  - update your application to Angular 14; for detailed migration instructions, refer to https://v14.angular.io/guide/update-to-latest-version;
  - update @scion/components to version 14; for detailed migration instructions, refer to https://github.com/SchweizerischeBundesbahnen/scion-toolkit/blob/master/CHANGELOG_COMPONENTS.md;
  - update @scion/components.internal to version 14; for detailed migration instructions, refer to https://github.com/SchweizerischeBundesbahnen/scion-toolkit/blob/master/CHANGELOG_COMPONENTS_INTERNAL.md;


## [13.0.1](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/ɵcomponents-13.0.0...ɵcomponents-13.0.1) (2022-05-18)


### Bug Fixes

* **ɵcomponents:** add Protractor as optional peer dependency as used by page objects ([ac7cd26](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/ac7cd26466dcaffedbf2796d163674d8f528b837))



# [13.0.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/13.0.0-beta.2...ɵcomponents-13.0.0) (2022-05-17)


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
