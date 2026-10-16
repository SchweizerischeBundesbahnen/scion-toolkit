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
- Test / Showcase pages ready machen (datasources, grouping)
- Howto markdown für tree, für Tabelle erweitern
- Tests
  - Für tree Tests: nur die API relevanten Sachen testen, der Rest soll über hierarchische Tabelle abgedeckt werden (z.B. keyboard navigation)
- Dani
  - Für den storage: muss der name mit table: anfangen? für tree komisch.
    - Evtl. storage extrahieren in common
  - Review (v.a. Datasource) mit Dani
