<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| SCION Toolkit | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |
|---------------|---------------------------------------------|-----------------------------|-----------------------------------|-------------------------------|

## [SCION Toolkit][menu-home] > [@scion/components][link-scion-components] > Localization

Learn how to localize texts in SCION components.

***
**Content:**
- [Text Provider](#text-provider)
- [Translatable Text](#translatable-text)
- [Text Function](#text-function)
- [Text Pipe](#text-pipe)
- [Built-In Texts](#built-in-texts)
***

### Text Provider
Text providers are used to provide texts to SCION components. A text provider is a function that returns the text for a translation key.

Multiple text providers can be registered. Providers are called in registration order. If a provider does not provide the text, the next provider is called, and so on.

A text provider can be registered using the `provideTextProvider` function.

```ts
import {inject} from '@angular/core';
import {provideTextProvider} from '@scion/components/text';
import {MaybeSignal} from '@scion/components/common';

provideTextProvider((key: string, params: Record<string, string>): MaybeSignal<string> | undefined => {
  if (key.startsWith('scion.')) {
    return undefined; // <--- return `undefined` to not translate built-in texts
  }
  return inject(TranslateService).translate(key, params); // The `TranslateService` is illustrative.
});
```

> [!TIP]
> - The function can call `inject` to get any required dependencies, such as a translation service.
> - The function can use `toSignal` to convert an `Observable` to a `Signal`.
> - The function can return `undefined` to skip translating a key, e.g., to use the default text for built-in texts.
> - Built-in texts start with the `scion.` prefix.

> [!IMPORTANT]
> Applications using the SCION Workbench should register a text provider via configuration passed to the `provideWorkbench` function. Refer to the [workbench documentation][link-scion-workbench-texts] for details.

### Translatable Text
Texts subject to localization are typed as `Translatable`. A `Translatable` is a `string` that, if it starts with the percent symbol (`%`), is passed to registered text providers for translation, with the percent symbol omitted.
Otherwise, the text is used as is. A translation key may include parameters in matrix notation for text interpolation.

Example of a translatable property:
```ts
interface SciToolbarButtonDescriptor {
  tooltip?: Translatable; // <--- translatable property
  // ... other properties skipped
}
```

Example usage:
```ts
contributeMenu('toolbar:main', toolbar => toolbar
  .addToolbarButton({
    icon: 'more_vert',
    tooltip: '%more.label', // <--- `more.label` is used as translation key and passed to registered text providers for translation
    onSelect: () => console.log('...')
  }),
);
```

Examples of Translatables:
- `%key`: translation key
- `%key;param=value`: translation key with a single interpolation parameter
- `%key;param1=value1;param2=value2`: translation key with multiple interpolation parameters
- `text`: no translation key; text is used as a literal string

> [!TIP]
> Semicolons in interpolation parameters must be escaped with two backslashes (`\\;`).

### Text Function
The `text()` function can be used to resolve the text for a translation key from registered [text providers](#text-provider). The function returns a `Signal` with the localized text.

```ts
text('%key');
```

Interpolation parameters can be passed via options or appended to the translatable in matrix notation. If appended, escape semicolons with two backslashes (`\\;`).

```ts
text('%key', {params: {param1: 'value1', param2: 'value2'}}); // <--- params are passed via options
text('%key;param1=value1;param2=value2'); // <--- params are appended in matrix notation
```

> [!IMPORTANT]
> - The function must be called within an injection context, or an explicit `Injector` passed.
> - The function must be called in a non-reactive (non-tracking) context.

### Text Pipe
In Angular templates, the `sciText` pipe can be used to resolve the text for a translation key from registered [text providers](#text-provider). The pipe returns a `Signal` with the localized text.

```html
@let text = '%key' | sciText;

Translation: {{text()}}
```

### Built-In Texts
SCION Components use the following built-in texts:

| Translation Key                        | Text            |
|----------------------------------------|-----------------|
| scion.components.no_items.message      | No items found. |
| scion.components.type_to_filter.action | Type to filter  |
| scion.components.clear.tooltip         | Clear           |

> [!TIP]
> Applications using the SCION Workbench also include workbench-related texts. Built-in workbench texts start with the `scion.workbench.` prefix. Refer to the [workbench documentation][link-scion-workbench-texts] for details.

> [!NOTE]
> The application can register a text provider to replace built-in SCION texts.


[menu-how-to]: /docs/site/howto/how-to.md

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

[link-scion-components]: /docs/site/scion-components.md
[link-scion-workbench-texts]: https://github.com/SchweizerischeBundesbahnen/scion-workbench/blob/master/docs/site/howto/how-to-localize.md
