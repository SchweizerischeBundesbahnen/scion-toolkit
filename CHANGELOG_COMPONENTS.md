# [20.0.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/components-19.3.0...components-20.0.0) (2025-06-06)


### Features

* **components:** add support for Angular 20 ([aab8386](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/aab8386bfad1d4b5dda1fe79687f8c7c61484112))
* **components/sashbox:** allow key-based access to sash sizes ([13a74a8](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/13a74a8018b4e6a3d32deed74036a43ae55fa750))


### Code Refactoring

* **components/dimension:** remove deprecated `SciDimensionModule` ([70a83a5](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/70a83a55c7b7ee72cc67274b659e2cf86ad93e9f))
* **components/sashbox:** remove deprecated `SciSashboxModule` ([7715537](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/7715537391473cae7b776da50d2f28db55f70914))
* **components/splitter:** remove deprecated `SciSplitterModule` ([7e170fa](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/7e170fa99ac6d0e706c9a2ed48d152da37eaf179))
* **components/throbber:** remove deprecated `SciThrobberModule` ([82f47ff](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/82f47ffa0cfe079964fa065b1cd908abbd312b5e))
* **components/viewport:** remove deprecated `SciViewportModule` ([4c5b6b5](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/4c5b6b5487a9fb6f59e29c3a715ee45fbb561c58))


### BREAKING CHANGES

* **components:** Updating `@scion/components` to Angular 20 introduced a breaking change.
  Update your application to Angular 20. For detailed migration instructions, refer to Angular's update guide: https://v20.angular.dev/update-guide.
 
* **components/dimension:** Removed deprecated `SciDimensionModule`.
  Import the standalone `SciDimensionDirective` instead.
 
* **components/throbber:** Removed deprecated `SciThrobberModule`.
  Import the standalone `SciThrobberComponent` instead.

* **components/splitter:** Removed deprecated `SciSplitterModule`.
  Import the standalone `SciSplitterComponent` instead.

* **components/sashbox:** Removed deprecated `SciSashboxModule`.
  Import the standalone `SciSashboxComponent` and `SciSashDirective` instead.

* **components/viewport:** Removed deprecated `SciViewportModule`.
  Import the standalone `SciViewportComponent` instead. For advanced use cases, it may also be required to import `SciScrollbarComponent` and `SciScrollableDirective`.

* **components/sashbox:** Changed `sashEnd` output of `SciSashboxComponent` from a number array to an object literal.
  The object literal associates the size of a sash with its `SciSashDirective.key`, or its display position (zero-based) if not specified a key. Previously, `sashEnd` emitted a number array with the sash sizes in display order.
  
  To migrate, add the `key` property to the `sciSash` template and read the size of a sash using its key.
  
  Example:
  ```html
  <sci-sashbox (sashEnd)="onSashEnd($event)">
    <ng-template sciSash key="sash1"> // -> Add key property
      Sash 1
    </ng-template>
    <ng-template sciSash key="sash2"> // -> Add key property
      Sash 2
    </ng-template>
  </sci-sashbox>
  ```
  
  ```ts
  public onSashEnd(sizes: {[key: string]: number}): void {
    // Get size of sash 1.
    const sashSize1 = sizes['sash1'];
  
    // Get size of sash 2.
    const sashSize2 = sizes['sash2'];
  }
  ```
* **components/sashbox:** 
  Removed temporary `sashEnd2` output from `SciSashboxComponent`. Use `sashEnd` again instead.


# [19.3.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/components-19.2.1...components-19.3.0) (2025-04-28)


### Features

* **components:** add design tokens for skeleton element states ([53c08f7](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/53c08f76d6021c62fc2efe2a39ebd01177de6039))



## [19.2.1](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/components-19.2.0...components-19.2.1) (2025-04-28)


### Bug Fixes

* **components/sashbox:** prevent style corruption if using the Bootstrap CSS framework ([403679e](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/403679e8b9d08ed5d0d1ad9840b3625e092e84e3))



