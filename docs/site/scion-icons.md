<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| SCION Toolkit | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
|---------------|---------------------------------------------|-----------------------------|-----------------------------------|-------------------------------|

## [SCION Toolkit][menu-home] > [@scion/components][link-scion-components] > Icons

Learn how to provide application-specific icons to SCION components.

***
**Content:**
- [Icon Provider](#icon-provider)
- [Icon Component](#icon-component)
- [Material Icons](#material-icons)
- [SCION Icons](#scion-icons)
  - [Content Security Policy (CSP)](#content-security-policy-csp)
  - [Self-Hosting the SCION Icon Font](#self-hosting-the-scion-icon-font)
  - [Loading Self-Hosted Icon Font Relative to Document Base](#loading-self-hosted-icon-font-relative-to-document-base)
***

### Icon Provider
Icon providers are used to provide icons to SCION components. An icon provider is a function that returns a component for an icon. The component renders the icon.

Multiple icon providers can be registered. Providers are called in registration order. If a provider does not provide the icon, the next provider is called, and so on.

An icon provider can be registered using the `provideIconProvider` function.

```ts
import {provideIconProvider} from '@scion/components/icon';
import {ComponentType} from '@angular/cdk/portal';

provideIconProvider((icon: string): ComponentType<unknown> | undefined => {
  if (icon.startsWith('scion.')) {
    return undefined; // <--- Return `undefined` to not replace SCION icons
  }
  if (icon === 'your-icon') {
    return YourIconComponent; // `YourIconComponent` is illustrative
  }
  return undefined;
});
```

> [!TIP]
> - The function can call `inject` to get any required dependencies.
> - The function can return `undefined` to not provide a requested icon, e.g., to use the built-in SCION icons.
> - SCION icons start with the `scion.` prefix.

> [!IMPORTANT]
> Applications using the SCION Workbench should register an icon provider via configuration passed to the `provideWorkbench` function. Refer to the [workbench documentation][link-scion-workbench-icons] for details.

Alternatively, the icon provider can return a descriptor, allowing for additional configuration such as inputs.

```ts
import {provideIconProvider} from '@scion/components/icon';
import {SciComponentDescriptor} from '@scion/components/common';
import {inputBinding} from '@angular/core';

provideIconProvider((icon: string): SciComponentDescriptor | undefined => {
  return {
    component: YourIconComponent, // `YourIconComponent` is illustrative
    bindings: [inputBinding('icon', () => icon)], // pass inputs to the icon component
  };
});
```

Inputs are available as input properties in the component.

```ts
public readonly icon = input.required<string>();
```

### Icon Component
The `SciIconComponent` (`<sci-icon>`) from `@scion/components/icon` displays icons based on registered [icon providers](#icon-provider).

Set the icon name as the slotted content of the `<sci-icon>` component.

```html
<sci-icon>home</sci-icon>
```

By default, the icon size is `1em`. To change the size, set the font-size on the `<sci-icon>` element or use the `--sci-icon-size` CSS variable.

```scss
sci-icon {
  --sci-icon-size: 16px;
}
```

### Material Icons
If no icon provider provides an icon, SCION interprets the icon as a Material icon font ligature.

Refer to https://fonts.google.com/icons for available Material icons and https://developers.google.com/fonts/docs/material_symbols#use_in_web for instructions on including the Material icon font.

Example of including the Material icon font in the global `styles.scss`:
```scss
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL@20..24,400,0&display=block');
```

### SCION Icons
SCION requires icons from https://cdn.jsdelivr.net/npm/@scion/icons, loaded by importing the `@scion/components` SCSS module in `styles.scss`.

```scss
@use '@scion/components';
```

SCION icon ligatures start with the `scion.` prefix. Applications can register an icon provider to replace the built-in SCION icons. 

Refer to https://icons.scion.vercel.app for available SCION icons.

### Content Security Policy (CSP)
Applications enforcing a Content Security Policy must whitelist the CDN using the `font-src` directive.

```
Content-Security-Policy: font-src 'self' https://cdn.jsdelivr.net/npm/@scion/icons/;
```

### Self-Hosting the SCION Icon Font
As an alternative to loading SCION icons from the CDN, you can host the SCION icon font directly within your application.

To self-host the SCION icon font:

1. Install the `@scion/icons` NPM module:
   ```shell
   npm install @scion/icons
   ```
2. Register the icon font files in `assets` in `angular.json`.
   ```
   "assets": [
     {
       "glob": "**/*",
       "input": "node_modules/@scion/icons",
       "output": "/scion-icons"
     }
   ]
   ```
3. Configure `@scion/components` SCSS module to load the icon font from `/scion-icons` (leading slash required):
   ```scss
   @use '@scion/components' with (
     $icon-font: (
       directory: '/scion-icons'
     )
   );
   ```

As an alternative to steps 1 and 2, you can manually download the icon font files from the CDN and place them directly into your application's public assets folder (`public/scion-icons/`):
- https://cdn.jsdelivr.net/npm/@scion/icons/scion-icons.ttf
- https://cdn.jsdelivr.net/npm/@scion/icons/scion-icons.svg
- https://cdn.jsdelivr.net/npm/@scion/icons/scion-icons.woff

### Loading Self-Hosted Icon Font Relative to Document Base
Applications deployed in a subdirectory must configure the `@scion/components` SCSS module to load the self-hosted icon font relative to the document base URL (defined by the `<base>` HTML tag) and exclude the icon font files from the application build.

Different steps are required depending on whether building the application with esbuild or Webpack.

**Using `@angular/build:application` (esbuild, default since Angular 20)**

1. Configure `@scion/components` SCSS module to load the icon font from `scion-icons` (no leading slash to be relative to the document base URL):
   ```scss
   @use '@scion/components' with (
     $icon-font: (
       directory: 'scion-icons'
     )
   );
   ```
2. Exclude the icon font files from the application build via `externalDependencies` in `angular.json`:
   ```
   "externalDependencies": [
     "scion-icons/*"
   ]
   ```

**Using `@angular-devkit/build-angular:browser` (Webpack, deprecated since Angular 22)**

Configure `@scion/components` SCSS module to load the icon font from `^scion-icons` (no leading slash to be relative to the document base URL):

The leading caret (`^`) instructs Webpack to exclude the icon font files from the application build.

```scss
@use '@scion/components' with (
  $icon-font: (
    directory: '^scion-icons'
  )
);
```

[menu-how-to]: /docs/site/howto/how-to.md

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

[link-scion-components]: /docs/site/scion-components.md
[link-scion-workbench-icons]: https://github.com/SchweizerischeBundesbahnen/scion-workbench/blob/master/docs/site/howto/how-to-icons.md
