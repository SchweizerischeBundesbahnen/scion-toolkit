<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| SCION Toolkit | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Toolkit][menu-home] > [@scion/components][link-scion-components] > Splitter

The NPM sub-module `@scion/components/splitter` provides an Angular splitter component, a visual element that allows the user to control the size of elements next to it.

***
Click [here](https://components.scion.vercel.app/#/sci-sashbox) for a demo of the splitter component used in the [Sashbox Component][link-tool-sashbox].
***

<!--- INSTALLATION AND USAGE --->
<details>
  <summary><strong>Installation and Usage</strong></summary>

1. Install `@scion/components` using the NPM command-line tool: 
   ```
   npm install @scion/components @scion/toolkit @angular/cdk
   ```

1. Import `SciSplitterComponent` in your component.

   ```typescript
   import {SciSplitterComponent} from '@scion/components/splitter';

   @Component({
     // other metadata skipped
     standalone: true,
     imports: [SciSplitterComponent]
   })
   export class YourComponent {
   }
   ```

   Alternatively, import `SciSplitterModule` in the `NgModule` that declares your component.

   ```typescript
   import {SciSplitterModule} from '@scion/components/splitter';

   @NgModule({
     imports: [SciSplitterModule]
   })
   export class AppModule {
   }
   ```

1. Add `sci-splitter` component as following:

   ```html
   <sci-splitter (move)="onSplitterMove($event.distance)" orientation="vertical"></sci-splitter>
   ```

</details>

<details>
  <summary><strong>Description</strong></summary>
  
The `<sci-splitter>` Angular component is a visual element that allows the user to control the size of elements next to it. It has a handle that the user can move depending on the orientation of the splitter.

Note that this control neither does change the size of adjacent elements nor does it (re-)position itself, but emits the distance by which the user has theoretically moved the splitter. You must subscribe to these events and change your layout accordingly.

> [@scion/components/sashbox][link-tool-sashbox] uses this splitter to divide a layout into several resizable sections. Another use case would be a resizable sidebar panel.

</details>

<!--- INPUT AND EVENTS --->
<details>
  <summary><strong>Inputs and Events</strong></summary>
  
#### Inputs:
- **orientation**\
  Controls whether to render a vertical or horizontal splitter.\
  By default, if not specified, renders a vertical splitter.
  Supported values are `vertical` or `horizontal`.

#### Events:
- **start**\
  Emits when starting to move the splitter.

- **end**\
  Emits when ending to move the splitter.

- **move**\
  Emits the distance in pixels when the splitter is moved.\
  **Note that the event is emitted outside of the Angular zone.**

- **reset**\
  Emits when to reset the splitter position.

</details>

<!--- STYLING --->
<details>
  <summary><strong>CSS Styling</strong></summary>

The default style of the splitter is made up of shades of gray.

You can control the appearance by overriding the following CSS variables:


- `--sci-splitter-bgcolor`\
 Sets the background color of the splitter.

- `--sci-splitter-bgcolor_hover`\
 Sets the background color of the splitter when hovering it.

- `--sci-splitter-size:`\
 Sets the size of the splitter along the main axis.

- `--sci-splitter-size_hover:`\
 Sets the size of the splitter along the main axis when hovering it.

- `sci-splitter-touch-target-size`\
 Sets the touch target size to move the splitter (accessibility).

- `--sci-splitter-cross-axis-size:`\
 Sets the splitter size along the cross axis.

- `--sci-splitter-border-radius:`\
 Sets the border radius of the splitter.

- `--sci-splitter-opacity_active:`\
 Sets the opacity of the splitter while the user moves the splitter.

- `--sci-splitter-opacity_hover`\
 Sets the opacity of the splitter when hovering it.

**Example:**

```css 
sci-splitter {
  --sci-splitter-bgcolor: black;
  --sci-splitter-bgcolor_hover: black;
}
```

</details>

[link-tool-sashbox]: /docs/site/tools/sashbox.md
[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

[link-scion-components]: /docs/site/scion-components.md
