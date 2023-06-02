<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| SCION Toolkit | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Toolkit][menu-home] > Bean Manager

The NPM sub-module `@scion/toolkit/bean-manager` provides a registry for singleton objects, so-called beans.

### TL;DR
The bean manager provides operations for obtaining references for beans. A bean can be any object, even primitive values can be beans. Beans are registered under a symbol in the bean manager. Using a bean's symbol, the bean can be looked up in the bean manager. By default, beans are instantiated lazy when looked up for the first time. Runlevels, part of the bean manager lifecycle, help with the controlled instantiation of dependent beans. Bean decorators allow for the installation of bean proxies to intercept method calls. 

<details>
  <summary><strong>Installation and Usage</strong></summary>

1. Install `@scion/toolkit` using the NPM command-line tool: 
    ```
    npm install @scion/toolkit --save
    ```

1. Register a bean in the bean manager. In its simplest form, the registration could look like this:

   ```typescript
   import {Beans} from '@scion/toolkit/bean-manager';
    
   Beans.register(ConsoleLogger);
   ```
   
1. Start the bean manager:
   ```typescript
   import {Beans} from '@scion/toolkit/bean-manager';
    
   await Beans.start();
   ```
   
1. Look up a bean from the bean manager:

   ```typescript
   import {Beans} from '@scion/toolkit/bean-manager';
    
   const logger = Beans.get(ConsoleLogger);
   ```
</details>

***

The following sections explain how to use the bean manager in more detail.

<details>
  <summary><strong>What is a Bean?</strong></summary>
  
A bean can be any object or even a primitive like a `boolean`. A bean is registered under some symbol in the bean manager. In most cases, the class of the bean is used as the symbol. You can then look up the bean under its registration symbol. A symbol is either a class type, an abstract class type, or a `Symbol`.  
</details>

<details>
  <summary><strong>Bean Scope</strong></summary>
  
Beans are application-scoped, sometimes also referred to as singleton objects.
</details>

<details>
  <summary><strong>Bean Construction</strong></summary>
  
By default, the bean manager constructs beans lazily when looked up for the first time. Subsequent lookups then get the same bean instance.

When registering a bean, however, you can instruct the bean manager to construct the bean eagerly at startup.

```typescript
Beans.register(EagerBean, {eager: true}); // This bean is constructed eagerly when starting the bean manager
```
</details>

<details>
  <summary><strong>Registering Beans</strong></summary>
  
 A bean is registered in the bean manager under some class type, abstract class type or `Symbol`. In most cases, the symbol is also the type of the bean instance but does not have to be. You can then look up the bean from the bean manager using that symbol.
 
 ```typescript
// Registers a bean under a class type
Beans.register(Logger, {useClass: ConsoleLogger});

// ... or as follows if the lookup symbol and bean type are identical
Beans.register(ConsoleLogger);

// Registers a bean under a JavaScript `Symbol`
const symbol = Symbol('LOGGER');
Beans.register(symbol, {useClass: ConsoleLogger});
```
 
When registering a bean, you must tell the bean manager how to construct the bean. Different strategies are supported, as listed below.
 
 |Strategy|Description|Example|
 |-|-|-|
 |useClass             |if to create an instance of a class                                   |```Beans.register(Logger, {useClass: ConsoleLogger});```|
 |useClass (shorthand) |Shorthand syntax if class and lookup symbol are identical             |```Beans.register(ConsoleLogger);```|
 |useValue             |if to use a static value as bean                                      |```Beans.register(LoggingConfig, {useValue: config});```|
 |useFactory           |if to construct the bean with a factory function                      |```Beans.register(Logger, {useFactory: () => new ConsoleLogger()});```|
 |useExisting          |if to create an alias for another bean registered in the bean manager |```Beans.register(Logger, {useExisting: ConsoleLogger});```|
 
> For Angular developers, the API looks familiar because inspired by Angular for registering providers.
</details>

<details>
  <summary><strong>Registering multiple Beans on the same Symbol</strong></summary>

Multiple beans can be registered under the same symbol by setting the `multi` flag to `true`. When looking them up, they are returned in an array in registration order.

```typescript
// Set the flag `multi` when registering a bean under a multi bean symbol
Beans.register(MessageInterceptor, {useClass: MessageLogger, multi: true});
Beans.register(MessageInterceptor, {useClass: MessageValidator, multi: true});

// Lookup beans on a multi symbol as follows
const interceptors = Beans.all(MessageInterceptor); // [MessageLogger, MessageValidator]
```  
</details>

<details>
  <summary><strong>Looking up Beans</strong></summary>
  
Beans are looked up using the symbol under which they were registered. The bean manager providers different methods to look up beans, as listed below.

