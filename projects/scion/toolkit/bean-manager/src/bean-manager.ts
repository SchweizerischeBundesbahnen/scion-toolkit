/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Defined, Maps} from '@scion/toolkit/util';
import {BehaviorSubject, firstValueFrom, noop} from 'rxjs';
import {filter} from 'rxjs/operators';

/**
 * The bean manager allows getting references to singleton objects, so-called beans.
 *
 * #### Bean
 * A bean can be any object or even a primitive like a `boolean`. A bean is registered under some symbol in the bean manager. In most
 * cases, the class of the bean is used as the symbol. You can then look up the bean under its registration symbol. A symbol is either
 * a class type, an abstract class type, or a `Symbol`.
 *
 * #### Bean Scope
 * Beans are application-scoped, sometimes also referred to as singleton objects.
 *
 * #### Bean Construction
 * By default, the bean manager constructs beans lazily when looked up for the first time. Subsequent lookups then get the same bean instance.
 * When registering a bean, however, you can instruct the bean manager to construct the bean eagerly at startup. Eager beans are constructed after
 * all initializers complete.
 *
 * #### Registering Beans
 * A bean is registered in the bean manager under some class type, abstract class type or `Symbol`. In most cases, the symbol is also the type of the bean
 * instance but does not have to be. You can then look up the bean from the bean manager using that symbol.
 *
 * When registering a bean, you must tell the bean manager how to construct the bean. Different strategies are supported, as listed below.
 *
 * |Strategy|Description|Example|
 * |-|-|-|
 * |useClass             |if to create an instance of a class                                   |```Beans.register(Logger, {useClass: ConsoleLogger});```|
 * |useClass (shorthand) |Shorthand syntax if class and lookup symbol are identical             |```Beans.register(ConsoleLogger);```|
 * |useValue             |if to use a static value as bean                                      |```Beans.register(LoggingConfig, {useValue: config});```|
 * |useFactory           |if to construct the bean with a factory function                      |```Beans.register(Logger, {useFactory: () => new ConsoleLogger()});```|
 * |useExisting          |if to create an alias for another bean registered in the bean manager |```Beans.register(Logger, {useExisting: ConsoleLogger});```|
 *
 * #### Registering multiple Beans on the same Symbol
 * Multiple beans can be registered under the same symbol by setting the multi flag to `true`. When looking them up, they are returned in an array in registration order.
 *
 * ```ts
 * Beans.register(MessageInterceptor, {useClass: MessageLoggerInterceptor, multi: true});
 * ```
 * #### Looking up Beans
 * Beans are looked up using the symbol under which they were registered. The bean manager providers different methods to look up beans, as listed below.
 *
 * |Method|Description|
 * |-|-|
 * |`Beans.get` |Returns the bean registered under the given symbol. If no or multiple beans are registered under the passed symbol, an error is thrown. |
 * |`Beans.opt` |Returns the bean registered under the given symbol, if any, or returns `undefined` otherwise. |
 * |`Beans.all` |Returns all beans registered under the given symbol. Returns an empty array if no bean is found. |
 *
 * #### Replacing Beans
 * A bean can be replaced by registering another bean under a bean's symbol. In turn, the replaced bean is disposed and unregistered.
 *
 * #### Decorating Beans
 * The bean manager allows decorating a bean to intercept invocations to its methods and properties. Multiple decorators can decorate a single bean. Decoration
 * takes place in decorator registration order.
 *
 * Decorators are registered in the bean manager using the `Beans.registerDecorator` method under the symbol of the bean to be decorated.
 * As with the registration of a bean, you must tell the bean manager how to construct the decorator. For more information, see Bean Construction Strategies.
 * Decorators must be registered before starting the bean manager.
 *
 * A decorator must implement the decorate method of the BeanDecorator interface and return the proxied bean. To proxy a bean, you can create a JavaScript proxy,
 * or create an anonymous class delegating to the actual bean.
 *
 * #### Initializers
 * Initializers help to run initialization tasks during startup. Initializers can specify a runlevel in which to execute. Initializers bound to lower
 * runlevels execute before initializers of higher runlevels. Initializers of the same runlevel may execute in parallel.
 *
 * Initializers are registered in the bean manager using the `Beans.registerInitializer` method, passing a function or an initializer object, and optionally a runlevel.
 * If not specifying a runlevel, the initializer is executed in runlevel <code>0</code>, or in the default runlevel as specified when starting the bean manager.
 *
 * @category BeanManager
 */
export class BeanManager {

