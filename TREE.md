```ts
import {MaybeObservable} from '@scion/toolkit/types';
import {SciComponentDescriptor, SciTemplateDescriptor} from '@scion/components/common';

// interface TreeNode<T> {
//   node: T;
//   hasChildren: boolean;
//   children?: TreeNode<T>[] | ((node: T) => MaybeObservable<TreeNode<T>[]>);
// }
//
// interface Data {
//   root: T[];
//   fetchChildren: (node: T) => MaybeObservable<TreeNode<T>[]>;
// }

interface SciTreeData<T> {
  items: Signal<T[]> | SciDataLoaderFn<T>;
  loadChildren: (item: T) => MaybeAsync<T>;
  hasChildren: (item: T) => boolean;
}

const data = [
  {
    id: 'A',
    children: [
      {id: 'B'},
      {id: 'C'},
    ]
  },
  {
    id: 'D',
    children: [
      {
        id: 'E',
        children: [
          {id: 'F'},
        ]
      }
    ]
  }
]

table({
  data: {
    items: signal(data),
    loadChildren: item => item.children,
    hasChildren: item => item.children.length > 0
  },
})

interface BaseTreeDescriptor {
  data: SciTreeData<T>;
  filterable?: boolean;
  selectable?: false | 'single' | 'multi';
  rowActions?: SciRowActionFactoryFn<T>;
  rowBindings?: SciTableRowBinding<T>[];
  bufferSize?: number;
  pageSize?: number;
  trackBy?: (item: T) => unknown;
}

interface StringTreeDescriptor extends BaseTreeDescriptor {
  value: (item: T) => string;
}

interface ComponentTreeDescriptor extends BaseTreeDescriptor {
  component: (item: T) => SciComponentDescriptor;
}

interface TemplateTreeDescriptor extends BaseTreeDescriptor {
  template: (item: T) => SciTemplateDescriptor;
}

function tree(treeDescriptor: StringTreeDescriptor | ComponentTreeDescriptor | TemplateTreeDescriptor) {
  table({
    ...treeConfig,
    resizable: false,
    showHeader: false,
  }, table => {
    if (treeDescriptor.component) {
      table.addComponentColumn(treeDescriptor.component)
    } else if (treeDescriptor.template) {
      table.addTemplateColumn(treeDescriptor.template)
    } else if (treeDescriptor.value) {
      table.addStringColumn(treeDescriptor.value)
    } else {
      throw Error('not allowed');
    }
  })
}


tree({
  value: item => item.name,
  data: {
    items: signal(data),
    loadChildren: item => item.children,
    hasChildren: item => item.children.length > 0
  },
  filterable: true,
})
```

# Fragen
- Soll im Tree / Hierarchische Tabelle, der state gespeichert werden? (welche nodes aufgeklappt sind)

# Entscheidungen
- Chevron für toggle auf ColumnDescriptor, falls mehrmals gesetzt => Fehler, falls keines gesetzt => Erste Column als Toggle nehmen.
  - Falls aufwändig, für den Anfang einfach nur auf der ersten Column
-  
