# [22.6.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/components-22.5.0...components-22.6.0) (2026-11-04)


### Features

* **components/table:** provide enum column to display values of an enumeration ([60caa19](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/60caa193ceb0f42627f5d8384e5e83a6cf5f0722))
* **components/table:** provide icon column to display icons ([06b1596](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/06b1596c6de130adf1d7b62b3cb6142c2592508d))
* **components/table:** display tooltip if cell content overflows ([e1dd04f](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/e1dd04f2f85369f6c33cee5fdd96ec3256da58bb))
* **components/table:** support associating an icon with a row ([37f0251](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/37f0251bd319be53aa173b732240a386090831c2))
* **components/table:** support icon and custom tooltip in column header ([2a8fc8d](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/2a8fc8d5eeb6fe3d8f6cbacca6a4f5a78c33b3c5))
* **components/table:** support translation of string column values ([3a31340](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/3a313401c3f8af665439627acd76488009b1bf3c))
* **components/table:** invoke column value function in injection context ([0c2f541](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/0c2f541887977fed89610049c0d8aeda079ed44a))
* **components/table:** inherit row bindings from parent injectors ([8778f47](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/8778f473f1fb7d5df5a732163920119a21977e97))
* **components/icon:** export `SciIconFontComponent` to simplify providing custom icon font ([4c05320](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/4c053206d54739ec592fe37c3bed2e16e9950eaf))
* **components/menu:** support icons for checkable menu items ([c189aeb](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/c189aeb2ae77a5ba5d74b1c3aeabd612a4cf8ba0))
* **components:** require manual loading of SCION icon font ([3c8b4d6](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/3c8b4d6f8d641d4617df21848917ac05c356e886))

### Bug Fixes

* **components/table:** prevent custom columns from matching all rows in global filters if using the default matcher ([06a37e8](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/06a37e8d14ef9598130e4628ebe5737cae5d5312))
* **components/table:** render column header divider for non-resizable columns ([ec3ce86](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/ec3ce86c99724fe74038f25df6048f17e67afc4a))
* **components/table:** do not invoke comparator function for `undefined` values ([7723369](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/7723369b0c6e21ee8de0c68489eccf665485b70b))
* **components/icon:** exclude ligature from text content ([97906fd](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/97906fdd7ac9051cb044b879c0187cce35a82269))
* **components/menu:** align menu items with filter field ([cef6754](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/cef67541f3162feb78014f1dc941c1c0dce05697))

### Code Refactoring

* **components/icon:** change SCION icon prefix from `scion.` to `scion:` ([b0901af](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/b0901afcc30916fdd7e56276fa50212b88a39295))
* **components/text:** change SCION text prefix from `scion.` to `scion:` ([d6db281](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/d6db28187f42d5341071345fedf09460dd69e0f7))

### Dependencies

* **components:** SCION Components requires `@scion/toolkit` `v2.4.0` or higher.

### Deprecations

* **components/scrollbar:** The SCSS mixin `scrollbar-hide-when-inactive` has been deprecated and marked for removal in Angular 23. No replacement. To hide the scrollbar when not hovering the associated viewport, set `opacity` to `0`. Transitions on `opacity` fade the scrollbar in and out.
* **components/scrollbar:** The SCSS mixin `scrollbar-position` has been deprecated and marked for removal in Angular 23. No replacement. Position the scrollbar using CSS properties (e.g., top, right, bottom, left) based on the scroll direction.

### BREAKING CHANGES

* **components/icon:** The SCION icon font is no longer loaded automatically by importing `@scion/components`. Applications must now explicitly import `scion-icon-font.css`.

  To migrate:

  Load the icon font in `src/styles.scss`:

  ```scss
  // Load required styles.
  @use '@scion/components';
  
  // Load SCION icon font.
  @import url('https://cdn.jsdelivr.net/npm/@scion/icons/scion-icon-font.css'); // <---- add this line
  ```

  If your application enforces a Content Security Policy (CSP), whitelist the CDN in both `font-src` and `style-src` directives (previously, only `font-src` was required):

  ```
  Content-Security-Policy: font-src 'self' https://cdn.jsdelivr.net/npm/@scion/icons/; style-src 'self' https://cdn.jsdelivr.net/npm/@scion/icons/;
  ```

  To self-host the SCION icon font, follow these steps:

  Install the `@scion/icons` NPM package to get the required icon font files:
  ```shell
  npm install @scion/icons
  ```

  Include the SCION icon font in `src/styles.scss`.
  ```scss
  @use '@scion/icons/scion-icon-font.css';
  ```

  Configuring `externalDependencies` or `assets` in `angular.json` is no longer required.

* **components/icon:** The prefix of SCION icons has changed from `scion.` to `scion:`.

  If using a custom icon provider, update the SCION icon check:
  ```ts
  provideIconProvider(icon => {
    if (icon.startsWith('scion:')) { // previously 'scion.'
      return undefined;
    }
    // ...
  });
  ```

* **components/text:** The prefix of SCION texts has changed from `scion.` to `scion:`.

  If translating SCION texts, update the translation keys to use the new prefix (e.g., replace `scion.components.clear.tooltip` with `scion:components:clear.tooltip`).

  For a list of built-in SCION texts, refer to the [documentation](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/blob/master/docs/site/scion-localization.md#built-in-texts).