  private _beanRegistry = new Map<Type<any> | AbstractType<any> | symbol, Set<BeanInfo>>();
  private _decoratorRegistry = new Map<Type<any> | AbstractType<any> | symbol, BeanDecorator<any>[]>();
  private _initializers: InitializerInfo[] = [];

  private _sequence = 0;
  private _runlevel$ = new BehaviorSubject<number>(-1);
  private _eagerBeansConstructed = false;
  private _started = false;

  /**
   * Registers a bean under the given symbol.
   *
   * If not providing instructions, the given symbol is used as the constructor function to construct the bean.
   *
   * By default, bean construction is lazy, meaning that the bean is constructed when looked up for the first time.
   * If another bean is registered under the same symbol, that other bean is disposed and replaced with the given bean.
   * To register multiple beans on the same symbol, register it with the flag `multi` set to `true`.
   *
   * Beans can be registered, replaced or removed even after starting the bean manager.
   *
   * @param  symbol - Symbol under which to register the bean.
   * @param  instructions - Control bean construction; see {@link BeanInstanceConstructInstructions} for more detail.
   * @return handle to unregister the bean.
   */
  public register<T>(symbol: Type<T | any> | AbstractType<T | any> | symbol, instructions?: BeanInstanceConstructInstructions<T>): Registration {
    if (!symbol) {
      throw Error('[BeanRegisterError] Missing bean lookup symbol.');
    }

    if (!instructions || !containsBeansConstructStrategy(instructions)) {
      instructions = {...instructions, useClass: symbol as Type<T>};
    }
    validateBeanConstructInstructions(symbol, instructions);

    // Check that either 'multi' or 'non-multi' beans are registered on the same symbol.
    const multi = Defined.orElse(instructions.multi, false);
    if (multi && this._beanRegistry.has(symbol) && Array.from(this._beanRegistry.get(symbol)!).some(metaData => !metaData.multi)) {
      throw Error('[BeanRegisterError] Trying to register a bean as \'multi-bean\' on a symbol that has already registered a \'non-multi-bean\'. This is probably not what was intended.');
    }
    if (!multi && this._beanRegistry.has(symbol) && Array.from(this._beanRegistry.get(symbol)!).some(metaData => metaData.multi)) {
      throw Error('[BeanRegisterError] Trying to register a bean on a symbol that has already registered a \'multi-bean\'. This is probably not what was intended.');
    }

    // Destroy an already registered bean under the same symbol, if any, unless multi is set to `true`.
    if (!multi && this._beanRegistry.has(symbol)) {
      this.disposeBean(this._beanRegistry.get(symbol)!.values().next().value);
    }

    const beanInfo: BeanInfo<T> = {
      symbol: symbol,
      beanConstructFn: createBeanConstructFunction(instructions),
      eager: Defined.orElse(instructions.eager || instructions.useValue !== undefined, false),
      multi: multi,
      instructions: instructions,
      constructing: false,
    };

    if (multi) {
      const beans = this._beanRegistry.get(symbol) || new Set<BeanInfo>();
      this._beanRegistry.set(symbol, beans.add(beanInfo));
    }
    else {
      this._beanRegistry.set(symbol, new Set<BeanInfo>([beanInfo]));
    }

    if (beanInfo.eager && this._eagerBeansConstructed) {
      this.getOrConstructBeanInstance(beanInfo);
    }

    return {unregister: (): void => this.disposeBean(beanInfo)};
  }

  /**
   * Registers a bean under the given symbol, but only if no other bean is registered under that symbol yet.
   *
   * For detailed information about how to register a bean, see {@link register}.
   *
   * @param  symbol - Symbol under which to register the bean.
   * @param  instructions - Control bean construction; see {@link BeanInstanceConstructInstructions} for more detail.
   * @return handle to unregister the bean.
   */
  public registerIfAbsent<T>(symbol: Type<T | any> | AbstractType<T | any> | symbol, instructions?: BeanInstanceConstructInstructions<T>): Registration {
    if (!symbol) {
      throw Error('[BeanRegisterError] Missing bean lookup symbol.');
    }

    if (!this._beanRegistry.has(symbol)) {
      return this.register(symbol, instructions);
    }
    return {unregister: noop};
  }

