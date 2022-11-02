<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| SCION Toolkit | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## SCION Toolkit

The SCION Toolkit is a collection of Angular components and framework-agnostic utilities designed primarily for use in SCION libraries such as [`@scion/workbench`][link-scion-workbench] and [`@scion/microfrontend-platform`][link-scion-microfrontend-platform].

The toolkit consists of two NPM modules:
- [**@scion/toolkit**](#framework-agnostic-tools-of-sciontoolkit)\
  Provides framework-agnostic tools in plain TypeScript. This module has no dependency on any other library.

- [**@scion/components** <img src="/docs/logo/angular.svg" alt="Angular-specific" title="Angular-specific">](#angular-components-and-directives-of-scioncomponents)\
  Component library based on the Angular framework that provides components and directives for Angular libraries or applications. It is not a comprehensive component library as its focus is on SCION requirements.

***

#### Framework-agnostic Tools

This module is available as [@scion/toolkit][link-toolkit-download] in the NPM registry.

- [**BeanManager**][link-tool-bean-manager]\
  Provides a registry for looking up singleton objects.

- [**Crypto**][link-tool-crypto]\
  Provides cryptographic functions.

- [**Observable**][link-tool-observable]\
  Provides RxJS Observables for observing the size or DOM mutations of an HTML element.
   
- [**Operators**][link-tool-operators]\
  Provides a set of useful RxJS operators. 

- [**Util**][link-tool-util]\
  Provides some utilities for dealing with collections and objects. 

- [**UUID**][link-tool-uuid]\
  Allows generating pseudo-random identifiers.

- [**WebStorage**][link-tool-web-storage]\
  Allows observing items contained in local or session storage.   


#### Angular Components and Directives <img src="/docs/logo/angular.svg" alt="Angular-specific" title="Angular-specific">

This module is available as [@scion/components][link-components-download] in the NPM registry.

- [**Dimension**][link-tool-dimension]\
  Provides a directive for observing changes in the size of the host element.

- [**Sashbox**][link-tool-sashbox]\
  Provides a sashbox component for splitting content into multiple parts, which the user can resize by moving the splitter between the parts.

- [**Splitter**][link-tool-splitter]\
  Provides a visual element that allows the user to control the size of elements next to it.

- [**Throbber**][link-tool-throbber]\
  Provides an animated graphical control, commonly called a spinner, to indicate the execution of an action.
  You can choose between different presentations: `ellipsis`, `ripple`, `roller`, `spinner`.

- [**Viewport**][link-tool-viewport]\
  Provides a viewport component with scrollbars that sit on top of the viewport client.

***

[![@scion/toolkit version](https://img.shields.io/npm/v/@scion/toolkit/latest?label=%40scion%2Ftoolkit)][link-toolkit-download]
[![@scion/components versions](https://img.shields.io/npm/v/@scion/components/latest?label=%40scion%2Fcomponents)][link-components-download]
[![Continuous Integration and Delivery][link-github-actions-workflow:status]][link-github-actions-workflow]


[link-toolkit-download]: https://www.npmjs.com/package/@scion/toolkit
[link-components-download]: https://www.npmjs.com/package/@scion/components
[link-github-actions-workflow]: https://github.com/SchweizerischeBundesbahnen/scion-toolkit/actions
[link-github-actions-workflow:status]: https://github.com/SchweizerischeBundesbahnen/scion-toolkit/workflows/Continuous%20Integration%20and%20Delivery/badge.svg?branch=master&event=push
[link-tool-viewport]: /docs/site/tools/viewport.md
[link-tool-dimension]: /docs/site/tools/dimension.md
[link-tool-sashbox]: /docs/site/tools/sashbox.md
[link-tool-splitter]: /docs/site/tools/splitter.md
[link-tool-throbber]: /docs/site/tools/throbber.md
[link-tool-observable]: /docs/site/tools/observable.md
[link-tool-operators]: /docs/site/tools/operators.md
[link-tool-util]: /docs/site/tools/util.md
[link-tool-uuid]: /docs/site/tools/uuid.md
[link-tool-web-storage]: /docs/site/tools/web-storage.md
[link-tool-bean-manager]: /docs/site/tools/bean-manager.md
[link-tool-crypto]: /docs/site/tools/crypto.md
[link-scion-microfrontend-platform]: https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/blob/master/README.md
[link-scion-workbench]: https://github.com/SchweizerischeBundesbahnen/scion-workbench/blob/master/README.md

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md
