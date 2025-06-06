# [20.0.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/components-19.3.0...components-20.0.0) (2025-06-06)


### Features

* **components:** add support for Angular 20 ([aab8386](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/aab8386bfad1d4b5dda1fe79687f8c7c61484112))
* **components/sashbox:** allow key-based access to sash sizes ([13a74a8](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/13a74a8018b4e6a3d32deed74036a43ae55fa750))

### Bug Fixes

* **toolkit/observable/bounding-client-rect:** position element only if necessary ([3b97195](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/3b97195e6c201abd0f2c35bb3e1edf4fad1e7a5a))


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
