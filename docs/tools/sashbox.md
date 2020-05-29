<a href="/README.md"><img src="/docs/branding/scion-toolkit.svg" height="50" alt="SCION Toolkit"></a>

| SCION Toolkit | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Toolkit][menu-home] > Sashbox

The NPM sub-module `@scion/toolkit/sashbox` provides an Angular sashbox component for splitting content into multiple parts, so-called sashes. The user can resize the sashes by moving the splitter between the sashes. 

<!--- USAGE --->
<details>
  <summary><strong>Usage</strong></summary>

1. Install `@scion/toolkit` using the NPM command-line tool: 
    ```
    npm install --save @scion/toolkit
    ```

1. Import `SciSashboxModule` in the module where to use the sashbox:
   
   ```typescript
   import { SciSashboxModule } from '@scion/toolkit/sashbox';

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

Sashes are modelled as content children inside a `<ng-template>` decorated with the `sciSash` directive. A sash can have a fixed size with an explicit unit, or a unitless proportion to distibute remaining space. A proportional sash has the ability to grow or shrink if necessary.

Sash content modeled in the `<ng-template>` is added to a CSS grid container with a single column, stretching the content vertically and horizontally.

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
  
  A sash is added to the sashbox in the form of a `<ng-template>` decorated with the `sciSash` directive. You can control its size by setting a `size` and/or `minSize`. To hide a sash, for example if using the sash as side panel, add a `*ngIf` to the sash `<ng-template>`.
  
#### Configuration:
  
  - **size**\
    Specifies the sash size, either as fixed size with an explicit unit, or as a unitless proportion to distibute remaining space. A proportional sash has the ability to grow or shrink if necessary, and must be `>= 1`. If not set, remaining space is distributed equally.
    
  - **minSize**\
    Specifies the minimal sash size in pixel or percent. The min-size prevents the user from shrinking the sash below this minimal size. If the unit is omitted, the value is interpreted as a pixel value.

</details>

<!--- SASH LAYOUT --->
<details>
  <summary><strong>Sash Layout</strong></summary>

Sash content modeled in the `<ng-template>` is added to a CSS grid container with a single column, stretching the content vertically and horizontally.

</details>

<!--- STYLING --->
<details>
  <summary><strong>Styling</strong></summary>

The default style of the sashbox is made up of shades of gray.

You can control the appearance by overriding the following CSS variables:


- `--sci-sashbox-gap`\
 Sets the gaps (gutters) between sashes.

- `--sci-sashbox-splitter_size`\
 Sets the size of the splitter along the main axis (width if direction is row, or height if direction is column).

- `--sci-sashbox-splitter_touchTargetSize:`\
 Sets the touch target size to move the splitter (accessibility).

- `--sci-sashbox-splitter_crossAxisSize:`\
 Sets the splitter handle size along the cross axis (height if direction is row, or width if direction is column).

- `--sci-sashbox-splitter_backgroundColor`\
 Sets the background color of the splitter.

- `--sci-sashbox-splitter_borderRadius:`\
 Sets the border radius of the splitter handle.

- `--sci-sashbox-splitter_sizeOnHover:`\
 Sets the size of the splitter along the main axis when hovering it.

- `--sci-sashbox-splitter_opacityOnHover:`\
 Sets the opacity of the splitter when hovering it.

- `--sci-sashbox-splitter_backgroundColorOnHover`\
 Sets the background color of the splitter when hovering it.

- `--sci-sashbox-splitter_opacityWhenActive:`\
 Sets the opacity of the splitter while the user moves the splitter.

**Example:**

```css 
sci-sashbox {
  --sci-sashbox-splitter_backgroundColor: black;
  --sci-sashbox-splitter_backgroundColorOnHover: black;
}
```

</details>


[menu-home]: /README.md
[menu-projects-overview]: /docs/projects-overview.md
[menu-changelog]: /docs/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/sponsoring.md

