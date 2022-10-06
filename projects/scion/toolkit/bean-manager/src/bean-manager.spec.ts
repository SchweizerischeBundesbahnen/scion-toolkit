/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {BeanDecorator, Beans, Initializer, PreDestroy} from './bean-manager';
import {fakeAsync, tick} from '@angular/core/testing';

describe('BeanManager', () => {

  beforeEach(async () => Beans.destroy());
  afterEach(async () => Beans.destroy());

  it('should allow looking up a bean', async () => {
    class Bean {
    }

    Beans.register(Bean);
    expect(Beans.get(Bean)).toBeInstanceOf(Bean);
    expect(Beans.get(Bean)).toBe(Beans.get(Bean));
  });

  it('should allow looking up a bean by a symbol', async () => {
    const symbol1 = Symbol('SYMBOL');
    Beans.register(symbol1, {useValue: 'bean'});
    expect(Beans.get(symbol1)).toEqual('bean');

    const symbol2 = Symbol('SYMBOL');
    Beans.register(symbol2, {useValue: 'bean'});
    expect(Beans.get(symbol2)).toEqual('bean');
    expect(Beans.get(symbol1)).not.toBe(symbol2);
  });

  it('should throw when looking up a bean not present in the bean manager', async () => {
    expect(() => Beans.get(Symbol())).toThrowError(/NullBeanError/);
  });

  it('should return \'undefined\' when looking up an optional bean not present in the bean manager', async () => {
    expect(Beans.opt(Symbol())).toBeUndefined();
  });

  it('should return \'orElseGet\' value when looking up a bean not present in the bean manager', async () => {
    expect(Beans.get(Symbol(), {orElseGet: 'not-found'})).toEqual('not-found');
  });

  it('should return "falsy" bean value', async () => {
    const symbol = Symbol();
    Beans.register(symbol, {useValue: 0});
    expect(Beans.get(symbol, {orElseGet: 123})).toEqual(0);

    Beans.register(symbol, {useValue: null});
    expect(Beans.get(symbol, {orElseGet: 123})).toBeNull();

    Beans.register(symbol, {useValue: ''});
    expect(Beans.get(symbol, {orElseGet: 'abc'})).toEqual('');
  });

  it('should return "falsy" \'orElseGet\' value', async () => {
    expect(Beans.get(Symbol(), {orElseGet: 0})).toEqual(0);
    expect(Beans.get(Symbol(), {orElseGet: null})).toBeNull();
    expect(Beans.get(Symbol(), {orElseGet: ''})).toEqual('');
  });

  it('should invoke \'orElseSupply\' function when looking up a bean not present in the bean manager', async () => {
    expect(Beans.get(Symbol(), {orElseSupply: (): string => 'not-found'})).toEqual('not-found');
  });

  it('should allow looking up multiple beans', async () => {
    class Bean {
    }

    const bean1 = new Bean();
    const bean2 = new Bean();
    const bean3 = new Bean();

    Beans.register(Bean, {useValue: bean1, multi: true});
    Beans.register(Bean, {useValue: bean2, multi: true});
    Beans.register(Bean, {useValue: bean3, multi: true});

    expect(() => Beans.get(Bean)).toThrowError(/MultiBeanError/);
    expect(Beans.all(Bean)).toEqual([bean1, bean2, bean3]);
  });

  it('should throw when registering a bean as \'multi-bean\' on a symbol that has already registered a \'non-multi\' bean', async () => {
    class Bean {
    }

    Beans.register(Bean, {useValue: new Bean()});
    expect(() => Beans.register(Bean, {useValue: new Bean(), multi: true})).toThrowError(/BeanRegisterError/);
  });

  it('should throw when registering a bean on a symbol that has already registered a \'multi-bean\'', async () => {
    class Bean {
    }

    Beans.register(Bean, {useValue: new Bean(), multi: true});
    expect(() => Beans.register(Bean, {useValue: new Bean(), multi: false})).toThrowError(/BeanRegisterError/);
  });

  it('should construct beans as a singleton', async () => {
    class Bean {
    }

    Beans.register(Bean);

    expect(Beans.get(Bean)).toBe(Beans.get(Bean));
    expect(Beans.get(Bean)).toBeInstanceOf(Bean);
  });

  it('should construct beans lazily unless specified differently', async () => {
    let constructed = false;

    class Bean {
      constructor() {
        constructed = true;
      }
    }

    Beans.register(Bean);

    expect(constructed).toBeFalse();
    Beans.get(Bean);
    expect(constructed).toBeTrue();
  });

  it('should allow initializers to look up beans', async () => {
    class Bean {
    }

    let actualBeanInInitializer: Bean | null = null;

    Beans.registerInitializer(() => {
      actualBeanInInitializer = Beans.get(Bean);
      return Promise.resolve();
    });

    Beans.register(Bean);
    await Beans.start();

    expect(actualBeanInInitializer!).toBe(Beans.get(Bean));
  });

  it('should construct lazy beans when looking it up for the first time', async () => {
    let constructed = false;

    class Bean {
      constructor() {
        constructed = true;
      }
    }

    Beans.register(Bean, {eager: false});

    expect(constructed).toBeFalse();
    expect(Beans.get(Bean)).toBeInstanceOf(Bean);
  });

  it('should invoke the bean\'s \'preDestroy\' lifecycle hook on destroy', async () => {
    let state: 'constructed' | 'destroyed' | undefined = undefined;

    class Bean implements PreDestroy {

      constructor() {
        state = 'constructed';
      }

      public preDestroy(): void {
        state = 'destroyed';
      }
    }

    Beans.register(Bean);
    expect(state).toEqual(undefined);
    Beans.get(Bean);
    expect(state!).toEqual('constructed');

    // destroy the bean manager
    Beans.destroy();

    expect(state!).toEqual('destroyed');
    expect(Beans.opt(Bean)).toBeUndefined();
  });

  it('should destroy beans which have no \'preDestroy\' lifecycle hook', async () => {
    let state: 'constructed' | 'destroyed' | undefined = undefined;

    class Bean {

      constructor() {
        state = 'constructed';
      }
    }

    Beans.register(Bean);
    expect(state).toEqual(undefined);
    Beans.get(Bean);
    expect(state!).toEqual('constructed');

    // destroy the bean manager
    Beans.destroy();

    expect(Beans.opt(Bean)).toBeUndefined();
  });

  it('should allow replacing a bean and destroy the replaced bean', async () => {
    let bean1Destroyed = false;

    const symbol = Symbol();

    class Bean1 implements PreDestroy {
      public preDestroy(): void {
        bean1Destroyed = true;
      }
    }

    class Bean2 {
    }

    Beans.register(symbol, {useClass: Bean1});
    expect(Beans.get(symbol)).toBeInstanceOf(Bean1);

    // replace the bean
    Beans.register(symbol, {useClass: Bean2});
    expect(Beans.get(symbol)).toBeInstanceOf(Bean2);
    expect(bean1Destroyed).toBeTrue();
  });

  it('should allow looking up other beans in a bean constructor', async () => {
    let bean1Constructed = false;
    let bean2Constructed = false;
    let bean3Constructed = false;

    class Bean1 {
      constructor() {
        bean1Constructed = true;
        Beans.get(Bean2); // lookup other bean in the constructor
      }
    }

    class Bean2 {
      constructor() {
        bean2Constructed = true;
      }
    }

    class Bean3 {
      constructor() {
        bean3Constructed = true;
      }
    }

    Beans.register(Bean1);
    Beans.register(Bean2);
    Beans.register(Bean3);

    expect(bean1Constructed).toBeFalse();
    expect(bean2Constructed).toBeFalse();
    expect(bean3Constructed).toBeFalse();

    Beans.get(Bean1);
    expect(bean1Constructed).toBeTrue();
    expect(bean2Constructed).toBeTrue();
    expect(bean3Constructed).toBeFalse();
  });

  it('should throw when looking up a bean which causes a circular construction cycle', async () => {
    class Bean1 {
      constructor() {
        Beans.get(Bean2);
      }
    }

    class Bean2 {
      constructor() {
        Beans.get(Bean3);
      }
    }

    class Bean3 {
      constructor() {
        Beans.get(Bean1);
      }
    }

    Beans.register(Bean1);
    Beans.register(Bean2);
    Beans.register(Bean3);

    expect(() => Beans.get(Bean1)).toThrowError(/BeanConstructError/);
  });

  it('should allow registering a bean under another symbol', async () => {
    let constructed = false;

    class Bean {
      constructor() {
        constructed = true;
      }
    }

    abstract class SomeSymbol {
    }

    Beans.register(SomeSymbol, {useClass: Bean});

    Beans.get(SomeSymbol);
    expect(constructed).toBeTrue();
    expect(() => Beans.get(Bean)).toThrowError(/NullBeanError/);
  });

  it('should allow registering some arbitrary object as a bean', async () => {
    abstract class SomeSymbol {
    }

    const someObject = {};
    Beans.register(SomeSymbol, {useValue: someObject});

    expect(Beans.get(SomeSymbol)).toBe(someObject);
  });

  it('should allow registering a bean representing a boolean value', async () => {
    abstract class TrueValueBean {
    }

    abstract class FalseValueBean {
    }

    Beans.register(TrueValueBean, {useValue: true});
    Beans.register(FalseValueBean, {useValue: false});

    expect(Beans.get(TrueValueBean)).toBeTrue();
    expect(Beans.get(FalseValueBean)).toBeFalse();
  });

  it('should allow registering a bean with `false` as its value (falsy value)', () => {
    const symbol = Symbol();
    Beans.register(symbol, {useValue: false});
    expect(Beans.get(symbol)).toBeFalse();
  });

  it('should allow registering a bean with `0` as its value (falsy value)', () => {
    const symbol = Symbol();
    Beans.register(symbol, {useValue: 0});
    expect(Beans.get(symbol)).toEqual(0);
  });

  it('should allow registering a bean with "" as its value (falsy value)', () => {
    const symbol = Symbol();
    Beans.register(symbol, {useValue: ''});
    expect(Beans.get(symbol)).toEqual('');
  });

  it('should allow registering a bean with `null` as its value (falsy value)', () => {
    const symbol = Symbol();
    Beans.register(symbol, {useValue: null});
    expect(Beans.get(symbol)).toBeNull();
  });

  it('should not allow registering a bean with `undefined` as its value', () => {
    const symbol = Symbol();
    expect(() => Beans.register(symbol, {useValue: undefined})).toThrowError(/\[BeanRegisterError] Passing `undefined` as bean value is not supported/);
    expect(() => Beans.get(symbol)).toThrowError(/NullBeanError/);
  });

  it('should allow registering a bean using a factory construction function', async () => {
    abstract class SomeSymbol {
    }

    const someObject = {};
    Beans.register(SomeSymbol, {useFactory: () => someObject});

    expect(Beans.get(SomeSymbol)).toBe(someObject);
  });

  it('should register a bean only if absent', async () => {
    abstract class SomeSymbol {
    }

    const bean1 = {name: 'bean1'};
    Beans.registerIfAbsent(SomeSymbol, {useValue: bean1});

    const bean2 = {name: 'bean2'};
    Beans.registerIfAbsent(SomeSymbol, {useValue: bean2});

    expect(Beans.get(SomeSymbol)).toBe(bean1);
  });

  it('should allow decorating a bean', async () => {
    abstract class Bean {
      public abstract getName(): string;
    }

    class BeanImpl implements Bean {
      public getName(): string {
        return 'name';
      }
    }

    class Decorator implements BeanDecorator<Bean> {
      public decorate(bean: Bean): Bean {
        return new class implements Bean {
          public getName(): string {
            return bean.getName().toUpperCase();
          }
        };
      }
    }

    Beans.register(Bean, {useClass: BeanImpl});
    Beans.registerDecorator(Bean, {useClass: Decorator});
    expect(Beans.get(Bean).getName()).toEqual('NAME');
  });

  it('should allow decorating multiple beans', async () => {
    abstract class Bean {
      public abstract getName(): string;
    }

    class Bean1 implements Bean {
      public getName(): string {
        return 'name of bean 1';
      }
    }

    class Bean2 implements Bean {
      public getName(): string {
        return 'name of bean 2';
      }
    }

    class Decorator implements BeanDecorator<Bean> {
      public decorate(bean: Bean): Bean {
        return new class implements Bean {
          public getName(): string {
            return bean.getName().toUpperCase();
          }
        };
      }
    }

    Beans.register(Bean, {useClass: Bean1, multi: true});
    Beans.register(Bean, {useClass: Bean2, multi: true});
    Beans.registerDecorator(Bean, {useClass: Decorator});
    expect(Beans.all(Bean).map(bean => bean.getName())).toEqual(['NAME OF BEAN 1', 'NAME OF BEAN 2']);
  });

  it('should destroy beans according to their destroy order when destroying the bean manager', async () => {
    const beanDestroyCaptor: string[] = [];

    class Bean1 implements PreDestroy {
      public preDestroy(): void {
        beanDestroyCaptor.push('bean1');
      }
    }

    class Bean2 implements PreDestroy {
      public preDestroy(): void {
        beanDestroyCaptor.push('bean2');
      }
    }

    class Bean3 implements PreDestroy {
      public preDestroy(): void {
        beanDestroyCaptor.push('bean3');
      }
    }

    class Bean4 implements PreDestroy {
      public preDestroy(): void {
        beanDestroyCaptor.push('bean4');
      }
    }

    Beans.register(Bean1, {eager: true});
    Beans.register(Bean2, {destroyOrder: 4, eager: true});
    Beans.register(Bean3, {destroyOrder: 3, eager: true});
    Beans.register(Bean4, {destroyOrder: 2, eager: true});

    await Beans.start();
    Beans.destroy();
    await expect(beanDestroyCaptor).toEqual(['bean1', 'bean4', 'bean3', 'bean2']);
  });

  it('should destroy beans of the same destroy order in reverse construction order', async () => {
    const beanDestroyCaptor: string[] = [];

    class Bean1 implements PreDestroy {
      public preDestroy(): void {
        beanDestroyCaptor.push('bean1');
      }
    }

    class Bean2 implements PreDestroy {
      public preDestroy(): void {
        beanDestroyCaptor.push('bean2');
      }
    }

    class Bean3 implements PreDestroy {
      public preDestroy(): void {
        beanDestroyCaptor.push('bean3');
      }
    }

    class Bean4 implements PreDestroy {
      public preDestroy(): void {
        beanDestroyCaptor.push('bean4');
      }
    }

    class Bean5 implements PreDestroy {
      public preDestroy(): void {
        beanDestroyCaptor.push('bean5');
      }
    }

    class Bean6 implements PreDestroy {
      public preDestroy(): void {
        beanDestroyCaptor.push('bean6');
      }
    }

    Beans.register(Bean1);
    Beans.register(Bean2);
    Beans.register(Bean3);
    Beans.register(Bean4);
    Beans.register(Bean5);
    Beans.register(Bean6);

    await Beans.start();

    Beans.get(Bean1);
    Beans.get(Bean6);
    Beans.get(Bean3);
    Beans.get(Bean5);
    Beans.get(Bean4);
    Beans.get(Bean2);

    Beans.destroy(); // 1, 6, 3, 5, 4, 2
    await expect(beanDestroyCaptor).toEqual(['bean2', 'bean4', 'bean5', 'bean3', 'bean6', 'bean1']);
  });

  it('should not construct \'not-yet-constructed\' beans when destroying the bean manager', async () => {
    let constructed = false;

    class Bean {
      constructor() {
        constructed = true;
      }
    }

    Beans.register(Bean);

    await Beans.start();
    Beans.destroy();
    await expect(constructed).toBeFalse();
  });

  it('should destroy a bean when unregistering it', async () => {
    class Bean {
    }

    const registration = Beans.register(Bean);
    expect(Beans.get(Bean)).toBeDefined();
    registration.unregister();
    expect(() => Beans.get(Bean)).toThrowError(/NullBeanError/);
  });

  it('should allow decorating a bean with multiple decorators invoked in the order as registered', async () => {
    const decoratorInvocationCaptor: string[] = [];

    class PingBean {

      public ping(ping: string): string {
        return ping;
      }
    }

    class Decorator1 implements BeanDecorator<PingBean> {
      public decorate(bean: PingBean): PingBean {
        return new class implements PingBean {
          public ping(ping: string): string {
            decoratorInvocationCaptor.push('decorator1');
            return `${bean.ping(ping)} [decorator1]`;
          }
        };
      }
    }

    class Decorator2 implements BeanDecorator<PingBean> {
      public decorate(bean: PingBean): PingBean {
        return new class implements PingBean {
          public ping(ping: string): string {
            decoratorInvocationCaptor.push('decorator2');
            return `${bean.ping(ping)} [decorator2]`;
          }
        };
      }
    }

    class ToUppercaseDecorator implements BeanDecorator<PingBean> {
      public decorate(bean: PingBean): PingBean {
        return new class implements PingBean {
          public ping(ping: string): string {
            decoratorInvocationCaptor.push('toUppercaseDecorator');
            return bean.ping(ping).toUpperCase();
          }
        };
      }
    }

    Beans.register(PingBean);
    Beans.registerDecorator(PingBean, {useClass: Decorator1});
    Beans.registerDecorator(PingBean, {useClass: Decorator2});
    Beans.registerDecorator(PingBean, {useClass: ToUppercaseDecorator});

    expect(Beans.get(PingBean).ping('ping')).toEqual('PING [decorator2] [decorator1]');
    expect(decoratorInvocationCaptor).toEqual(['decorator1', 'decorator2', 'toUppercaseDecorator']);
  });

  it('should unregister beans when destroying the bean manager', async () => {
    class Bean {
    }

    Beans.register(Bean);

    await Beans.start();
    expect(Beans.get(Bean)).toBeDefined();

    Beans.destroy();
    await Beans.start();

    expect(() => Beans.get(Bean)).toThrowError(/NullBeanError/);
  });

  it('should allow registering an alias for an existing bean [useExisting]', async () => {
    abstract class Bean {
    }

    abstract class Alias {
    }

    Beans.register(Bean);
    Beans.register(Alias, {useExisting: Bean});

    const actualBean = Beans.get(Bean);
    const alias = Beans.get(Alias);
    expect(actualBean).toBe(alias);
    expect(alias).toBeInstanceOf(Bean);
    expect(alias).not.toBeInstanceOf(Alias);
  });

  it('should not destroy the referenced bean when its alias is destroyed [useExisting]', async () => {
    let beanDestroyed = false;

    abstract class Bean implements PreDestroy {
      public preDestroy(): void {
        beanDestroyed = true;
      }
    }

    abstract class Alias {
    }

    // Register the bean and its alias
    Beans.register(Bean);
    Beans.register(Alias, {useExisting: Bean});

    const actualBean = Beans.get(Bean);
    const alias = Beans.get(Alias);
    expect(actualBean).toBe(alias as any);

    // Replace the alias bean. When replacing a regular bean, the bean instance would be destroyed.
    Beans.register(Alias, {useValue: 'some-other-bean'});

    expect(Beans.get(Bean)).toBe(actualBean);
    expect(beanDestroyed).toBeFalse();
    expect(Beans.get(Alias)).toEqual('some-other-bean' as any);
  });

  it('should not invoke \'preDestroy\' on value bean', async () => {
    let destroyed = false;

    const value = new class implements PreDestroy {
      public preDestroy(): void {
        destroyed = true;
      }
    };

    const VALUE_BEAN = Symbol();
    Beans.register(VALUE_BEAN, {useValue: value});
    expect(Beans.get(VALUE_BEAN)).toBe(value);

    Beans.destroy();
    expect(destroyed).toBeFalse();
  });

  it('should invoke \'preDestroy\' on class bean', async () => {
    let destroyed = false;

    class Bean implements PreDestroy {
      public preDestroy(): void {
        destroyed = true;
      }
    }

    Beans.register(Bean);
    expect(Beans.get(Bean)).toBeInstanceOf(Bean);

    Beans.destroy();
    expect(destroyed).toBeTrue();
  });

  it('should invoke \'preDestroy\' on factory bean', async () => {
    let destroyed = false;

    class Bean implements PreDestroy {
      public preDestroy(): void {
        destroyed = true;
      }
    }

    Beans.register(Bean, {useFactory: () => new Bean()});
    expect(Beans.get(Bean)).toBeInstanceOf(Bean);

    Beans.destroy();
    expect(destroyed).toBeTrue();
  });

  it('should execute initializers with a lower runlevel before initializers with a higher runlevel', fakeAsync(() => {
    const log: string[] = [];

    // Register initializers which resolve after 100ms.
    Beans.registerInitializer({
      useFunction: async () => {
        await waitFor(100);
        log.push('initializer [100ms, runlevel 0]');
      },
      runlevel: 0,
    });
    Beans.registerInitializer({
      useFunction: async () => {
        await waitFor(100);
        log.push('initializer [100ms, runlevel 1]');
      },
      runlevel: 1,
    });
    Beans.registerInitializer({
      useFunction: async () => {
        await waitFor(100);
        log.push('initializer [100ms, runlevel 2]');
      },
      runlevel: 2,
    });

    // Register initializers which resolve after 200ms.
    Beans.registerInitializer({
      useFunction: async () => {
        await waitFor(200);
        log.push('initializer [200ms, runlevel 0]');
      },
      runlevel: 0,
    });
    Beans.registerInitializer({
      useFunction: async () => {
        await waitFor(200);
        log.push('initializer [200ms, runlevel 1]');
      },
      runlevel: 1,
    });
    Beans.registerInitializer({
      useFunction: async () => {
        await waitFor(200);
        log.push('initializer [200ms, runlevel 2]');
      },
      runlevel: 2,
    });

    // Register initializers which resolve after 600ms.
    Beans.registerInitializer({
      useFunction: async () => {
        await waitFor(600);
        log.push('initializer [600ms, runlevel 0]');
      },
      runlevel: 0,
    });
    Beans.registerInitializer({
      useFunction: async () => {
        await waitFor(600);
        log.push('initializer [600ms, runlevel 1]');
      },
      runlevel: 1,
    });
    Beans.registerInitializer({
      useFunction: async () => {
        await waitFor(600);
        log.push('initializer [600ms, runlevel 2]');
      },
      runlevel: 2,
    });

    Beans.start();

    // after 100ms
    tick(100);
    expect(log).toEqual([
      'initializer [100ms, runlevel 0]',
    ]);

    // after 200ms
    tick(100);
    expect(log).toEqual([
      'initializer [100ms, runlevel 0]',
      'initializer [200ms, runlevel 0]',
    ]);

    // after 600ms
    tick(400);
    expect(log).toEqual([
      'initializer [100ms, runlevel 0]',
      'initializer [200ms, runlevel 0]',
      'initializer [600ms, runlevel 0]',
    ]);

    // after 700ms
    tick(100);
    expect(log).toEqual([
      'initializer [100ms, runlevel 0]',
      'initializer [200ms, runlevel 0]',
      'initializer [600ms, runlevel 0]',
      'initializer [100ms, runlevel 1]',
    ]);

    // after 800ms
    tick(100);
    expect(log).toEqual([
      'initializer [100ms, runlevel 0]',
      'initializer [200ms, runlevel 0]',
      'initializer [600ms, runlevel 0]',
      'initializer [100ms, runlevel 1]',
      'initializer [200ms, runlevel 1]',
    ]);

    // after 1200ms
    tick(400);
    expect(log).toEqual([
      'initializer [100ms, runlevel 0]',
      'initializer [200ms, runlevel 0]',
      'initializer [600ms, runlevel 0]',
      'initializer [100ms, runlevel 1]',
      'initializer [200ms, runlevel 1]',
      'initializer [600ms, runlevel 1]',
    ]);

    // after 1300ms
    tick(100);
    expect(log).toEqual([
      'initializer [100ms, runlevel 0]',
      'initializer [200ms, runlevel 0]',
      'initializer [600ms, runlevel 0]',
      'initializer [100ms, runlevel 1]',
      'initializer [200ms, runlevel 1]',
      'initializer [600ms, runlevel 1]',
      'initializer [100ms, runlevel 2]',
    ]);

    // after 1400ms
    tick(100);
    expect(log).toEqual([
      'initializer [100ms, runlevel 0]',
      'initializer [200ms, runlevel 0]',
      'initializer [600ms, runlevel 0]',
      'initializer [100ms, runlevel 1]',
      'initializer [200ms, runlevel 1]',
      'initializer [600ms, runlevel 1]',
      'initializer [100ms, runlevel 2]',
      'initializer [200ms, runlevel 2]',
    ]);

    // after 1800ms
    tick(400);
    expect(log).toEqual([
      'initializer [100ms, runlevel 0]',
      'initializer [200ms, runlevel 0]',
      'initializer [600ms, runlevel 0]',
      'initializer [100ms, runlevel 1]',
      'initializer [200ms, runlevel 1]',
      'initializer [600ms, runlevel 1]',
      'initializer [100ms, runlevel 2]',
      'initializer [200ms, runlevel 2]',
      'initializer [600ms, runlevel 2]',
    ]);
  }));

  it('should register initializers in the configured runlevel (only if not specified by the initializer)', async () => {
    const log: string[] = [];

    Beans.registerInitializer({
      useFunction: async () => void (log.push('initializer runlevel 0')),
      runlevel: 0,
    });
    Beans.registerInitializer({
      useFunction: async () => void (log.push('initializer runlevel 1')),
      runlevel: 1,
    });
    Beans.registerInitializer({
      useFunction: async () => void (log.push('initializer runlevel 2')),
      runlevel: 2,
    });
    Beans.registerInitializer({
      useFunction: async () => void (log.push('initializer runlevel 3')),
      runlevel: 3,
    });
    Beans.registerInitializer({
      useFunction: async () => void (log.push('initializer-1 (no runlevel specified)')),
    });
    Beans.registerInitializer({
      useFunction: async () => void (log.push('initializer-2 (no runlevel specified)')),
    });
    Beans.registerInitializer({
      useFunction: async () => void (log.push('initializer-3 (no runlevel specified)')),
    });

    await Beans.start({initializerDefaultRunlevel: 2});

    // after 1s
    await expect(log).toEqual([
      'initializer runlevel 0',
      'initializer runlevel 1',
      'initializer runlevel 2',
      'initializer-1 (no runlevel specified)',
      'initializer-2 (no runlevel specified)',
      'initializer-3 (no runlevel specified)',
      'initializer runlevel 3',
    ]);
  });

  it('should not run initializers of higher runlevels when initializers bound to lower runlevels reject', async () => {
    const log: string[] = [];

    Beans.registerInitializer({
      useFunction: async () => {
        log.push('initializer [runlevel 1]');
      },
      runlevel: 1,
    });

    Beans.registerInitializer({
      useFunction: async () => {
        log.push('initializer [runlevel 2]');
      },
      runlevel: 2,
    });

    Beans.registerInitializer({
      useFunction: () => {
        log.push('initializer [runlevel 2]');
        return Promise.reject();
      },
      runlevel: 2,
    });

    Beans.registerInitializer({
      useFunction: async () => {
        log.push('initializer [runlevel 3]');
      },
      runlevel: 3,
    });

    await expectAsync(Beans.start()).toBeRejectedWithError(/InitializerError/);
    expect(log).toEqual([
      'initializer [runlevel 1]',
      'initializer [runlevel 2]',
      'initializer [runlevel 2]',
    ]);
  });

  it('should construct eager beans when starting the bean manager', async () => {
    let bean1Constructed = false;
    let bean2Constructed = false;

    class Bean1 {
      constructor() {
        bean1Constructed = true;
      }
    }

    class Bean2 {
      constructor() {
        bean2Constructed = true;
      }
    }

    Beans.register(Bean1, {eager: true});
    Beans.register(Bean2, {eager: true});

    await Beans.start();

    expect(bean1Constructed).toBeTrue();
    expect(bean2Constructed).toBeTrue();
  });

  it('should immediately construct eager bean when registered after started the bean manager', async () => {
    let constructed = false;

    class Bean {
      constructor() {
        constructed = true;
      }
    }

    await Beans.start();
    Beans.register(Bean, {eager: true});
    expect(constructed).toBeTrue();
  });

  it('should immediately construct eager bean when registered in an initializer that is bound to a higher runlevel than the "eager bean construction runlevel"', async () => {
    const eagerBeanConstructRunlevel = 5;

    let bean1Constructed = false;
    let bean2Constructed = false;
    let bean3Constructed = false;

    class Bean1 {
      constructor() {
        bean1Constructed = true;
      }
    }

    class Bean2 {
      constructor() {
        bean2Constructed = true;
      }
    }

    class Bean3 {
      constructor() {
        bean3Constructed = true;
      }
    }

    Beans.registerInitializer({
      useFunction: async () => void Beans.register(Bean1, {eager: true}),
      runlevel: eagerBeanConstructRunlevel - 1,
    });
    Beans.registerInitializer({
      useFunction: async () => void Beans.register(Bean2, {eager: true}),
      runlevel: eagerBeanConstructRunlevel,
    });
    Beans.registerInitializer({
      useFunction: async () => void Beans.register(Bean3, {eager: true}),
      runlevel: eagerBeanConstructRunlevel + 1,
    });

    await Beans.start({eagerBeanConstructRunlevel});
    expect(bean1Constructed).toBeTrue();
    expect(bean2Constructed).toBeTrue();
    expect(bean3Constructed).toBeTrue();
  });

  it('should not construct lazy beans when starting the bean manager', async () => {
    let bean1Constructed = false;
    let bean2Constructed = false;

    class Bean1 {
      constructor() {
        bean1Constructed = true;
      }
    }

    class Bean2 {
      constructor() {
        bean2Constructed = true;
      }
    }

    Beans.register(Bean1);
    Beans.register(Bean2, {eager: false});
    await Beans.start();

    expect(bean1Constructed).toBeFalse();
    expect(bean2Constructed).toBeFalse();
  });

  it('should not construct eager beans when an initializer rejects', async () => {
    let constructed = false;

    class Bean {
      constructor() {
        constructed = true;
      }
    }

    Beans.register(Bean, {eager: true});
    Beans.registerInitializer(() => Promise.reject('initializer rejected'));

    await expectAsync(Beans.start()).toBeRejectedWithError(/InitializerError/);
    expect(constructed).toBeFalse();
  });

  it('should construct eager beans after running all initializers', async () => {
    const log: string[] = [];

    class Bean1 {
      constructor() {
        log.push('construct-bean-1');
      }
    }

    class Bean2 {
      constructor() {
        log.push('construct-bean-2');
      }
    }

    Beans.register(Bean1, {eager: true});
    Beans.register(Bean2, {eager: true});
    Beans.registerInitializer(async () => {
      log.push('initializer-1 [no runlevel specified]');
    });
    Beans.registerInitializer({
      useFunction: async () => void (log.push('initializer-2 [runlevel 5]')),
      runlevel: 5,
    });
    Beans.registerInitializer(async () => {
      log.push('initializer-3 [no runlevel specified]');
    });

    await Beans.start();

    expect(log).toEqual([
      'initializer-1 [no runlevel specified]',
      'initializer-3 [no runlevel specified]',
      'initializer-2 [runlevel 5]',
      'construct-bean-1',
      'construct-bean-2',
    ]);
  });

  it('should construct eager beans in the order as registered', async () => {
    const log: string[] = [];

    class Bean1 {
      constructor() {
        log.push('bean-1');
      }
    }

    class Bean2 {
      constructor() {
        log.push('bean-2');
      }
    }

    class Bean3 {
      constructor() {
        log.push('bean-3');
      }
    }

    Beans.register(Bean1, {eager: true});
    Beans.register(Bean3, {eager: true});
    Beans.register(Bean2, {eager: true});
    await Beans.start();

    expect(log).toEqual([
      'bean-1',
      'bean-3',
      'bean-2',
    ]);
  });

  it('should construct eager beans in the runlevel specified', async () => {
    const log: string[] = [];

    class Bean1 {
      constructor() {
        log.push('construct-bean-1');
      }
    }

    class Bean2 {
      constructor() {
        log.push('construct-bean-2');
      }
    }

    Beans.register(Bean1, {eager: true});
    Beans.register(Bean2, {eager: true});
    Beans.registerInitializer(async () => {
      log.push('initializer-1 [no runlevel specified]');
    });
    Beans.registerInitializer({
      useFunction: async () => void (log.push('initializer-2 [runlevel 6]')),
      runlevel: 6,
    });
    Beans.registerInitializer(async () => {
      log.push('initializer-3 [no runlevel specified]');
    });

    await Beans.start({eagerBeanConstructRunlevel: 5});

    expect(log).toEqual([
      'initializer-1 [no runlevel specified]',
      'initializer-3 [no runlevel specified]',
      'construct-bean-1',
      'construct-bean-2',
      'initializer-2 [runlevel 6]',
    ]);
  });

  it('should throw when trying to register a decorator after the bean manager started', async () => {
    const symbol = Symbol();
    Beans.register(symbol, {useValue: 'bean'});
    await Beans.start();

    class Decorator implements BeanDecorator<string> {
      public decorate(bean: string): string {
        return bean.toUpperCase();
      }
    }

    expect(() => Beans.registerDecorator(symbol, {useClass: Decorator})).toThrowError(/BeanManagerLifecycleError/);
  });

  it('should throw when trying to register an initializer after the bean manager started', async () => {
    await Beans.start();
    expect(() => Beans.registerInitializer(() => Promise.resolve())).toThrowError(/BeanManagerLifecycleError/);
  });

  it('should throw when trying to start the bean manager multiple times', async () => {
    await Beans.start();
    await expectAsync(Beans.start()).toBeRejectedWithError(/BeanManagerLifecycleError/);
  });

  it('should unregister initializers when destroying the bean manager', async () => {
    let initializerInvoked = false;
    Beans.registerInitializer(async () => {
      initializerInvoked = true;
    });

    await Beans.start();
    expect(initializerInvoked).toBeTrue();

    // Destroy the bean manager
    Beans.destroy();

    // Start the bean manager anew
    initializerInvoked = false;
    await Beans.start();
    expect(initializerInvoked).toBeFalse();
  });

  it('should allow starting the bean manager after destroying it', async () => {
    await Beans.start();
    Beans.destroy();
    await expectAsync(Beans.start()).toBeResolved();
  });

  it('should resolve the \'start\' Promise when all initializers resolve', async () => {
    Beans.registerInitializer(() => Promise.resolve());
    Beans.registerInitializer(() => Promise.resolve());
    Beans.registerInitializer(() => Promise.resolve());

    await expectAsync(Beans.start()).toBeResolved();
  });

  it('should reject the \'start\' Promise when an initializer rejects', async () => {
    Beans.registerInitializer(() => Promise.resolve());
    Beans.registerInitializer(() => Promise.reject());
    Beans.registerInitializer(() => Promise.resolve());

    await expectAsync(Beans.start()).toBeRejectedWithError(/InitializerError/);
  });

  it('should allow registration of a function initializer', async () => {
    let initializerInvoked = false;

    Beans.registerInitializer(async () => void (initializerInvoked = true));
    await Beans.start();

    expect(initializerInvoked).toBeTrue();
  });

  it('should allow registration of a function initializer (useFunction)', async () => {
    let initializerInvoked = false;

    Beans.registerInitializer({useFunction: async () => void (initializerInvoked = true)});
    await Beans.start();

    expect(initializerInvoked).toBeTrue();
  });

  it('should allow registration of a class initializer (useClass)', async () => {
    let initializerInvoked = false;

    class InitializerClass implements Initializer {

      public async init(): Promise<void> {
        initializerInvoked = true;
      }
    }

    Beans.registerInitializer({useClass: InitializerClass});
    await Beans.start();

    expect(() => Beans.get(InitializerClass)).toThrowError(/NullBeanError/);
    expect(initializerInvoked).toBeTrue();
  });

  it('should allow using an existing bean as initializer (useExisting)', async () => {
    const beanInstances = new Set<Bean>();

    class Bean implements Initializer {

      public initInvoked = false;

      constructor() {
        beanInstances.add(this);
      }

      public async init(): Promise<void> {
        this.initInvoked = true;
      }
    }

    Beans.registerInitializer({useExisting: Bean});
    Beans.register(Bean);
    await Beans.start();

    expect(new Set([Beans.get(Bean)])).toEqual(beanInstances);
    expect(Beans.get(Bean).initInvoked).toBeTrue();
  });

  it('should error if not registered the bean specified as initializer (useExisting)', async () => {
    class Bean implements Initializer {
      public async init(): Promise<void> { // eslint-disable-line @typescript-eslint/no-empty-function
      }
    }

    Beans.registerInitializer({useExisting: Bean});
    await expectAsync(Beans.start()).toBeRejectedWithError(/InitializerError/);
  });

  /**
   * Returns a Promise that resolves after the given millis elapses.
   */
  function waitFor(millis: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, millis));
  }
});
