```ts
// Table & Hierarchical Table Examples
{
  const data = signal([]);

  // Array Table
  table(data, table => table);

  table({
      datasource: data,
    },
    table => table);

  table({
      datasource: provideTableDatasource(data),
    },
    table => table);

  // Table Paged
  table({
      datasource: providePageableTableDatasource({
        getItems: request => ({items: [], totalCount: 10}),
      }),
    },
    table => table);

  // Table Tree (not paged, but maybe async)
  table({
    datasource: provideTreeDatasource(data, {
      getChildren: item => item.children,
      hasChildren: item => item.children.length > 0,
    }),
  }, table => table);

  // Table Tree (paged)
  table({
      datasource: providePageableTreeDatasource({
        getItems: request => ({items: [], totalCount: 10}),
        getChildren: (item, request) => ({items: [], totalCount: 10}),
        hasChildren: item => item.children.length > 0,
      }),
    },
    table => table);
}
```

# Fragen
- Soll im Tree / Hierarchische Tabelle, der state gespeichert werden? (welche nodes aufgeklappt sind)

# Entscheidungen
- Chevron für toggle auf ColumnDescriptor, falls mehrmals gesetzt => Fehler, falls keines gesetzt => Erste Column als Toggle nehmen.
  - Falls aufwändig, für den Anfang einfach nur auf der ersten Column

# TODO
- Row expand: sollte auch parents mit expanden
  - Nicht möglich via tree traversal, da wir die Daten evtl. nicht haben (noch nicht geladen sind)
  - API ergänzen, dass man ein Set an Ids reingeben kann, so kann der aufrufer den path zum Item mitgeben
- Row collapse: bei table children nicht collapsen bei Tree schon (to discuss)
- Für selection propagation muss evtl. die DataSource angepasst werden (Alle IDs müssen bekannt sein) würde auch für row expand / collapse helfen 