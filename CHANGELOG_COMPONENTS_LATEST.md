# [18.0.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/components-17.0.0...components-18.0.0) (2024-05-31)


### deps

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



