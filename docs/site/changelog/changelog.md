<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| [SCION Toolkit][menu-home] | [Projects Overview][menu-projects-overview] | Changelog | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## Changelog

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
- if using Angular agnostic tools, migrate your app to Angular 10 by running `ng update @angular/cli @angular/core @angular/cdk`.



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





[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md