# [19.2.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/components-19.1.0...components-19.2.0) (2025-03-12)


### Features

* **components/sashbox:** enable sash to slide in and out ([626e59b](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/626e59b5fdf71daafe50773fef1950b2b5280759))



# [19.1.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/components-19.0.0...components-19.1.0) (2025-02-25)


### Features

* **components/sashbox:** enable accessing new sash sizes by key on `sashEnd` ([1b648a7](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/1b648a70778851f57d60ec237384e014ba7420b1))


### Performance Improvements

* **components/splitter:** throttle move event to emit once per animation frame ([a423ce5](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/a423ce569585938ae99a89a651be9f6829b7212c))



# [19.0.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/components-18.1.1...components-19.0.0) (2024-11-29)


### Dependencies

* **components:** update `@scion/components` to Angular 19 ([0918769](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/0918769fa37a77e31cd3fe281e11578399ec437c))


### Performance Improvements

* **components/viewport:** avoid change detection cycle when scrolling the viewport ([402b408](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/402b408b91ba2b7feca76def5289499458d353e4))


### BREAKING CHANGES

* **components:** Updating `@scion/components` to Angular 19 introduced a breaking change.

  To migrate:
  - Update your application to Angular 19; for detailed migration instructions, refer to https://v19.angular.dev/update-guide;
* **components/viewport:** Changed viewport to emit scroll events outside the Angular zone.

  To handle scroll events inside the Angular zone, e.g., if updating component bindings, manually synchronize with the Angular zone, as follows:

  ```ts
  inject(NgZone).run(() => {
    ...
  });
  ```


### Deprecations

* **components:** `SciDimensionModule`, `SciViewportModule`, `SciSashboxModule`, `SciSplitterModule` and `SciThrobberModule` have been deprecated. Import respective standalone components and directives instead. The modules will be removed in a future release.


## [18.1.1](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/components-18.1.0...components-18.1.1) (2024-10-28)


### Performance Improvements

* **components/dimension:** avoid unnecessary change detection cycles ([948061e](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/948061e2382f48fb697b2f639875b1ddc167483c))


### Dependencies

* **components:** SCION Components requires `@scion/toolkit` version `1.6.0` or later.


# [18.1.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/components-18.0.1...components-18.1.0) (2024-10-22)


### Features

* **components/dimension:** provide signal to observe the bounding box of an element ([1d1d804](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/1d1d804c817c9536a69afd89d2f148c4da9ea104))
* **components/dimension:** provide signal to observe the size of an element ([b817e7b](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/b817e7be26ac2beb0b2e9c69d52bf53b657742ef))



## [18.0.1](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/components-18.0.0...components-18.0.1) (2024-10-03)


### Bug Fixes

* **components/sashbox:** ensure sash resizes to minimum size ([e39a347](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/e39a347b9584b077a720d6dd3f6877c4e970b887))
* **components/sashbox:** prevent overflow when moving splitter ([c8a0b57](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/c8a0b57096c28e055cc38f23b756af824afdc424))


### BREAKING CHANGES

* **components:** SCION Components requires `@scion/toolkit` version `1.5.0` or later.


# [18.0.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/components-17.0.0...components-18.0.0) (2024-05-31)


### Dependencies

* **components:** update @scion/components to Angular 18 ([dc202c4](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/dc202c44d6657fcad254946b4574bf9df7769950))


### BREAKING CHANGES

