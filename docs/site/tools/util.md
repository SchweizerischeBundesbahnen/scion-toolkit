<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| SCION Toolkit | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Toolkit][menu-home] > [@scion/toolkit][link-scion-toolkit] > Util

The NPM sub-module `@scion/toolkit/util` provides some utilities for dealing with collections and objects.

To use the utils, install the NPM module `@scion/toolkit` as following:
 
```
npm install @scion/toolkit
```

<details>
  <summary><strong>Arrays</strong></summary>
   
  The `Arrays` utility provides the following methods.
  
  - **coerce**\
    Creates an array from the given value, or returns the value if already an array. If given `null` or `undefined`, by default, returns an empty array.
  - **isEqual**\
    Compares items of given arrays for reference equality.
  - **remove**\
    Removes the specified element from an array, or the elements which satisfy the provided predicate function. The original array will be changed.
  - **distinct**\
    Removes duplicate items from the array. The original array will not be modified.
  - **intersect**\
    Intersects the given arrays, returning a new array containing all the elements contained in every array. Arrays which are `undefined` or `null` are ignored.

</details>

<details>
  <summary><strong>Dictionaries</strong></summary>
   
  The `Dictionaries` utility provides the following methods.
  
  - **coerce**\
    Creates a `Dictionary` from the given dictionary-like object. If given a `Dictionary`, it is returned. If given `null` or `undefined`, by default, returns an empty `Dictionary`.
  - **withoutUndefinedEntries**\
    Returns a new `Dictionary` with `undefined` values removed.

</details>

<details>
  <summary><strong>Maps</strong></summary>
   
  The `Maps` utility provides the following methods.
  
  - **coerce**\
    Creates a `Map` from the given map-like object. If given a `Map`, it is returned. If `null` or `undefined` is given, by default, returns an empty `Map`.
  - **addSetValue**\
    Adds the given value into a `Set` in the multi value `Map<any, Set<any>>`.
  - **removeSetValue**\
    Removes the given value or values matching the given predicate from the multi `Map`.
  - **addListValue**\
    Adds the given value into an `Array` in the multi value `Map<any, any[]>`.
  - **removeListValue**\
    Removes the given value or values matching the given predicate from the multi `Map`.
  - **removeListValue**\
    Removes the given value or values matching the given predicate from the multi `Map`.

</details>

<details>
  <summary><strong>Objects</strong></summary>
   
  The `Objects` utility provides the following methods.
  
  - **isEqual**\
    Compares the two objects for shallow equality.

</details>

<details>
  <summary><strong>Observables</strong></summary>
   
  The `Observables` utility provides the following methods.
  
  - **coerce**\
    Creates an `Observable` from the given value, or returns the value if already an `Observable`. If given a `Promise`, it is converted into an Observable.

</details>

<details>
  <summary><strong>Defined</strong></summary>
   
  The `Defined` utility provides methods to work with `undefined` values. The value `null` is considered as a defined value.
  
  > TypeScript 3.7 introduces the [`nullish coalescing operator`](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#nullish-coalescing) `(??)`, which is similar to the `Defined` function, but also applies for `null` values.
  
  - **orElse**\
    Returns the value, if present, otherwise returns the `orElseValue`, which can be a static value or provided by a supplier function.
  - **orElseThrow**\
    Returns the value, if present, otherwise throws an exception to be created by the provided supplier.

</details>

 
[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

[link-scion-toolkit]: /docs/site/scion-toolkit.md
