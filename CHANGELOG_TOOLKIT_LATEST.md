# [2.0.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/toolkit-1.6.2...toolkit-2.0.0) (2025-06-06)


### Features

* **toolkit/util:** add generic to `Dictionaries.withoutUndefinedEntries` signature ([477d095](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/477d095a509d402f1c4058e3d038dab58d239da7))
* **toolkit/util:** allow passing an iterable of tuples to `Dictionaries.coerce()` ([12de536](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/12de536abd471ab63100c65087a720b4f51d0270))
* **toolkit/util:** allow passing an iterable of tuples to `Maps.coerce()` ([5f7d737](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/5f7d737cd9936f4a31d5750bf86e7380e87a556f))

### Bug Fixes

* **toolkit/observable:** align document root element with page viewport ([b86736c](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/b86736ce6251277bd245ccf35855f28566ca5512))


### Code Refactoring

* **toolkit/observable:** remove deprecated `fromDimension$` observable ([e836d20](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/e836d2020c4bdf5a9bbb05220aca3e5212050225))
* **toolkit/operators:** remove deprecated `subscribeInside` and  `observeInside` operators ([db2b9d0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/db2b9d06df3e2c745f7f78efd2b26acac755026b))

### BREAKING CHANGES

* **toolkit/operators:** Removed deprecated `subscribeInside` operator.
  Use `subscribeIn` from `@scion/toolkit/operators` instead. Migrating to `subscribeIn` may break your operator chain. Unlike `subscribeInside`, `subscribeIn` only wraps the subscription, not the downstream operators. Depending on your observable's emission, an additional `observeIn` may be necessary.

* **toolkit/operators:** Removed deprecated `observeInside` operator.
  Use `observeIn` from `@scion/toolkit/operators` instead.

* **toolkit/observable:** Removed deprecated `fromDimension$` observable.
  Use `fromResize$` from `@scion/toolkit/observable` instead.

* **toolkit/observable:** Removed deprecated `captureElementDimension` function.
  Read the size of an element using its `getBoundingClientRect` function or from its `clientWidth`, `clientHeight`, `offsetWidth` or `offsetHeight` properties.
