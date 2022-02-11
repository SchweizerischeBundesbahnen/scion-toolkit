<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| SCION Toolkit | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## SCION Toolkit

SCION Toolkit is a collection of UI components and utilities designed primarily for use in SCION libraries and their demo and test applications. The toolkit is published as single NPM library with a separate entry point per tool, allowing for tree shaking away not used tools. The library has a peer-dependency on the Angular framework, since some tools are Angular-specific.

The toolkit contains the following tools:

***

#### Angular Components and Directives

- [**Viewport**][link-tool-viewport]\
  Provides a viewport component with scrollbars that sit on top of the viewport client.

- [**Dimension**][link-tool-dimension]\
  Provides a directive for observing changes in the size of the host element.

- [**Sashbox**][link-tool-sashbox]\
Provides a sashbox component for splitting content into multiple parts, which the user can resize by moving the splitter between the parts.

- [**Splitter**][link-tool-splitter]\
Provides a visual element that allows the user to control the size of elements next to it.

- [**Throbber**][link-tool-throbber]\
Provides an animated graphical control, commonly called a spinner, to indicate the execution of an action.
You can choose between different presentations: `ellipsis`, `ripple`, `roller`, `spinner`.

#### Framework-agnostic Tools

- [**Observable**][link-tool-observable]\
  Provides RxJS Observables for observing the size or DOM mutations of an HTML element.
   
- [**Operators**][link-tool-operators]\
  Provides a set of useful RxJS operators. 

- [**Util**][link-tool-util]\
  Provides some utilities for dealing with collections and objects. 

- [**UUID**][link-tool-uuid]\
  Allows generating pseudo-random identifiers.

- [**BeanManager**][link-tool-bean-manager]\
Provides a registry for looking up singleton objects.

- [**WebStorage**][link-tool-web-storage]\
Allows observing items contained in local or session storage.   
   
***

### Disclaimer
As for now, SCION Toolkit is exclusively optimized and tested on the latest Google Chrome release. Nevertheless, most things should work fine on other modern browsers.

### Versioning
SCION Toolkit follows the same SemVer philosophy as Angular, with major versions being released at the same time as major versions of the Angular framework. 

[![Project version](https://img.shields.io/npm/v/@scion/toolkit.svg)][link-download]
[![Project version](https://img.shields.io/npm/v/@scion/toolkit/next.svg)][link-download]
[![Continuous Integration and Delivery][link-github-actions-workflow:status]][link-github-actions-workflow]


[link-download]: https://www.npmjs.com/package/@scion/toolkit
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

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md