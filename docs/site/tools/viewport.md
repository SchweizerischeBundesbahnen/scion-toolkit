<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| SCION Toolkit | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Toolkit][menu-home] > Viewport

The NPM sub-module `@scion/toolkit/viewport` provides an Angular viewport component with scrollbars that sit on top of the viewport client. The component renders its `<ng-content>` inside a scrollable viewport, that shows a vertical and/or horizontal scrollbar when the `<ng-content>` overflows the component's boundaries.

By default, the `<ng-content>` is added to a CSS grid container with a single column, thus, content fills remaining space vertically and horizontally. See section *Layout* for more information.

***
Click [here](https://scion-toolkit-testing-app.now.sh/#/sci-viewport) for a demo of the viewport component in our internal test application.
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
  
The viewport component displays scrollbars only when the content overflows and while the user moves his mouse over the viewport.

Some operating systems place scrollbars next to the content, which shrinks the content by a few pixels when scrollbars are displayed. For this reason, unless the operating system already does, the viewport component hides the native scrollbars and renders scrollbars on top of the content. Nevertheless, the viewport client remains natively scrollable, i.e. it supports native touch gestures and accelerated scrolling speed. In addition, the viewport scrolls natively near the viewport edges during drag and drop operations.

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
  <summary><strong>Layout</strong></summary>
The viewport has no intrinsic size, thus, you must either give it an explicit size, or place it in a layout to fill remaining space. 

By default, the `<ng-content>` is added to a CSS grid container with a single column.

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

    - Adds the `<cdk-virtual-scroll-viewport>` element as child element to the `<main>` element. Instead of the `<main>` element, you could also use a `<div>` element.
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
       position: relative;
       overflow: hidden;
       @include hide-scrollbars-when-inactive();
       height: 500px;
   
       > sci-scrollbar {
         @include scrollbar();
       }
     }
   ```
   
   **Explanation:**

    > The directive `sciScrollable` fully stretches its host element, which is `<cdk-virtual-scroll-viewport>` in our example, to the bounding box of the nearest positioned parent, and shifts native scrollbars out of the bounding box of the parent component.

    - Defines a positioning context on the `<main>` element by setting its `position` to `relative`.
    - Sets the `overflow` CSS variable of the `<main>` element to `hidden` to clip the native scrollbars of `<cdk-virtual-scroll-viewport>`.
    - Hides the scrollbar when the user is not hovering the viewport by applying the `hide-scrollbars-when-inactive` mixin available through `~@scion/toolkit/viewport/scrollbar`.
    - Positions the `<sci-scrollbar>` by applying the `scrollbar` mixin available through `~@scion/toolkit/viewport/scrollbar`.

</details>

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

