/*
 * Copyright (c) 2018-2025 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, DestroyRef, forwardRef, inject, InjectionToken, Injector, signal} from '@angular/core';
import {ComponentFixtureAutoDetect, TestBed} from '@angular/core/testing';
import {toEqualToolbarCustomMatcher} from '../testing/jasmine/matcher/to-equal-toolbar.matcher';
import {toEqualMenuCustomMatcher} from '../testing/jasmine/matcher/to-equal-menu.matcher';
import {ToolbarPO} from './toolbar.po';
import {contributeMenu} from '../menu-contribution';
import {SciToolbarComponent} from './toolbar.component';
import {MenuPO} from '../menu/menu.po';
import {toBeAttachedCustomMatcher} from '../testing/jasmine/matcher/to-be-attached.matcher';
import {By} from '@angular/platform-browser';
import {provideMenuAcceleratorTargetProvider, provideMenuContextProvider, provideMenuInjectionContextProvider} from '../menu-environment/menu-environment.provider';
import {noop} from 'rxjs';

describe('Toolbar', () => {

  beforeEach(() => {
    jasmine.addAsyncMatchers(toEqualToolbarCustomMatcher);
    jasmine.addAsyncMatchers(toEqualMenuCustomMatcher);
    jasmine.addAsyncMatchers(toBeAttachedCustomMatcher);
  });

  it('should contribute to toolbar', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);

    // Contribute to toolbar.
    contributeMenu('toolbar:testee', toolbar => toolbar
      .addToolbarButton({icon: 'icon-1', onSelect: noop}), {injector: TestBed.inject(Injector)},
    );
    await fixture.whenStable();

    // Expect toolbar.
    const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
    await expectAsync(toolbar).toEqualToolbar([
      {type: 'menu-item', icon: 'icon-1'},
    ]);

    // Contribute to toolbar again.
    contributeMenu('toolbar:testee', toolbar => toolbar
      .addToolbarButton({icon: 'icon-2', onSelect: noop}), {injector: TestBed.inject(Injector)},
    );

    // Expect toolbar.
    await expectAsync(toolbar).toEqualToolbar([
      {type: 'menu-item', icon: 'icon-1'},
      {type: 'menu-item', icon: 'icon-2'},
    ]);
  });

  it('should contribute to toolbar group', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);

    // Contribute to toolbar.
    contributeMenu('toolbar:testee', toolbar => toolbar
      .addToolbarButton({icon: 'icon-1', onSelect: noop})
      .addGroup({name: 'toolbar:additions'}), {injector: TestBed.inject(Injector)},
    );
    await fixture.whenStable();

    // Expect toolbar.
    const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
    await expectAsync(toolbar).toEqualToolbar([
      {type: 'menu-item', icon: 'icon-1'},
    ]);

    // Contribute to toolbar group.
    contributeMenu('toolbar:additions', toolbar => toolbar
      .addToolbarButton({icon: 'icon-2', onSelect: noop}), {injector: TestBed.inject(Injector)},
    );
    await fixture.whenStable();

    // Expect toolbar.
    await expectAsync(toolbar).toEqualToolbar([
      {
        type: 'menu-item',
        icon: 'icon-1',
      },
      {
        type: 'group',
        children: [
          {
            type: 'menu-item',
            icon: 'icon-2',
          },
        ],
      },
    ]);
  });

  it('should call toolbar factory function in reactive context', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);
    const itemVisible = signal(false);

    // Contribute to toolbar.
    contributeMenu('toolbar:testee', toolbar => {
      if (itemVisible()) {
        toolbar.addToolbarButton({icon: 'icon', onSelect: noop});
      }
    }, {injector: TestBed.inject(Injector)});

    // Expect toolbar.
    const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
    await expectAsync(toolbar).toEqualToolbar([]);

    // Show toolbar item.
    itemVisible.set(true);

    // Expect toolbar.
    await expectAsync(toolbar).toEqualToolbar([{type: 'menu-item', icon: 'icon'}]);

    // Hide toolbar item.
    itemVisible.set(false);

    // Expect toolbar.
    await expectAsync(toolbar).toEqualToolbar([]);
  });

  it('should call toolbar factory function only when tracked signal changes', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    @Component({
      selector: 'spec-testee',
      template: `
        <sci-toolbar name="toolbar:testee" class="testee-1"/>
        <sci-toolbar name="toolbar:testee" class="testee-2"/>
      `,
      imports: [SciToolbarComponent],
    })
    class SpecTesteeComponent {
    }

    const fixture = TestBed.createComponent(SpecTesteeComponent);
    const contribution1 = {
      callCount: 0,
      signal: signal('A'),
    };
    const contribution2 = {
      callCount: 0,
      signal: signal('A'),
    };

    // Contribute to toolbar.
    contributeMenu('toolbar:testee', toolbar => {
      contribution1.callCount++;
      contribution1.signal();
      toolbar.addToolbarButton({icon: 'icon-1', onSelect: noop});
    }, {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect toolbar.
    const toolbar1 = new ToolbarPO(fixture, {cssClass: 'testee-1'});
    const toolbar2 = new ToolbarPO(fixture, {cssClass: 'testee-2'});
    expect(contribution1.callCount).toBe(1);
    expect(contribution2.callCount).toBe(0);
    await expectAsync(toolbar1).toEqualToolbar([{type: 'menu-item', icon: 'icon-1'}]);
    await expectAsync(toolbar2).toEqualToolbar([{type: 'menu-item', icon: 'icon-1'}]);

    // Contribute to toolbar again.
    contributeMenu('toolbar:testee', toolbar => {
      contribution2.callCount++;
      contribution2.signal();
      toolbar.addToolbarButton({icon: 'icon-2', onSelect: noop});
    }, {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect toolbar.
    expect(contribution1.callCount).toBe(1);
    expect(contribution2.callCount).toBe(1);
    await expectAsync(toolbar1).toEqualToolbar([
      {type: 'menu-item', icon: 'icon-1'},
      {type: 'menu-item', icon: 'icon-2'},
    ]);
    await expectAsync(toolbar2).toEqualToolbar([
      {type: 'menu-item', icon: 'icon-1'},
      {type: 'menu-item', icon: 'icon-2'},
    ]);

    // Change tracked signal in factory function of contribution 1.
    contribution1.signal.set('B');
    await fixture.whenStable();

    // Expect only factory function of contribution 1 to be called.
    expect(contribution1.callCount).toBe(2);
    expect(contribution2.callCount).toBe(1);

    // Change tracked signal in factory function of contribution 2.
    contribution2.signal.set('B');
    await fixture.whenStable();

    // Expect only factory function of contribution 2 to be called.
    expect(contribution1.callCount).toBe(2);
    expect(contribution2.callCount).toBe(2);
  });

  it('should not call toolbar factory function again when signal of toolbar item changes', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    @Component({
      selector: 'spec-testee',
      template: `
        <sci-toolbar name="toolbar:testee" class="testee-1"/>
        <sci-toolbar name="toolbar:testee" class="testee-2"/>
      `,
      imports: [SciToolbarComponent],
    })
    class SpecTesteeComponent {
    }

    const fixture = TestBed.createComponent(SpecTesteeComponent);
    let toolbarFactoryFunctionCallCount = 0;
    const visible = signal(true);

    // Contribute to toolbar.
    contributeMenu('toolbar:testee', toolbar => {
      toolbarFactoryFunctionCallCount++;
      toolbar.addToolbarButton({icon: 'icon', visible: visible, onSelect: noop});
    }, {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect toolbar.
    expect(toolbarFactoryFunctionCallCount).toBe(1);
    const toolbar1 = new ToolbarPO(fixture, {cssClass: 'testee-1'});
    const toolbar2 = new ToolbarPO(fixture, {cssClass: 'testee-2'});
    await expectAsync(toolbar1).toEqualToolbar([{type: 'menu-item', icon: 'icon'}]);
    await expectAsync(toolbar2).toEqualToolbar([{type: 'menu-item', icon: 'icon'}]);

    // Change signal.
    visible.set(false);
    await fixture.whenStable();

    // Expect toolbar.
    await expectAsync(toolbar1).toEqualToolbar([]);
    await expectAsync(toolbar2).toEqualToolbar([]);
    expect(toolbarFactoryFunctionCallCount).toBe(1);
  });

  it('should remove contribution on dispose', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);

    // Contribute to toolbar.
    const toolbarContribution1 = contributeMenu('toolbar:testee', toolbar => toolbar.addToolbarButton({icon: 'icon-1', onSelect: noop}), {injector: TestBed.inject(Injector)});
    const toolbarContribution2 = contributeMenu('toolbar:testee', toolbar => toolbar.addToolbarButton({icon: 'icon-2', onSelect: noop}), {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect toolbar.
    const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
    await expectAsync(toolbar).toEqualToolbar([
      {type: 'menu-item', icon: 'icon-1'},
      {type: 'menu-item', icon: 'icon-2'},
    ]);

    // Dispose toolbar contribution 1.
    toolbarContribution1.dispose();
    await fixture.whenStable();

    // Expect toolbar.
    await expectAsync(toolbar).toEqualToolbar([
      {type: 'menu-item', icon: 'icon-2'},
    ]);

    // Dispose toolbar contribution 2.
    toolbarContribution2.dispose();

    // Expect toolbar.
    await expectAsync(toolbar).toEqualToolbar([]);
  });

  it('should destroy injector when toolbar is removed', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    @Component({
      selector: 'spec-two-toolbars',
      template: `
        @if (toolbar1Visible()) {
          <sci-toolbar name="toolbar:testee"/>
        }
        @if (toolbar2Visible()) {
          <sci-toolbar name="toolbar:testee"/>
        }
      `,
      imports: [SciToolbarComponent],
    })
    class SpecTesteeComponent {
      public toolbar1Visible = signal(true);
      public toolbar2Visible = signal(true);
    }

    const fixture = TestBed.createComponent(SpecTesteeComponent);
    let destroyed = false;

    // Contribute to toolbar.
    contributeMenu('toolbar:testee', toolbar => {
      toolbar.addToolbarButton({icon: 'icon', onSelect: noop});
      inject(DestroyRef).onDestroy(() => destroyed = true);
    }, {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect injector not to be destroyed.
    expect(destroyed).toBeFalse();

    // Remove toolbar 1.
    fixture.componentInstance.toolbar1Visible.set(false);
    await fixture.whenStable();

    // Expect injector not to be destroyed.
    expect(destroyed).toBeFalse();

    // Remove toolbar 2.
    fixture.componentInstance.toolbar2Visible.set(false);
    await fixture.whenStable();

    // Expect injector to be destroyed.
    expect(destroyed).toBeTrue();
  });

  it('should change toolbar name', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    @Component({
      selector: 'spec-testee',
      template: '<sci-toolbar [name]="name()" class="testee"/>',
      imports: [SciToolbarComponent],
    })
    class SpecTesteeComponent {
      public name = signal<`toolbar:${string}`>('toolbar:testee');
    }

    const fixture = TestBed.createComponent(SpecTesteeComponent);

    let toolbarFactoryFunction1CallCount = 0;
    let toolbarFactoryFunction2CallCount = 0;

    // Contribute to toolbar testee-1.
    contributeMenu('toolbar:testee-1', toolbar => {
      toolbarFactoryFunction1CallCount++;
      toolbar.addToolbarButton({icon: 'icon-1', onSelect: noop});
    }, {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Contribute to toolbar testee-2.
    contributeMenu('toolbar:testee-2', toolbar => {
      toolbarFactoryFunction2CallCount++;
      toolbar.addToolbarButton({icon: 'icon-2', onSelect: noop});
    }, {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect toolbar.
    expect(toolbarFactoryFunction1CallCount).toBe(0);
    expect(toolbarFactoryFunction2CallCount).toBe(0);
    const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});

    // Set toolbar name to testee-1.
    fixture.componentInstance.name.set('toolbar:testee-1');
    await fixture.whenStable();

    // Expect toolbar.
    expect(toolbarFactoryFunction1CallCount).toBe(1);
    expect(toolbarFactoryFunction2CallCount).toBe(0);
    await expectAsync(toolbar).toEqualToolbar([
      {type: 'menu-item', icon: 'icon-1'},
    ]);

    // Set toolbar name to testee-2.
    fixture.componentInstance.name.set('toolbar:testee-2');
    await fixture.whenStable();

    // Expect toolbar.
    expect(toolbarFactoryFunction1CallCount).toBe(1);
    expect(toolbarFactoryFunction2CallCount).toBe(1);
    await expectAsync(toolbar).toEqualToolbar([
      {type: 'menu-item', icon: 'icon-2'},
    ]);

    // Set toolbar name to testee-1.
    fixture.componentInstance.name.set('toolbar:testee-1');
    await fixture.whenStable();

    // Expect toolbar.
    expect(toolbarFactoryFunction1CallCount).toBe(1);
    expect(toolbarFactoryFunction2CallCount).toBe(1);
    await expectAsync(toolbar).toEqualToolbar([
      {type: 'menu-item', icon: 'icon-1'},
    ]);
  });

  it('should close menu when clicking toolbar item again', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);

    // Contribute to toolbar.
    contributeMenu('toolbar:testee', toolbar => toolbar
      .addToolbarMenu({icon: 'menu', cssClass: 'testee'}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Click toolbar item.
    const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
    toolbar.button({cssClass: 'testee'}).nativeElement.click();
    const menu = new MenuPO(fixture);

    // Expect menu.
    await expectAsync(menu).toEqualMenu([
      {type: 'menu-item', label: 'label'},
    ]);

    // Click toolbar item again.
    toolbar.button({cssClass: 'testee'}).nativeElement.click();
    await fixture.whenStable();

    // Expect menu ont to be attached.
    await expectAsync(() => menu.debugElement).not.toBeAttached();
  });

  it('should not display toolbar button if menu is empty', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);

    // Contribute to toolbar.
    contributeMenu('toolbar:testee', toolbar => toolbar
      .addToolbarButton({label: 'label-1', onSelect: noop})
      .addToolbarMenu({label: 'label-2'}, menu => menu)
      .addToolbarMenu({label: 'label-3', menu: {name: 'menu:testee-1'}}, menu => menu)
      .addToolbarMenu({label: 'label-4', menu: {name: 'menu:testee-2'}}, menu => menu), {injector: TestBed.inject(Injector)});

    contributeMenu('menu:testee-2', menu => menu, {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect toolbar.
    const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
    await expectAsync(toolbar).toEqualToolbar([
      {type: 'menu-item', label: 'label-1'},
    ]);
  });

  it('should not display empty group', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);

    // Contribute to toolbar.
    contributeMenu('toolbar:testee', toolbar => toolbar
      .addToolbarButton({label: 'label-1', onSelect: noop})
      .addGroup(group => group)
      .addGroup({})
      .addGroup({}, group => group)
      .addGroup({name: 'toolbar:testee-1'})
      .addGroup({name: 'toolbar:testee-2'})
      .addGroup({name: 'toolbar:testee-3'}, group => group)
      .addGroup({name: 'toolbar:testee-4'}, group => group), {injector: TestBed.inject(Injector)});

    contributeMenu('toolbar:testee-2', toolbar => toolbar, {injector: TestBed.inject(Injector)});
    contributeMenu('toolbar:testee-4', toolbar => toolbar, {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect toolbar.
    const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
    await expectAsync(toolbar).toEqualToolbar([
      {type: 'menu-item', label: 'label-1'},
    ]);
  });

  describe('Context', () => {

    describe('Toolbar', () => {

      it('should run factory function per context', async () => {
        @Component({
          selector: 'spec-testee',
          template: `
            <sci-toolbar name="toolbar:testee" [context]="contextToolbar1()" class="testee-1"/>
            <sci-toolbar name="toolbar:testee" [context]="contextToolbar2()" class="testee-2"/>
          `,
          imports: [SciToolbarComponent],
        })
        class SpecTesteeComponent {
          public contextToolbar1 = signal(new Map());
          public contextToolbar2 = signal(new Map());
        }

        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecTesteeComponent);

        // Contribute to toolbar.
        contributeMenu('toolbar:testee', toolbar => {
          const checked = signal(false);
          toolbar.addToolbarButton({icon: 'icon', cssClass: 'testee', checked, onSelect: () => checked.update(checked => !checked)});
        }, {injector: TestBed.inject(Injector)});

        await fixture.whenStable();

        const toolbar1 = new ToolbarPO(fixture, {selector: 'sci-toolbar.testee-1'});
        const toolbar2 = new ToolbarPO(fixture, {selector: 'sci-toolbar.testee-2'});

        // Click button in toolbar 1.
        toolbar1.button({cssClass: 'testee'}).nativeElement.click();
        await fixture.whenStable();
        await expectAsync(toolbar1).toEqualToolbar([{type: 'menu-item', checked: true}]);
        await expectAsync(toolbar2).toEqualToolbar([{type: 'menu-item', checked: true}]);

        // Set context on toolbar 1.
        fixture.componentInstance.contextToolbar1.set(new Map().set('context', 'A'));
        await fixture.whenStable();
        await expectAsync(toolbar1).toEqualToolbar([{type: 'menu-item', checked: false}]);
        await expectAsync(toolbar2).toEqualToolbar([{type: 'menu-item', checked: true}]);

        // Set context on toolbar 2.
        fixture.componentInstance.contextToolbar2.set(new Map().set('context', 'B'));
        await fixture.whenStable();
        await expectAsync(toolbar1).toEqualToolbar([{type: 'menu-item', checked: false}]);
        await expectAsync(toolbar2).toEqualToolbar([{type: 'menu-item', checked: false}]);

        // Click button in toolbar 1.
        toolbar1.button({cssClass: 'testee'}).nativeElement.click();
        await fixture.whenStable();
        await expectAsync(toolbar1).toEqualToolbar([{type: 'menu-item', checked: true}]);
        await expectAsync(toolbar2).toEqualToolbar([{type: 'menu-item', checked: false}]);

        // Click button in toolbar 2.
        toolbar2.button({cssClass: 'testee'}).nativeElement.click();
        await fixture.whenStable();
        await expectAsync(toolbar1).toEqualToolbar([{type: 'menu-item', checked: true}]);
        await expectAsync(toolbar2).toEqualToolbar([{type: 'menu-item', checked: true}]);
      });

      it('should inherit context from environment', async () => {
        const rootContext = signal(new Map());
        const componentContext = signal(new Map());

        @Component({
          selector: 'spec-testee',
          template: '<sci-toolbar name="toolbar:testee" [context]="context()"/>',
          imports: [SciToolbarComponent],
          providers: [
            provideMenuContextProvider(() => componentContext),
          ],
        })
        class SpecTesteeComponent {
          public context = signal(new Map());
        }

        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
            provideMenuContextProvider(() => rootContext),
          ],
        });

        const fixture = TestBed.createComponent(SpecTesteeComponent);

        // Contribute to toolbar requiring context A.
        contributeMenu('toolbar:testee', (toolbar, context) => {
          toolbar.addToolbarButton({icon: `${context.get('context')}`, onSelect: noop});
        }, {requiredContext: new Map().set('context', 'A'), injector: TestBed.inject(Injector)});

        // Contribute to toolbar requiring context B.
        contributeMenu('toolbar:testee', (toolbar, context) => {
          toolbar.addToolbarButton({icon: `${context.get('context')}`, onSelect: noop});
        }, {requiredContext: new Map().set('context', 'B'), injector: TestBed.inject(Injector)});
        await fixture.whenStable();

        const toolbar = new ToolbarPO(fixture, {selector: 'sci-toolbar'});

        // Expect toolbar.
        await expectAsync(toolbar).toEqualToolbar([]);

        // Set root context to A.
        rootContext.set(new Map().set('context', 'A'));
        await fixture.whenStable();
        await expectAsync(toolbar).toEqualToolbar([{type: 'menu-item', icon: 'A'}]);

        // Set component context to B.
        componentContext.set(new Map().set('context', 'B'));
        await fixture.whenStable();
        await expectAsync(toolbar).toEqualToolbar([{type: 'menu-item', icon: 'B'}]);

        // Clear component context.
        componentContext.set(new Map());
        await fixture.whenStable();
        await expectAsync(toolbar).toEqualToolbar([{type: 'menu-item', icon: 'A'}]);

        // Set context on toolbar to B.
        fixture.componentInstance.context.set(new Map().set('context', 'B'));
        await fixture.whenStable();
        await expectAsync(toolbar).toEqualToolbar([{type: 'menu-item', icon: 'B'}]);

        // Set context on toolbar to C.
        fixture.componentInstance.context.set(new Map().set('context', 'C'));
        await fixture.whenStable();
        await expectAsync(toolbar).toEqualToolbar([]);

        // Set context on toolbar to undefined.
        fixture.componentInstance.context.set(new Map().set('context', undefined));
        await fixture.whenStable();
        await expectAsync(toolbar).toEqualToolbar([]);
      });
    });

    describe('Contribution', () => {

      it('should inherit context from environment', async () => {
        @Component({
          selector: 'spec-testee',
          template: '<sci-toolbar name="toolbar:testee" [context]="context()"/>',
          imports: [SciToolbarComponent],
        })
        class SpecTesteeComponent {
          public context = signal(new Map());
        }

        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecTesteeComponent);

        const parentContributionContext = signal(new Map());
        const childContributionContext = signal(new Map());

        const parentContributionInjector = Injector.create({
          parent: TestBed.inject(Injector),
          providers: [
            provideMenuContextProvider(() => parentContributionContext),
          ],
        });

        const childContributionInjector = Injector.create({
          parent: parentContributionInjector,
          providers: [
            provideMenuContextProvider(() => childContributionContext),
          ],
        });

        // Set context on toolbar to A.
        fixture.componentInstance.context.set(new Map().set('context', 'A'));

        // Contribute to toolbar.
        const contribution1 = contributeMenu('toolbar:testee', (toolbar, context) => {
          toolbar.addToolbarButton({icon: `${context.get('context')}`, onSelect: noop});
        }, {injector: childContributionInjector});

        await fixture.whenStable();

        const toolbar = new ToolbarPO(fixture, {selector: 'sci-toolbar'});

        // Expect toolbar.
        await expectAsync(toolbar).toEqualToolbar([{type: 'menu-item', icon: 'A'}]);

        // Set parent context to B.
        parentContributionContext.set(new Map().set('context', 'B'));
        await fixture.whenStable();
        await expectAsync(toolbar).toEqualToolbar([]);

        // Set child context to A.
        childContributionContext.set(new Map().set('context', 'A'));
        await fixture.whenStable();
        await expectAsync(toolbar).toEqualToolbar([{type: 'menu-item', icon: 'A'}]);

        // Dispose contribution 1.
        contribution1.dispose();

        // Contribute to toolbar with required context C.
        const contribution2 = contributeMenu('toolbar:testee', (toolbar, context) => {
          toolbar.addToolbarButton({icon: `${context.get('context')}`, onSelect: noop});
        }, {requiredContext: new Map().set('context', 'C'), injector: childContributionInjector});
        await fixture.whenStable();
        await expectAsync(toolbar).toEqualToolbar([]);

        // Set context on toolbar to C.
        fixture.componentInstance.context.set(new Map().set('context', 'C'));
        await fixture.whenStable();
        await expectAsync(toolbar).toEqualToolbar([{type: 'menu-item', icon: 'C'}]);

        // Dispose contribution 2.
        contribution2.dispose();

        // Contribute to toolbar with required context undefined.
        contributeMenu('toolbar:testee', (toolbar, context) => {
          toolbar.addToolbarButton({icon: `${context.get('context')}`, onSelect: noop});
        }, {requiredContext: new Map().set('context', undefined), injector: childContributionInjector});
        await fixture.whenStable();
        await expectAsync(toolbar).toEqualToolbar([{type: 'menu-item', icon: 'C'}]);
      });

      it('should inherit injection tokens from environment', async () => {
        const PARENT_PROVIDER = new InjectionToken<string>('PARENT_PROVIDER');
        const CHILD_PROVIDER = new InjectionToken<string>('CHILD_PROVIDER');
        const LEVEL = new InjectionToken<string>('LEVEL');
        const TOKEN = new InjectionToken<string>('CONTEXT');

        @Component({
          selector: 'spec-parent',
          template: '<spec-child/>',
          imports: [forwardRef(() => SpecChildComponent)],
          providers: [
            {provide: LEVEL, useValue: 'level-1'},
            provideMenuInjectionContextProvider(context => [
              {provide: PARENT_PROVIDER, useValue: 'parent'},
              {provide: TOKEN, useValue: `${inject(LEVEL)}-${context.get('context')}`},
            ]),
          ],
        })
        class SpecParentComponent {
        }

        @Component({
          selector: 'spec-child',
          template: '<sci-toolbar name="toolbar:testee" [context]="context()"/>',
          imports: [SciToolbarComponent],
          providers: [
            {provide: LEVEL, useValue: 'level-2'},
            provideMenuInjectionContextProvider(context => [
              {provide: CHILD_PROVIDER, useValue: 'child'},
              {provide: TOKEN, useValue: `${inject(LEVEL)}-${context.get('context')}`},
            ]),
          ],
        })
        class SpecChildComponent {
          public context = signal(new Map());
        }

        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecParentComponent);

        // Set context on toolbar to A.
        (fixture.debugElement.query(By.directive(SpecChildComponent)).componentInstance as SpecChildComponent).context.set(new Map().set('context', 'A'));

        // Contribute to toolbar.
        contributeMenu('toolbar:testee', toolbar => {
          toolbar.addToolbarButton({label: `[PARENT_PROVIDER=${inject(PARENT_PROVIDER)}, CHILD_PROVIDER=${inject(CHILD_PROVIDER)}, TOKEN=${inject(TOKEN)}]`, onSelect: noop});
        }, {injector: TestBed.inject(Injector)});
        await fixture.whenStable();

        const toolbar = new ToolbarPO(fixture, {selector: 'sci-toolbar'});

        // Expect toolbar.
        await expectAsync(toolbar).toEqualToolbar([{type: 'menu-item', label: '[PARENT_PROVIDER=parent, CHILD_PROVIDER=child, TOKEN=level-2-A]'}]);
      });

      it('should require any context value (*)', async () => {
        @Component({
          selector: 'spec-testee',
          template: '<sci-toolbar name="toolbar:testee" [context]="context()"/>',
          imports: [SciToolbarComponent],
        })
        class SpecTesteeComponent {
          public context = signal(new Map());
        }

        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecTesteeComponent);

        // Contribute to toolbar.
        contributeMenu('toolbar:testee', (toolbar, context) => {
          toolbar.addToolbarButton({icon: `${context.get('context')}`, onSelect: noop});
        }, {requiredContext: new Map().set('context', '*'), injector: TestBed.inject(Injector)});
        await fixture.whenStable();

        const toolbar = new ToolbarPO(fixture, {selector: 'sci-toolbar'});

        // Expect toolbar.
        await expectAsync(toolbar).toEqualToolbar([]);

        // Set context on toolbar to A.
        fixture.componentInstance.context.set(new Map().set('context', 'A'));
        await fixture.whenStable();
        await expectAsync(toolbar).toEqualToolbar([{type: 'menu-item', icon: 'A'}]);

        // Set context on toolbar to B.
        fixture.componentInstance.context.set(new Map().set('context', 'B'));
        await fixture.whenStable();
        await expectAsync(toolbar).toEqualToolbar([{type: 'menu-item', icon: 'B'}]);

        // Set context on toolbar to undefined.
        fixture.componentInstance.context.set(new Map().set('context', undefined));
        await fixture.whenStable();
        await expectAsync(toolbar).toEqualToolbar([]);

        // Clear context on toolbar.
        fixture.componentInstance.context.set(new Map());
        await fixture.whenStable();
        await expectAsync(toolbar).toEqualToolbar([]);
      });
    });

    describe('AcceleratorTarget', () => {

      it('should inherit target from environment', async () => {
        const rootAcceleratorTargets = signal<Element[]>([]);
        const childAcceleratorTargets = signal<Element[]>([]);

        @Component({
          selector: 'spec-testee',
          template: `
            <div id="accelerator-target-1"></div>
            <div id="accelerator-target-2"></div>
            <div id="accelerator-target-3"></div>
            <div id="accelerator-target-4"></div>
            <sci-toolbar name="toolbar:testee" [acceleratorTarget]="acceleratorTargets()"/>
          `,
          imports: [SciToolbarComponent],
          providers: [
            provideMenuAcceleratorTargetProvider(() => childAcceleratorTargets),
          ],
        })
        class SpecTesteeComponent {
          public acceleratorTargets = signal<Element[]>([]);
        }

        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
            provideMenuAcceleratorTargetProvider(() => rootAcceleratorTargets),
          ],
        });

        const fixture = TestBed.createComponent(SpecTesteeComponent);

        const acceleratorTarget1 = document.querySelector('div#accelerator-target-1')!;
        const acceleratorTarget2 = document.querySelector('div#accelerator-target-2')!;
        const acceleratorTarget3 = document.querySelector('div#accelerator-target-3')!;
        const acceleratorTarget4 = document.querySelector('div#accelerator-target-4')!;

        // Spy console.
        const spy = spyOn(console, 'log').and.callThrough();

        // Contribute to toolbar.
        contributeMenu('toolbar:testee', toolbar => {
          toolbar.addToolbarButton({icon: 'icon', accelerator: {alt: true, key: '1'}, onSelect: () => console.log('onSelect item')});
        }, {injector: TestBed.inject(Injector)});
        await fixture.whenStable();

        const toolbar = new ToolbarPO(fixture, {selector: 'sci-toolbar'});
        await expectAsync(toolbar).toEqualToolbar([{type: 'menu-item', icon: 'icon'}]);

        // Press alt-1 on document.
        document.dispatchEvent(new KeyboardEvent('keydown', {key: '1', altKey: true}));
        expect(console.log).toHaveBeenCalledWith('onSelect item');
        spy.calls.reset();

        // Set accelerator target 1 on root.
        rootAcceleratorTargets.set([acceleratorTarget1]);
        await fixture.whenStable();

        // Press alt-1 on accelerator target 1.
        acceleratorTarget1.dispatchEvent(new KeyboardEvent('keydown', {key: '1', altKey: true}));
        expect(console.log).toHaveBeenCalledWith('onSelect item');
        spy.calls.reset();

        // Press alt-1 on document.
        document.dispatchEvent(new KeyboardEvent('keydown', {key: '1', altKey: true}));
        expect(console.log).not.toHaveBeenCalledWith('onSelect item');
        spy.calls.reset();

        // Set accelerator target 2 on child.
        childAcceleratorTargets.set([acceleratorTarget2]);
        await fixture.whenStable();

        // Press alt-1 on accelerator target 1.
        acceleratorTarget1.dispatchEvent(new KeyboardEvent('keydown', {key: '1', altKey: true}));
        expect(console.log).toHaveBeenCalledWith('onSelect item');
        spy.calls.reset();

        // Press alt-1 on accelerator target 2.
        acceleratorTarget2.dispatchEvent(new KeyboardEvent('keydown', {key: '1', altKey: true}));
        expect(console.log).toHaveBeenCalledWith('onSelect item');
        spy.calls.reset();

        // Press alt-1 on document.
        document.dispatchEvent(new KeyboardEvent('keydown', {key: '1', altKey: true}));
        expect(console.log).not.toHaveBeenCalledWith('onSelect item');
        spy.calls.reset();

        // Set accelerator target 1 and target 3 on root.
        rootAcceleratorTargets.set([acceleratorTarget1, acceleratorTarget3]);
        await fixture.whenStable();

        // Press alt-1 on accelerator target 1.
        acceleratorTarget1.dispatchEvent(new KeyboardEvent('keydown', {key: '1', altKey: true}));
        expect(console.log).toHaveBeenCalledWith('onSelect item');
        spy.calls.reset();

        // Press alt-1 on accelerator target 2.
        acceleratorTarget2.dispatchEvent(new KeyboardEvent('keydown', {key: '1', altKey: true}));
        expect(console.log).toHaveBeenCalledWith('onSelect item');
        spy.calls.reset();

        // Press alt-1 on accelerator target 3.
        acceleratorTarget3.dispatchEvent(new KeyboardEvent('keydown', {key: '1', altKey: true}));
        expect(console.log).toHaveBeenCalledWith('onSelect item');
        spy.calls.reset();

        // Press alt-1 on document.
        document.dispatchEvent(new KeyboardEvent('keydown', {key: '1', altKey: true}));
        expect(console.log).not.toHaveBeenCalledWith('onSelect item');
        spy.calls.reset();

        // Set accelerator target 4 on toolbar.
        fixture.componentInstance.acceleratorTargets.set([acceleratorTarget4]);
        await fixture.whenStable();

        // Press alt-1 on accelerator target 1.
        acceleratorTarget1.dispatchEvent(new KeyboardEvent('keydown', {key: '1', altKey: true}));
        expect(console.log).not.toHaveBeenCalledWith('onSelect item');
        spy.calls.reset();

        // Press alt-1 on accelerator target 2.
        acceleratorTarget2.dispatchEvent(new KeyboardEvent('keydown', {key: '1', altKey: true}));
        expect(console.log).not.toHaveBeenCalledWith('onSelect item');
        spy.calls.reset();

        // Press alt-1 on accelerator target 3.
        acceleratorTarget3.dispatchEvent(new KeyboardEvent('keydown', {key: '1', altKey: true}));
        expect(console.log).not.toHaveBeenCalledWith('onSelect item');
        spy.calls.reset();

        // Press alt-1 on accelerator target 4.
        acceleratorTarget4.dispatchEvent(new KeyboardEvent('keydown', {key: '1', altKey: true}));
        expect(console.log).toHaveBeenCalledWith('onSelect item');
        spy.calls.reset();

        // Press alt-1 on document.
        document.dispatchEvent(new KeyboardEvent('keydown', {key: '1', altKey: true}));
        expect(console.log).not.toHaveBeenCalledWith('onSelect item');
        spy.calls.reset();
      });
    });
  });

  describe('Toolbar Button', () => {

    it('should provide icon', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const icon = signal('testee-2');

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarButton({icon: 'testee-1', onSelect: noop})
        .addToolbarButton({icon: icon, onSelect: noop})
        .addToolbarButton({icon: SpecControlComponent, onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          icon: 'testee-1',
        },
        {
          type: 'menu-item',
          icon: 'testee-2',
        },
        {
          type: 'menu-item',
          iconComponent: {selector: 'spec-control'},
        },
      ]);

      // Update icon.
      icon.set('TESTEE-2');
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          icon: 'testee-1',
        },
        {
          type: 'menu-item',
          icon: 'TESTEE-2',
        },
        {
          type: 'menu-item',
          iconComponent: {selector: 'spec-control'},
        },
      ]);
    });

    it('should provide label', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const label = signal('testee-2');

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarButton({label: 'testee-1', onSelect: noop})
        .addToolbarButton({label: label, onSelect: noop})
        .addToolbarButton({label: SpecControlComponent, onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          label: 'testee-1',
        },
        {
          type: 'menu-item',
          label: 'testee-2',
        },
        {
          type: 'menu-item',
          labelComponent: {selector: 'spec-control'},
        },
      ]);

      // Update label.
      label.set('TESTEE-2');
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          label: 'testee-1',
        },
        {
          type: 'menu-item',
          label: 'TESTEE-2',
        },
        {
          type: 'menu-item',
          labelComponent: {selector: 'spec-control'},
        },
      ]);
    });

    it('should provide tooltip', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const tooltip = signal('testee-1');

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarButton({tooltip: 'testee', icon: 'icon', onSelect: noop})
        .addToolbarButton({tooltip: tooltip, icon: 'icon', onSelect: noop})
        .addToolbarButton({tooltip: 'testee', icon: 'icon', accelerator: {key: 'F1'}, onSelect: noop})
        .addToolbarButton({tooltip: 'testee', icon: 'icon', accelerator: {alt: true, key: '1'}, onSelect: noop})
        .addToolbarButton({tooltip: 'testee', icon: 'icon', accelerator: {shift: true, key: '2'}, onSelect: noop})
        .addToolbarButton({tooltip: 'testee', icon: 'icon', accelerator: {ctrl: true, key: '3'}, onSelect: noop})
        .addToolbarButton({tooltip: 'testee', icon: 'icon', accelerator: {shift: true, alt: true, key: '4'}, onSelect: noop})
        .addToolbarButton({tooltip: 'testee', icon: 'icon', accelerator: {ctrl: true, shift: true, key: '5'}, onSelect: noop})
        .addToolbarButton({tooltip: 'testee', icon: 'icon', accelerator: {ctrl: true, alt: true, key: '6'}, onSelect: noop})
        .addToolbarButton({tooltip: 'testee', icon: 'icon', accelerator: {ctrl: true, shift: true, alt: true, key: '7'}, onSelect: noop})
        .addToolbarButton({tooltip: 'testee', icon: 'icon', accelerator: {ctrl: true, key: ' '}, onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          tooltip: 'testee',
        },
        {
          type: 'menu-item',
          tooltip: 'testee-1',
        },
        {
          type: 'menu-item',
          tooltip: 'testee (F1)',
        },
        {
          type: 'menu-item',
          tooltip: 'testee (Alt+1)',
        },
        {
          type: 'menu-item',
          tooltip: 'testee (Shift+2)',
        },
        {
          type: 'menu-item',
          tooltip: 'testee (Ctrl+3)',
        },
        {
          type: 'menu-item',
          tooltip: 'testee (Shift+Alt+4)',
        },
        {
          type: 'menu-item',
          tooltip: 'testee (Ctrl+Shift+5)',
        },
        {
          type: 'menu-item',
          tooltip: 'testee (Ctrl+Alt+6)',
        },
        {
          type: 'menu-item',
          tooltip: 'testee (Ctrl+Shift+Alt+7)',
        },
        {
          type: 'menu-item',
          tooltip: 'testee (Ctrl+Space)',
        },
      ]);

      // Update tooltip.
      tooltip.set('TESTEE-1');
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          tooltip: 'testee',
        },
        {
          type: 'menu-item',
          tooltip: 'TESTEE-1',
        },
        {
          type: 'menu-item',
          tooltip: 'testee (F1)',
        },
        {
          type: 'menu-item',
          tooltip: 'testee (Alt+1)',
        },
        {
          type: 'menu-item',
          tooltip: 'testee (Shift+2)',
        },
        {
          type: 'menu-item',
          tooltip: 'testee (Ctrl+3)',
        },
        {
          type: 'menu-item',
          tooltip: 'testee (Shift+Alt+4)',
        },
        {
          type: 'menu-item',
          tooltip: 'testee (Ctrl+Shift+5)',
        },
        {
          type: 'menu-item',
          tooltip: 'testee (Ctrl+Alt+6)',
        },
        {
          type: 'menu-item',
          tooltip: 'testee (Ctrl+Shift+Alt+7)',
        },
        {
          type: 'menu-item',
          tooltip: 'testee (Ctrl+Space)',
        },
      ]);
    });

    it('should provide disabled', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const disabled = signal(true);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarButton({icon: 'icon-1', onSelect: noop})
        .addToolbarButton({icon: 'icon-2', disabled: true, onSelect: noop})
        .addToolbarButton({icon: 'icon-3', disabled: false, onSelect: noop})
        .addToolbarButton({icon: 'icon-4', disabled: disabled, onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          icon: 'icon-1',
          disabled: false,
        },
        {
          type: 'menu-item',
          icon: 'icon-2',
          disabled: true,
        },
        {
          type: 'menu-item',
          icon: 'icon-3',
          disabled: false,
        },
        {
          type: 'menu-item',
          icon: 'icon-4',
          disabled: true,
        },
      ]);

      // Update disabled.
      disabled.set(false);
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          icon: 'icon-1',
          disabled: false,
        },
        {
          type: 'menu-item',
          icon: 'icon-2',
          disabled: true,
        },
        {
          type: 'menu-item',
          icon: 'icon-3',
          disabled: false,
        },
        {
          type: 'menu-item',
          icon: 'icon-4',
          disabled: false,
        },
      ]);
    });

    it('should provide checked', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const checked = signal(true);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarButton({icon: 'icon-1', onSelect: noop})
        .addToolbarButton({icon: 'icon-2', checked: true, onSelect: noop})
        .addToolbarButton({icon: 'icon-3', checked: false, onSelect: noop})
        .addToolbarButton({icon: 'icon-4', checked: checked, onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          checked: false,
        },
        {
          type: 'menu-item',
          checked: true,
        },
        {
          type: 'menu-item',
          checked: false,
        },
        {
          type: 'menu-item',
          checked: true,
        },
      ]);

      // Update checked.
      checked.set(false);
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          checked: false,
        },
        {
          type: 'menu-item',
          checked: true,
        },
        {
          type: 'menu-item',
          checked: false,
        },
        {
          type: 'menu-item',
          checked: false,
        },
      ]);
    });

    it('should provide visible', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const visible = signal(true);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarButton({icon: 'icon-1', onSelect: noop})
        .addToolbarButton({icon: 'icon-2', onSelect: noop, visible: true})
        .addToolbarButton({icon: 'icon-3', onSelect: noop, visible: false})
        .addToolbarButton({icon: 'icon-4', onSelect: noop, visible: visible}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          icon: 'icon-1',
        },
        {
          type: 'menu-item',
          icon: 'icon-2',
        },
        {
          type: 'menu-item',
          icon: 'icon-4',
        },
      ]);

      // Update visible.
      visible.set(false);
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          icon: 'icon-1',
        },
        {
          type: 'menu-item',
          icon: 'icon-2',
        },
      ]);
    });

    it('should invoke onSelect callback on click', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarButton({icon: 'icon-1', cssClass: 'testee-1', onSelect: () => console.log('Click item 1')})
        .addToolbarButton({icon: 'icon-2', cssClass: 'testee-2', onSelect: () => console.log('Click item 2')}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Spy console.
      spyOn(console, 'log').and.callThrough();

      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});

      // Click on item 1.
      toolbar.button({cssClass: 'testee-1'}).nativeElement.click();
      expect(console.log).toHaveBeenCalledWith('Click item 1');

      // Click on item 2.
      toolbar.button({cssClass: 'testee-2'}).nativeElement.click();
      expect(console.log).toHaveBeenCalledWith('Click item 2');
    });

    it('should invoke onSelect callback on pressing keystroke', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarButton({icon: '1', cssClass: 'testee-1', accelerator: {alt: true, key: '1'}, onSelect: () => console.log('Click item 1')})
        .addToolbarButton({icon: '2', cssClass: 'testee-2', accelerator: {alt: true, key: '2'}, onSelect: () => console.log('Click item 2')}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Spy console.
      spyOn(console, 'log').and.callThrough();

      // Press alt-1 on document.
      document.dispatchEvent(new KeyboardEvent('keydown', {key: '1', altKey: true}));
      expect(console.log).toHaveBeenCalledWith('Click item 1');

      // Press alt-2 on document.
      document.dispatchEvent(new KeyboardEvent('keydown', {key: '2', altKey: true}));
      expect(console.log).toHaveBeenCalledWith('Click item 2');
    });

    it('should provide css class', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar.addToolbarButton({cssClass: ['testee-1', 'testee-2'], icon: 'icon', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          cssClass: ['testee-1', 'testee-2'],
        },
      ]);
    });

    it('should provide attributes', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar.addToolbarButton({attributes: {attr1: 'testee-1', attr2: 'testee-2'}, icon: 'icon', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          attributes: {attr1: 'testee-1', attr2: 'testee-2'},
        },
      ]);
    });
  });

  describe('Toolbar Split Button', () => {

    it('should invoke onSelect callback on primary button click', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarSplitButton({icon: 'icon-1', cssClass: 'testee-1', onSelect: () => console.log('Click item 1')}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
        .addToolbarSplitButton({icon: 'icon-2', cssClass: 'testee-2', onSelect: () => console.log('Click item 2')}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Spy console.
      spyOn(console, 'log').and.callThrough();

      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});

      // Click on item 1.
      toolbar.splitButton({cssClass: 'testee-1'}).primaryButton.nativeElement.click();
      expect(console.log).toHaveBeenCalledWith('Click item 1');

      // Click on item 2.
      toolbar.splitButton({cssClass: 'testee-2'}).primaryButton.nativeElement.click();
      expect(console.log).toHaveBeenCalledWith('Click item 2');
    });

    it('should open menu on menu button click', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarSplitButton({icon: 'icon', cssClass: 'testee', onSelect: noop}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      toolbar.splitButton({cssClass: 'testee'}).menuButton.nativeElement.click();

      // Expect menu.
      const menu = new MenuPO(fixture);
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu-item',
          label: 'label',
        },
      ]);
    });
  });

  describe('Toolbar Control', () => {

    it('should provide component', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar.addToolbarControl({component: SpecControlComponent}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          control: {selector: 'spec-control'},
        },
      ]);
    });

    it('should provide tooltip', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarControl({tooltip: 'testee', component: SpecControlComponent}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          tooltip: 'testee',
        },
      ]);
    });

    it('should provide css class', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarControl({cssClass: ['testee-1', 'testee-2'], component: SpecControlComponent}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          cssClass: ['testee-1', 'testee-2'],
        },
      ]);
    });

    it('should provide attributes', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarControl({attributes: {attr1: 'testee-1', attr2: 'testee-2'}, component: SpecControlComponent}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          attributes: {attr1: 'testee-1', attr2: 'testee-2'},
        },
      ]);
    });
  });

  describe('Toolbar Menu', () => {

    it('should provide icon', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const icon = signal('testee-2');

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarMenu({icon: 'testee-1'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
        .addToolbarMenu({icon: icon}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
        .addToolbarMenu({icon: SpecControlComponent}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu',
          icon: 'testee-1',
        },
        {
          type: 'menu',
          icon: 'testee-2',
        },
        {
          type: 'menu',
          iconComponent: {selector: 'spec-control'},
        },
      ]);

      // Update icon.
      icon.set('TESTEE-2');
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu',
          icon: 'testee-1',
        },
        {
          type: 'menu',
          icon: 'TESTEE-2',
        },
        {
          type: 'menu',
          iconComponent: {selector: 'spec-control'},
        },
      ]);
    });

    it('should provide label', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const label = signal('testee-2');

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarMenu({label: 'testee-1'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
        .addToolbarMenu({label: label}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
        .addToolbarMenu({label: SpecControlComponent}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu',
          label: 'testee-1',
        },
        {
          type: 'menu',
          label: 'testee-2',
        },
        {
          type: 'menu',
          labelComponent: {selector: 'spec-control'},
        },
      ]);

      // Update label.
      label.set('TESTEE-2');
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu',
          label: 'testee-1',
        },
        {
          type: 'menu',
          label: 'testee-2',
        },
        {
          type: 'menu',
          labelComponent: {selector: 'spec-control'},
        },
      ]);
    });

    it('should provide tooltip', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const tooltip = signal('testee-2');

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarMenu({tooltip: 'testee-1', label: 'label'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
        .addToolbarMenu({tooltip: tooltip, label: 'label'}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu',
          tooltip: 'testee-1',
        },
        {
          type: 'menu',
          tooltip: 'testee-2',
        },
      ]);

      // Update tooltip.
      tooltip.set('TESTEE-2');
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu',
          tooltip: 'testee-1',
        },
        {
          type: 'menu',
          tooltip: 'TESTEE-2',
        },
      ]);
    });

    it('should provide disabled', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const disabled = signal(true);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarMenu({label: 'label-1'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
        .addToolbarMenu({label: 'label-2', disabled: true}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
        .addToolbarMenu({label: 'label-3', disabled: false}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
        .addToolbarMenu({label: 'label-4', disabled: disabled}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu',
          label: 'label-1',
          disabled: false,
        },
        {
          type: 'menu',
          label: 'label-2',
          disabled: true,
        },
        {
          type: 'menu',
          label: 'label-3',
          disabled: false,
        },
        {
          type: 'menu',
          label: 'label-4',
          disabled: true,
        },
      ]);

      // Update disabled.
      disabled.set(false);
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu',
          label: 'label-1',
          disabled: false,
        },
        {
          type: 'menu',
          label: 'label-2',
          disabled: true,
        },
        {
          type: 'menu',
          label: 'label-3',
          disabled: false,
        },
        {
          type: 'menu',
          label: 'label-4',
          disabled: false,
        },
      ]);
    });

    it('should provide visualMenuIndicator', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarMenu({visualMenuIndicator: true, icon: 'icon'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
        .addToolbarMenu({visualMenuIndicator: true, label: 'label'}, menu => menu.addMenuItem({label: 'label-1', onSelect: noop}))
        .addToolbarMenu({visualMenuIndicator: true, icon: 'icon', label: 'label'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
        .addToolbarMenu({visualMenuIndicator: false, icon: 'icon'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
        .addToolbarMenu({visualMenuIndicator: false, label: 'label'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
        .addToolbarMenu({visualMenuIndicator: false, icon: 'icon', label: 'label'}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu',
          visualMenuIndicator: true,
        },
        {
          type: 'menu',
          visualMenuIndicator: false,
        },
        {
          type: 'menu',
          visualMenuIndicator: false,
        },
        {
          type: 'menu',
          visualMenuIndicator: false,
        },
        {
          type: 'menu',
          visualMenuIndicator: false,
        },
        {
          type: 'menu',
          visualMenuIndicator: false,
        },
      ]);
    });

    it('should configure menu width', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarMenu({menu: {width: '500px'}, icon: 'icon', cssClass: 'item-1'}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      toolbar.button({cssClass: 'item-1'}).nativeElement.click();
      const menu = new MenuPO(fixture);
      await fixture.whenStable();

      // Expect menu width to be 500.
      expect(menu.nativeElement.getBoundingClientRect().width).toEqual(500);
    });

    it('should configure menu minWidth', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarMenu({menu: {minWidth: '500px'}, icon: 'icon', cssClass: 'item-1'}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      toolbar.button({cssClass: 'item-1'}).nativeElement.click();
      const menu = new MenuPO(fixture);
      await fixture.whenStable();

      // Expect menu width to be 500.
      expect(menu.nativeElement.getBoundingClientRect().width).toEqual(500);
    });

    it('should configure menu maxWidth', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarMenu({menu: {maxWidth: '200px'}, icon: 'icon', cssClass: 'item-1'}, menu => menu.addMenuItem({label: 'long label text to exceed maximum width', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      toolbar.button({cssClass: 'item-1'}).nativeElement.click();
      const menu = new MenuPO(fixture);
      await fixture.whenStable();

      // Expect menu width to be 200.
      expect(menu.nativeElement.getBoundingClientRect().width).toEqual(200);
    });

    it('should configure menu maxHeight', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarMenu({menu: {maxHeight: '200px'}, icon: 'icon', cssClass: 'item-1'}, menu => menu
          .addMenuItem({label: 'label', onSelect: noop})
          .addMenuItem({label: 'label', onSelect: noop})
          .addMenuItem({label: 'label', onSelect: noop})
          .addMenuItem({label: 'label', onSelect: noop})
          .addMenuItem({label: 'label', onSelect: noop})
          .addMenuItem({label: 'label', onSelect: noop})
          .addMenuItem({label: 'label', onSelect: noop})
          .addMenuItem({label: 'label', onSelect: noop})
          .addMenuItem({label: 'label', onSelect: noop})
          .addMenuItem({label: 'label', onSelect: noop})
          .addMenuItem({label: 'label', onSelect: noop})
          .addMenuItem({label: 'label', onSelect: noop})
          .addMenuItem({label: 'label', onSelect: noop})
          .addMenuItem({label: 'label', onSelect: noop})
          .addMenuItem({label: 'label', onSelect: noop})
          .addMenuItem({label: 'label', onSelect: noop})
          .addMenuItem({label: 'label', onSelect: noop})
          .addMenuItem({label: 'label', onSelect: noop})
          .addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      const menu = new MenuPO(fixture);

      // Open menu.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      toolbar.button({cssClass: 'item-1'}).nativeElement.click();
      await fixture.whenStable();

      // Expect overflow.
      const viewportClient = menu.viewport!.query(By.css('div.viewport-client'));
      expect((viewportClient.nativeElement as HTMLElement).clientHeight).toBeGreaterThan((menu.viewport!.nativeElement as HTMLElement).clientHeight);

      // Expect menu viewport height to be 200.
      expect(menu.viewport!.nativeElement.getBoundingClientRect().height).toEqual(200);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {type: 'menu-item', label: 'label'},
        {type: 'menu-item', label: 'label'},
        {type: 'menu-item', label: 'label'},
        {type: 'menu-item', label: 'label'},
        {type: 'menu-item', label: 'label'},
        {type: 'menu-item', label: 'label'},
        {type: 'menu-item', label: 'label'},
        {type: 'menu-item', label: 'label'},
        {type: 'menu-item', label: 'label'},
        {type: 'menu-item', label: 'label'},
        {type: 'menu-item', label: 'label'},
        {type: 'menu-item', label: 'label'},
        {type: 'menu-item', label: 'label'},
        {type: 'menu-item', label: 'label'},
        {type: 'menu-item', label: 'label'},
        {type: 'menu-item', label: 'label'},
        {type: 'menu-item', label: 'label'},
        {type: 'menu-item', label: 'label'},
        {type: 'menu-item', label: 'label'},
      ]);
    });

    it('should provide css class', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarMenu({cssClass: ['testee-1', 'testee-2'], label: 'label'}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu',
          cssClass: ['testee-1', 'testee-2'],
        },
      ]);
    });

    it('should provide attributes', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarMenu({attributes: {attr1: 'testee-1', attr2: 'testee-2'}, label: 'label'}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu',
          attributes: {attr1: 'testee-1', attr2: 'testee-2'},
        },
      ]);
    });
  });

  describe('Group', () => {

    it('should call toolbar factory function in reactive context', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);
      const itemVisible = signal(false);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => {
        toolbar.addGroup({name: 'toolbar:group'});
      }, {injector: TestBed.inject(Injector)});

      contributeMenu('toolbar:group', toolbar => {
        if (itemVisible()) {
          toolbar.addToolbarButton({icon: 'icon', onSelect: noop});
        }
      }, {injector: TestBed.inject(Injector)});

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([]);

      // Show toolbar item.
      itemVisible.set(true);

      // Expect toolbar.
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'group',
          children: [
            {type: 'menu-item', icon: 'icon'},
          ],
        },
      ]);

      // Hide toolbar item.
      itemVisible.set(false);

      // Expect toolbar.
      await expectAsync(toolbar).toEqualToolbar([]);
    });

    it('should call toolbar factory function only when tracked signal changes', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);
      const contribution1 = {
        callCount: 0,
        signal: signal('A'),
      };

      const contribution2 = {
        callCount: 0,
        signal: signal('A'),
      };

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => {
        contribution1.callCount++;
        contribution1.signal();
        toolbar.addToolbarButton({icon: 'icon-1', onSelect: noop});
        toolbar.addGroup({name: 'toolbar:group'});
      }, {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      expect(contribution1.callCount).toBe(1);
      await expectAsync(toolbar).toEqualToolbar([
        {type: 'menu-item', icon: 'icon-1'},
      ]);

      // Contribute to group.
      contributeMenu('toolbar:group', toolbar => {
        contribution2.callCount++;
        contribution2.signal();
        toolbar.addToolbarButton({icon: 'icon-2', onSelect: noop});
      }, {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      expect(contribution1.callCount).toBe(1);
      expect(contribution2.callCount).toBe(1);
      await expectAsync(toolbar).toEqualToolbar([
        {type: 'menu-item', icon: 'icon-1'},
        {
          type: 'group',
          children: [
            {type: 'menu-item', icon: 'icon-2'},
          ],
        },
      ]);

      // Change tracked signal in factory function of contribution 1.
      contribution1.signal.set('B');
      await fixture.whenStable();

      // Expect only factory function of contribution 1 to be called.
      expect(contribution1.callCount).toBe(2);
      expect(contribution2.callCount).toBe(1);

      // Change tracked signal in factory function of contribution 2.
      contribution2.signal.set('B');
      await fixture.whenStable();

      // Expect only factory function of contribution 2 to be called.
      expect(contribution1.callCount).toBe(2);
      expect(contribution2.callCount).toBe(2);
    });

    it('should not call toolbar factory function again when signal of toolbar item changes', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);
      const contribution1 = {
        callCount: 0,
        icon: signal('icon-1'),
      };

      const contribution2 = {
        callCount: 0,
        icon: signal('icon-2'),
      };

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => {
        contribution1.callCount++;
        toolbar.addToolbarButton({icon: contribution1.icon, onSelect: noop});
        toolbar.addGroup({name: 'toolbar:group'});
      }, {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      expect(contribution1.callCount).toBe(1);
      await expectAsync(toolbar).toEqualToolbar([
        {type: 'menu-item', icon: 'icon-1'},
      ]);

      // Contribute to group.
      contributeMenu('toolbar:group', toolbar => {
        contribution2.callCount++;
        toolbar.addToolbarButton({icon: contribution2.icon, onSelect: noop});
      }, {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      expect(contribution1.callCount).toBe(1);
      expect(contribution2.callCount).toBe(1);
      await expectAsync(toolbar).toEqualToolbar([
        {type: 'menu-item', icon: 'icon-1'},
        {
          type: 'group',
          children: [
            {type: 'menu-item', icon: 'icon-2'},
          ],
        },
      ]);

      // Change signal in factory function of contribution 1.
      contribution1.icon.set('icon-1a');
      await fixture.whenStable();

      // Expect factory function not to be called again.
      expect(contribution1.callCount).toBe(1);
      expect(contribution2.callCount).toBe(1);
      await expectAsync(toolbar).toEqualToolbar([
        {type: 'menu-item', icon: 'icon-1a'},
        {
          type: 'group',
          children: [
            {type: 'menu-item', icon: 'icon-2'},
          ],
        },
      ]);

      // Change tracked signal in factory function of contribution 2.
      contribution2.icon.set('icon-2a');
      await fixture.whenStable();

      // Expect factory function not to be called again.
      expect(contribution1.callCount).toBe(1);
      expect(contribution2.callCount).toBe(1);
      await expectAsync(toolbar).toEqualToolbar([
        {type: 'menu-item', icon: 'icon-1a'},
        {
          type: 'group',
          children: [
            {type: 'menu-item', icon: 'icon-2a'},
          ],
        },
      ]);
    });

    it('should provide disabled', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const disabled = signal(true);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addGroup({}, toolbar => toolbar.addToolbarButton({icon: 'icon', onSelect: noop}))
        .addGroup({disabled: true}, toolbar => toolbar.addToolbarButton({icon: 'icon', onSelect: noop}))
        .addGroup({disabled: false}, toolbar => toolbar.addToolbarButton({icon: 'icon', onSelect: noop}))
        .addGroup({disabled: disabled}, toolbar => toolbar.addToolbarButton({icon: 'icon', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'group',
          children: [
            {
              type: 'menu-item',
              disabled: false,
            },
          ],
        },
        {
          type: 'group',
          children: [
            {
              type: 'menu-item',
              disabled: true,
            },
          ],
        },
        {
          type: 'group',
          children: [
            {
              type: 'menu-item',
              disabled: false,
            },
          ],
        },
        {
          type: 'group',
          children: [
            {
              type: 'menu-item',
              disabled: true,
            },
          ],
        },
      ]);

      // Update disabled.
      disabled.set(false);
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'group',
          children: [
            {
              type: 'menu-item',
              disabled: false,
            },
          ],
        },
        {
          type: 'group',
          children: [
            {
              type: 'menu-item',
              disabled: true,
            },
          ],
        },
        {
          type: 'group',
          children: [
            {
              type: 'menu-item',
              disabled: false,
            },
          ],
        },
        {
          type: 'group',
          children: [
            {
              type: 'menu-item',
              disabled: false,
            },
          ],
        },
      ]);
    });

    it('should provide css class', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addGroup({cssClass: ['testee-1', 'testee-2']}, toolbar => toolbar.addToolbarButton({icon: 'icon', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'group',
          cssClass: ['testee-1', 'testee-2'],
        },
      ]);
    });
  });

  describe('Toolbar Contribution Position', () => {

    it('should contribute at position start', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarButton({icon: 'icon-1', onSelect: noop})
        .addToolbarButton({icon: 'icon-2', onSelect: noop})
        .addToolbarButton({icon: 'icon-3', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Contribute to toolbar at position start.
      contributeMenu({location: 'toolbar:testee', position: 'start'}, toolbar => toolbar.addToolbarButton({icon: 'icon-testee', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          icon: 'icon-testee',
        },
        {
          type: 'menu-item',
          icon: 'icon-1',
        },
        {
          type: 'menu-item',
          icon: 'icon-2',
        },
        {
          type: 'menu-item',
          icon: 'icon-3',
        },
      ]);
    });

    it('should contribute at position end', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarButton({icon: 'icon-1', onSelect: noop})
        .addToolbarButton({icon: 'icon-2', onSelect: noop})
        .addToolbarButton({icon: 'icon-3', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Contribute to toolbar at position end.
      contributeMenu({location: 'toolbar:testee', position: 'end'}, toolbar => toolbar.addToolbarButton({icon: 'icon-testee', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          icon: 'icon-1',
        },
        {
          type: 'menu-item',
          icon: 'icon-2',
        },
        {
          type: 'menu-item',
          icon: 'icon-3',
        },
        {
          type: 'menu-item',
          icon: 'icon-testee',
        },
      ]);
    });

    it('should contribute before menu-item', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarButton({icon: 'icon-1', onSelect: noop})
        .addToolbarButton({name: 'menuitem:2', icon: 'icon-2', onSelect: noop})
        .addToolbarButton({icon: 'icon-3', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Contribute to toolbar before menuitem:2.
      contributeMenu({location: 'toolbar:testee', before: 'menuitem:2'}, toolbar => toolbar.addToolbarButton({icon: 'icon-testee', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          icon: 'icon-1',
        },
        {
          type: 'menu-item',
          icon: 'icon-testee',
        },
        {
          type: 'menu-item',
          icon: 'icon-2',
        },
        {
          type: 'menu-item',
          icon: 'icon-3',
        },
      ]);
    });

    it('should contribute after menu-item', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarButton({icon: 'icon-1', onSelect: noop})
        .addToolbarButton({name: 'menuitem:2', icon: 'icon-2', onSelect: noop})
        .addToolbarButton({icon: 'icon-3', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Contribute to toolbar before menuitem:2.
      contributeMenu({location: 'toolbar:testee', after: 'menuitem:2'}, toolbar => toolbar.addToolbarButton({icon: 'icon-testee', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          icon: 'icon-1',
        },
        {
          type: 'menu-item',
          icon: 'icon-2',
        },
        {
          type: 'menu-item',
          icon: 'icon-testee',
        },
        {
          type: 'menu-item',
          icon: 'icon-3',
        },
      ]);
    });

    it('should contribute before menu', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarButton({icon: 'icon-1', onSelect: noop})
        .addToolbarMenu({name: 'menuitem:2', icon: 'icon-2'}, menu => menu
          .addMenuItem({label: 'label-2', onSelect: noop}))
        .addToolbarButton({icon: 'icon-3', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Contribute to toolbar before menu:2.
      contributeMenu({location: 'toolbar:testee', before: 'menuitem:2'}, toolbar => toolbar.addToolbarButton({icon: 'icon-testee', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          icon: 'icon-1',
        },
        {
          type: 'menu-item',
          icon: 'icon-testee',
        },
        {
          type: 'menu',
          icon: 'icon-2',
        },
        {
          type: 'menu-item',
          icon: 'icon-3',
        },
      ]);
    });

    it('should contribute after menu', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarButton({icon: 'icon-1', onSelect: noop})
        .addToolbarMenu({name: 'menuitem:2', icon: 'icon-2'}, menu => menu
          .addMenuItem({label: 'label-2', onSelect: noop}))
        .addToolbarButton({icon: 'icon-3', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Contribute to toolbar after menu:2.
      contributeMenu({location: 'toolbar:testee', after: 'menuitem:2'}, toolbar => toolbar.addToolbarButton({icon: 'icon-testee', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          icon: 'icon-1',
        },
        {
          type: 'menu',
          icon: 'icon-2',
        },
        {
          type: 'menu-item',
          icon: 'icon-testee',
        },
        {
          type: 'menu-item',
          icon: 'icon-3',
        },
      ]);
    });

    it('should contribute before group', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarButton({icon: 'icon-1', onSelect: noop})
        .addGroup({name: 'toolbar:2'}, toolbar => toolbar
          .addToolbarButton({icon: 'icon-2', onSelect: noop}))
        .addToolbarButton({icon: 'icon-3', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Contribute to toolbar before group toolbar:2.
      contributeMenu({location: 'toolbar:testee', before: 'toolbar:2'}, toolbar => toolbar.addToolbarButton({icon: 'icon-testee', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          icon: 'icon-1',
        },
        {
          type: 'menu-item',
          icon: 'icon-testee',
        },
        {
          type: 'group',
          children: [
            {
              type: 'menu-item',
              icon: 'icon-2',
            },
          ],
        },
        {
          type: 'menu-item',
          icon: 'icon-3',
        },
      ]);
    });

    it('should contribute after group', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarButton({icon: 'icon-1', onSelect: noop})
        .addGroup({name: 'toolbar:2'}, toolbar => toolbar
          .addToolbarButton({icon: 'icon-2', onSelect: noop}))
        .addToolbarButton({icon: 'icon-3', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Contribute to toolbar after group toolbar:2.
      contributeMenu({location: 'toolbar:testee', after: 'toolbar:2'}, toolbar => toolbar.addToolbarButton({icon: 'icon-testee', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          icon: 'icon-1',
        },
        {
          type: 'group',
          children: [
            {
              type: 'menu-item',
              icon: 'icon-2',
            },
          ],
        },
        {
          type: 'menu-item',
          icon: 'icon-testee',
        },
        {
          type: 'menu-item',
          icon: 'icon-3',
        },
      ]);
    });
  });
});

@Component({
  selector: 'spec-root',
  template: '<sci-toolbar name="toolbar:testee" [context]="context()" class="testee"/>',
  imports: [SciToolbarComponent],
})
class SpecRootComponent {
  public context = signal<Map<string, unknown>>(new Map());
}

@Component({
  selector: 'spec-control',
  template: 'spec-control',
})
class SpecControlComponent {
}