  /**
   * Registers a decorator to proxy a bean.
   *
   * The decorator is invoked when the bean is constructed. Multiple decorators can be registered to decorate a bean.
   * They are invoked in the order as registered.
   *
   * Decorators must be registered before starting the bean manager.
   *
   * @param symbol - Identifies the bean(s) which to decorate. If multiple beans are registered under that symbol, they all are decorated.
   * @param decorator - Specifies the decorator.
   */
  public registerDecorator<T extends BeanDecorator<any>>(symbol: Type<any> | AbstractType<any> | symbol, decorator: {useValue: T} | {useClass?: Type<T>} | {useFactory?: () => T}): void {
    if (this._started) {
      throw Error('[BeanManagerLifecycleError] Decorators can only be registered before starting the bean manager.');
    }

    if (!symbol) {
      throw Error('[BeanDecoratorRegisterError] A decorator requires a symbol.');
    }

    validateBeanConstructInstructions(symbol, decorator);
    const constructFn = createBeanConstructFunction(decorator)();
    Maps.addListValue(this._decoratorRegistry, symbol, constructFn);
  }

  /**
   * Registers an initializer that is executed when the bean manager starts. The bean manager is fully started when all initializers are completed.
   *
   * Initializers can specify a runlevel in which to execute. Initializers bound to lower runlevels execute before initializers of higher runlevels.
   * Initializers of the same runlevel may execute in parallel. Runlevels must be >= 0;
   *
   * Initializers must be registered before starting the bean manager.
   */
  public registerInitializer(initializer: InitializerFn | {useFunction?: InitializerFn; useClass?: Type<Initializer>; useExisting?: Type<Initializer> | AbstractType<Initializer> | symbol; runlevel?: number}): void {
    if (this._started) {
      throw Error('[BeanManagerLifecycleError] Initializers can only be registered before starting the bean manager.');
    }

    const initializerInfo: InitializerInfo = ((): InitializerInfo => {
      if (typeof initializer === 'function') {
        return {fn: initializer};
      }
      else if (initializer.runlevel !== undefined && initializer.runlevel < 0) {
        throw Error(`[InitializerRegisterError] The runlevel of an initializer must be >= 0, but was ${initializer.runlevel}.`);
      }
      else if (initializer.useFunction) {
        return {fn: initializer.useFunction, runlevel: initializer.runlevel};
      }
      else if (initializer.useClass) {
        const useClass = initializer.useClass;
        return {fn: (): Promise<void> => new useClass().init(), runlevel: initializer.runlevel};
      }
      else if (initializer.useExisting) {
        const useExisting = initializer.useExisting;
        return {fn: (): Promise<void> => Beans.get(useExisting).init(), runlevel: initializer.runlevel};
      }
      throw Error('[NullInitializerError] No initializer specified.');
    })();

    this._initializers.push(initializerInfo);
  }

  /**
   * Returns the bean registered under the given symbol.
   *
   * By default, if no or multiple beans are registered under the given symbol, an error is thrown.
   *
   * @param  symbol - Symbol to look up the bean.
   * @param  orElse - Controls what to do if no bean is found under the given symbol. If not set and if no bean is found, the bean manager throws an error.
   * @throws if not finding a bean, or if multiple beans are found under the given symbol.
   */
  public get<T>(symbol: Type<T> | AbstractType<T> | Type<any> | AbstractType<any> | symbol, orElse?: {orElseGet?: T; orElseSupply?: () => T}): T {
    const beans = this.all(symbol);
    switch (beans.length) {
      case 0: {
        if (orElse?.orElseGet !== undefined) {
          return orElse.orElseGet;
        }
        if (orElse?.orElseSupply) {
          return orElse.orElseSupply();
        }

        throw Error(`[NullBeanError] No bean registered under the symbol '${getSymbolName(symbol)}'.`);
      }
      case 1: {
        return beans[0];
      }
      default: {
        throw Error(`[MultiBeanError] Multiple beans registered under the symbol '${getSymbolName(symbol)}'.`);
      }
    }
  }

  /**
   * Returns the bean registered under the given symbol, if any, or returns `undefined` otherwise.
   *
   * @param  symbol - Symbol to look up the bean.
   * @throws if multiple beans are found under the given symbol.
   */
  public opt<T>(symbol: Type<T> | AbstractType<T> | Type<any> | AbstractType<any> | symbol): T | undefined {
    return this.get(symbol, {orElseSupply: (): undefined => undefined});
  }

