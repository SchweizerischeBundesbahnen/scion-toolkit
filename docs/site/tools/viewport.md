<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| SCION Toolkit | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Toolkit][menu-home] > Viewport

The NPM sub-module `@scion/toolkit/viewport` provides an Angular viewport component with scrollbars that sit on top of the viewport client. The component renders its `<ng-content>` inside a scrollable viewport, that shows a vertical and/or horizontal scrollbar when the `<ng-content>` overflows the component's boundaries.

`NgContent` is added to a CSS grid container with, by default, a single column, filling remaining space vertically and horizontally. See section '*Layouting the viewport content*' for more information.

***
Click [here](https://scion-toolkit-testing-app.vercel.app/#/sci-viewport) for a demo of the viewport component in our internal test application.
***

<!--- USAGE --->
<details>
  <summary><strong>Usage</strong></summary>

1. Install `@scion/toolkit` using the NPM command-line tool: 
    ```
    npm install --save @scion/toolkit
    ```

1. Import `SciViewportModule` in the module where to use the viewport:
   
   ```typescript
   import { SciViewportModule } from '@scion/toolkit/viewport';

   @NgModule({
     imports: [SciViewportModule]
   })
   export class AppModule {
   }
   ```

1. Wrap your content inside the `sci-viewport` component as following:

   ```html
   <sci-viewport>
     your content
   </sci-viewport>
   ```

</details>

<details>
  <summary><strong>Description</strong></summary>
  
This component represents a viewport with the `<ng-content>` used as scrollable content. Content is added to a CSS grid layout.

The viewport component displays scrollbars when its content overflows. Scrollbars are displayed on top of the content, not next to it. The component uses the native scrollbars of the operating system if they are already sitting on top, or falls back and renders scrollbars on top otherwise. The viewport remains natively scrollable with the native scrollbars shifted out of the viewport's visible area. Consequently, the viewport keeps supporting native scrolling features such as touch gestures, scroll speed acceleration, or scrolling near the viewport edges during drag-and-drop operations.

</details>

<!--- INPUTS AND EVENTS --->
<details>
  <summary><strong>Inputs and Events</strong></summary>
  
#### Inputs:
- **scrollbarStyle**\
  Controls whether to use native scrollbars or, which is by default, emulated scrollbars that sit on top of the viewport client. In the latter, the viewport client remains natively scrollable.\
  Supported values are `native`, `on-top`, or `hidden`.

#### Events:
- **scroll**\
  Emits upon a scroll event.

</details>

<!--- PROPERTIES AND METHODS --->
<details>
  <summary><strong>Properties and Methods</strong></summary>

#### Properties:
- **scrollTop**\
  Sets or returns the number of pixels that the viewport client is scrolled vertically.

- **scrollLeft**\
  Sets or returns the number of pixels that the viewport client is scrolled horizontally.

- **scrollHeight**\
  Returns the height of the viewport client.

- **scrollWidth**\
  Returns the width of the viewport client.

- **viewportElement**\
  Returns the viewport `HTMLElement`.

- **viewportClientElement**\
  Returns the viewport client `HTMLElement`.

#### Methods:
- **isElementInView**\
  Checks if the specified element is scrolled into the viewport.
- **scrollIntoView**\
  Scrolls the specified element into the viewport.
- **computeOffset**\
  Computes the distance of the element to the viewport's left or top border.

</details>

<!--- LAYOUT --->
<details>
  <summary><strong>Adding the viewport to a layout</strong></summary>

Typically you would add the viewport component to a flexible layout, filling the remaining space vertically and horizontally, such as a flexbox container with the viewport's `flex` CSS property set to either `flex: auto` or `flex: 1 1 0`.

The viewport is sized according to its content width and height. It grows to absorb any free space, thus overflowing its content only when encountering a layout constraint. Depending on the layout, different steps may be necessary to prevent the viewport from growing to infinity.

- If practical, give the viewport a fixed size or a maximum size.
- If you add the viewport to a flexbox layout, make sure that it cannot exceed the available space. Instead, the viewport should fill the remaining space, vertically and horizontally. Be aware that, by default, a flex item does not shrink below its minimum content size. To change this, set the viewport's `flex-basis` to `0` (instead of `auto`), or use the CSS shorthand property `flex: 1 1 0`. The `flex-basis` defines the default size of a flex item before the remaining extra space is distributed. If the viewport does not appear after setting this property, check its parent elements' content sizes. As an alternative to setting `flex: 1 1 0`, change the setting to `flex: auto` and hide the overflow in the parent element, as follows: `overflow: hidden`. Another approach would be to set the minimum height of all parents to `0`, as follows: `min-height: 0`.

> For the complete documentation on the flex layout and its features, refer to https://developer.mozilla.org/en-US/docs/Web/CSS/flex.
 </details>

<details>
  <summary><strong>Layouting the viewport content</strong></summary>

`NgContent` is added to a CSS grid container with, by default, a single column, filling remaining space vertically and horizontally.

You can override the following CSS variables to control the grid:

- `--sci-viewport-content-grid-template-columns`\
  Defines the columns and their track sizes (by default, single column with track size `auto`)

- `--sci-viewport-content-grid-template-rows`\
  Defines the rows and their track sizes (by default, single row with track size `auto`)

- `--sci-viewport-content-grid-auto-columns`\
  Defines the track size of not explicitly declared columns.

- `--sci-viewport-content-grid-auto-rows`\
  Defines the track size of not explicitly declared rows.

- `--sci-viewport-content-grid-gap`\
  Sets the gaps (gutters) between rows and columns. 

Example of how to control the CSS grid:
```css 
sci-viewport {
  --sci-viewport-content-grid-auto-rows: min-content;
  --sci-viewport-content-grid-gap: .5em;
}
```

</details>

<!--- SCROLLBAR --->
<details>
  <summary><strong>Scrollbar styling</strong></summary>

You can override the following CSS variables to control the appearance of the scrollbar:

- `--sci-viewport-scrollbar-color`\
  Sets the color of the scrollbar (by default, uses `rgb(78, 78, 78)`). 

Example of how to set CSS variables:
```css 
sci-viewport {
  --sci-viewport-scrollbar-color: blue;
}
```

</details>

<details>
  <summary><strong>Using the SCION scrollbar in other viewport implementations</strong></summary>

The module `@scion/toolkit/viewport` exports the scrollbar component `<sci-scrollbar>` used internally by `<sci-viewport>`, allowing you to use it with other viewports as well, like for example with the `<cdk-virtual-scroll-viewport>` component of Angular CDK.

**The following example illustrates how to use `<sci-scrollbar>` in combination with `<cdk-virtual-scroll-viewport>`.**

1. Install `@scion/toolkit` using the NPM command-line tool: 
    ```
    npm install --save @scion/toolkit
    ```

1. Import `SciViewportModule` in the module where to use the scrollbar:
   
   ```typescript
   import { SciViewportModule } from '@scion/toolkit/viewport';

   @NgModule({
     imports: [SciViewportModule]
   })
   export class YourModule {
   }
   ```

1. Add the following code to the HTML template:

   ```html
   <main>
     <cdk-virtual-scroll-viewport #cdkViewport
                                  [itemSize]="25"
                                  sciScrollable>
       <div *cdkVirtualFor="let item of items" [style.height.px]="25">
         {{item}}
       </div>
     </cdk-virtual-scroll-viewport>

     <!-- render vertical scrollbar which sits on top of the cdk viewport -->
     <sci-scrollbar [direction]="'vscroll'" [viewport]="cdkViewport.getElementRef().nativeElement"></sci-scrollbar>
   </main>
   ```
   
   **Explanation:**

    - Adds the `<cdk-virtual-scroll-viewport>` element as child element to the `<main>` element. Instead of the `<main>` element, you could use any other container element.
    - Creates the local template variable `#cdkViewport` to hold the reference to the CDK viewport component.
    - Decorates the CDK viewport with the `sciScrollable` directive to hide its native scrollbars.
    - Adds the vertical scrollbar `<sci-scrollbar>` and connects it to the CDK viewport.

1. Add the following code to the component:

   ```typescript
   export class YourComponent {

     public items: string[] = [];

     constructor() {
       for (let i = 0; i < 100000; i++) {
         this.items.push(`${i}`);
       }
     }
   }
   ````

   The code snippet above populates the items array with 100'000 items.

1. Add the following code to the style template of the component:

   ```scss
     @import '~@scion/toolkit/viewport/scrollbar';
   
     main {
       display: grid; // stretches content vertically and horizontally
       position: relative; // positioned anchor for the scrollbars
       overflow: hidden; // hides native scrollbars (shifted out of the visible viewport area)
       @include hide-scrollbars-when-inactive(); // hide scrollbars when the user is not hovering the viewport.
       height: 500px;
   
       > sci-scrollbar {
         @include scrollbar(); // positions scrollbars
       }
     }
   ```
   
   **Explanation:**

    > The directive `sciScrollable` makes the host element, which is `<cdk-virtual-scroll-viewport>` in our example, natively scrollable. It shifts native scrollbars out of the visible area of the host element, unless they sit on top of the viewport, e.g., in OS X. This directive expects its host element to be the only child in document flow in its parent DOM element, which is `<main>` in our example. It makes the host element fill up the entire space (width and height set to 100%). The parent element should set `overflow: hidden` and `display: grid` or `display: flex` in combination with `flex: auto` to make the host element filling remaining space vertically and horizontally.

</details>

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

