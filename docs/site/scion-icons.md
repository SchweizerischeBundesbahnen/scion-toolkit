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
- [Built-In Icons](#built-in-icons)
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
    return undefined; // <--- Return `undefined` to not replace built-in icons
  }
  if (icon === 'your-icon') {
    return YourIconComponent; // `YourIconComponent` is illustrative
  }
  return undefined;
});
```

> [!TIP]
> - The function can call `inject` to get any required dependencies.
> - The function can return `undefined` to not provide a requested icon, e.g., to use the default icon for built-in icons.
> - Built-in icons start with the `scion.` prefix.

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

### Built-In Icons
SCION has the following built-in icons:

| Icon Key                | Usage                                     |
|-------------------------|-------------------------------------------|
| scion.add               | Add an item                               |
| scion.add_large         | Add an item (large)                       |
| scion.bin               | Bin symbol                                |
| scion.checkmark         | Indicates a selected option               |
| scion.chevron_down      | Chevron down symbol                       |
| scion.chevron_left      | Chevron left symbol                       |
| scion.chevron_right     | Chevron right symbol                      |
| scion.chevron_up        | Chevron up symbol                         |
| scion.clear             | Clear items                               |
| scion.close             | Close a popover                           |
| scion.collapse_all      | Collapse all items                        |
| scion.copy              | Copy an item                              |
| scion.delete            | Delete an item                            |
| scion.dirty             | Indicates unsaved data                    |
| scion.drag_handle       | Drag or move an item                      |
| scion.duplicate         | Duplicate an item                         |
| scion.edit              | Edit an item                              |
| scion.emdash            | Em dash symbol                            |
| scion.envelope          | Envelope symbol                           |
| scion.envelope_closed   | Indicates a closed envelope               |
| scion.envelope_opened   | Indicates an opened envelope              |
| scion.expand_all        | Expand an item                            |
| scion.external_link     | Open link in a new tab                    |
| scion.filter            | Set or change a filter                    |
| scion.find              | Find an item                              |
| scion.folder            | Directory symbol                          |
| scion.help              | Indicates help, support, or documentation |
| scion.hide              | Hide a panel                              |
| scion.magnifier         | Magnifier symbol                          |
| scion.minimize          | Minimize a panel                          |
| scion.minus             | Minus sign                                |
| scion.modified          | Indicates modified data                   |
| scion.more_horizontal   | Show a popover to the left or right       |
| scion.more_vertical     | Show a popover above or below             |
| scion.new               | Create an item                            |
| scion.new_large         | Create an item (large)                    |
| scion.paste             | Paste from clipboard                      |
| scion.pen               | Pen symbol                                |
| scion.pin               | Pin an item                               |
| scion.pinned            | Indicates a pinned item                   |
| scion.placeholder_frame | Placeholder symbol                        |
| scion.placeholder_image | Placeholder symbol for an image           |
| scion.plus              | Plus sign                                 |
| scion.plus_large        | Plus sign (large)                         |
| scion.remove            | Remove an item (x)                        |
| scion.remove_minus      | Remove an item (-)                        |
| scion.reset             | Reset a form                              |
| scion.search            | Search for an item                        |
| scion.sort_ascending    | Sort items in ascending order (A-Z, 0-9)  |
| scion.sort_by           | Change sort order                         |
| scion.sort_descending   | Sort items in descending order (Z-A, 9-0) |
| scion.user              | User symbol                               |


> [!NOTE]
> The application can register an icon provider to replace built-in SCION icons.

To use SCION icons, import the `@scion/components` SCSS module in the global `styles.scss`:

```scss
@use '@scion/components';
```

By default, SCION icons are loaded from the CDN https://cdn.jsdelivr.net/npm/@scion/components/resources/scion-icons.

### Content Security Policy (CSP)
Applications enforcing a Content Security Policy must whitelist the CDN using the `font-src` directive.

```
Content-Security-Policy: font-src 'self' https://cdn.jsdelivr.net/npm/@scion/components/;
```

### Self-Hosting the SCION Icon Font
As an alternative to loading SCION icons from the CDN, the application can host the SCION icon font.

To host the icon font locally:
1. Download the icon font from `https://cdn.jsdelivr.net/npm/@scion/components/resources/scion-icons/scion-icons.zip`.
2. Extract the font files into the application's public assets folder (e.g., `/public/scion-icons`).
3. Configure the path in the `@scion/components` SCSS module:
   ```scss
   @use '@scion/components' with (
     $icon-font: (
       directory: '/scion-icons' // must start with a leading slash
     )
   );
   ```

### Loading Self-Hosted Icon Font Relative to Document Base
Applications deployed in a subdirectory must configure the `@scion/components` SCSS module to load the self-hosted icon font relative to the document base URL (defined by the `<base>` HTML tag) and exclude the font files from the application build.

Different steps are required depending on whether building the application with esbuild or Webpack.

**Using `@angular/build:application` (esbuild, default since Angular 20)**

1. Remove the leading slash from the directory configuration:
   ```scss
   @use '@scion/components' with (
     $icon-font: (
       directory: 'scion-icons' // relative to document base URL
     )
   );
   ```
2. Exclude the font files from the application build via `externalDependencies` in `angular.json`:
   ```json
   "externalDependencies": [
     "scion-icons/scion-icons.*"
   ]
   ```

**Using `@angular-devkit/build-angular:browser` (Webpack)**

Configure the directory path with a leading caret (`^`), instructing Webpack to exclude the font files from the application build:

```scss
@use '@scion/components' with (
  $icon-font: (
    directory: '^scion-icons' // leading caret excludes the font files from Webpack build
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
