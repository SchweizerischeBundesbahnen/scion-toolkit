<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| SCION Toolkit | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Toolkit][menu-home] > Dimension

The NPM sub-module `@scion/toolkit/dimension` provides an Angular directive for observing the size of an HTML element. The directive emits the element's initial size, and then continuously emits when its size changes. It never completes.

<details>
  <summary><strong>Usage</strong></summary>

1. Install `@scion/toolkit` using the NPM command-line tool: 
    ```
    npm install --save @scion/toolkit
    ```

1. Import `SciDimensionModule` in the module where to use the directive:
   
   ```typescript
   import { SciDimensionModule } from '@scion/toolkit/dimension';

   @NgModule({
     imports: [SciDimensionModule]
   })
   export class AppModule {
   }
   ```

1. Add the `sciDimension` directive to the HTML element for which you want to observe its size:

   ```html
   <div sciDimension (sciDimensionChange)="onDimensionChange($event)"></div>
   ```

1. Add the following method to the component:
   ```typescript
   public onDimensionChange(dimension: Dimension): void {
     console.log(dimension);
   }
   ```
</details>

<details>
  <summary><strong>Control if to emit outside of the Angular zone</strong></summary>
  
You can control if to emit a dimension change inside or outside of the Angular zone by passing a `boolean` value to the input parameter `emitOutsideAngular`. If emitting outside of the Angular zone, the directive does not trigger an Angular change detection cycle. By default, dimension changes are emitted inside of the Angular zone.
  
   ```html
   <div sciDimension (sciDimensionChange)="onDimensionChange($event)" [emitOutsideAngular]="false"></div>
   ```
</details>

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

