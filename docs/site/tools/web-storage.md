<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| SCION Toolkit | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Toolkit][menu-home] > [@scion/toolkit][link-scion-toolkit] > WebStorage

The NPM sub-module `@scion/toolkit/storage` allows the observation of values contained in local or session storage.

> Local Storage maintains a persistent storage area per origin. Data does not expire and remains after the browser restarts. Session Storage also provides a separate storage area per origin, which, however, is only available for the duration of the page session (as long as the browser is open, including page reloads and restores). Each browser tab has its separate page session.

<details>
  <summary><strong>Installation and Usage</strong></summary>

1. Install `@scion/toolkit` using the NPM command-line tool: 
    ```
    npm install @scion/toolkit
    ```

1. Create an instance of the `WebStorage` class by passing the storage implementor as constructor argument.

   ```typescript
   import {WebStorage} from '@scion/toolkit/storage';
    
   export const sessionStorage = new WebStorage(window.sessionStorage);
   export const localStorage = new WebStorage(window.localStorage);
   ```
   
1. Observe items in the storage, as following:

   ```typescript
   sessionStorage.observe$('key').subscribe(item => {
   });
   ```

***

### For Angular projects

If using Angular, you can provide `WebStorage` for dependency injection into services, components, directives, or pipes.
  
1. Create a `LocalStorage` and `SessionStorage` class, both extending the `WebStorage` class. In the constructor, call the super constructor, passing either `window.localStorage` or `window.sessionStorage`. 
   
   ```typescript
    @Injectable({providedIn: 'root'})
    export class SessionStorage extends WebStorage {
      constructor() {
        super(window.sessionStorage);
      }
    } 
   ```
   
   ```typescript
    @Injectable({providedIn: 'root'})
    export class LocalStorage extends WebStorage {
      constructor() {
        super(window.localStorage);
      }
    }
   ```

2. Inject `LocalStorage` or `SessionStorage`, as following:
   
   ```typescript
    export class YourComponent {
      constructor(private localStorage: LocalStorage, private sessionStorage: SessionStorage) {
      }
    }
   ```
   
***
   
Alternatively, you could also use a DI token to provide `WebStorage` for dependency injection.

1. Create a DI token under which to provide the storage. 

   ```typescript
    export const SESSION_STORAGE = new InjectionToken<WebStorage>('SESSION_STORAGE', {
     factory: () => new WebStorage(window.sessionStorage),
    });
   
    export const LOCAL_STORAGE = new InjectionToken<WebStorage>('LOCAL_STORAGE', {
      factory: () => new WebStorage(window.localStorage),
    });

   ```
2. Inject the storage as following:

   ```typescript
    export class YourComponent {
      constructor(@Inject(SESSION_STORAGE) private sessionStorage: WebStorage,
                  @Inject(LOCAL_STORAGE) private localStorage: WebStorage) {
      }
    }
   ```
</details>

#### Methods:

<details>
  <summary><strong>get</strong></summary>

Returns the item associated with the given key, or `undefined` if not found.
</details>

<details>
  <summary><strong>observe$</strong></summary>

Observes the item associated with the given key.

Upon subscription, it emits the current item from the storage, but, by default, only if present, and then continuously emits when the item associated with the given key changes. It never completes.

When removing the item from the storage, by default, the Observable does not emit.

Set `emitIfAbsent` to `true` if to emit `undefined` when removing the item, or if there is no item associated with the given key upon subscription. By default, `emitIfAbsent` is set to `false`.
</details>

<details>
  <summary><strong>absent$</strong></summary>

Notifies when no item is present for the given key. The Observable never completes.
</details>

<details>
  <summary><strong>put</strong></summary>

Puts the given item into storage. The item is serialized to JSON.  
</details>

<details>
  <summary><strong>putIfAbsent</strong></summary>

Puts the given item into storage, but only if not present. The item is serialized to JSON.\
Instead of an item you can pass a provider function to produce the item.  
</details>

<details>
  <summary><strong>remove</strong></summary>

Removes the item associated with the given key.  
</details>

<details>
  <summary><strong>isPresent</strong></summary>

Checks if an item is present in the storage. Present also includes `null` and `undefined` items.  
</details>

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

[link-scion-toolkit]: /docs/site/scion-toolkit.md
