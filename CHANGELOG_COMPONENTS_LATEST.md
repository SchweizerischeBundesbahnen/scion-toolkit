# [22.7.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/components-22.6.0...components-22.7.0) (2026-11-11)


### Features

* **components/table:** support displaying hierarchical data ([c96b52b](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/c96b52b0f263e9f567df6dad6abe8b6dc58395d4))
* **components/tree:** provide tree component to display a tree structure ([2fcfcbe](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/2fcfcbe2d8e9949e55a2fa2951554483e1cb63a1))

### Dependencies

* **components:** SCION Components requires `@scion/toolkit` `v2.5.0` or higher.

### BREAKING CHANGES

* **components/table:** Changed the type of `SciTableEvent.items`, `SciTable.activeItem`, and `SciTable.selectedItems` from item instances (`T`) to item identities (`ID`).
  - `SciTableEvent.items`: `T[]` -> `ID[]`
  - `SciTable.activeItem`: `Signal<T | undefined>` -> `Signal<ID | undefined>`
  - `SciTable.selectedItems`: `Signal<T[]>` -> `Signal<ID[]>`
