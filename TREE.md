```ts
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
    ],
  },
  {
    id: 'D',
    children: [
      {
        id: 'E',
        children: [
          {id: 'F'},
        ],
      },
    ],
  },
]

table({
    data: {
      items: signal(data),
      loadChildren: item => item.children,
      hasChildren: item => item.children.length > 0,
    },
  }, table => {
    table.addNumberColumn({
      label: 'id',
      value: item => item.id,
    });
    table.addNumberColumn({
      label: 'id',
      value: item => item.id,
    });
  },
)


// Simple Api?
table({
    items: signal(data),
    loadChildren: item => item.children,
    hasChildren: item => item.children.length > 0,
  }, table => {
    table.addNumberColumn({
      label: 'id',
      value: item => item.id,
    });
    table.addNumberColumn({
      label: 'name',
      value: item => item.name,
    });
  },
)

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
    }
    else if (treeDescriptor.template) {
      table.addTemplateColumn(treeDescriptor.template)
    }
    else if (treeDescriptor.value) {
      table.addStringColumn(treeDescriptor.value)
    }
    else {
      throw Error('not allowed');
    }
  })
}

tree({
  label: item => item.name,
  header: string,
  sort: (a: SciCellContext<T, string>, b: SciCellContext<T, string>) => number,
  filter: (text: string, context: SciCellContext<T, string>) => boolean,
  sortable?: boolean | {comparator: (a: SciCellContext<T, void>, b: SciCellContext<T, void>) => number},
  filterable?: boolean | {matcher: (text: string, context: SciCellContext<T, void>) => boolean},
  datasource: treeDatasource(data, {
    getChildren: item => item.children,
    hasChildren: item => item.children.length > 0,
  })
},
})


export interface SciNodeContext<T, LABEL> {
  item: T;
  label: LABEL;
}

```

# Fragen
- Soll im Tree / Hierarchische Tabelle, der state gespeichert werden? (welche nodes aufgeklappt sind)

# Entscheidungen
- Chevron für toggle auf ColumnDescriptor, falls mehrmals gesetzt => Fehler, falls keines gesetzt => Erste Column als Toggle nehmen.
  - Falls aufwändig, für den Anfang einfach nur auf der ersten Column
-  
