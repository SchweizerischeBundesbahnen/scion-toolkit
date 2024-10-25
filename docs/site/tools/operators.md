<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| SCION Toolkit | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Toolkit][menu-home] > [@scion/toolkit][link-scion-toolkit] > Operators

The NPM sub-module `@scion/toolkit/operators` provides a set of useful RxJS operators.

To use the operators, install the NPM module `@scion/toolkit` as following:

```
npm install @scion/toolkit
```

<details>
  <summary><strong>filterArray</strong></summary>

Filters items in the source array and emits an array with items satisfying given predicate.

```typescript
import {filterArray} from '@scion/toolkit/operators';
of(['a', 'b', 'c'])
  .pipe(filterArray(item => item === 'b'))
  .subscribe(items => {
    console.log(items); // prints ['b']
  });
```

</details>

<details>
  <summary><strong>mapArray</strong></summary>

Maps each element in the source array to its mapped value.

```typescript
import {mapArray} from '@scion/toolkit/operators';

const persons = [
  {name: 'John', age: 42},
  {name: 'Anna', age: 38},
  {name: 'Jack', age: 25},
];

of(persons)
  .pipe(mapArray(person => person.name))
  .subscribe((names: string[]) => {
    console.log(names); // prints ['John', 'Anna', 'Jack']
  });
```

</details>

<details>
  <summary><strong>sortArray</strong></summary>

Sorts items in the source array and emits an array with those items sorted.

```typescript
import {sortArray} from '@scion/toolkit/operators';

const persons = [
  {name: 'John', age: 42},
  {name: 'Anna', age: 38},
  {name: 'Jack', age: 25},
];

of(persons)
  .pipe(sortArray((person1, person2) => person1.age - person2.age))
  .subscribe(persons => {
    console.log(persons); // prints [{name: 'Jack', age: 25}, {name: 'Anna', age: 38}, {name: 'John', age: 42}]
  });
```

</details>

<details>
  <summary><strong>tapFirst</strong></summary>

Executes a tap-function for the first perculating value.

```typescript
import {tapFirst} from '@scion/toolkit/operators';
of('a', 'b', 'c')
  .pipe(tapFirst(firstItem => console.log(firstItem))) // prints 'a'
  .subscribe(items => {
    ...
  });
```

</details>

<details>
  <summary><strong>observeIn</strong></summary>

Mirrors the source observable, running downstream operators (operators after the `observeIn` operator) and subscription handlers (`next`, `error`, `complete`) in the given function.

This operator is similar to RxJS's [`observeOn`](https://rxjs.dev/api/operators/observeOn) operator, but instead of a scheduler, it accepts a function.
The function is invoked each time the source emits, errors or completes and must call the provided `doContinue` function to continue.

Use this operator to set up a context for downstream operators, such as inside or outside the Angular zone.

The following example runs downstream operators inside Angular:
```ts
import {inject, NgZone} from '@angular/core';
import {interval} from 'rxjs';
import {tap} from 'rxjs/operators';
import {observeIn} from '@scion/toolkit/operators';

// Code running outside the Angular zone.
const zone = inject(NgZone);

interval(1000)
  .pipe(
    tap(() => ...), // runs outside Angular
    observeIn(doContinue => zone.run(doContinue)),
    tap(() => ...), // runs inside Angular
  )
  .subscribe(() => ...); // runs inside Angular
```
</details>

<details>
  <summary><strong>subscribeIn</strong></summary>

Mirrors the source observable, subscribing to the source in the given function.

This operator is similar to RxJS's [`subscribeOn`](https://rxjs.dev/api/operators/subscribeOn) operator, but instead of a scheduler, it accepts a function.
The function is invoked when subscribing to the source and must call the provided `doSubscribe` function to subscribe.

Use this operator to set up a context for the subscription, such as inside or outside the Angular zone.

The following example illustrates subscribing outside Angular:
```ts
import {inject, NgZone} from '@angular/core';
import {interval} from 'rxjs';
import {subscribeIn} from '@scion/toolkit/operators';

// Code running inside the Angular zone.
const zone = inject(NgZone);

interval(1000)
  .pipe(subscribeIn(doSubscribe => zone.runOutsideAngular(doSubscribe)))
  .subscribe(() => ...);
```
</details>

<details>
  <summary><strong>combineArray</strong></summary>

Combines the Observables contained in the source array by applying `combineLatest`, emitting an array with the latest value of each Observable of the source array. Combines only the Observables of the most recently emitted array.

> Each time the source emits an array of Observables, combines its Observables by subscribing to each of them, cancelling any subscription of a previous source emission.

```typescript
import {combineArray} from '@scion/toolkit/operators';
import {interval} from 'rxjs';
import {map, take} from 'rxjs/operators';

interval(100)
  .pipe(
    map(i => [
      interval(30).pipe(map(ii => [`A(${i};${ii})`, `B(${i};${ii})`])),
      interval(70).pipe(map(ii => [`C(${i};${ii})`])),
    ]),
    combineArray(),
    take(4),
  )
  .subscribe(value => {
    console.log(value);
  });
```
The snippet above prints the following output to the console:
```console
['A(0;1)', 'B(0;1)', 'C(0;0)']
['A(0;2)', 'B(0;2)', 'C(0;0)']
['A(1;1)', 'B(1;1)', 'C(1;0)']
['A(1;2)', 'B(1;2)', 'C(1;0)']
```

</details>

<details>
  <summary><strong>distinctArray</strong></summary>

Removes duplicates of elements in the source array.

```typescript
import {distinctArray} from '@scion/toolkit/operators';
import {of} from 'rxjs';

of(['a', 'b', 'a', 'e', 'b', 'd'])
  .pipe(distinctArray())
  .subscribe(value => {
    console.log(value);
  });
```
The snippet above prints the following output to the console:
```console
['a', 'b', 'e', 'd']
```

</details>

<details>
  <summary><strong>bufferUntil</strong></summary>

Buffers the source Observable values until `closingNotifier$` notifier resolves, emits or completes.

Once closed the buffer, emits buffered values as separate emission per buffered value, in the order as collected.
After that, mirrors the source Observable, i.e., emits values as they arrive.

Unlike `bufferWhen` RxJS operator, the buffer is not re-opened once closed.

```typescript
import {bufferUntil} from '@scion/toolkit/operators';
import {Subject} from 'rxjs';

const source$ = new Subject();
const notifier$ = new Subject();

source$
  .pipe(bufferUntil(notifier$))
  .subscribe(value => {
    console.log(value);
  });

// Emit A and B, then close the buffer, then emit C
console.log('before A');
source$.next('A');
console.log('after A');

console.log('before B');
source$.next('B');
console.log('after B');

console.log('before closing the buffer');
buffer$.complete();
console.log('after closing the buffer');

console.log('before C');
source$.next('C');
console.log('after C');  
```
The snippet above prints the following output to the console:
```console
'before A'
'after A'
'before B'
'after B'
'before closing the buffer'
'A'
'B'
'after closing the buffer'
'before C'
'C
'after C'
```

</details>

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

[link-scion-toolkit]: /docs/site/scion-toolkit.md
