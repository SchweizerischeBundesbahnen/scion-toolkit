TODO TABLE

- check whether column name must be unique
- is loader called in reactive context or injection context -> dispose injection context

- prevent flickering when resizing in table header

- add test to not display splitters during scrolling, also if only pressing the thumb
- Add test that resizable can be overriden hat component level
- add test to have stable column width when scrolling a column with different cell content length
- add test to scroll viewport horizontally over header
- add test to not scroll viewport vertically over header

- moving splitters fast causes pointer mismatch
- change default that filters are not visible by default
- add test to prevent vertical scrolling while hovering the header, but not horizontal scrolling
- resource als datasource?
- icon column?
- cell alignment?
-

TODO Styling
- Background color should be transparent (peripheral, non-peripheral)
- Hide splitter when hovering row actions
- background color of row actions
- animate skeletons


Pending
- Tastatursteuerung
- Ctrl-End, Ctrl-Home
- PageUp, PageDown
- How To (Dokumentation)
- Injection Context in Loader (für Cleanup)

rename header to label (ist das label des headers, header ist alles)

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