  /**
   * Returns all beans registered under the given symbol. Returns an empty array if no bean is found.
   *
   * @param symbol - Symbol to look up the beans.
   */
  public all<T>(symbol: Type<T> | AbstractType<T> | Type<any> | AbstractType<any> | symbol): T[] {
    const beanInfos = Array.from(this._beanRegistry.get(symbol) || new Set<BeanInfo>());
    if (!beanInfos || !beanInfos.length) {
      return [];
    }
    if (beanInfos.some(beanInfo => beanInfo.constructing)) {
      throw Error(`[BeanConstructError] Circular bean construction cycle detected [bean={${getSymbolName(symbol)}}].`);
    }

    return beanInfos.map(beanInfo => this.getOrConstructBeanInstance(beanInfo));
  }

  /**
   * Starts the bean manager by running initializers and constructing eager beans. By default, constructs eager beans after
   * all initializers completed.
   *
   * Initializers with a lower runlevel are executed before initializers with a higher runlevel. After all initializers of the
   * same runlevel have completed, initializers of the next higher runlevel are executed, and so on. Initializers of the same
   * runlevel may run in parallel.
   *
   * @param  config - Control initialization of the bean manager.
   * @return A Promise that resolves when all initializers completed.
   */
  public async start(config?: BeanManagerConfig): Promise<void> {
    if (this._started) {
      throw Error('[BeanManagerLifecycleError] Bean manager already started.');
    }

    const initializerDefaultRunlevel = config?.initializerDefaultRunlevel ?? 0;
    const eagerBeanConstructRunlevel = config?.eagerBeanConstructRunlevel ?? ((): number => {
      if (this._initializers.length === 0) {
        return initializerDefaultRunlevel + 1;
      }
      return Math.max(...this._initializers.map(initializer => initializer.runlevel ?? initializerDefaultRunlevel)) + 1;
    })();

    // Register initializer to construct eager beans.
    this.registerInitializer({
      useFunction: async () => {
        this.constructEagerBeans();
        this._eagerBeansConstructed = true;
      },
      runlevel: eagerBeanConstructRunlevel,
    });

    // Run initializers.
    await this.runInitializers(initializerDefaultRunlevel);

    this._started = true;
  }

  /**
   * Destroys all beans managed by the bean manager.
   *
   * After calling this method, beans, initializers and decorators unregistered.
   *
   * Calling this method has no effect if the bean manager is not started, or failed to start.
   */
  public destroy(): void {
    this.getBeanInfos()
      .sort(compareByDestroyOrder)
      .forEach(bean => this.disposeBean(bean));

    this._beanRegistry.clear();
    this._decoratorRegistry.clear();
    this._initializers.length = 0;
    this._runlevel$.next(-1);
    this._eagerBeansConstructed = false;
    this._started = false;
  }

  private disposeBean(beanInfo: BeanInfo): void {
    const destroyable = beanInfo.instructions.useClass || beanInfo.instructions.useFactory;
    if (destroyable && beanInfo.instance && typeof (beanInfo.instance as PreDestroy).preDestroy === 'function') {
      try {
        beanInfo.instance.preDestroy();
      }
      catch (error) {
        console?.error('Bean threw an error in `preDestroy`', error);
      }
    }

    beanInfo.instance = undefined;
    beanInfo.constructing = false;
    Maps.removeSetValue(this._beanRegistry, beanInfo.symbol, beanInfo);
  }

  /**
   * Returns a Promise that resolves when the bean manager enters the specified runlevel.
   * The Promise resolves immediately when the bean manager has already entered or completed that runlevel.
   */
  public async whenRunlevel(runlevel: number): Promise<void> {
    return firstValueFrom(this._runlevel$
      .pipe(filter(currentRunlevel => currentRunlevel >= runlevel)))
      .then(() => Promise.resolve());
  }

  private getBeanInfos(): BeanInfo[] {
    return Array.from(this._beanRegistry.values()).reduce((acc, beanInfos) => acc.concat(Array.from(beanInfos)), [] as BeanInfo[]);
  }

  /**
   * Runs registered initializers, where initializers with a lower runlevel are executed before initializers with a higher runlevel.
   * After all initializers of the same runlevel have completed, initializers of the next higher runlevel are executed, and so on.
   * Initializers of the same runlevel may run in parallel.
   */
  private async runInitializers(defaultInitializerRunlevel: number): Promise<void> {
    const initializersGroupedByRunlevel = this._initializers.reduce((grouped, initializer) => Maps.addListValue(grouped, initializer.runlevel ?? defaultInitializerRunlevel, initializer.fn), new Map<number, InitializerFn[]>());
    const runlevels = Array
      .from(initializersGroupedByRunlevel.keys())
      .sort((a, b) => (a - b)); // sort numerically, not alphabetically

    for (const runlevel of runlevels) {
      this._runlevel$.next(runlevel);
      try {
        await Promise.all(initializersGroupedByRunlevel.get(runlevel)!.map(initializerFn => initializerFn()));
      }
      catch (error) {
        throw Error(`[InitializerError] Initializer rejected with an error: ${error} [runlevel=${runlevel}]`);
      }
    }
  }

