# [1.0.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/13.0.0-beta.2...toolkit-1.0.0) (2022-05-17)


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

Below is the changelog of `@scion/toolkit` before the separation.
***


# [13.0.0-beta.2](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/13.0.0-beta.1...13.0.0-beta.2) (2022-03-15)


### Bug Fixes

* **toolkit/bean-manager:** construct eager bean when registering it after started the bean manager ([3511b4b](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/3511b4b381302c1a31eac2562e6d4caaaac68544))
* **toolkit/bean-manager:** prevent registering a bean with `undefined` as value ([8f68cdf](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/8f68cdf56c5e4b60399b8a8d41c70744bc2ec830))
* **toolkit/testing:** time out `ObserveCaptor#waitUntilEmitCount` when not capturing expected emissions in time ([ec8507c](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/ec8507c468e49103e016c9283b827b240aafdb17))


### Features

* **toolkit/bean-manager:** allow using an existing bean as initializer ([efde8b1](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/efde8b18d3b23de8c26b5eb35a4347813e6980bd))
* **toolkit/storage:** allow synchronous retrieval of an item ([eadd8fd](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/eadd8fdb6fe07eb4a057de9198f5a7d0b4fa7117))



# [13.0.0-beta.1](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/12.0.0-beta.3...13.0.0-beta.1) (2022-02-18)


### Dependencies

* **toolkit:** update `@scion/toolkit` to Angular 13 and migrate to RxJS 7.5 ([d9114e2](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/d9114e246d9b05c63a65abb80aaa1a71009b25e8))


### Code Refactoring

* **toolkit/observable:** remove option for disabling native resize observer ([af91803](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/af91803c8781b7212b86b17731277c696023f0e5))


### BREAKING CHANGES

* **toolkit:** Updating `@scion/toolkit` to Angular 13 and RxJS 7.5 introduced a breaking change.

  To migrate:
  - update your application to Angular 13; for detailed migration instructions,
    refer to https://github.com/angular/angular/blob/master/CHANGELOG.md#1321-2022-02-02.
  - migrate your application to RxJS 7.5; for detailed migration instructions,
    refer to https://rxjs.dev/6-to-7-change-summary.


* **toolkit/observable:** Support for disabling the native `ResizeObserver` has been removed because this API is now supported by all major browsers.

  To migrate:
  - remove the `options` parameter when calling `fromDimension$ `.
  - remove the global flag `FromDimension.defaults.useNativeResizeObserver`.



# [12.0.0-beta.3](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/12.0.0-beta.2...12.0.0-beta.3) (2021-12-06)


### Bug Fixes

* **toolkit/viewport:** remove DOM elements instantly after computing the native scrollbar track size ([af28dee](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/af28dee7c797588f69b61fc868558c3f7be5bbe6))


### Features

* **toolkit/splitter:** provide splitter Angular component to control the size of elements next to it ([4cb5afe](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/4cb5afeae990625c3b0269b9ccbc3b44a23081ee))



# [12.0.0-beta.2](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/12.0.0-beta.1...12.0.0-beta.2) (2021-08-31)


### Bug Fixes

* **toolkit/testing:** fix check in `ObserveCaptor` to indicate whether the Observable has failed ([606b47e](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/606b47e60f3c2de5214612d5d27b4ec51f7f8e28))


### Features

* **toolkit:** provide a function to remove undefined entries from a dictionary ([5350a1c](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/5350a1cbdbdfcacd8b4574daee26a3307ae55eca))



# [12.0.0-beta.1](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/11.0.0-beta.12...12.0.0-beta.1) (2021-07-01)


### Chore

