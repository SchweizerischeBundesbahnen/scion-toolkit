# [1.5.0](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/compare/toolkit-1.4.1...toolkit-1.5.0) (2024-10-03)


### Performance Improvements

* **toolkit/observable:** optimize position detection in `fromBoundingClientRect$` ([540b8bb](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/540b8bbdfd968b56ed484a0daf290257105c4d8f))


### Code Refactoring

* **toolkit/operators:** remove deprecated `pluckArray` operator ([6c84329](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/6c84329f8cb6180dee465b6ac1ffc6c660f2029f))
* **toolkit/testing:** remove deprecated `ObserveCaptor#resetValues` method ([10253e6](https://github.com/SchweizerischeBundesbahnen/scion-toolkit/commit/10253e6ab09e22ef43fccd7913eba27fe45541fc))


### BREAKING CHANGES

* **toolkit/testing:** `ObserveCaptor#resetValues` was deprecated and has been removed; use `ObserveCaptor#reset` instead.
* **toolkit/operators:** RxJS operator `pluckArray` was deprecated and has been removed; use `mapArray` instead.