  /**
   * Constructs beans with an eager construction.
   */
  private constructEagerBeans(): void {
    this.getBeanInfos()
      .filter(beanInfo => beanInfo.eager)
      .forEach(beanInfo => this.getOrConstructBeanInstance(beanInfo));
  }

  /**
   * Returns the bean instance if already constructed, or constructs the bean otherwise.
   */
  private getOrConstructBeanInstance<T>(beanInfo: BeanInfo): T {
    // Check if the bean is already constructed.
    if (beanInfo.instance) {
      return beanInfo.instance;
    }

    // Construct the bean and decorate it.
    beanInfo.constructing = true;
    try {
      const bean: T = beanInfo.beanConstructFn();
      const decorators = this._decoratorRegistry.get(beanInfo.symbol) || [];

      beanInfo.instance = [...decorators].reverse().reduce((decoratedBean, decorator) => decorator.decorate(decoratedBean), bean);
      beanInfo.constructInstant = ++this._sequence;

      return beanInfo.instance;
    }
    finally {
      beanInfo.constructing = false;
    }
  }
}

/**
 * Provides access to beans registered in the bean manager.
 *
 * @category BeanManager
 */
export const Beans = new BeanManager();

/**
 * Compares beans according to their destroy order. If the order is the same, the construction time of the beans is compared, in reverse construction order.
 *
 * @ignore
 */
function compareByDestroyOrder(bean1: BeanInfo, bean2: BeanInfo): number {
  if ((bean1.instructions.destroyOrder ?? 0) < (bean2.instructions.destroyOrder ?? 0)) {
    return -1;
  }
  if ((bean1.instructions.destroyOrder ?? 0) > (bean2.instructions.destroyOrder ?? 0)) {
    return +1;
  }
  return (bean2.constructInstant ?? 0) - (bean1.constructInstant ?? 0); // reverse construction order
}

/** @ignore */
function createBeanConstructFunction<T>(instructions: BeanInstanceConstructInstructions<T>): () => T | null {
  if (instructions.useValue !== undefined) {
    const useValue = instructions.useValue;
    return (): T | null => useValue;
  }
  else if (instructions.useClass) {
    const useClassFn = instructions.useClass;
    return (): T => new useClassFn();
  }
  else if (instructions.useFactory) {
    const useFactoryFn = instructions.useFactory;
    return (): T => useFactoryFn();
  }
  else if (instructions.useExisting) {
    const useExisting = instructions.useExisting;
    return (): T => Beans.get(useExisting);
  }
  throw Error(`[BeanConstructError] Missing bean construction strategy`);
}

/**
 * Validates passed instructions to construct the bean to be valid.
 *
 * @ignore
 */
function validateBeanConstructInstructions(symbol: Type<any> | AbstractType<any> | symbol, instructions: BeanInstanceConstructInstructions): void {
  switch (Object.keys(instructions).filter(instruction => instruction.startsWith('use')).length) {
    case 0:
      throw Error(`[BeanRegisterError] Missing bean construction strategy. Expected one of 'useValue', 'useClass', 'useFactory' or 'useExisting' [bean=${symbol.toString()}, instructions=${JSON.stringify(instructions)}]`);
    case 1:
      break;
    default:
      throw Error(`[BeanRegisterError] Multiple bean construction strategies specified. Expected one of 'useValue', 'useClass', 'useFactory' or 'useExisting' [bean=${symbol.toString()}, instructions=${JSON.stringify(instructions)}]`);
  }

  if (Object.keys(instructions).includes('useValue') && instructions.useValue === undefined) {
    throw Error(`[BeanRegisterError] Passing \`undefined\` as bean value is not supported [bean=${symbol.toString()}].`);
  }
}

/** @ignore */
function containsBeansConstructStrategy(instructions: BeanInstanceConstructInstructions): boolean {
  return Object.keys(instructions).some(property => property.startsWith('use'));
}

/**
 * Lifecycle hook will be executed before destroying this bean.
 *
 * @category BeanManager
 */
export interface PreDestroy {

  /**
   * Method invoked before destroying this bean, e.g., when unregistering it, or when shutting down the bean manager.
   */
  preDestroy(): void;
}

