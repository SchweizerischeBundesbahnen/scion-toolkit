<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| SCION Toolkit | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Toolkit][menu-home] > [@scion/toolkit][link-scion-toolkit] > Observable

The NPM sub-module `@scion/toolkit/observable` provides RxJS observables to observe various aspects of an HTML element, such as size, position, and mutations.

To use the observables, install the NPM module `@scion/toolkit` as following:
 
```
npm install @scion/toolkit
```

<details>
  <summary><strong><a id="from-resize"></a>fromResize$</strong></summary>

Wraps the native [`ResizeObserver`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) in an RxJS observable to observe resizing of an element.

Upon subscription, emits the current size, and then continuously when the size changes. The observable never completes.

```ts
import {fromResize$} from '@scion/toolkit/observable';

const element: HTMLElement = ...;
fromResize$(element).subscribe((entries: ResizeObserverEntry[]) => {

});
```

</details>
 
<details>
  <summary><strong>fromMutation$</strong></summary>

Wraps the native [`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) in an RxJS observable to observe mutations of an element.
 
```ts
import {fromMutation$} from '@scion/toolkit/observable';

const element: HTMLElement = ...;
fromMutation$(element).subscribe((mutations: MutationRecord[]) => {

});
```

</details> 
 
<details>
  <summary><strong>fromIntersection$</strong></summary>

Wraps the native [`IntersectionObserver`](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) in an RxJS observable to observe intersection of an element.

Upon subscription, emits the current intersection state, and then continuously when the intersection state changes. The observable never completes.

```ts
import {fromIntersection$} from '@scion/toolkit/observable';

const element: HTMLElement = ...;
fromIntersection$(element, {threshold: 1}).subscribe((entries: IntersectionObserverEntry[]) => {

});
```

</details> 

<details>
  <summary><strong>fromBoundingClientRect$</strong></summary>

Observes changes to the bounding box of an element.

The [bounding box](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect) includes the element's position relative to the top-left of the viewport and its size.

Upon subscription, emits the current bounding box, and then continuously when the bounding box changes. The observable never completes.


```ts
import {fromBoundingClientRect$} from '@scion/toolkit/observable';

const element: HTMLElement = ...;
fromBoundingClientRect$(element).subscribe((clientRect: DOMRect) => {

});
```

The element and the document root (`<html>`) must be positioned `relative` or `absolute`. If not, positioning is changed to `relative`.
 
*Note:*
There is no native browser API to observe the position of an element. The observable uses [`IntersectionObserver`](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) and [`ResizeObserver`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) to detect position changes. For tracking only size changes, use [`fromResize$`](#from-resize) instead.
</details> 

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

[link-scion-toolkit]: /docs/site/scion-toolkit.md
