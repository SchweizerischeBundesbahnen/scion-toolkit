<a href="/README.md"><img src="/docs/branding/scion-toolkit.svg" height="50" alt="SCION Toolkit"></a>

| SCION Toolkit | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Toolkit][menu-home] > Observable

The NPM sub-module `@scion/toolkit/observable` provides a set of useful RxJS observables. It has no dependency on the Angular framework.

To use the observables, install the NPM module `@scion/toolkit` as following:
 
```
npm install --save @scion/toolkit
```

<details>
  <summary><strong>fromDimension$</strong></summary>
  
Allows observing the dimension of an element. Upon subscription, it emits the element's dimension, and then continuously emits when the dimension of the element changes. It never completes.

```typescript
import { Dimension, fromDimension$ } from '@scion/toolkit/observable';

const element: HTMLElement = ...;
fromDimension$(element).subscribe((dimension: Dimension) => {   
 console.log(dimension);
});
```

By default, the Observable uses the native [`ResizeObserver`](https://wicg.github.io/ResizeObserver) if supported by the user agent, or falls back to listening for resize events on a hidden HTML `<object>` element. You can, however, override this strategy to never use the native `ResizeObserver` by setting the global flag `FromDimension.defaults.useNativeResizeObserver` to `false`, or override it locally by passing an options object when constructing the `Observable`.

> The HTML `<object>` element provides a nested browsing context with a separate window, allowing to listen for resize events natively.
The HTML `<object>` element is aligned with the target's bounds, thus requires the element to define a positioning context. If not positioned,
the element is changed to be positioned relative. The implementation is based on a blog post published in [`backalleycoder.com`](http://www.backalleycoder.com/2013/03/18/cross-browser-event-based-element-resize-detection/).

*Note:* Web Performance Working Group is working on a [W3C recommendation for natively observing changes to Element’s size](https://wicg.github.io/ResizeObserver/).
The Web API draft, however, is still work in progress and support limited to Google Chrome and Opera.

</details>
 
<details>
  <summary><strong>fromMutation$</strong></summary>

Allows watching for changes being made to the DOM tree of an HTML element. It never completes.

The Observable wraps a [`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) to watch for changes being made to the DOM tree.
  
```typescript
import { fromMutation$ } from '@scion/toolkit/observable';

const element: HTMLElement = ...;
fromMutation$(element).subscribe((mutations: MutationRecord[]) => {
 console.log(mutations);
});
```

When constructing the Observable, you can pass a `MutationObserverInit` options object to control which attributes or events to observe. See https://developer.mozilla.org/en-US/docs/Web/API/MutationObserverInit for more information.

</details> 
 

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