/**
 * Metadata about a bean.
 *
 * @ignore
 */
interface BeanInfo<T = any> {
  symbol: Type<T | any> | AbstractType<T | any> | symbol;
  instance?: T;
  constructing: boolean;
  beanConstructFn: () => T | null;
  constructInstant?: number;
  eager: boolean;
  multi: boolean;
  instructions: BeanInstanceConstructInstructions;
}

/**
 * @ignore
 */
interface InitializerInfo {
  fn: InitializerFn;
  runlevel?: number;
}

/**
 * Describes how a bean instance is created.
 *
 * @category BeanManager
 */
export interface BeanInstanceConstructInstructions<T = any> {
  /**
   * Set if to use a static value as bean.
   */
  useValue?: T | null;
  /**
   * Set if to create an instance of a class.
   */
  useClass?: Type<T>;
  /**
   * Set if to construct the instance with a factory function.
   */
  useFactory?: () => T;
  /**
   * Set if to create an alias for another bean.
   */
  useExisting?: Type<any> | AbstractType<any> | symbol;
  /**
   * Set if to construct the bean eagerly. By default, bean construction is lazy when the bean is looked up for the first time.
   */
  eager?: boolean;
  /**
   * Set if to provide multiple beans for a single symbol.
   */
  multi?: boolean;
  /**
   * Control when to destroy the bean when destroying the bean manager.
   * Beans with a lower destroy order are destroyed before beans with a higher destroy order. Beans of the same destroy order
   * are destroyed in reverse construction order.
   */
  destroyOrder?: number;
}

/**
 * Allows executing initialization tasks (synchronous or asynchronous) when starting the bean manager. The bean manager is fully started when all initializers are completed.
 *
 * Initializers can specify a runlevel in which to execute. Initializers bound to lower runlevels execute before initializers of higher runlevels.
 * Initializers of the same runlevel may execute in parallel.
 *
 * @see {@link BeanManager.registerInitializer Beans.registerInitializer}
 * @category BeanManager
 */
export interface Initializer {
  /**
   * Executes some work during bean manager startup.
   *
   * @return a Promise that resolves when this initializer completes its initialization.
   */
  init(): Promise<void>;
}

/**
 * Allows executing initialization tasks (synchronous or asynchronous) when starting the bean manager. The bean manager is fully started when all initializers are completed.
 *
 * Initializers can specify a runlevel in which to execute. Initializers bound to lower runlevels execute before initializers of higher runlevels.
 * Initializers of the same runlevel may execute in parallel.
 *
 * The initializer function must return a Promise that resolves when completed its initialization.
 *
 * @see {@link BeanManager.registerInitializer Beans.registerInitializer}
 * @category BeanManager
 */
export declare type InitializerFn = () => Promise<void>;

/**
 * Allows intercepting bean method or property invocations.
 * When the bean is constructed, it is passed to the decorator in order to be proxied.
 *
 * @see {@link BeanManager.registerDecorator Beans.registerDecorator}
 * @category BeanManager
 */
export interface BeanDecorator<T> {
  /**
   * Method invoked when the bean is instantiated.
   *
   * @param  bean - The actual bean instance; use it to delegate invoations to the actual bean.
   * @return proxied bean
   */
  decorate(bean: T): T;
}

/**
 * Represents a symbol of an abstract class.
 *
 * @category BeanManager
 */
export interface AbstractType<T> extends Function { // eslint-disable-line @typescript-eslint/ban-types
  prototype: T;
}

/**
 * Represents a symbol of a class.
 *
 * @category BeanManager
 */
export interface Type<T> extends Function { // eslint-disable-line @typescript-eslint/ban-types
  new(...args: any[]): T;
}

/**
 * @ignore
 */
function getSymbolName(symbol: Type<any> | AbstractType<any> | symbol): string {
  return (typeof symbol === 'function' ? symbol.name : symbol.toString());
}

/**
 * Handle to undo a registration.
 */
export interface Registration {
  unregister: () => void;
}

/**
 * Control initialization of the bean manager.
 *
 * @category BeanManager
 */
export interface BeanManagerConfig {
  /**
   * Defines the runlevel in which to construct eager beans.
   * If not set, eager beans are constructed after all registered initializers completed.
   */
  eagerBeanConstructRunlevel?: number;
  /**
   * Defines the runlevel in which initializers, that do not specify a runlevel, should be executed.
   * If not set, initializers not specifying a runlevel are bound to the runlevel <code>0</code>.
   */
  initializerDefaultRunlevel?: number;
}
