<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| SCION Toolkit | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Toolkit][menu-home] > Observable

The NPM sub-module `@scion/toolkit/observable` provides a set of useful RxJS observables.

To use the observables, install the NPM module `@scion/toolkit` as following:
 
```
npm install @scion/toolkit --save
```

<details>
  <summary><strong>fromDimension$</strong></summary>
  
Allows observing the dimension of an element. Upon subscription, it emits the element's dimension, and then continuously emits when the dimension of the element changes. It never completes.

```typescript
import {Dimension, fromDimension$} from '@scion/toolkit/observable';

const element: HTMLElement = ...;
fromDimension$(element).subscribe((dimension: Dimension) => {   
 console.log(dimension);
});
```

The Observable uses the native [`ResizeObserver`](https://wicg.github.io/ResizeObserver) to detect size changes of the passed element.

</details>
 
<details>
  <summary><strong>fromMutation$</strong></summary>

Allows watching for changes being made to the DOM tree of an HTML element. It never completes.

The Observable wraps a [`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) to watch for changes being made to the DOM tree.
  
```typescript
import {fromMutation$} from '@scion/toolkit/observable';

const element: HTMLElement = ...;
fromMutation$(element).subscribe((mutations: MutationRecord[]) => {
 console.log(mutations);
});
```

When constructing the Observable, you can pass a `MutationObserverInit` options object to control which attributes or events to observe. See https://developer.mozilla.org/en-US/docs/Web/API/MutationObserverInit for more information.

</details> 

<details>
  <summary><strong>fromBoundingClientRect$</strong></summary>
  
Allows observing an element's bounding box, providing information about the element's size and position relative to the browser viewport. Refer to https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect for more information.

Upon subscription, the Observable emits the element's current bounding box, and then continuously emits when its bounding box changes, e.g., due to a change in the layout. The Observable never completes.

```typescript
import {fromBoundingClientRect$} from '@scion/toolkit/observable';

const element: HTMLElement = ...;
fromBoundingClientRect$(element).subscribe((boundingBox: Readonly<DOMRect>) => {
 console.log(boundingBox);
});
```

***
If you are only interested in element size changes and not position changes, consider using the `fromDimension$` Observable as it is more efficient because natively supported by the browser.
***
 
*Note on the detection of position changes:*\
 
There is, unfortunately, no native browser API to detect position changes of an element in a performant and reliable way. Our approach to detecting position changes of an element is based on the premise that it usually involves a parent or a parent's direct child changing in size. Repositioning can further occur when the user scrolls a parent container or when elements are added to or removed from the DOM. This covers most cases, but not all.
 
We are aware that this approach can be quite expensive, mainly because potentially a large number of elements need to be monitored for resizing/scrolling. Therefore, use this Observable only if you need to be informed about position changes. For pure dimension changes use the `fromDimension$` Observable instead.
</details> 

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

