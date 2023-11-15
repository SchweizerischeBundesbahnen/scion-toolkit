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



