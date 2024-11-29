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


