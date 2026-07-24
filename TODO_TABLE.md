# TODO

- Table Model Interface aufräumen und nur die sachen exposen, die es auch wirklich braucht
- Mouseleave auf Rows
- Scroll auf resize und row actions
- Sortierung / Filter für demo page slow data source
- Column Names / Table Name. Was brauchen wir?

## 2. Prio
- Native Scrollbar overlaps mit header auf MacOS
- Table Selection refactor (unterschiedliche selection types)

## Tests
- Viewport vergrössern / verkleinern
  - Beim vergrössern sollte die PageSize grösser werden, verkleinern sollte nichts machen

# Dev Fragen
- Selection mit shift über mehrere Pages
  - Vorschlag: Falls Pages nicht geladen sind, wird bei shift click nur das letzte Element selektier.
- Primary Action, Single / Double Click. Was bieten wir an? Wie benennen wir es?
  - Vorschlag: `primaryAction` für double click / enter. Single Click wird für den Moment nicht angeboten.
- Braucht es für die row actions eine eigene Abstraktion? (für responsive menus)
  - Vorschlag: Nein, falls es irgendeinmal ein responsive Menu geben sollte, muss das dann halt additiv auf der API angeboten werden.
- Wann wollen wir die Table persistieren? OnColumnChange, explizit bei z.B. onResizeEnd. Was wollen wir alles persistieren (width, sort, filter, etc.)?

# UX Fragen
- Table selection mit shift
- row actions verstecken, wenn mehrere rows selektiert sind?
- Müssen row actions responsive sein?
- Sollen die row actions nur on hover kommen oder auch beim active item?
  - Variante: Wie Intellij (Commit View) beide, hover und active item.
- Boolean filter so ok?
- True-False values icons?
- Sortier-Icons werden noch gebraucht.
- Global table actions?
- Muss die header Höhe via config anpassbar sein? (filter / header labels)
- Sollten zuerst die "fraction" columns kleiner werden und erst danach geschoben während dem Resizing?
- Filter icon indicator wenn gefiltert ist?
