<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| SCION Toolkit | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Toolkit][menu-home] > UUID

The NPM sub-module `@scion/toolkit/uuid` provides a pseudo-random identifier generator.

#### Installation and Usage

1. Install `@scion/toolkit` using the NPM command-line tool: 
    ```
    npm install @scion/toolkit --save
    ```

1. Import the `UUID` symbol from `@scion/toolkit/uuid` and invoke the method `randomUUID`:
   
   ```typescript
   import {UUID} from '@scion/toolkit/uuid';
 
   const uuid: string = UUID.randomUUID();
   ```   

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

