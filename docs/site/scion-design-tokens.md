<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| SCION Toolkit | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Toolkit][menu-home] > [@scion/components][link-scion-components] > SCION Design Tokens

SCION provides a set of design tokens to enable consistent design of components of the SCION libraries. Design tokens are provided by the `@scion/components` SCSS module.

An application can define a custom theme to change the default look of the SCION components. Multiple themes are supported. A theme is a collection of design tokens, defining specific design aspects such as colors, spacings, etc. A design token can have a different value per theme.

An application typically loads the SCSS module `@scion/components` in the `styles.scss` file.

```scss
@use '@scion/components';
```

### Themes
SCION provides a light and a dark theme, `scion-light` and `scion-dark`. Custom themes can be passed to the module under the `$themes` map entry, replacing the built-in themes. A custom theme can define only a subset of the available design tokens, with unspecified tokens inherited from the built-in theme of the same color scheme. The color scheme of a theme is determined by the `color-scheme` token.

```scss
@use '@scion/components' with (
  $themes: (
    dark: (
      color-scheme: dark,
      --sci-color-gray-50: #1D1D1D,
      --sci-color-gray-75: #262626,
      --sci-color-gray-100: #323232,
      --sci-color-gray-200: #3F3F3F,
      --sci-color-gray-300: #545454,
      --sci-color-gray-400: #707070,
      --sci-color-gray-500: #909090,
      --sci-color-gray-600: #B2B2B2,
      --sci-color-gray-700: #D1D1D1,
      --sci-color-gray-800: #EBEBEB,
      --sci-color-gray-900: #FFFFFF,
      --sci-color-accent: blueviolet,
    ),
    light: (
      color-scheme: light,
      --sci-color-gray-50: #FFFFFF,
      --sci-color-gray-75: #FDFDFD,
      --sci-color-gray-100: #F8F8F8,
      --sci-color-gray-200: #E6E6E6,
      --sci-color-gray-300: #D5D5D5,
      --sci-color-gray-400: #B1B1B1,
      --sci-color-gray-500: #909090,
      --sci-color-gray-600: #6D6D6D,
      --sci-color-gray-700: #464646,
      --sci-color-gray-800: #222222,
      --sci-color-gray-900: #000000,
      --sci-color-accent: blueviolet,
    ),
  )
);
```

### Theme Selection
A theme is selected based on the user's OS color scheme preference. To select a theme manually, add the `sci-theme` attribute to the root HTML element and set its value to the name of the theme.

```html
<html sci-theme="scion-dark">
```

### SCION Design Tokens
SCION supports the following design tokens:

<details>
  <summary><strong>Static Color Tokens</strong></summary>
  <br>

Colors that have a fixed color value across all themes.

[Static Color Tokens](https://raw.githubusercontent.com/SchweizerischeBundesbahnen/scion-toolkit/master/projects/scion/components/design/colors/_scion-static-colors.scss)

</details>

<details>
  <summary><strong>Named Color Tokens</strong></summary>
  <br>

Predefined set of named colors as palette of tints and shades.

[Named Color Tokens (light theme)](https://raw.githubusercontent.com/SchweizerischeBundesbahnen/scion-toolkit/master/projects/scion/components/design/colors/_scion-light-colors.scss), [Named Color Tokens (dark theme)](https://raw.githubusercontent.com/SchweizerischeBundesbahnen/scion-toolkit/master/projects/scion/components/design/colors/_scion-dark-colors.scss)

</details>

<details>
  <summary><strong>Semantic Tokens</strong></summary>
  <br>

Tokens for a particular usage.

[Semantic Tokens (light theme)](https://raw.githubusercontent.com/SchweizerischeBundesbahnen/scion-toolkit/master/projects/scion/components/design/themes/_scion-light-theme.scss), [Semantic Tokens (dark theme)](https://raw.githubusercontent.com/SchweizerischeBundesbahnen/scion-toolkit/master/projects/scion/components/design/themes/_scion-dark-theme.scss)

</details>

<details>
  <summary><strong>Component-specific Tokens</strong></summary>
  <br>

Tokens for a particular component.

[Component-specific Tokens](https://raw.githubusercontent.com/SchweizerischeBundesbahnen/scion-toolkit/master/projects/scion/components/design/components/_scion-component-tokens.scss)

</details>

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

[link-scion-components]: /docs/site/scion-components.md
