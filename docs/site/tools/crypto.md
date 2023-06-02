<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| SCION Toolkit | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Toolkit][menu-home] > Crypto

The NPM sub-module `@scion/toolkit/crypto` provides cryptographic functions.

To use the crypto module, install the NPM module `@scion/toolkit` as following:

```
npm install @scion/toolkit --save
```

<details>
  <summary><strong>Crypto.digest</strong></summary>

Generates a digest of the given data using the specified algorithm (or SHA-256 by default) and converts it to a hex string.

```typescript
import {Crypto} from '@scion/toolkit/crypto';

const hash: string = await Crypto.digest('some-data');
```
</details>


[menu-home]: /README.md

[menu-projects-overview]: /docs/site/projects-overview.md

[menu-changelog]: /docs/site/changelog.md

[menu-contributing]: /CONTRIBUTING.md

[menu-sponsoring]: /docs/site/sponsoring.md
