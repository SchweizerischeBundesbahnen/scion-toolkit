<a href="/README.md"><img src="/docs/branding/scion-toolkit.svg" height="50" alt="SCION Toolkit"></a>

| SCION Toolkit | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Toolkit][menu-home] > Operators

The NPM sub-module `@scion/toolkit/operators` provides a set of useful RxJS operators. It has no dependency on the Angular framework.

To use the operators, install the NPM module `@scion/toolkit` as following:
 
```
npm install --save @scion/toolkit
```

<details>
  <summary><strong>filterArray</strong></summary>
   
  Filters items in the source array and emits an array with items satisfying given predicate.

   ```typescript
   import { filterArray } from '@scion/toolkit/operators';

   of(['a', 'b', 'c'])
     .pipe(filterArray(item => item === 'b'))
     .subscribe(items => {
         console.log(items); // prints ['b']
     });
   ```

</details>

<details>
  <summary><strong>pluckArray</strong></summary>
  
  Maps each element in the source array to its extracted property using the passed extract function.
   
  ```typescript
  import { pluckArray } from '@scion/toolkit/operators';

  const persons = [
    {name: 'John', age: 42},
    {name: 'Anna', age: 38},
    {name: 'Jack', age: 25},
  ];

  of(persons)
    .pipe(pluckArray(person => person.name))
    .subscribe((names: string[]) => {
      console.log(names); // prints ['John', 'Anna', 'Jack']
    });
  ```

</details>

<details>
  <summary><strong>sortArray</strong></summary>
  
  Sorts items in the source array and emits an array with those items sorted.
  
  ```typescript
  import { sortArray } from '@scion/toolkit/operators';

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
  import { tapFirst } from '@scion/toolkit/operators';
  of('a', 'b', 'c')
    .pipe(tapFirst(firstItem => console.log(firstItem))) // prints 'a'
    .subscribe(items => {
      ...
    });
  ```

</details>

 
[menu-home]: /README.md
[menu-projects-overview]: /docs/projects-overview.md
[menu-changelog]: /docs/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/sponsoring.md

