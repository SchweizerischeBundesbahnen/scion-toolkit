# TODO

- Neue icons in icon font und integrieren (z.B. sort icons für spalten)
- Call loader fn in injection context (separate context per call to release resources)
- Gedanken über tri-state bei Sortierung (erforderlich?)
- Analyze and fix menu group crash
- Neue icons von Jonas integrieren
- Test dass Tabelle in Workbench Microfrontend funktioniert
- Test dass Tabelle mit RemoteDataFetcher funktioniert (Zusammenspiel)
- Table Header
  - only use button if sortable
  - --sci-table-header-height CSS variable should only apply to headers, not filters

# Future Features
- Native Focus für active Row
- Multiline Headers
- Dokumentation
- DataLoaderFn: Add suport to return signal (besides Observable, Promise, Object)
- Icon column
- Cell alignment (left, right, center)
- Workbench Integration: Selected/Active Row nur in accent Farbe wenn part/view Fokus hat
- Animate skeletons
- Verbindung offen halten auf Pages die nicht mehr im Viewport sind?
    - invalidate method on table model?
    - load wenn into viewport?
    - analzyse
    - Problematic: large table with frequent updates -> why should table update for rows not in viewport?
    - Was machen wir bei einem update, delete
    - Cancel page requests
    - Gedanken über updatedaussehalb der aktuellen page gemacht?
- Gedanken über public API von sort und filter (stateful?)
- Scrollbar thumb position mismach bei zoom; Umstellung auf capturePointerPosition, dann Umwandlung auf screenX nicht erforderlich; sci-mousemove disoatcher obsolet

- ## Bugs
- Filter Field Drop Down
  - Anzeige DarkModel
  - allenfalls sci-menu wegen alignment

# UX Fragen
- Wollen wir Splitter wirklich beim Hover auf rows anzeigen? Reicht nicht Cursor? Ruhiger, Hover auf Splitter möglich 
  -> wenn nicht, kann z-index auf toolbar entfernt werden

## Tests
- Add test that filter/sort function on model can be invoked regardless of filterable/sortable of column/table.
- Add test that global setting for filterable/sortable are stronger than column-level filterable/sortable settings


> sci-table {
   font-size: 20px;
}
