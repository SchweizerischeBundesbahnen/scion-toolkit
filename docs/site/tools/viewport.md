<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| SCION Toolkit | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Toolkit][menu-home] > [@scion/components][link-scion-components] > Viewport

The NPM sub-module `@scion/components/viewport` provides an Angular viewport component with scrollbars that sit on top of the viewport client. The component renders slotted content (`<ng-content>`) inside a scrollable viewport, that shows a vertical and/or horizontal scrollbar when content overflows the component's boundaries.

By default, slotted content is added to a CSS grid layout with a single column, filling remaining space vertically and horizontally. Using the `::part(content)` pseudo element selector, you can configure the grid container or apply a different layout, such as a flex or flow layout. See section "*Layouting the viewport's slotted content*" for more information.

***
Click [here](https://components.scion.vercel.app/#/sci-viewport) for a demo of the viewport component and supported features.
***

<!--- INSTALLATION AND USAGE --->
<details>
  <summary><strong>Installation and Usage</strong></summary>

1. Install `@scion/components` using the NPM command-line tool: 
   ```
   npm install @scion/components @scion/toolkit @angular/cdk
   ```
 
1. Import SCION Design Tokens in `styles.scss` to style the viewport:
   ```scss
   @use '@scion/components';
   ```
   See [SCION Design Tokens][link-scion-design-tokens] for more information. 

1. Import `SciViewportComponent` in your component.

   ```ts
   import {SciViewportComponent} from '@scion/components/viewport';

   @Component({
     // other metadata skipped
     imports: [SciViewportComponent]
   })
   export class YourComponent {
   }
   ```

1. Put your content inside the `<sci-viewport></sci-viewport>` component, as following:

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
  Controls if to use the native scrollbar or a scrollbar that sits on top of the viewport. Defaults to `on-top`.
  Supported values are `native`, `on-top`, or `hidden`.

#### Events:
- **scroll**\
  Emits when the viewport is scrolled. The event is emitted outside the Angular zone to avoid unnecessary change detection cycles.

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
  <summary><strong>Layouting the viewport's slotted content</strong></summary>

By default, the viewport's slotted content (`ng-content`) is added to a CSS grid container with a single column, filling remaining space vertically and horizontally. Using the `::part(content)` pseudo element selector, you can configure the grid container or apply a different layout, such as a flex or flow layout.

#### Example of adding slotted content to a CSS flex container.
```css
sci-viewport::part(content) {
  display: flex;
  flex-direction: column;
}
```

#### Example of configuring CSS grid container with two columns
```css
sci-viewport::part(content) {
  grid-template-columns: 1fr 1fr;
  gap: 1em;
}
```

</details>

<!--- SCROLLBAR --->
<details>
  <summary><strong>Styling</strong></summary>

To customize the default look of SCION components or support different themes, configure the `@scion/components` SCSS module in `styles.scss`. See [SCION Design Tokens][link-scion-design-tokens] for more information. To style a specific `sci-viewport` component, the following CSS variables can be set directly on the component.

- `--sci-viewport-scrollbar-color`\
  Sets the color of the scrollbar. 

Example of how to set CSS variables:
```css 
sci-viewport {
  --sci-viewport-scrollbar-color: blue;
}
```

</details>

<details>
  <summary><strong>Using the SCION scrollbar in other viewport implementations</strong></summary>

The following example illustrates how to use `<sci-scrollbar>` in a `<cdk-virtual-scroll-viewport>` of Angular CDK.

1. Install `@scion/components` and required dependencies from NPM: 
   ```
   npm install @scion/components @scion/toolkit @angular/cdk
   ```

1. Import [SCION Design Tokens][link-scion-design-tokens] in `styles.scss` to provide required styles for the scrollbar.
   ```scss
   @use '@scion/components';
   ```

1. Add the following code to the HTML template:

   ```html
   <cdk-virtual-scroll-viewport #cdkViewport [itemSize]="25">
     <div *cdkVirtualFor="let item of items" [style.height.px]="25">
       {{item}}
     </div>
   </cdk-virtual-scroll-viewport>

   <!-- Add the scrollbar and bind it to the viewpor -->
   <sci-scrollbar direction="vscroll" [viewport]="cdkViewport.getElementRef().nativeElement"/>
   ```

1. Add the following code to the component class:

   ```ts
   import {Component} from '@angular/core';
   import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
   import {SciScrollbarComponent} from '@scion/components/viewport';
   
   @Component({
     // metadata skipped
     imports: [
       CdkVirtualScrollViewport,
       CdkFixedSizeVirtualScroll,
       CdkVirtualForOf,
       SciScrollbarComponent,
     ],
   })
   export class TesteeComponent {
     // Create an array with 100'000 items.
     protected items = Array.from({length: 100_000}, (_, i) => `${i + 1}`);
   }
   ```

1. Add the following code to the style template of the component:

   ```scss
   :host {
     > cdk-virtual-scroll-viewport {
       // Prevent rendering native scrollbar.
       scrollbar-width: none;
       
       // Define an anchor to position the scrollbar
       anchor-name: --viewport;
     
       // Hide the scrollbar when not hovering over the viewport.
       &:not(:hover) + sci-scrollbar {
         opacity: 0;
       }
     
       // Style the viewport (illustrative).
       width: 500px;
       height: 300px;
       border: 1px solid lightgray;
     }
     
     > sci-scrollbar {
       position: absolute;
       top: anchor(--viewport top);
       right: anchor(--viewport right);
       bottom: anchor(--viewport bottom);
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
[link-scion-design-tokens]: /docs/site/scion-design-tokens.md
