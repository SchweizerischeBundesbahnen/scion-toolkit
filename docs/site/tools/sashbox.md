<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| SCION Toolkit | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Toolkit][menu-home] > [@scion/components][link-scion-components] > Sashbox

The NPM sub-module `@scion/components/sashbox` provides an Angular sashbox component for splitting content into multiple parts, so-called sashes. The user can resize the sashes by moving the splitter between the sashes. 

***
Click [here](https://components.scion.vercel.app/#/sci-sashbox) for a demo of the sashbox component in our internal test application.
***

<!--- INSTALLATION AND USAGE --->
<details>
  <summary><strong>Installation and Usage</strong></summary>

1. Install `@scion/components` using the NPM command-line tool: 
   ```
   npm install @scion/components @scion/toolkit @angular/cdk

1. Import SCION Design Tokens in `styles.scss` to style the sashbox:
   ```scss
   @use '@scion/components';
   ```
   See [SCION Design Tokens][link-scion-design-tokens] for more information.

1. Import `SciSashboxComponent` and `SciSashDirective` in your component.

   ```ts
   import {SciSashboxComponent, SciSashDirective} from '@scion/components/sashbox';

   @Component({
     // other metadata skipped
     imports: [
       SciSashboxComponent,
       SciSashDirective,
     ],
   })
   export class YourComponent {
   }
   ```

   Alternatively, import `SciSashboxModule` in the `NgModule` that declares your component.
   
   ```ts
   import {SciSashboxModule} from '@scion/components/sashbox';

   @NgModule({
     imports: [SciSashboxModule]
   })
   export class AppModule {
   }
   ```

1. Add `sci-sashbox` component as following:

   ```html
   <sci-sashbox direction="row">
     <ng-template sciSash size="1">
       Content of sash 1
     </ng-template>

     <ng-template sciSash size="2">
       Content of sash 2
     </ng-template>

     <ng-template sciSash size="300px">
       Content of sash 3
     </ng-template>
   </sci-sashbox>
   ```
   
   The above code snippet creates three horizontally arranged sashes, with the left sash being half as wide as the middle sash and the right sash being 300px wide.  

</details>

<details>
  <summary><strong>Description</strong></summary>
  
The `<sci-sashbox>` is like a CSS flexbox container that lays out its content children (sashes) in a row (which is by default)
or column arrangement (as specified by the direction property). A splitter is added between each child to allow the user to
shrink or stretch the individual sashes.

Sashes are modelled as `<ng-template>` decorated with the `sciSash` directive. A sash can have a fixed size with an explicit unit, or a unitless proportion to distribute remaining space. A proportional sash has the ability to grow or shrink if necessary.

Sash content is added to a CSS grid container with a single column, stretching the content vertically and horizontally.

</details>

<!--- INPUT AND EVENTS --->
<details>
  <summary><strong>Inputs and Events</strong></summary>
  
#### Inputs:
- **direction**\
  Specifies if to lay out sashes in a row (which is by default) or column arrangement.\
  Supported values are `row` or `column`.

#### Events:
- **sashStart**\
  Emits when start sashing.

- **sashEnd**\
  Emits when end sashing.

</details>

<!--- SASH TEMPLATE --->
<details>
  <summary><strong>Sash Template</strong></summary>
  
  A sash is added to the sashbox in the form of a `<ng-template>` decorated with the `sciSash` directive. You can control its size by setting a `size` and/or `minSize`. To hide a sash, for example if using the sash as side panel, place the sash in an `@if` block.
  
#### Configuration:
  
  - **size**\
    Specifies the sash size, either as fixed size with an explicit unit, or as a unitless proportion to distribute remaining space. A proportional sash has the ability to grow or shrink if necessary, and must be `>= 1`. If not set, remaining space is distributed equally.
    
  - **minSize**\
    Specifies the minimal sash size in pixel or percent. The min-size prevents the user from shrinking the sash below this minimal size. If the unit is omitted, the value is interpreted as a pixel value.
    
  - **key**\
    Specifies an optional key to identify this sash.\
    The key is used as the property key in the object emitted by `SciSashboxComponent.sashEnd` to associate the size of this sash.
 
  - **animate**\
    Controls whether to animate the entering and leaving of this sash, only if fixed-sized. Defaults to `false`.\
    Enabling animation will mimic the behavior of a side panel that slides in or out.\
    Note: Animates only sashes added or removed after the initial rendering.

</details>

<!--- SASH LAYOUT --->
<details>
  <summary><strong>Sash Layout</strong></summary>

Sash content modeled in the `<ng-template>` is added to a CSS grid container with a single column, stretching the content vertically and horizontally.

</details>

<!--- STYLING --->
<details>
  <summary><strong>Styling</strong></summary>

To customize the default look of SCION components or support different themes, configure the `@scion/components` SCSS module in `styles.scss`. See [SCION Design Tokens][link-scion-design-tokens] for more information. To style a specific `sci-sashbox` component, the following CSS variables can be set directly on the component.

- `--sci-sashbox-gap`\
 Sets the gaps (gutters) between sashes.

- `--sci-sashbox-splitter-background-color`\
  Sets the background color of the splitter.

- `--sci-sashbox-splitter-background-color-hover`\
  Sets the background color of the splitter when hovering it.

- `--sci-sashbox-splitter-size`\
 Sets the size of the splitter along the main axis.

- `--sci-sashbox-splitter-size-hover:`\
  Sets the size of the splitter along the main axis when hovering it.

- `--sci-sashbox-splitter-touch-target-size:`\
 Sets the touch target size to move the splitter (accessibility).

- `--sci-sashbox-splitter-cross-axis-size:`\
 Sets the splitter size along the cross axis.

- `--sci-sashbox-splitter-border-radius:`\
 Sets the border radius of the splitter.

- `--sci-sashbox-splitter-opacity-hover:`\
 Sets the opacity of the splitter when hovering it.

- `--sci-sashbox-splitter-opacity-active:`\
 Sets the opacity of the splitter while the user moves the splitter.

**Example:**

```css 
sci-sashbox {
  --sci-sashbox-splitter-background-color: black;
  --sci-sashbox-splitter-background-color-hover: black;
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
