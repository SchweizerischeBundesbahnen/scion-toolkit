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