* **toolkit:** update @scion/toolkit to Angular 12 ([8331caa](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/8331caa32b83087e9144cf74b6e902e781d2d4ef)), closes [#56](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/issues/56)



# [11.0.0-beta.12](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/11.0.0-beta.11...11.0.0-beta.12) (2021-06-24)


### Bug Fixes

* **ɵtoolkit/accordion:** stretch the accordion header horizontally to its full width ([4f4e152](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/4f4e152cfb43da381f8b557d5add77aa3e30d88c))
* **ɵtoolkit/filter-field:** use unique id to identify the input element ([736e32a](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/736e32af2a9de8fe7cec9e6826c5883fcd57642a))


### Features

* **ɵtoolkit/tabbar:** allow activating a tab programmatically ([6c70831](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/6c708314037d94e5cbd3019100e28b3b5e57d1ba))
* **toolkit/operators:** add `bufferUntil` operator to buffer emissions ([50e365e](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/50e365eb68d660a20af9db09615592c4d55f53ba))
* **toolkit/operators:** add `combineArray` operator to combine Observables contained in the source array ([113a419](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/113a419b24afebe6e67fc97ebd72f5f81cd74b39))
* **toolkit/operators:** add `distinctArray` operator to remove duplicates in the source array ([5a61e1c](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/5a61e1ca566b713298ae3350a93de7a6f348369f))



# [11.0.0-beta.11](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/11.0.0-beta.10...11.0.0-beta.11) (2021-04-26)


### Chore

* **toolkit:** compile with TypeScript strict checks enabled ([0a241d5](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/0a241d526984d855287cfa3e7410460a2cb7fc06)), closes [#42](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/issues/42)



# [11.0.0-beta.10](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/11.0.0-beta.9...11.0.0-beta.10) (2021-03-16)


### Bug Fixes

* **toolkit/testing:** allow to reset the emit count of `ObserveCaptor` ([b2427bf](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/b2427bfb2c7384c157ef73b9e04a56af4df262b4))



# [11.0.0-beta.9](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/11.0.0-beta.8...11.0.0-beta.9) (2021-03-09)


### Bug Fixes

* **toolkit/util:** make the signature of `Arrays.intersect` compatible with strict type checking mode ([21bde13](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/21bde13550ed78c192531f7b88a2651848ffa9c0)), closes [#48](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/issues/48)



# [11.0.0-beta.8](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/11.0.0-beta.7...11.0.0-beta.8) (2021-02-21)


### Bug Fixes

* **ɵtoolkit/accordion:** trigger filled state update on initialization ([7a5402f](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/7a5402f6022a39fa50696e2e49b4dbcec3b14fdd))
* **ɵtoolkit/list:** remove padding to prevent native scrollbars from showing ([5fc6dc1](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/5fc6dc16698dbb2b5942adcec768269f3d5866ef))



# [11.0.0-beta.7](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/11.0.0-beta.6...11.0.0-beta.7) (2021-02-10)


### Features

* **toolkit/util:** support the coercion of Map's from other JavaScript realms ([aea4aa8](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/aea4aa8ce21dac20cb4bb22aeff440f81d6b5b8c))



# [11.0.0-beta.6](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/11.0.0-beta.5...11.0.0-beta.6) (2021-01-15)


### Bug Fixes

* **ɵtoolkit/accordion:** remove viewport from accordion ([ff0aac3](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/ff0aac345cce7c58bebd1b49386c2216929158ba))
* **toolkit/viewport:** render the actual scroll position when an animation completes ([8033a79](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/8033a7947cbde1b84f0f632aaf7bc0d0d7cb3cb0))



# [11.0.0-beta.5](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/11.0.0-beta.4...11.0.0-beta.5) (2021-01-11)


### Features

* **ɵtoolkit/accordion:** allow displaying accordion items in solid instead of speech bubble style ([7d211d3](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/7d211d34f2ded4c9f90869b9f69896435df07d8b))
* **ɵtoolkit/accordion:** provide page object to be used in e2e protractor tests ([c94c14e](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/c94c14e9be6109e0ce7af5277e850d74524a3bcd))
* **ɵtoolkit/filter-field:** allow the user to reset filter text ([29e3fec](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/29e3fec61b9bbf403b3ad1db0bfc08b9aaa88191))
* **ɵtoolkit/filter-field:** enable the filter field for use with the Angular Forms API ([079b00c](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/079b00c1ae13f9c46a35c7c7d306763b7f32e251))
* **ɵtoolkit/theme:** remove the focus glow from disabled input fields ([be9944c](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/be9944c5e610dc20ea6c96b2e6df05624480372d))
* **toolkit/observable:** allow observing an element's position on the screen ([7cbffa1](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/7cbffa1dc17538a0cd197a4d10e5c3ca8bbca2e7))
* **toolkit/viewport:** allow a viewport to grow with its content ([b7f9e0d](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/b7f9e0db350965e836c1a74707ce530ea32887bf))


### BREAKING CHANGES

* **toolkit/viewport:** Changed the `sci-viewport` element to grow with its content. The viewport no longer positions its content absolutely, but in the document element flow instead, allowing the viewport to adapt its size to its content's width and height. This change may be breaking. Please refer to our documentation on how to layout a viewport: https://github.com/SchweizerischeBundesbahnen/scion-toolkit/blob/master/docs/site/tools/viewport.md.

As part of this change, we also had to change the `sci-scrollable` directive's behavior. It no longer positions its host absolutely, but in document element flow instead. You may use this directive for adding the SCION scrollbar to other viewport implementations, such as the `<cdk-virtual-scroll-viewport>` component of Angular CDK. To migrate, add the host to a CSS grid container to fill the remaining space vertically and horizontally.



# [11.0.0-beta.4](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/11.0.0-beta.3...11.0.0-beta.4) (2020-12-17)


### Bug Fixes

* **toolkit/sashbox:** do not form a stacking context barrier on sash content ([ff624fd](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/ff624fd9d10ef0a50d7d269ae286e8dd63c826f7))


### Features

* **ɵtoolkit/checkbox:** allow to query the checked state via page object ([1b0a767](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/1b0a7674f9639bd754c6e708fd7451b4a0aff836))
* **ɵtoolkit/property:** throw an error if the page object is given an invalid element finder ([ca0cb90](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/ca0cb901b53ea321f1842bbe25819d5a6b764e62))
* **ɵtoolkit/tabbar:** provide page object to select a tab in e2e tests ([9538a02](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/9538a021bcd909be91475145c46e168b956d6199))



# [11.0.0-beta.3](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/11.0.0-beta.2...11.0.0-beta.3) (2020-12-09)


### Features

* **ɵtoolkit/filter-field:** allow setting a placeholder text if empty ([0e4d4cf](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/0e4d4cfe0f0aca48ad1f0f967f9b87eb9bf7693a))
* **toolkit/sashbox:** prevent the splitter from overlapping overlays ([6903256](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/69032562f31d4d1ef4d18ac1ed53234dd3adfdef))
* **toolkit/throbber:** provide a throbber to indicate execution of an action ([eca1da9](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/eca1da93b54bcfefd4df808b8cc100155c25f0c9))
* **toolkit/viewport:** allow styling scrollbar and prefix CSS variable names to lay out viewport content ([f91dc1f](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/f91dc1f13a0510bfacd122dff7b58c02e5352af7))


### BREAKING CHANGES

* **toolkit/viewport:** Renamed CSS variables to lay out viewport content.

  To migrate: If customizing the default layout of viewport content, replace the following CSS variables:
  - `--grid-template-columns` -> `--sci-viewport-content-grid-template-columns`
  - `--grid-template-rows` -> `--sci-viewport-content-grid-template-rows`
  - `--grid-auto-columns` -> `--sci-viewport-content-grid-auto-columns`
  - `--grid-auto-rows` -> `--sci-viewport-content-grid-auto-rows`
  - `--gap` -> `--sci-viewport-content-grid-gap`



# [11.0.0-beta.2](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/11.0.0-beta.1...11.0.0-beta.2) (2020-11-17)


### Bug Fixes

* **toolkit:** restrict the toolkit to be compatible with Angular version 11 ([2e603df](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/2e603dffee5182b88fb45c5870d6bd6441e1cc07))



# [11.0.0-beta.1](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/10.0.0-beta.4...11.0.0-beta.1) (2020-11-17)


### chore

* **toolkit:** update @scion/toolkit to Angular 11 ([abfb0e9](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/abfb0e96a25bb765bc1ae6f4f9cf270e8edf3bf0)), closes [#26](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/issues/26)


### BREAKING CHANGES

* **toolkit:** Added support for Angular 11.

  To migrate:
  If using Angular-specific tools, migrate your app to Angular 11 as following:
  - Run `ng update @angular/cli @angular/core @angular/cdk`.
  - Refer to the Angular Update Guide for detailed instructions on how to update Angular: https://update.angular.io



# [10.0.0-beta.4](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/10.0.0-beta.3...10.0.0-beta.4) (2020-11-11)


### Bug Fixes

* **toolkit/testing:** capture error in `ObserveCaptor` ([31d3efe](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/31d3efe7a70e8908d53ee4892dc4f6cafa46bbb5))



# [10.0.0-beta.3](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/10.0.0-beta.2...10.0.0-beta.3) (2020-11-05)


### Bug Fixes

* **toolkit/sashbox:** accept numeric values for sash proportions ([94100ba](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/94100bac33f042e55f83ae4706ab71d81762c537))
* **toolkit/sashbox:** emit sash sizes when resetting the sash layout ([6063078](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/60630788a41b7dc148a4b2193b44abe58ae584f7))
* **toolkit/sashbox:** remove dimension module from imported modules as not used ([76bb850](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/76bb850eac0f9d112dd53d2ff5228bd02c6f2373))
* **toolkit/viewport:** remove dimension module from imported modules as not used ([eef3cf8](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/eef3cf8f0ba4bef4d73beec88d0588c9ab97c3c2))


### Features

* **toolkit/util:** add method to arrays util to get the last element in an array matching a predicate ([2346dc1](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/2346dc1db9bcbf59f186e294718a1240753c8a5f))
* **toolkit/operators:** allow running downstream and upstream operators inside a context ([5074075](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/507407592f91aab170f697e945b012ed50a0f189))
* **toolkit/operators:** deprecate `pluckArray` RxJS operator in favor of the `mapArray` operator ([5c72584](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/5c72584ceb2426e84423e3253596428b251310a6))
* **toolkit/sashbox:** emit sash sizes when finished sashing ([0d28543](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/0d2854345e28732023c836acb07f7ce0455888d0))
* **toolkit/util:** make options object optional in `Arrays.remove` utility ([c87f5fd](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/c87f5fd52a8863020ff7f407602eeebfcf78a9ff))
* **toolkit/storage:** observe changes to items in local and session storage using the WebStorage class ([f435426](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/f4354260a0173c31c3883544c7699504d840b8b7))
* **toolkit/bean-manager:** provide bean manager to look up singleton objects ([bf76eca](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/bf76eca7c74e9e087159d31f0297ff939e2c8f40))



# [10.0.0-beta.2](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/10.0.0-beta.1...10.0.0-beta.2) (2020-08-07)


### Features

* **ɵtoolkit:** allow organizing content in tabs ([98805e0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/98805e083a3e4874ce44ea28ebb6d6c177baa65d)), closes [#10](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/issues/10)



# [10.0.0-beta.1](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/9.0.0-beta.3...10.0.0-beta.1) (2020-07-17)


### Bug Fixes

* **ɵtoolkit:** prefix the version in the URL of the testing application ([885700b](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/885700b899a8432896bdc8d32149c151574df683))


### chore

* update toolkit to Angular 10 ([da15919](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/da15919ecd2e70737a8d4c1ef562690b01245288)), closes [#11](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/issues/11)


### BREAKING CHANGES

* Added support for Angular 10.

  To migrate:
  - if using Angular-specific tools, migrate your app to Angular 10 by running `ng update @angular/cli @angular/core @angular/cdk`.



# [9.0.0-beta.3](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/9.0.0-beta.2...9.0.0-beta.3) (2020-06-12)


### Bug Fixes

* **ɵtoolkit:** allow placing form field labels above ([6220121](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/62201216c37c70b24880c6fe2047846594f3ecfa))
* **ɵtoolkit:** change colors in accent color palette to have a higher contrast ([50d0a40](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/50d0a40c88f397d3c59e1ceedf7a22e37615118e))
* **toolkit:** make sashbox component work with Angular 9 ([8fd97a8](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/8fd97a87da06fac608fa6fdb5844a8d6c50cac74))
* **toolkit:** use dash-case for CSS variables of sci-sashbox component ([0504476](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/0504476899b21454feba91322903e16b5df0f4d2))


### BREAKING CHANGES

* **toolkit:** Renamed CSS variables of sci-sashbox component as following:

  - `--sci-sashbox-splitter_backgroundColor` to `--sci-sashbox-splitter-bgcolor`
  - `--sci-sashbox-splitter_backgroundColorOnHover` to `--sci-sashbox-splitter-bgcolor_hover`
  - `--sci-sashbox-splitter_size` to `--sci-sashbox-splitter-size`
  - `--sci-sashbox-splitter_sizeOnHover` to `--sci-sashbox-splitter-size_hover`
  - `--sci-sashbox-splitter_touchTargetSize` to `--sci-sashbox-splitter-touch-target-size`
  - `--sci-sashbox-splitter_crossAxisSize` to `--sci-sashbox-splitter-cross-axis-size`
  - `--sci-sashbox-splitter_borderRadius` to `--sci-sashbox-splitter-border-radius`
  - `--sci-sashbox-splitter_opacityWhenActive` to `--sci-sashbox-splitter-opacity_active
  - `--sci-sashbox-splitter_opacityOnHover` to `--sci-sashbox-splitter-opacity_hover`



# [9.0.0-beta.2](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/9.0.0-beta.1...9.0.0-beta.2) (2020-06-01)


### Bug Fixes

* publish internal toolkit under `@scion/toolkit.internal` instead of `@scion/~toolkit` ([78a31d7](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/78a31d7cee441fd3dcfdd8eee43c788e3f8241d2))



# 9.0.0-beta.1 (2020-06-01)


### Features

* create scion-toolkit repository with tools from scion-workbench repository ([42571e1](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/42571e1313e00aebbbc0dafd046eb4fa784fab33))



