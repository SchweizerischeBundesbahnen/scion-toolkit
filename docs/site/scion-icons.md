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
***

### Icon Provider
Icon providers are used to provide icons to SCION components. An icon provider is a function that returns a component for an icon. The component renders the icon.

Multiple icon providers can be registered. Providers are called in registration order. Returning `undefined` delegates to the next provider.

An icon provider can be registered using the `provideIconProvider` function.

```ts
import {provideIconProvider} from '@scion/components/icon';
import {ComponentType} from '@angular/cdk/portal';

provideIconProvider((icon: string): ComponentType<unknown> | undefined => {
  if (icon.startsWith('scion:')) {
    return undefined; // <--- Return `undefined` to not replace SCION icons
  }
  if (icon === 'your-icon') {
    return YourIconComponent; // `YourIconComponent` is illustrative
  }
  return undefined;
});
```

> [!TIP]
> - The function can call `inject` to get required dependencies.
> - SCION icons start with the `scion:` prefix.

> [!IMPORTANT]
> Applications using the SCION Workbench should register an icon provider via configuration passed to the `provideWorkbench` function. Refer to the [workbench documentation][link-scion-workbench-icons] for details.

**Passing Inputs Using a Descriptor**

If your icon component requires inputs, return an `SciComponentDescriptor` instead of the icon component type:

```ts
import {provideIconProvider} from '@scion/components/icon';
import {SciComponentDescriptor} from '@scion/components/common';
import {inputBinding} from '@angular/core';

provideIconProvider((icon: string): SciComponentDescriptor | undefined => {
  if (icon.startsWith('scion:')) {
    return undefined;
  }

  return {
    component: YourIconComponent, // `YourIconComponent` is illustrative
    bindings: [inputBinding('icon', () => icon)], // pass inputs to the icon component
  };
});
```

Inputs are available as input properties in the component:

```ts
public readonly icon = input.required<string>();
```

**Using an Icon Font**

To render icons from an icon font, you can use `SciIconFontComponent`, passing the `fontFamily` and `ligature` inputs:

```ts
import {provideIconProvider, SciIconFontComponent} from '@scion/components/icon';
import {SciComponentDescriptor} from '@scion/components/common';
import {inputBinding} from '@angular/core';

provideIconProvider((icon: string): SciComponentDescriptor | undefined => {
  if (icon.startsWith('scion:')) {
    return undefined;
  }

  return {
    component: SciIconFontComponent,
    bindings: [
      inputBinding('fontFamily', () => 'your-icon-font-name'),
      inputBinding('ligature', () => icon),
    ],
  };
});
```

### Icon Component
The `<sci-icon>` component displays icons based on registered [icon providers](#icon-provider).

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

Example of including the Material icon font in `src/styles.scss`:
```scss
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL@20..24,400,0&display=block');
```

### SCION Icons
SCION requires the SCION icon font, which can be loaded from the CDN by importing `scion-icon-font.css` in `src/styles.scss`:

```scss
@import url('https://cdn.jsdelivr.net/npm/@scion/icons/scion-icon-font.css');
```

Alternatively, link the stylesheet directly in the `<head>` of `src/index.html`:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@scion/icons/scion-icon-font.css" />
```

SCION icon ligatures start with the `scion:` prefix and can be replaced using an icon provider. Refer to https://icons.scion.vercel.app for available SCION icons.

### Content Security Policy (CSP)
Applications enforcing a Content Security Policy must whitelist the CDN using the `font-src` and `style-src` directives.

```
Content-Security-Policy: font-src 'self' https://cdn.jsdelivr.net/npm/@scion/icons/; style-src 'self' https://cdn.jsdelivr.net/npm/@scion/icons/;
```

### Self-Hosting the SCION Icon Font
As an alternative to loading SCION icons from the CDN, you can host the SCION icon font directly within your application.

To self-host the SCION icon font:

1. Install the `@scion/icons` NPM package to get the required icon font files: 
   ```shell
   npm install @scion/icons
   ```
2. Include the SCION icon font in `src/styles.scss`.
   ```scss
   @use '@scion/icons/scion-icon-font.css';
   ```

[menu-how-to]: /docs/site/howto/how-to.md

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

[link-scion-components]: /docs/site/scion-components.md
[link-scion-workbench-icons]: https://github.com/SchweizerischeBundesbahnen/scion-workbench/blob/master/docs/site/howto/how-to-icons.md