* **components:** Updating `@scion/components` to Angular 18 introduced a breaking change.

  To migrate:
  - Update your application to Angular 18; for detailed migration instructions, refer to https://v18.angular.dev/update-guide;
  - Deprecations introduced in version 16.2.0 have been removed:
    - SCION components now require the SCSS module `@scion/components` to be imported in `styles.scss`. See [SCION Design Tokens](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/blob/master/docs/site/scion-design-tokens.md) for more information. Note that this step is not required if using `@scion/workbench` as imported by the SCION Workbench.
    - CSS variables of `sci-splitter` and `sci-sashbox` components have been replaced as follows:
      - `--sci-splitter-bgcolor` ➜ `--sci-splitter-background-color`
      - `--sci-splitter-bgcolor_hover` ➜ `--sci-splitter-background-color-hover`
      - `--sci-splitter-size_hover` ➜ `--sci-splitter-size-hover`
      - `--sci-splitter-opacity_active` ➜ `--sci-splitter-opacity-active`
      - `--sci-splitter-opacity_hover` ➜ `--sci-splitter-opacity-hover`
      - `--sci-sashbox-splitter-bgcolor` ➜ `--sci-sashbox-splitter-background-color`
      - `--sci-sashbox-splitter-size_hover` ➜ `--sci-sashbox-splitter-size-hover`
      - `--sci-sashbox-splitter-opacity_hover` ➜ `--sci-sashbox-splitter-opacity-hover`
      - `--sci-sashbox-splitter-bgcolor_hover` ➜ `--sci-sashbox-splitter-background-color-hover`
      - `--sci-sashbox-splitter-opacity_active` ➜ `--sci-sashbox-splitter-opacity-active`



# [17.0.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/components-16.2.0...components-17.0.0) (2023-11-15)


### Dependencies