|Method|Description|
|-|-|
|`Beans.get` |Returns the bean registered under the given symbol. If no or multiple beans are registered under the passed symbol, an error is thrown. |
|`Beans.opt` |Returns the bean registered under the given symbol, if any, or returns `undefined` otherwise. |
|`Beans.all` |Returns all beans registered under the given symbol. Returns an empty array if no bean is found. |

```typescript
import {Beans} from '@scion/toolkit/bean-manager';

const logger = Beans.get(ConsoleLogger);
```
</details>

<details>
  <summary><strong>Replacing Beans</strong></summary>
  
A bean can be replaced by registering another bean under a bean's symbol. In turn, the replaced bean is disposed and unregistered.
</details>

<details>
  <summary><strong>Decorating Beans</strong></summary>
  
The bean manager allows decorating a bean to intercept invocations to its methods and properties. Multiple decorators can decorate a single bean. Decoration takes place in decorator registration order.

Decorators are registered in the bean manager using the `Beans.registerDecorator` method under the symbol of the bean to be decorated. As with the registration of a bean, you must tell the bean manager how to construct the decorator. For more information, see Bean Construction Strategies. Decorators must be registered before starting the bean manager.

A decorator must implement the decorate method of the BeanDecorator interface and return the proxied bean. To proxy a bean, you can create a JavaScript proxy, or create an anonymous class delegating to the actual bean.

```typescript
// Bean which replies to ping requests.
class PingBean {

  public ping(text: string): string {
    return text;
  }
}
Beans.register(PingBean);

// Decorators for converting ping requests to uppercase.
class UppercaseDecorator implements BeanDecorator<PingBean> {

  public decorate(bean: PingBean): PingBean {
    // Create a proxy in the form of an anonymous class. The proxy delegates to the actual bean. 
    return new class implements PingBean {

      public ping(text: string): string {
        return bean.ping(text.toUpperCase());
      }
    };
  }
}
Beans.registerDecorator(PingBean, {useClass: UppercaseDecorator});
```
</details>

<details>
  <summary><strong>Initializers</strong></summary>
  
Initializers help to run initialization tasks during startup of the bean manager. Initializers can specify a runlevel in which to execute. Initializers bound to lower runlevels execute before initializers of higher runlevels. Initializers of the same runlevel may execute in parallel.
 
Initializers are registered in the bean manager using the `Beans.registerInitializer` method, passing a function or an initializer object, and optionally a runlevel. If not specifying a runlevel, the initializer is executed in runlevel <code>0</code>, or in the default runlevel as specified when starting the bean manager.

The following code snippet illustrates the registration of an initialization function.
```typescript
Beans.registerInitializer(() => {
  // doing some initialization work
  return Promise.resolve();
});
```

If passing an initializer object, you can control in which runlevel to execute the initializer, as follows:
```typescript
Beans.registerInitializer({
  useFunction: () => {
    // doing some initialization work
    return Promise.resolve();
  },
  runlevel: 2,
});
```

You can also register an initializer in the form of a class type implementing the `Initializer` interface, as follows:
```typescript
class YourInitializer implements Initializer {

  public init(): Promise<void> {
    // doing some initialization work
    return Promise.resolve();   
  }
}

// Register the initializer
Beans.registerInitializer({
  useClass: YourInitializer,
  runlevel: 2,
});
```

You can also use an existing bean as initializer, as follows:
```typescript
class YourBean implements Initializer {

  public init(): Promise<void> {
    // doing some initialization work
    return Promise.resolve();   
  }
}

// Register the bean
Beans.register(YourBean);
// Register the initializer
Beans.registerInitializer({useExisting: YourBean});
```

</details>

<details>
  <summary><strong>Starting the Bean Manager</strong></summary>

Starting the bean manager runs registered initializers and constructs beans configured with an eager construction strategy. Starting the bean manager returns a Promise that resolves after all initializers complete.

```typescript
import {Beans} from '@scion/toolkit/bean-manager';

await Beans.start();
```

Initializers with a lower runlevel are executed before initializers with a higher runlevel. After all initializers of the same runlevel have completed, initializers of the next higher runlevel are executed, and so on. Initializers of the same runlevel may run in parallel. Refer to section `Initializers` to learn how to register initializers.
</details>

<details>
  <summary><strong>Bean Destruction</strong></summary>

Beans are disposed when destroying the bean manager, or when unregistering a bean, or when replacing a bean. A bean can implement the `PreDestroy` lifecycle interface, causing the bean manager to call the `preDestroy` method before destroying the bean, e.g., to release allocated resources.

```typescript
class Bean implements PreDestroy {

  public preDestroy(): void {
    // invoked before disposing this bean
  }
}

Beans.register(Bean);

```
</details>

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

