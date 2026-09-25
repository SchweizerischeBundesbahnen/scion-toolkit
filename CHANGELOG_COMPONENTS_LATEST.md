# [22.3.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/components-22.2.0...components-22.3.0) (2026-09-24)


### Features

* **components/table:** provide table component for displaying tabular data ([022d07f](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/022d07fb59368c00410cd98ba57c1441da4a8d07))
* **components/menu:** provide toolbar, menubar, and menu service for opening menus ([847d6ec](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/847d6ecec6967cb2a9d7cbbe2f84d026b9a70f47))
* **components/icon:** provide built-in icon set and icon provider API ([063e0ad](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/063e0ad27c478af426cc79f3f3d2eba435073830))
* **components/text:** provide text provider API ([40bba49](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/40bba49f56cbfae6a90e3e227b1c67d964551c64))
* **components/splitter:** add CSS variables for handle positioning ([09d0045](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/09d004548e849631e18528a82d882ed9ccd8ea52))
* **components/theme:** provide `--sci-color-theme` CSS variable ([7b9cd61](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/7b9cd610e19a02aa3eecaa35384068d2a88c53f3))
* **components/viewport:** add signal indicating whether viewport is scrolling ([9aa2a6b](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/9aa2a6b6f63555f2762bd4fcb285d7eaea615c84))


### Dependencies

* **components:** SCION Components requires `@scion/toolkit` `v2.2.0` or higher.

### BREAKING CHANGES

* **components:** SCION Components requires icons to be loaded from the following CDN: https://cdn.jsdelivr.net/npm/@scion/icons.

  Applications enforcing a Content Security Policy must whitelist the CDN using the `font-src` directive.

  ```
  Content-Security-Policy: font-src 'self' https://cdn.jsdelivr.net/npm/@scion/icons/;
  ```
