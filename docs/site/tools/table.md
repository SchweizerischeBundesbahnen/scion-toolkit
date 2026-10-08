<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| SCION Toolkit | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
|---------------|---------------------------------------------|-----------------------------|-----------------------------------|-------------------------------|

## [SCION Toolkit][menu-home] > [@scion/components][link-scion-components] > Table

The NPM sub-module `@scion/components/table` provides an Angular component for displaying tabular data in Angular applications.

***
**Content:**

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Columns](#columns)
- [Custom Columns](#custom-columns)
- [Column Width](#column-width)
- [Table Configuration](#table-configuration)
    - [Filtering](#filtering)
    - [Sorting](#sorting)
    - [Selection](#selection)
    - [Row Actions](#row-actions)
    - [Row Bindings](#row-bindings)
- [Table Events](#table-events)
- [User Settings](#user-settings)
- [Localization of Column Headers](#localization-of-column-headers)
- [Fixed Row Height](#fixed-row-height)
- [Table Styling](#table-styling)
- [Row/Column Styling](#rowcolumn-styling)

***
Click [here](https://components.scion.vercel.app/#/sci-table) for a demo of the table component.
***

### Installation

Install `@scion/components` and required dependencies from NPM:

```
npm install @scion/components @scion/toolkit @angular/cdk
```

Import [SCION Design Tokens][link-scion-design-tokens] in `styles.scss` to provide required styles for the table.

```scss
@use '@scion/components';
```

### Basic Usage

Create a table using the `table()` function.

```ts
import {SciTableComponent, table} from '@scion/components/table';
import {httpResource} from '@angular/common/http';

// Load data to display in the table.
const users = httpResource<User[]>(() => 'users', {defaultValue: []});

// Create the table and pass data.
const userTable = table(users.value, table => table
  .addNumberColumn('ID', user => user.id)
  .addStringColumn('Name', user => user.name)
  .addBooleanColumn('Inactive', user => user.inactive)
  .addDateColumn('Expiration', user => user.expiration),
);
```

In the HTML, assign the table a name and bind it to the table instance returned by the `table()` function. The name must start with the `table:` prefix and is used to store user settings in the storage.

```html

<sci-table name="table:users" [table]="userTable"/>
```

The `table()` function requires two arguments: a signal containing the data to display in the table and a factory function to define the columns. The table calls the passed factory function with a factory that has methods for adding columns to the table.

> [!TIP]
> - The passed factory function is executed in a reactive context, running again whenever tracked signals change.
> - The passed factory function can call `inject` to get required dependencies. The injection context is destroyed each time the function is called anew.

A column requires at minimum a value function to provide the cell label for an item. If displaying column headers, it also requires a column header.

```ts
import {table} from '@scion/components/table';

table(users.value, table => table.addStringColumn('Name', user => user.name));
```

Alternatively, a descriptor can be passed to configure the column in more detail, for example, to set a preferred column width or configure a custom column filter and sort function.

```ts
import {table} from '@scion/components/table';

table(users.value, table => table.addStringColumn({
  header: 'Name',
  value: user => user.name,
  width: '2fr',
  minWidth: 200,
  filterable: {matcher: (text, context) => matchesUser(context.item, text)}, // `matchesUser` is illustrative
  sortable: {comparator: (a, b) => compareUsers(a.item, b.item)}, // `compareUsers` is illustrative
}));
```

### Columns

The table provides built-in columns for the following data types: `string`, `number`, `boolean`, and `Date`. Columns for other data types or custom cell rendering can be added as custom columns. See the [Custom Columns](#custom-columns) section for details.

#### String Column

Displays text.

```ts
import {table} from '@scion/components/table';

table(users.value, table => table.addStringColumn({
  header: 'Name',
  value: user => user.name,
}));
```

The column can be configured with a custom matcher and comparator for custom filtering and sorting.

```ts
import {table} from '@scion/components/table';

table(users.value, table => table.addStringColumn({
  header: 'Name',
  value: user => user.name,
  filterable: {matcher: (text, context) => matchesUser(context.item, text)}, // `matchesUser` is illustrative
  sortable: {comparator: (a, b) => compareUsers(a.item, b.item)}, // `compareUsers` is illustrative
}));
```

#### Number Column

Displays numeric values.

```ts
import {table} from '@scion/components/table';

table(users.value, table => table.addNumberColumn({
  header: 'Active Session Count',
  value: user => user.sessionsCount,
}));
```

#### Boolean Column

Displays boolean values.

```ts
import {table} from '@scion/components/table';

table(users.value, table => table.addBooleanColumn({
  header: 'Inactive',
  value: user => user.inactive,
}));
```

#### Date Column

Displays dates, times, or both.

A date column accepts an ISO 8601 date/time string (e.g., `2026-10-06`, `2026-10-06T14:30:15Z`, or `T14:30:15`), milliseconds since the UTC epoch, or a `Date` object.

```ts
import {table} from '@scion/components/table';

table(users.value, table => table.addDateColumn({
  header: 'Expiration',
  value: user => user.expiration,
}));
```

Use the `format` property to control how the date is rendered. The format can be a predefined Angular date format (e.g., `mediumDate` or `mediumTime`) or a custom date/time pattern (e.g., `dd.MM.yyyy` or `HH:mm`). If omitted, it defaults to the format configured in `DATE_PIPE_DEFAULT_OPTIONS` or falls back to `mediumDate`.

```ts
import {table} from '@scion/components/table';

table(users.value, table => table.addDateColumn({
  header: 'Daily Digest Time',
  value: user => user.dailyDigestTime,
  format: 'HH:mm', // <--- Set the format
}));
```

> [!TIP]
> - See [Angular Predefined Format Options](https://angular.dev/api/common/DatePipe#pre-defined-format-options) for available formats.
> - See [Angular Custom Format Syntax](https://angular.dev/api/common/DatePipe#custom-format-options) for custom date/time pattern syntax.


Dates render in the user's local timezone by default. You can override this per column using the `timezone` property or globally via the `DATE_PIPE_DEFAULT_OPTIONS` DI token.

```ts
import {table} from '@scion/components/table';

table(users.value, table => table.addDateColumn({
  header: 'Daily Digest Time',
  value: user => user.dailyDigestTime,
  format: 'HH:mm',
  timezone: '+0200' // <--- Set the timezone
}));
```

Dates are localized using the locale provided by `SCI_LOCALE`, a writable signal initialized with Angular's `LOCALE_ID`. Localization affects date/time patterns, month and weekday names, AM/PM indicators, and related formatting symbols.

The default locale can be changed at runtime as follows:

```ts
import {inject} from '@angular/core';
import {SCI_LOCALE} from '@scion/components/common';

inject(SCI_LOCALE).set('de-CH');
```

To override the locale for a single column, use the `locale` property:

```ts
import {table} from '@scion/components/table';

table(users.value, table => table.addDateColumn({
  header: 'Daily Digest Time',
  value: user => user.dailyDigestTime,
  format: 'HH:mm',
  locale: 'de-CH', // <--- Set the locale
}));
```

Angular includes only `en-US` by default. Register other locales via `registerLocaleData()`, typically in an environment initializer at app startup:

```ts
import {bootstrapApplication} from '@angular/platform-browser';
import {provideEnvironmentInitializer} from '@angular/core';
import {registerLocaleData} from '@angular/common';

import localeDeCH from '@angular/common/locales/de-CH';
import localeFrCH from '@angular/common/locales/fr-CH';
import localeItCH from '@angular/common/locales/it-CH';

bootstrapApplication(AppComponent, {
  providers: [
    provideEnvironmentInitializer(() => {
      registerLocaleData(localeDeCH);
      registerLocaleData(localeFrCH);
      registerLocaleData(localeItCH);
    }),
  ],
});
```

### Custom Columns

Custom columns allow for custom cell rendering by specifying either a component or a template. Custom columns can be added using the `addComponentColumn()` or `addTemplateColumn()` methods.

To add a component column, specify the component and input bindings via the `component` property.

```ts
import {table} from '@scion/components/table';
import {inputBinding} from '@angular/core';

table(users.value, table => table.addComponentColumn({
  header: 'Status',
  component: user => ({ // <--- Set the component
    component: StatusComponent,
    bindings: [
      inputBinding('status', () => user.status),
    ],
  }),
  filterable: {matcher: (text, context) => matchesStatus(context.item, text)}, // `matchesStatus` is illustrative
  sortable: {comparator: (a, b) => compareStatus(a.item, b.item)}, // `compareStatus` is illustrative
}));
```

To add a template column, specify the template via the `template` property. The template can be injected using the `viewChild()` function using its name.

```ts
import {table} from '@scion/components/table';
import {TemplateRef, viewChild} from '@angular/core';

// Inject the template
const statusTemplate = viewChild.required<TemplateRef<User>>('status');

table(users.value, table => table.addTemplateColumn({
  header: 'Status',
  template: () => ({template: statusTemplate}),  // <--- Set the template
  filterable: {matcher: (text, context) => matchesStatus(context.item, text)}, // `matchesStatus` is illustrative
  sortable: {comparator: (a, b) => compareStatus(a.item, b.item)}, // `compareStatus` is illustrative
}));
```

An explicit binding is usually not required because the item is available via default template variable (`let-user`).

```html

<ng-template #status let-user>
  <!-- chip is illustrative -->
  <app-chip>{{user.status}}</app-chip>
</ng-template>
```

> [!IMPORTANT]
> In order to be filterable and sortable, custom columns require an explicit filter matcher and sort comparator.

### Column Width

By default, columns have an equal width of `1fr`. The available space is distributed equally among the columns.

You can set an explicit width for a column via its `width` property, either as an absolute value (`px`) or as a fraction (`fr`).

Columns with an absolute width do not grow or shrink, but they can still be resized by the user. Columns with a fractional width are distributed proportionally based on their ratio (`fr`) within the available space.

### Table Configuration

The `table()` function provides an overload for passing a descriptor to configure data, columns, and features.

```ts
import {table} from '@scion/components/table';
import {httpResource} from '@angular/common/http';

const users = httpResource<User[]>(() => 'users', {defaultValue: []});

const userTable = table({
  datasource: users.value,
  filterable: true,
  selectable: 'single',
  wrapHeader: true,
  columns: table => table
    .addNumberColumn('ID', user => user.id)
    .addStringColumn('Name', user => user.name)
    .addBooleanColumn('Inactive', user => user.inactive)
    .addDateColumn('Expiration', user => user.expiration),
});
```

The descriptor contains options for configuring the table, such as whether the table can be filtered and sorted, whether rows can be selected (and if so, whether single or multiple), whether column headers should be displayed, as well as properties for configuring row actions and row bindings.

#### Filtering

A table can be configured to display column filters, allowing users to filter the table by column.

```ts
import {table} from '@scion/components/table';

table({
  datasource: users.value,
  filterable: true, // <--- enable column filtering 
  columns: table => table
    .addNumberColumn('ID', user => user.id)
    .addStringColumn('Name', user => user.name)
    .addBooleanColumn('Inactive', user => user.inactive)
    .addDateColumn('Expiration', user => user.expiration),
});
```

Built-in columns of a table are filterable by default, using a default matcher which can be overridden at the column level via `filterable` property.

Custom columns (`component` or `template` columns) cannot be filtered unless a matcher is configured in the column's `filterable` property.

```ts
import {table} from '@scion/components/table';

table(users.value, table => table
  .addComponentColumn({
    component: user => ({component: UserComponent, bindings: [inputBinding('user', () => user)]}),
    filterable: {matcher: (text, context) => matchesUser(context.item, text)}, // `matchesUser` is illustrative
  })
  .addTemplateColumn({
    template: () => ({template: userTemplate}),
    filterable: {matcher: (text, context) => matchesUser(context.item, text)}, // `matchesUser` is illustrative
  }),
);
```

In addition to column filters, `SciTable` provides a `filter()` method for filtering items cross-column, useful if the application provides a table filter field.

```ts
import {table} from '@scion/components/table';

const userTable = table(users.value, table => table
  .addNumberColumn('ID', user => user.id)
  .addStringColumn('Name', user => user.name)
  .addBooleanColumn('Inactive', user => user.inactive)
  .addDateColumn('Expiration', user => user.expiration),
);

userTable.filter('...');
```

#### Sorting

Built-in table columns are sortable by default. Sorting can be disabled at the table or column level via the `sortable` property. Columns can configure a custom comparator.

```ts
import {table} from '@scion/components/table';

table({
  datasource: users.value,
  sortable: false, // <--- disable column sorting 
  columns: table => table
    .addNumberColumn('ID', user => user.id)
    .addStringColumn('Name', user => user.name)
    .addBooleanColumn('Inactive', user => user.inactive)
    .addDateColumn('Expiration', user => user.expiration),
});
```

Custom columns (`component` or `template` columns) cannot be sorted unless a comparator is configured in the column's `sortable` property.

```ts
import {table} from '@scion/components/table';

table(users.value, table => table
  .addComponentColumn({
    component: user => ({component: UserComponent, bindings: [inputBinding('user', () => user)]}),
    sortable: {comparator: (a, b) => compareUsers(a.item, b.item)}, // `compareUsers` is illustrative
  })
  .addTemplateColumn({
    template: () => ({template: userTemplate}),
    sortable: {comparator: (a, b) => compareUsers(a.item, b.item)}, // `compareUsers` is illustrative
  }),
);
```

#### Selection

The table can be configured to support selection of a single row, multiple rows, or no selection at all.

```ts
import {table} from '@scion/components/table';

const users = httpResource<User[]>(() => 'users', {defaultValue: []});

const userTable = table({
  datasource: users.value,
  selectable: 'single', // <--- limit to single selection
  columns: table => table
    .addNumberColumn('ID', user => user.id)
    .addStringColumn('Name', user => user.name)
    .addBooleanColumn('Inactive', user => user.inactive)
    .addDateColumn('Expiration', user => user.expiration),
});
```

The current selection and active row are available via the `SciTable` instance returned by the `table()` function.

```ts
import {table} from '@scion/components/table';
import {effect, Signal} from '@angular/core';

const userTable = table(users.value, table => table
  .addNumberColumn('ID', user => user.id)
  .addStringColumn('Name', user => user.name)
  .addBooleanColumn('Inactive', user => user.inactive)
  .addDateColumn('Expiration', user => user.expiration),
);

effect(() => {
  const selection = userTable.selectedItems();
  const activeItem = userTable.activeItem();
});
```

#### Row Actions

Row actions enable interaction with a row and appear when the user hovers over a row. Row actions can be buttons or menus.

Row actions are configured via the `rowActions` property on the table descriptor that is passed to the `table()` function.

```ts
import {table} from '@scion/components/table';

table({
  datasource: users.value,
  columns: table => table
    .addNumberColumn('ID', user => user.id)
    .addStringColumn('Name', user => user.name)
    .addBooleanColumn('Inactive', user => user.inactive)
    .addDateColumn('Expiration', user => user.expiration),
  rowActions: (toolbar, user) => toolbar
    .addToolbarButton({icon: 'user_attributes', onSelect: () => openProfile(user)}) // `openProfile` is illustrative
    .addToolbarMenu({icon: 'more_vert', visualMenuIndicator: false}, menu => menu
      .addMenuItem({icon: 'edit', label: 'Edit user', onSelect: () => editUser(user)}) // `editUser` is illustrative
      .addGroup(group => group
        .addMenuItem({icon: 'delete', label: 'Delete user', onSelect: () => deleteUser(user)}) // `deleteUser` is illustrative
        .addMenuItem({icon: 'lock', label: 'Disable user', onSelect: () => lockUser(user)}), // `lockUser` is illustrative
      ),
    ),
});
```

> [!NOTE]
> Icon ligatures are interpreted as Material icon font ligatures if no icon provider is configured. \
> Refer to the [Icon Documentation][link-scion-icons] for more information on how to provide an icon provider.

#### Row Bindings

Table row bindings enable custom row styling or associating HTML attributes or CSS classes with a row.

```ts
import {table} from '@scion/components/table';

table({
  datasource: users.value,
  columns: table => table
    .addNumberColumn('ID', user => user.id)
    .addStringColumn('Name', user => user.name)
    .addBooleanColumn('Inactive', user => user.inactive)
    .addDateColumn('Expiration', user => user.expiration),
  rowBindings: (bindings, user, index) => bindings
    .addPartBinding(user.inactive ? 'row:inactive' : 'row:active') // <--- ::part binding
    .addPartBinding(index % 2 === 0 ? 'row:even' : 'row:odd')
    .addAttributeBinding('data-userid', user.id), // <--- attribute binding
});
```

Part bindings make a row stylable by associating its cells with an [HTML part attribute][link-mdn-part-attribute] that can be referenced in CSS using the [`::part()` CSS pseudo-element selector][link-mdn-part-selector]. A single row can have multiple part bindings.

```scss
sci-table::part(row\:negative) {
  color: red;
}
```

See the [Row/Column Styling](#rowcolumn-styling) section for details.

HTML attribute bindings are useful for end-to-end testing. For example, they can be used to associate a row with an item's primary key.

```ts
document.querySelector('sci-table[name="table:testee"] sci-table-row[data-userid="123"]');
```

### Table Events

The table has the following events:

- **primaryAction**\
  Emits when the user double-clicks a row or presses `Enter` on selected rows.

### User Settings

The table has no user interface for user settings, such as resetting column widths or showing/hiding column filters.
However, the application can read/write table settings via `SciTable` and provide an application-specific settings dialog.

```ts
import {table} from '@scion/components/table';

const userTable = table(users.value, table => table
  .addNumberColumn('ID', user => user.id)
  .addStringColumn('Name', user => user.name)
  .addBooleanColumn('Inactive', user => user.inactive)
  .addDateColumn('Expiration', user => user.expiration),
);

userTable.filterable.set(true);
userTable.showHeader.set(false);
userTable.wrapHeader.set(true);
```

User settings, such as the width of resized columns, are stored in local storage. A different storage can be configured using the `provideTableStorage()` function, for example, to write user settings to a database or disable storage.

```ts
import {bootstrapApplication} from '@angular/platform-browser';
import {provideTableStorage} from '@scion/components/table';

bootstrapApplication(AppComponent, {
  providers: [
    provideTableStorage(CustomTableStorage),
  ],
});
```

The storage must implement the `SciTableStorage` interface and be provided as an Angular service.

```ts
import {Service} from '@angular/core';
import {SciTableStorage} from '@scion/components/table';

@Service()
export class CustomTableStorage implements SciTableStorage {

  public load(name: `scion.components.table:${string}`): Promise<string | null> | string | null {
    // read a value from storage
  }

  public store(name: `scion.components.table:${string}`, value: string): Promise<void> | void {
    // write a value to storage
  }
}
```

### Localization of Column Headers

Column headers can be localized using the built-in [Localization][link-scion-localization] mechanism by passing a `Translatable`. A `Translatable` is a `string` that starts with the percent symbol (`%`). Translatables are passed to registered text providers for translation.

```ts
import {table} from '@scion/components/table';

table(users.value, table => table.addStringColumn('%name.label', user => user.name));
```

A text provider can be registered using the `provideTextProvider()` function. Refer to [Localization][link-scion-localization] for more information.

### Fixed Row Height

All rows in the table must have equal height, which is `2em` by default. The height can be changed per table using the CSS variable `--sci-table-row-height`.

```scss
sci-table {
  --sci-table-row-height: 30px;
}
```

### Table Styling

The default look of `sci-table` can be customized using CSS variables.

A table border can be set directly on the `sci-table` element.

```scss
sci-table {
  border: 1px solid var(--sci-color-border);
  border-radius: var(--sci-corner);
}
```

The background color of the table header can be set using the `--sci-table-header-background-color` CSS variable.

```scss
sci-table {
  --sci-table-header-background-color: var(--sci-color-gray-100);
}
```

Gridlines can be enabled using the `--sci-table-gridline-color` CSS variable.

```scss
sci-table {
  --sci-table-gridline-color: var(--sci-color-border);
}
```

Column header dividers can be hidden using the `--sci-table-header-column-divider` CSS variable.

```scss
sci-table {
  --sci-table-header-column-divider: hidden;
}
```

The following CSS variables are supported:

- `--sci-table-gridline-color`
- `--sci-table-header-height`
- `--sci-table-header-cursor`
- `--sci-table-header-background-color`
- `--sci-table-header-background-color-hover`
- `--sci-table-header-font-family`
- `--sci-table-header-font-size`
- `--sci-table-header-font-weight`
- `--sci-table-header-text-color`
- `--sci-table-header-column-divider`
- `--sci-table-row-height`
- `--sci-table-row-background-color-hover`
- `--sci-table-row-background-color-selected`
- `--sci-table-row-border-radius`
- `--sci-table-row-outline-color`
- `--sci-table-row-outline-width`
- `--sci-table-row-outline-style`
- `--sci-table-row-action-background-color`
- `--sci-table-row-action-background-color-selected`
- `--sci-table-cell-padding-inline`

Refer to [SCION Design Tokens][link-scion-design-tokens] for more information on customizing the default look of SCION components and supporting different themes.

To change default cell styles, like `text-align`, `user-select`, or `font-variant-numeric`, use the [`::part()` CSS pseudo-element selector][link-mdn-part-selector] as described in the [Row/Column Styling](#rowcolumn-styling) section.

### Row/Column Styling

Cells can be styled using the [`::part()` CSS pseudo-element selector][link-mdn-part-selector] by referencing part names contributed to the cell's [HTML `part` attribute][link-mdn-part-attribute].

- **Rows** can register [row bindings](#row-bindings) to contribute part names to the HTML `part` attribute of their cells.
- **Columns** automatically contribute their name (`column:name`) and data type (`column:datatype`) to the HTML `part` attribute of their cells.

Cells can also be styled conditionally based on the row state. When setting a custom background color, conditional styling is recommended to avoid covering the default background color of selected rows.

- **row:selected / row:not:selected** \
  Applied when a row is selected or not selected.
- **row:active / row:not:active** \
  Applied when a row is active or not active.

**Styling Rows**

Style cells in rows matching a row binding (e.g., `row:some-row`):

```scss
sci-table::part(row\:some-row) {
  font-weight: 600;
}
```

```scss
sci-table::part(row\:even row\:not\:selected) {
  background-color: lightgray;
}
```

See [row bindings](#row-bindings) for how to register a `part` row binding.

**Styling Columns**

Style cells in columns of a specific column data type:

```scss
sci-table::part(column\:number) {
  font-variant-numeric: normal;
}

sci-table::part(column\:string) {
  text-align: center;
}
```

Style cells in a column of a specific column name (e.g., `column:some-column`):

```scss
sci-table::part(column\:some-column) {
  text-align-last: justify;
  user-select: text;
}
```

**Styling Specific Cells**

Style a cell at the intersection of a specific row binding and column name:

```scss
sci-table::part(row\:some-row column\:some-column) {
  text-align-last: justify;
}
```

> [!NOTE]
> In CSS `::part()` selectors, separate multiple part names with a space (` `) to match cells having all specified part names.

> [!NOTE]
> In CSS `::part()` selectors, escape colons within part names using a backslash (`\:`).

> [!TIP]
> Use conditional styling based on the row state when setting a custom background color.
>
> ```scss
> sci-table::part(row\:even row\:not\:selected) {
>   background-color: lightgray;
> }
> ```

> [!TIP]
> - Set the `user-select` CSS property to `text` to make text in a cell selectable.
> - Set the `text-align` or `text-align-last` CSS property to align text in a column.
> - Set the `font-variant-numeric` CSS property to `normal` to disable tabular figures in a column.


[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

[link-scion-components]: /docs/site/scion-components.md
[link-scion-design-tokens]: /docs/site/scion-design-tokens.md
[link-scion-localization]: /docs/site/scion-localization.md
[link-scion-icons]: /docs/site/scion-icons.md
[link-mdn-part-attribute]: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/part
[link-mdn-part-selector]: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::part
