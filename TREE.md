# Entscheidungen
- Chevron für toggle auf ColumnDescriptor, falls mehrmals gesetzt => Fehler, falls keines gesetzt => Erste Column als Toggle nehmen.
  - Falls aufwändig, für den Anfang einfach nur auf der ersten Column // Remove after rebase

# TODO
- Howto markdown für tree, für Tabelle erweitern
- Tests
  - Für tree Tests: nur die API relevanten Sachen testen, der Rest soll über hierarchische Tabelle abgedeckt werden (z.B. keyboard navigation)
- Für den storage: muss der name mit table: anfangen? für tree komisch.
  - Evtl. storage extrahieren in common
- Selection scrollActiveRowIntoViewport 1px daneben (ganzer Border sollte sichtbar sein)

- chevron wie icon