TODO TABLE DWIE/MARC
====================

Pending
- is loader called in reactive context or injection context -> dispose injection context
- Tastatursteuerung
- Ctrl-End, Ctrl-Home
- PageUp, PageDown
- How To (Dokumentation)
- Injection Context in Loader (für Cleanup)

Tests
- Add test that resizable can be overriden hat component level


Bugs
- BufferSize 1 geht nicht
- bgcolor row actions im dark theme
- ensure unique column name (challenge of auto-named rows)
- change default that filters are not visible by default

Feature für nächstes PI
- Resource als datasource?
- Icon column?
- Cell alignment (left, right, center)
- Workbench active view/part color (selection, active row color)

Nice
- Umstellung Test für async Datasource als e2e tests
- column header zu column label

TODO Styling
- Background color should be transparent (peripheral, non-peripheral)
- Hide splitter when hovering row actions
- background color of row actions
- animate skeletons
- index auf context wegen row styling (zebra style)





//   // 1. Check if column was already resized and use this value.
//   // 2. Check if column is a fraction, use the fraction ratio.
//   // 3. Use the computed column width in px.

UNIT FÜR WITH: fr, px, em, ...
hover on drag für test stability

    &.resizing {
      --sci-splitter-background-color: var(--sci-table-active-color);
    }
	
    fit('should update table on data change', async () => {
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);
      const sciTable = table('table:testee', data, table => table.addNumberColumn(i => i.id), {injector: TestBed.inject(Injector)});
      const fixture = TestBed.createComponent(SciTableComponent, {bindings: [inputBinding('table', () => sciTable)]});
      await fixture.whenStable();
      {
        const table = new TablePO(fixture);
        expect(table.rows.length).toEqual(3);

        data.update(d => d.concat({id: 4}));
        await fixture.whenStable();
        expect(table.rows.length).toEqual(4);
      }
    });
