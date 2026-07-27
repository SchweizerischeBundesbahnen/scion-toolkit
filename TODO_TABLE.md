# TODO

- Table Model Interface aufräumen und nur die sachen exposen, die es auch wirklich braucht
- Scroll auf resize und row actions
- Column Names / Table Name. Was brauchen wir?

## 2. Prio
- Native Scrollbar overlaps mit header auf MacOS
- Table Selection refactor (unterschiedliche selection types)

## Tests
- Viewport vergrössern / verkleinern
  - Beim vergrössern sollte die PageSize grösser werden, verkleinern sollte nichts machen

# Dev Fragen
- Selection mit shift über mehrere Pages
  - Vorschlag: Falls Pages nicht geladen sind, wird bei shift click nur das letzte Element selektiert.
- Primary Action, Single / Double Click. Was bieten wir an? Wie benennen wir es?
  - Vorschlag: `primaryAction` für double click / enter. Single Click wird für den Moment nicht angeboten.
- Braucht es für die row actions eine eigene Abstraktion? (für responsive menus)
  - Vorschlag: Nein, falls es irgendeinmal ein responsive Menu geben sollte, muss das dann halt additiv auf der API angeboten werden.
- Wann wollen wir die Table persistieren? OnColumnChange, explizit bei z.B. onResizeEnd. Was wollen wir alles persistieren (width, sort, filter, etc.)?

# UX Fragen
- Selection mit shift über mehrere Pages
  - Vorschlag: Falls Pages nicht geladen sind, wird bei shift click nur das letzte Element selektiert.
- Row Actions
  - row actions verstecken, wenn mehrere rows selektiert sind?
  - Müssen row actions responsive sein?
  - Sollen die row actions nur on hover kommen oder auch beim active item?
    - Variante: Wie Intellij (Commit View) beide, hover und active item.
- Global table actions?
  - Kommt noch, aber nicht basis funktionalität
- Boolean Column
  - Boolean filter so ok?
  - True-False values icons ok?
- Header
  - Sortier-Icons werden noch gebraucht.
  - Filter icon indicator wenn gefiltert ist?
  - Muss die header Höhe via config anpassbar sein, oder sollte die immer gleich sein? (filter / header labels)
    - Evtl. zwei Ausprägungen (compact / normal). Nicht x verschiedene Varianten
- Resizing
  - Sollten zuerst die "fraction" columns kleiner werden und erst danach geschoben während dem Resizing?
  - Kann auch in der Tabelle gedragged werden?
  - Ist resizing auf einer row = eine Interaction mit der row, d.h sollte sie selektiert werden beim resizing?


## Entscheidungen

- selection über mehrere pages bei slow data source - ok
- toolbar api so beibehalten - kein extra api
- checkboxes bei select machen je nach Fall schon Sinn. evtl. mit Tree angehen
  - Für den Moment so lassen wies ist.
- row actions nur bei hover
- true false All okay, icons in tabelle
  - Übersetzung via labelprovider auf boolean column
- beim verschieben von spalten soll alles kleiner werden bis min-width erreicht ist
- vertikale linie bei hover anzeigen
- Nur Spaltenbreite wird gespeichert im Moment.
- Globaler Filter wäre cool, Marc und Etienne schauen, ob das noch möglich wäre, für den initial Release.
