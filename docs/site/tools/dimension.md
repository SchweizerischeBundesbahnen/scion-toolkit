<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| SCION Toolkit | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Toolkit][menu-home] > [@scion/components][link-scion-components] > Dimension

The NPM sub-module `@scion/components/dimension` provides primitives for observing the size of an element.

Install the NPM module `@scion/components` as following:

```
npm install @scion/components @scion/toolkit @angular/cdk
```

<details>
  <summary><strong>Dimension Directive</strong></summary>

Angular directive to observe the size of an HTML element.

1. Import `SciDimensionDirective`.

   ```ts
   import {SciDimensionDirective} from '@scion/components/dimension';

   @Component({
     // other metadata skipped
     standalone: true,
     imports: [SciDimensionDirective]
   })
   export class YourComponent {
   }
   ```

1. Add `sciDimension` directive to an element in the template.

   ```html
   <div sciDimension (sciDimensionChange)="onDimensionChange($event)"></div>
   ```

1. Add method to be notified about size changes of the element.
   ```ts
   public onDimensionChange(dimension: SciDimension): void {
     console.log(dimension);
   }
   ```

The directive can be configured with `emitOutsideAngular` to control whether to emit inside or outside the Angular zone. Defaults to `false`.

</details>

<details>
  <summary><strong>Dimension Signal</strong></summary>

Creates a signal to observe the size of an element.

```ts
import {fromDimension} from '@scion/components/dimension';

const element: HTMLElement = ...;
const dimension = fromDimension(element);
```

The signal subscribes to the native [`ResizeObserver`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) to monitor element size changes. The subscription is automatically disposed of when the current context is destroyed.

> - The function must be called within an injection context or with a `DestroyRef` passed for automatic unsubscription.
> - The function must NOT be called within a reactive context to avoid repeated subscriptions.

</details>

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

[link-scion-components]: /docs/site/scion-components.md
