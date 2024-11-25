<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| SCION Toolkit | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Toolkit][menu-home] > [@scion/components][link-scion-components] > Dimension

The NPM sub-module `@scion/components/dimension` provides a set of tools for observing the size and position of an element.

Install the NPM module `@scion/components` as following:

```
npm install @scion/components @scion/toolkit @angular/cdk
```

<details>
  <summary><strong>Dimension Directive</strong></summary>

Directive to observe the size of an element in the HTML template.

1. Import `SciDimensionDirective`.

   ```ts
   import {SciDimensionDirective} from '@scion/components/dimension';

   @Component({
     // other metadata skipped
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
  <summary><strong><a id="dimension-signal"></a>Dimension Signal</strong></summary>

Signal to observe the size of an element.

The signal subscribes to the native [`ResizeObserver`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) to monitor element size changes. Destroying the injection context will unsubscribe the observer.


```ts
import {dimension} from '@scion/components/dimension';

const element: HTMLElement = ...;
const size = dimension(element);

console.log(size());
```

- The function must be called within an injection context or an injector provided. Destroying the injector will unsubscribe the signal.
- The function must not be called within a reactive context to avoid repeated subscriptions.

**Example of observing the size of the component:**

```ts
import {Component, effect, ElementRef, inject} from '@angular/core';
import {dimension} from '@scion/components/dimension';

@Component({...})
class YourComponent {

   private host = inject(ElementRef<HTMLElement>);
   private dimension = dimension(this.host);

   constructor() {
     effect(() => console.log(this.dimension()));
   }
}
```

**Example of observing the size of a view child:**

The element can be passed as a signal, enabling observation of view children in the component constructor.

```ts
import {Component, effect, ElementRef, viewChild} from '@angular/core';
import {dimension} from '@scion/components/dimension';

@Component({...})
class YourComponent {

   private viewChild = viewChild<ElementRef<HTMLElement>>('view_child');
   private dimension = dimension(this.viewChild);

   constructor() {
     effect(() => console.log(this.dimension()));
   }
}
```

</details>

<details>
  <summary><strong>BoundingClientRect Signal</strong></summary>

Signal to observe the bounding box of an element.

The [bounding box](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect) includes the element's position relative to the top-left of the viewport and its size.


```ts
import {boundingClientRect} from '@scion/components/dimension';

const element: HTMLElement = ...;
const boundingBox = boundingClientRect(element);

console.log(boundingBox());
```

- The function must be called within an injection context or an injector provided. Destroying the injector will unsubscribe the signal.
- The function must not be called within a reactive context to avoid repeated subscriptions.
- The element and the document root (`<html>`) must be positioned `relative` or `absolute`. If not, a warning is logged, and positioning changed to `relative`.

*Note:*
There is no native browser API to observe the position of an element. The signal uses [`IntersectionObserver`](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) and [`ResizeObserver`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) to detect position changes. For tracking only size changes, use [`Dimension`](#dimension-signal) signal instead.


**Example of observing the bounding box of the component:**

```ts
import {Component, effect, ElementRef, inject} from '@angular/core';
import {boundingClientRect} from '@scion/components/dimension';

@Component({...})
class YourComponent {

   private host = inject(ElementRef<HTMLElement>);
   private boundingBox = boundingClientRect(this.host);

   constructor() {
      effect(() => console.log(this.boundingBox()));
   }
}
```

**Example of observing the bounding box of a view child:**

The element can be passed as a signal, enabling observation of view children in the component constructor.

```ts
import {Component, effect, ElementRef, viewChild} from '@angular/core';
import {boundingClientRect} from '@scion/components/dimension';

@Component({...})
class YourComponent {

   private viewChild = viewChild<ElementRef<HTMLElement>>('view_child');
   private boundingBox = boundingClientRect(this.viewChild);

   constructor() {
      effect(() => console.log(this.boundingBox()));
   }
}
```

</details>


[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

[link-scion-components]: /docs/site/scion-components.md