* **components:** update @scion/components to Angular 17 ([ac7f284](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/ac7f28401bbbd76b179cd845929b5f258ffab652)), closes [#174](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/issues/174)


### BREAKING CHANGES

* **components:** Updating `@scion/components` to Angular 17 introduced a breaking change.

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



# [16.2.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/components-16.1.0...components-16.2.0) (2023-10-09)


### Bug Fixes

* **components/viewport:** calculate exact scrollbar size ([7dd929a](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/7dd929a76f14d7b433d5e5fb729c3452d947d41e))


### Features

* **components:** enable theming of SCION components ([e33a358](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/e33a358bfa80b799faf34f1ac6f272f08e007653))


### DEPRECATIONS

* **components:** Theming of SCION components has introduced deprecations that will break in the next major release.

  To migrate:
    - Import the `@scion/components` SCSS module in `styles.scss`. Optionally, pass a configuration to customize the default look of SCION components or to support multiple themes. See [SCION Design Tokens](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/blob/master/docs/site/scion-design-tokens.md) for more information. Note that this step is not required if using `@scion/workbench` as imported by the SCION Workbench.
    - For consistency, following CSS variables for styling the `sci-splitter` and `sci-sashbox` components have been renamed:
      - `--sci-splitter-bgcolor` ➜ `--sci-splitter-background-color`
      - `--sci-splitter-bgcolor_hover` ➜ `--sci-splitter-background-color-hover`
      - `--sci-splitter-size_hover` ➜ `--sci-splitter-size-hover`
      - `--sci-splitter-opacity_active` ➜ `--sci-splitter-opacity-active`
      - `--sci-splitter-opacity_hover` ➜ `--sci-splitter-opacity-hover`
      - `--sci-sashbox-splitter-bgcolor` ➜ `--sci-sashbox-splitter-background-color`
      - `--sci-sashbox-splitter-size_hover` ➜ `--sci-sashbox-splitter-size-hover`
      - `--sci-sashbox-splitter-opacity_hover` ➜ `--sci-sashbox-splitter-opacity-hover`
      - `--sci-sashbox-splitter-bgcolor_hover` ➜ `--sci-sashbox-splitter-background-color-hover`
      - `--sci-sashbox-splitter-opacity_active` ➜ `--sci-sashbox-splitter-opacity-active`
    - Scrollbar-related mixins have been moved to the `@scion/components/scrollbar` SCSS module. Migrate as follows:
  
       **Before:**
       ```scss
       @use '@scion/components' as sci-components;
       @include sci-components.scrollbar-hide-when-inactive()
       @include sci-components.scrollbar-position()
       ```
       **After:**
       ```scss
       @use '@scion/components/scrollbar' as sci-scrollbar;
       @include sci-scrollbar.scrollbar-hide-when-inactive()
       @include sci-scrollbar.scrollbar-position()
       ```



# [16.1.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/components-16.0.0...components-16.1.0) (2023-06-02)


### Features

* **components:** accept passing `undefined` in optional inputs ([aacdda1](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/aacdda16c062c0a7ad9a3b5474a65f5889ff3027))
* **components:** mark required inputs as required ([010008c](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/010008c2dc1ed80be6fb059523fb267d00a778d7))
* **components:** migrate to standalone components ([78be807](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/78be8077a054f594b11cd3d8a1583b67304de529))



# [16.0.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/components-15.0.2...components-16.0.0) (2023-05-15)


### Dependencies

* **components:** update @scion/components to Angular 16 ([f1813e6](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/f1813e6440cc44660e7da8d3a71466cd59ee7c7c)), closes [#151](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/issues/151) [#100](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/issues/100)


### BREAKING CHANGES

* **components:** Updating `@scion/components` to Angular 16 introduced a breaking change.

  To migrate:
  - Update your application to Angular 16; for detailed migration instructions, refer to https://v16.angular.io/guide/update-to-latest-version;
  - Deprecated API for customizing the layout of `sci-viewport` via CSS variables has been removed. Change the following CSS variables to styles of the `sci-viewport::part(content)` pseudo element selector:
    - `--sci-viewport-content-grid-template-columns` -> `grid-template-columns`
    - `--sci-viewport-content-grid-template-rows` -> `grid-template-rows`
    - `--sci-viewport-content-grid-auto-columns` -> `grid-auto-columns`
    - `--sci-viewport-content-grid-auto-rows` -> `grid-auto-rows`
    - `--sci-viewport-content-grid-gap` -> `gap`
  
    #### Migration example:
    **Before**
    ```css
    sci-viewport {
      --sci-viewport-content-grid-template-columns: 1fr 1fr;
      --sci-viewport-content-grid-gap: 1em;
    }
    ```
    **After**
    ```css
    sci-viewport::part(content) {
      grid-template-columns: 1fr 1fr;
      gap: 1em;
    }
    ```



## [15.0.2](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/components-15.0.1...components-15.0.2) (2023-03-29)


### Bug Fixes

* **components/viewport:** display scrollbar only when hovering the viewport ([9f2c6f2](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/9f2c6f2faea567f6aa8091b3194e660d25fccb4a))



## [15.0.1](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/components-15.0.0...components-15.0.1) (2023-03-28)


### Bug Fixes

* **components/viewport:** consider elements as scrolled into view when there is no viewport overflow ([22baab7](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/22baab78c4bdf34caeb99c750079cd415aca046b))
* **components/viewport:** do not throw error when calling `computeOffset` for an element not contained in the viewport ([7177bc7](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/7177bc779e40c76d455d89189cbc533bb630dee7))
* **components/viewport:** do not throw error when calling `isElementInView` for an element not contained in the viewport ([7eeac19](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/7eeac19db86ca232db5e279748851186c4b5b159))
* **components/viewport:** do not throw error when calling `scrollIntoView` for elements not contained in the viewport ([f27a94f](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/f27a94f6ca44798bcf394afb46fac3efd2f5d068))


### BREAKING CHANGES

* **components/viewport:** more tolerant handling of elements not contained in the viewport introduced a breaking change.

  The following methods of `SciViewportComponent` are now more tolerant when invoked for elements that are not contained in the viewport or have `display` style set to `none`.

  - `SciViewportComponent#computeOffset` returns `null` instead of throwing an error.
  - `SciViewportComponent#isElementInView` returns `false` instead of throwing an error.
  - `SciViewportComponent#scrollIntoView` does nothing instead of throwing an error.



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
