<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| SCION Toolkit | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
|---------------|---------------------------------------------|-----------------------------|-----------------------------------|-------------------------------|

## [SCION Toolkit][menu-home] > [@scion/components][link-scion-components] > Tree

The NPM sub-module `@scion/components/tree` provides an Angular component for displaying a tree structure in Angular applications.

***
**Content:**

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Tree Configuration](#tree-configuration)
    - [Label](#label)
    - [Datasource](#datasource)
    - [Item Identity](#item-identity)
    - [Filtering](#filtering)
    - [Selection](#selection)
    - [Node Actions](#node-actions)
    - [Node Icon](#node-icon)
    - [Node Bindings](#node-bindings)
- [Tree Events](#tree-events)
- [User Settings](#user-settings)
- [Fixed Node Height](#fixed-node-height)
- [Tree Styling](#tree-styling)
- [Node Styling](#node-styling)

***
Click [here](https://components.scion.vercel.app/#/sci-tree) for a demo of the tree component.
***

### Installation

Install `@scion/components` and required dependencies from NPM:

```
npm install @scion/components @scion/toolkit @angular/cdk
```

Import required styles and icons in `src/styles.scss`.

```scss
@use '@scion/components';
@import url('https://cdn.jsdelivr.net/npm/@scion/icons/scion-icon-font.css');
```

### Basic Usage

Create a tree using the `tree()` function.

```ts
import {SciTreeComponent, tree, provideTreeDatasource} from '@scion/components/tree';
import {httpResource} from '@angular/common/http';

// Load data to display in the tree.
const files = httpResource<File[]>(() => '/api/files', {defaultValue: []});

// Create the tree and pass data.
const fileTree = tree({
  label: file => file.name,
  datasource: provideTreeDatasource(files.value, file => file.children),
});
```

> [!NOTE]
> Examples in this guide use a `File` entity to showcase `sci-tree` usage. File-related types and functions are illustrative and not part of the API.

In the HTML, bind the tree instance returned by the `tree()` function to `<sci-tree>` and assign it a name. The name must start with the `tree:` prefix and is used to store user settings.

```html
<sci-tree name="tree:files" [tree]="fileTree"/>
```

### Tree Configuration

The `tree()` function takes a descriptor to configure the tree. The descriptor requires at minimum a `datasource` and a node `label`.

```ts
import {tree, provideTreeDatasource} from '@scion/components/tree';
import {httpResource} from '@angular/common/http';

const files = httpResource<File[]>(() => '/api/files', {defaultValue: []});

const fileTree = tree({
  label: file => file.name,
  datasource: provideTreeDatasource(files.value, file => file.children),
});
```

The descriptor provides additional options for configuring the tree, such as filtering, node selection, node actions, node bindings, and more.

#### Label

The label can be defined as a function returning text or as a [custom label](#custom-label) using a component or template.

#### String Label

To define a string label, provide a function that receives a node's data and returns the text to display.

```ts
import {tree, provideTreeDatasource} from '@scion/components/tree';

tree({
  label: file => file.name,
  datasource: provideTreeDatasource(files.value, file => file.children),
});
```

#### Custom Label

Custom node content can be rendered using a component or template.

To render the label from a component, specify the component and its input bindings using the `component` property.

```ts
import {tree, provideTreeDatasource} from '@scion/components/tree';
import {inputBinding} from '@angular/core';

tree({
  label: {
    component: file => ({
      component: FileComponent, // <--- Set the component
      bindings: [
        inputBinding('name', () => file.name),
      ],
    }),
  },
  datasource: provideTreeDatasource(files.value, file => file.children),
  matcher: (text, context) => matchesFile(context.item, text),
});
```

To render the label from a template, specify the template using the `template` property. The template can be injected using the `viewChild()` function using its name.

```ts
import {tree, provideTreeDatasource} from '@scion/components/tree';
import {TemplateRef, viewChild} from '@angular/core';

// Inject the template
const fileTemplate = viewChild.required<TemplateRef<File>>('fileTemplate');

tree({
  label: {
    template: () => ({template: fileTemplate}), // <--- Set the template
  },
  datasource: provideTreeDatasource(files.value, file => file.children),
  matcher: (text, context) => matchesFile(context.item, text),
});
```

An explicit binding is usually not required because the item is available via default template variable (`let-file`).

```html
<ng-template #fileTemplate let-file>
  <app-file>{{file.name}}</app-file>
</ng-template>
```

> [!IMPORTANT]
> In order to be filterable, custom labels require a matcher defined via `SciTreeDescriptor.matcher` property.

#### Datasource

The tree requires a datasource to provide items for display. Use the `provideTreeDatasource()` function to create a datasource, passing a signal containing the root items and a
function that returns the children of a given item.

```ts
import {tree, provideTreeDatasource} from '@scion/components/tree';
import {httpResource} from '@angular/common/http';

const files = httpResource<File[]>(() => '/api/files', {defaultValue: []});

tree({
  label: file => file.name,
  datasource: provideTreeDatasource(files.value, file => file.children),
});
```

#### Item Identity

Each item must have a unique and stable identity. Defaults to the item object reference. Use the `trackBy` property to specify the item identity instead.

```ts
import {tree, provideTreeDatasource} from '@scion/components/tree';

tree({
  label: file => file.name,
  datasource: provideTreeDatasource(files.value, file => file.children),
  trackBy: file => file.id,
});
```

#### Filtering

The tree does not provide a filter field. The application can implement its own filter field and use the `filter()` method to filter the tree.

String labels are filterable by default. To customize the matching behavior, specify a matcher function via the `matcher` property.

```ts
import {tree, provideTreeDatasource} from '@scion/components/tree';

tree({
  label: file => file.name,
  datasource: provideTreeDatasource(files.value, file => file.children),
  matcher: (text, context) => matchesFile(context.item, text), // custom matcher
});
```

Custom labels (`component` or `template`) are not filterable by default. To enable filtering for these labels, specify a matcher function via the `matcher` property.

```ts
import {tree, provideTreeDatasource} from '@scion/components/tree';

// Component
tree({
  label: {component: file => ({component: FileComponent, bindings: [inputBinding('name', () => file.name)]})},
  datasource: provideTreeDatasource(files.value, file => file.children),
  matcher: (text, context) => matchesFile(context.item, text),
});

// Template
tree({
  label: {template: () => ({template: fileTemplate})},
  datasource: provideTreeDatasource(files.value, file => file.children),
  matcher: (text, context) => matchesFile(context.item, text),
});
```

If the application provides a filter field, use the `filter()` method to apply the entered filter text. The method accepts a string and filters the tree using the configured matcher.

```ts
import {tree, provideTreeDatasource} from '@scion/components/tree';

const fileTree = tree({
  label: file => file.name,
  datasource: provideTreeDatasource(files.value, file => file.children),
});

fileTree.filter('...');
```

#### Selection

The tree can be configured to support selection of a single node, multiple nodes, or no selection at all.

```ts
import {tree, provideTreeDatasource} from '@scion/components/tree';

tree({
  label: file => file.name,
  datasource: provideTreeDatasource(files.value, file => file.children),
  selectable: 'single', // <--- limit to single selection
});
```

The current selection and active node are available via the `SciTree` instance returned by the `tree()` function.

```ts
import {tree, provideTreeDatasource} from '@scion/components/tree';
import {effect} from '@angular/core';

const fileTree = tree({
  label: file => file.name,
  datasource: provideTreeDatasource(files.value, file => file.children),
});

effect(() => {
  const selection = fileTree.selectedItems();
  const activeItem = fileTree.activeItem();
});
```

Nodes can be selected programmatically using the `select()` method. Pass a single ID or an array of IDs to select multiple nodes.

```ts
import {tree, provideTreeDatasource} from '@scion/components/tree';

const fileTree = tree({
  label: file => file.name,
  datasource: provideTreeDatasource(files.value, file => file.children),
});

// Select a single node
fileTree.select('README.md');

// Select multiple nodes
fileTree.select(['README.md', 'package.json']);
```

#### Expansion

Nodes can be expanded or collapsed programmatically using the `expandAll()` and `collapseAll()` methods.

```ts
import {tree, provideTreeDatasource} from '@scion/components/tree';

const fileTree = tree({
  label: file => file.name,
  datasource: provideTreeDatasource(files.value, file => file.children),
});

// Expand all nodes
fileTree.expandAll();

// Collapse all nodes
fileTree.collapseAll();
```

#### Node Actions

Node actions enable interaction with a node and appear when the user hovers over a node. Node actions can be buttons or menus.

Node actions are configured via the `nodeActions` property on the tree descriptor that is passed to the `tree()` function.

```ts
import {tree, provideTreeDatasource} from '@scion/components/tree';

tree({
  label: file => file.name,
  datasource: provideTreeDatasource(files.value, file => file.children),
  nodeActions: (toolbar, file) => toolbar
    .addToolbarButton({icon: 'download', tooltip: 'Download', visible: file.type === 'file', onSelect: () => downloadFile(file)})
    .addToolbarMenu({icon: 'more_vert', visualMenuIndicator: false}, menu => menu
      .addMenuItem({icon: 'edit', label: 'Rename', onSelect: () => renameFile(file)})
      .addMenuItem({icon: 'share', label: 'Share', onSelect: () => shareFile(file)})
      .addGroup(group => group
        .addMenuItem({icon: 'delete', label: 'Delete', onSelect: () => deleteFile(file)}),
      ),
    ),
});
```

> [!NOTE]
> Icon ligatures are interpreted as Material icon font ligatures if no icon provider is configured. \
> Refer to the [Icon Documentation][link-scion-icons] for more information on how to provide an icon provider.

#### Node Icon

A node can display an icon before its label by adding an icon binding.

```ts
import {tree, provideTreeDatasource} from '@scion/components/tree';

tree({
  label: file => file.name,
  datasource: provideTreeDatasource(files.value, file => file.children),
  nodeBindings: (bindings, file) => file.type === 'file' ? bindings.addIconBinding('description') : bindings.addIconBinding('folder'),
});
```

> [!NOTE]
> Icon ligatures are interpreted as Material icon font ligatures if no icon provider is configured. \
> Refer to the [Icon Documentation][link-scion-icons] for more information on how to provide an icon provider.

#### Node Bindings

Node bindings enable custom node styling or associating HTML attributes or CSS classes with a node.

```ts
import {tree, provideTreeDatasource} from '@scion/components/tree';

tree({
  label: file => file.name,
  datasource: provideTreeDatasource(files.value, file => file.children),
  nodeBindings: (bindings, file, index) => bindings
    .addPartBinding(file.locked ? 'node:locked' : undefined) // <--- ::part binding
    .addAttributeBinding('data-filename', file.name), // <--- attribute binding
});
```

Part attribute bindings make a node stylable by associating its content with one or more [HTML part attributes][link-mdn-part-attribute] that can be referenced in CSS using the [`::part()` CSS pseudo-element selector][link-mdn-part-selector].

```scss
sci-tree::part(node\:locked) {
  color: grey;
}
```

See the [Node Styling](#node-styling) section for details.

HTML attribute bindings are useful for end-to-end testing. For example, they can be used to associate a node with an item's primary key.

```ts
document.querySelector('sci-tree[name="tree:testee"] sci-table-row[data-filename="README.md"]');
```

> [!NOTE]
> The tree renders its nodes using `sci-table-row` elements. The outermost element is `sci-tree`, while the inner elements retain their `sci-table-*` element names.

### Tree Events

The tree has the following events:

- **primaryAction**\
  Emits when the user double-clicks a node or presses `Enter` on selected nodes.

### Fixed Node Height

All nodes in the tree must have equal height, which is `2em` by default. The height can be changed per tree using the CSS variable `--sci-tree-node-height`.

```scss
sci-tree {
  --sci-tree-node-height: 30px;
}
```

### Tree Styling

The default look of `sci-tree` can be customized using CSS variables.

A tree border can be set directly on the `sci-tree` element.

```scss
sci-tree {
  border: 1px solid var(--sci-color-border);
  border-radius: var(--sci-corner);
}
```

The tree node indent can be set using the `--sci-tree-node-indent` CSS variable.

```scss
sci-tree {
  --sci-tree-node-indent: 1.5em;
}
```

The following CSS variables are supported:

- `--sci-tree-node-height`
- `--sci-tree-node-indent`
- `--sci-tree-node-background-color-hover`
- `--sci-tree-node-background-color-selected`
- `--sci-tree-node-border-radius`
- `--sci-tree-node-outline-color`
- `--sci-tree-node-outline-width`
- `--sci-tree-node-outline-style`
- `--sci-tree-node-action-background-color`
- `--sci-tree-node-action-background-color-selected`

Refer to [SCION Design Tokens][link-scion-design-tokens] for more information on customizing the default look of SCION components and supporting different themes.

To change default node styles, like `text-align`, or `user-select`, use the [`::part()` CSS pseudo-element selector][link-mdn-part-selector] as described in the [Node Styling](#node-styling) section.

### Node Styling

Content of nodes can be styled using the [`::part()` CSS pseudo-element selector][link-mdn-part-selector] by referencing part names contributed to the node's [HTML `part` attribute][link-mdn-part-attribute].

Nodes can register [node bindings](#node-bindings) to contribute part names to the HTML `part` attribute of their nodes.

Node content can also be styled conditionally based on the node state. When setting a custom background color, conditional styling is recommended to avoid covering the default background color of selected nodes.

- **node:selected / node:not:selected** \
  Applied when a node is selected or not selected.
- **node:active / node:not:active** \
  Applied when a node is active or not active.

**Styling Nodes**

Style node content of nodes matching a node binding (e.g., `node:some-node`):

```scss
sci-tree::part(node\:some-node) {
  font-weight: 600;
}
```

```scss
sci-tree::part(node\:some-node node\:active) {
  font-style: italic;
}
```

See [node bindings](#node-bindings) for how to register a `part` node binding.

> [!NOTE]
> In CSS `::part()` selectors, separate multiple part names with a space (` `) to match nodes having all specified part names.

> [!NOTE]
> In CSS `::part()` selectors, escape colons within part names using a backslash (`\:`).

> [!TIP]
> Use conditional styling based on the node state when setting a custom background color.
>
> ```scss
> sci-tree::part(node\:some-node node\:not\:selected) {
>   background-color: lightgray;
> }
> ```

> [!TIP]
> Set the `user-select` CSS property to `text` to make text in a node selectable.

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
[link-scion-localization]: /docs/site/scion-localization.md#locale
