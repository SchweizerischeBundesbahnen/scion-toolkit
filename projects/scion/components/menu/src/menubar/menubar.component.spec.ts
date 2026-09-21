/*
 * Copyright (c) 2018-2026  Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, DestroyRef, forwardRef, inject, InjectionToken, Injector, signal} from '@angular/core';
import {ComponentFixtureAutoDetect, TestBed} from '@angular/core/testing';
import {toEqualMenuCustomMatcher} from '../testing/jasmine/matcher/to-equal-menu.matcher';
import {contributeMenu} from '../menu-contribution';
import {toBeAttachedCustomMatcher} from '../testing/jasmine/matcher/to-be-attached.matcher';
import {SciMenubarComponent} from './menubar.component';
import {MenubarPO} from './menubar.po';
import {toEqualMenubarCustomMatcher} from '../testing/jasmine/matcher/to-equal-menubar.matcher';
import {MenuPO} from '../menu/menu.po';
import {By} from '@angular/platform-browser';
import {provideMenuAcceleratorTargetProvider, provideMenuContextProvider, provideMenuInjectionContextProvider} from '../menu-environment/menu-environment.provider';

describe('Menubar', () => {

  beforeEach(() => {
    jasmine.addAsyncMatchers(toEqualMenubarCustomMatcher);
    jasmine.addAsyncMatchers(toEqualMenuCustomMatcher);
    jasmine.addAsyncMatchers(toBeAttachedCustomMatcher);
  });

  it('should contribute to menubar', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);

    // Contribute to menubar.
    contributeMenu('menubar:testee', menubar => menubar
      .addMenu({label: 'label-1'}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)},
    );
    await fixture.whenStable();

    // Expect menubar.
    const menubar = new MenubarPO(fixture, {cssClass: 'testee'});
    await expectAsync(menubar).toEqualMenubar([
      {type: 'menu-item', label: 'label-1'},
    ]);

    // Contribute to menubar again.
    contributeMenu('menubar:testee', menubar => menubar
      .addMenu({label: 'label-2'}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)},
    );
    await fixture.whenStable();

    // Expect menubar.
    await expectAsync(menubar).toEqualMenubar([
      {type: 'menu-item', label: 'label-1'},
      {type: 'menu-item', label: 'label-2'},
    ]);
  });

  it('should call menubar factory function in reactive context', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);
    const itemVisible = signal(false);

    // Contribute to menubar.
    contributeMenu('menubar:testee', menubar => {
      if (itemVisible()) {
        menubar.addMenu({label: 'label'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}));
      }
    }, {injector: TestBed.inject(Injector)});

    // Expect menubar.
    const menubar = new MenubarPO(fixture, {cssClass: 'testee'});
    await expectAsync(menubar).toEqualMenubar([]);

    // Show menubar item.
    itemVisible.set(true);

    // Expect menubar.
    await expectAsync(menubar).toEqualMenubar([{type: 'menu-item', label: 'label'}]);

    // Hide menubar item.
    itemVisible.set(false);

    // Expect menubar.
    await expectAsync(menubar).toEqualMenubar([]);
  });

  it('should call menubar factory function only when tracked signal changes', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    @Component({
      selector: 'spec-testee',
      template: `
        <sci-menubar name="menubar:testee" class="testee-1"/>
        <sci-menubar name="menubar:testee" class="testee-2"/>
      `,
      imports: [SciMenubarComponent],
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

    // Contribute to menubar.
    contributeMenu('menubar:testee', menubar => {
      contribution1.callCount++;
      contribution1.signal();
      menubar.addMenu({label: 'label-1'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}));
    }, {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect menubar.
    const menubar1 = new MenubarPO(fixture, {cssClass: 'testee-1'});
    const menubar2 = new MenubarPO(fixture, {cssClass: 'testee-2'});
    expect(contribution1.callCount).toBe(1);
    await expectAsync(menubar1).toEqualMenubar([{type: 'menu-item', icon: 'icon-1'}]);
    await expectAsync(menubar2).toEqualMenubar([{type: 'menu-item', icon: 'icon-1'}]);

    // Contribute to menubar again.
    contributeMenu('menubar:testee', menubar => {
      contribution2.callCount++;
      contribution2.signal();
      menubar.addMenu({label: 'label-2'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}));
    }, {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect menubar.
    expect(contribution1.callCount).toBe(1);
    expect(contribution2.callCount).toBe(1);
    await expectAsync(menubar1).toEqualMenubar([
      {type: 'menu-item', icon: 'icon-1'},
      {type: 'menu-item', icon: 'icon-2'},
    ]);
    await expectAsync(menubar2).toEqualMenubar([
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

  it('should not call menubar factory function again when signal of menubar item changes', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    @Component({
      selector: 'spec-testee',
      template: `
        <sci-menubar name="menubar:testee" class="testee-1"/>
        <sci-menubar name="menubar:testee" class="testee-2"/>
      `,
      imports: [SciMenubarComponent],
    })
    class SpecTesteeComponent {
    }

    const fixture = TestBed.createComponent(SpecTesteeComponent);
    let menubarFactoryFunctionCallCount = 0;
    const visible = signal(true);

    // Contribute to menubar.
    contributeMenu('menubar:testee', menubar => {
      menubarFactoryFunctionCallCount++;
      menubar.addMenu({label: 'label', visible: visible}, menu => menu.addMenuItem({label: 'label', onSelect: noop}));
    }, {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect menubar.
    expect(menubarFactoryFunctionCallCount).toBe(1);
    const menubar1 = new MenubarPO(fixture, {cssClass: 'testee-1'});
    const menubar2 = new MenubarPO(fixture, {cssClass: 'testee-2'});
    await expectAsync(menubar1).toEqualMenubar([{type: 'menu-item', icon: 'icon'}]);
    await expectAsync(menubar2).toEqualMenubar([{type: 'menu-item', icon: 'icon'}]);

    // Change signal.
    visible.set(false);
    await fixture.whenStable();

    // Expect menubar.
    await expectAsync(menubar1).toEqualMenubar([]);
    await expectAsync(menubar2).toEqualMenubar([]);
    expect(menubarFactoryFunctionCallCount).toBe(1);
  });

  it('should remove contribution on dispose', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);

    // Contribute to menubar.
    const menubarContribution1 = contributeMenu('menubar:testee', menubar => menubar.addMenu({label: 'label-1'}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
    const menubarContribution2 = contributeMenu('menubar:testee', menubar => menubar.addMenu({label: 'label-2'}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});

    // Expect menubar.
    const menubar = new MenubarPO(fixture, {cssClass: 'testee'});
    await expectAsync(menubar).toEqualMenubar([
      {
        type: 'menu-item',
        label: 'label-1',
      },
      {
        type: 'menu-item',
        label: 'label-2',
      },
    ]);

    // Dispose menubar contribution 1.
    menubarContribution1.dispose();

    // Expect menubar.
    await expectAsync(menubar).toEqualMenubar([
      {
        type: 'menu-item',
        label: 'label-2',
      },
    ]);

    // Dispose menubar contribution 2.
    menubarContribution2.dispose();

    // Expect menubar.
    await expectAsync(menubar).toEqualMenubar([]);
  });

  it('should destroy injector when menubar is removed', async () => {
    @Component({
      selector: 'spec-testee',
      template: `
        @if (menubar1Visible()) {
          <sci-menubar name="menubar:testee"/>
        }
        @if (menubar2Visible()) {
          <sci-menubar name="menubar:testee"/>
        }
      `,
      imports: [SciMenubarComponent],
    })
    class SpecTesteeComponent {
      public menubar1Visible = signal(true);
      public menubar2Visible = signal(true);
    }

    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecTesteeComponent);
    let destroyed = false;

    // Contribute to menubar.
    contributeMenu('menubar:testee', menubar => {
      menubar.addMenu({label: 'label'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}));
      inject(DestroyRef).onDestroy(() => destroyed = true);
    }, {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect injector not to be destroyed.
    expect(destroyed).toBeFalse();

    // Remove menubar 1.
    fixture.componentInstance.menubar1Visible.set(false);
    await fixture.whenStable();

    // Expect injector not to be destroyed.
    expect(destroyed).toBeFalse();

    // Remove menubar 2.
    fixture.componentInstance.menubar2Visible.set(false);
    await fixture.whenStable();

    // Expect injector to be destroyed.
    expect(destroyed).toBeTrue();
  });

  it('should change menubar name', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    @Component({
      selector: 'spec-testee',
      template: '<sci-menubar [name]="name()" class="testee"/>',
      imports: [SciMenubarComponent],
    })
    class SpecTesteeComponent {
      public name = signal<`menubar:${string}`>('menubar:testee');
    }

    const fixture = TestBed.createComponent(SpecTesteeComponent);

    let menubarFactoryFunction1CallCount = 0;
    let menubarFactoryFunction2CallCount = 0;

    // Contribute to menubar testee-1.
    contributeMenu('menubar:testee-1', menubar => {
      menubarFactoryFunction1CallCount++;
      menubar.addMenu({label: 'label-1'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}));
    }, {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Contribute to menubar testee-2.
    contributeMenu('menubar:testee-2', menubar => {
      menubarFactoryFunction2CallCount++;
      menubar.addMenu({label: 'label-2'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}));
    }, {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect menubar.
    expect(menubarFactoryFunction1CallCount).toBe(0);
    expect(menubarFactoryFunction2CallCount).toBe(0);
    const menubar = new MenubarPO(fixture, {cssClass: 'testee'});

    // Set menubar name to testee-1.
    fixture.componentInstance.name.set('menubar:testee-1');
    await fixture.whenStable();

    // Expect menubar.
    expect(menubarFactoryFunction1CallCount).toBe(1);
    expect(menubarFactoryFunction2CallCount).toBe(0);
    await expectAsync(menubar).toEqualMenubar([
      {
        type: 'menu-item',
        label: 'label-1',
      },
    ]);

    // Set menubar name to testee-2.
    fixture.componentInstance.name.set('menubar:testee-2');
    await fixture.whenStable();

    // Expect menubar.
    expect(menubarFactoryFunction1CallCount).toBe(1);
    expect(menubarFactoryFunction2CallCount).toBe(1);
    await expectAsync(menubar).toEqualMenubar([
      {
        type: 'menu-item',
        label: 'label-2',
      },
    ]);

    // Set menubar name to testee-1.
    fixture.componentInstance.name.set('menubar:testee-1');
    await fixture.whenStable();

    // Expect menubar.
    expect(menubarFactoryFunction1CallCount).toBe(1);
    expect(menubarFactoryFunction2CallCount).toBe(1);
    await expectAsync(menubar).toEqualMenubar([
      {
        type: 'menu-item',
        label: 'label-1',
      },
    ]);
  });

  it('should not display menubar button if menu is empty', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);

    // Contribute to menubar.
    contributeMenu('menubar:testee', menubar => menubar
      .addMenu({label: 'label-1'}, menu => menu)
      .addMenu({label: 'label-2', menu: {name: 'menu:testee-1'}}, menu => menu)
      .addMenu({label: 'label-3', menu: {name: 'menu:testee-2'}}, menu => menu), {injector: TestBed.inject(Injector)},
    );

    contributeMenu('menu:testee-2', menu => menu, {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect menubar.
    const menubar = new MenubarPO(fixture, {cssClass: 'testee'});
    await expectAsync(menubar).toEqualMenubar([]);
  });

  it('should open menu on hover if another menu is already open', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);

    // Contribute to menubar.
    contributeMenu('menubar:testee', menubar => menubar
      .addMenu({label: 'label-1', cssClass: 'testee-1'}, menu => menu.addMenuItem({label: 'label-1', onSelect: noop}))
      .addMenu({label: 'label-2', cssClass: 'testee-2'}, menu => menu.addMenuItem({label: 'label-2', onSelect: noop})), {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    const menubar = new MenubarPO(fixture, {cssClass: 'testee'});

    // Hover item 1.
    const item1 = menubar.item({cssClass: 'testee-1'}).nativeElement;
    item1.dispatchEvent(new MouseEvent('mouseenter'));
    await fixture.whenStable();

    // Expect menu 1 not to open.
    const menu1 = new MenuPO(fixture, {cssClass: 'testee-1'});
    await expectAsync(() => menu1.debugElement).not.toBeAttached();

    // Click item 1.
    item1.click();
    await fixture.whenStable();

    // Expect menu 1 to open.
    await expectAsync(() => menu1.debugElement).toBeAttached();

    // Hover item 2.
    const item2 = menubar.item({cssClass: 'testee-2'}).nativeElement;
    item2.dispatchEvent(new MouseEvent('mouseenter'));
    await fixture.whenStable();

    // Expect menu 2 to open.
    const menu2 = new MenuPO(fixture, {cssClass: 'testee-2'});
    await expectAsync(() => menu2.debugElement).toBeAttached();
    await expectAsync(() => menu1.debugElement).not.toBeAttached();
  });

  it('should close menu when clicking menubar item again', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);

    // Contribute to menubar.
    contributeMenu('menubar:testee', menubar => menubar
      .addMenu({label: 'label', cssClass: 'testee'}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Click menubar item.
    const menubar = new MenubarPO(fixture, {cssClass: 'testee'});
    menubar.item({cssClass: 'testee'}).nativeElement.click();

    // Expect menu.
    const menu = new MenuPO(fixture);
    await expectAsync(menu).toEqualMenu([
      {
        type: 'menu-item',
        label: 'label',
      },
    ]);

    // Click menubar item again.
    menubar.item({cssClass: 'testee'}).nativeElement.click();

    // Expect menu to be closed.
    await expectAsync(() => menu.debugElement).not.toBeAttached();
  });

  it('should provide label', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);

    const label = signal('testee-2');

    // Contribute to menubar.
    contributeMenu('menubar:testee', menubar => menubar
      .addMenu({label: 'testee-1'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
      .addMenu({label: label}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect menubar.
    const menubar = new MenubarPO(fixture, {cssClass: 'testee'});
    await expectAsync(menubar).toEqualMenubar([
      {
        type: 'menu-item',
        label: 'testee-1',
      },
      {
        type: 'menu-item',
        label: 'testee-2',
      },
    ]);

    // Update label.
    label.set('TESTEE-2');
    await expectAsync(menubar).toEqualMenubar([
      {
        type: 'menu-item',
        label: 'testee-1',
      },
      {
        type: 'menu-item',
        label: 'TESTEE-2',
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

    // Contribute to menubar.
    contributeMenu('menubar:testee', menubar => menubar
      .addMenu({label: 'label-1'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
      .addMenu({label: 'label-2', visible: true}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
      .addMenu({label: 'label-3', visible: false}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
      .addMenu({label: 'label-4', visible: visible}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
      .addMenu({label: 'label-5'}, menu => menu.addMenuItem({label: 'label', onSelect: noop, visible: true}))
      .addMenu({label: 'label-6'}, menu => menu.addMenuItem({label: 'label', onSelect: noop, visible: false}))
      .addMenu({label: 'label-7'}, menu => menu.addMenuItem({label: 'label', onSelect: noop, visible: visible})), {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect menubar.
    const menubar = new MenubarPO(fixture, {cssClass: 'testee'});
    await expectAsync(menubar).toEqualMenubar([
      {
        type: 'menu-item',
        label: 'label-1',
      },
      {
        type: 'menu-item',
        label: 'label-2',
      },
      {
        type: 'menu-item',
        label: 'label-4',
      },
      {
        type: 'menu-item',
        label: 'label-5',
      },
      {
        type: 'menu-item',
        label: 'label-7',
      },
    ]);

    // Update visible.
    visible.set(false);
    await expectAsync(menubar).toEqualMenubar([
      {
        type: 'menu-item',
        label: 'label-1',
      },
      {
        type: 'menu-item',
        label: 'label-2',
      },
      {
        type: 'menu-item',
        label: 'label-5',
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

    // Contribute to menubar.
    contributeMenu('menubar:testee', menubar => menubar.addMenu({label: 'label-1', cssClass: ['testee-1', 'testee-2']}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect menubar.
    const menubar = new MenubarPO(fixture, {cssClass: 'testee'});
    await expectAsync(menubar).toEqualMenubar([
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

    // Contribute to menubar.
    contributeMenu('menubar:testee', menubar => menubar
      .addMenu({label: 'label', attributes: {attr1: 'testee-1', attr2: 'testee-2'}}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect menubar.
    const menubar = new MenubarPO(fixture, {cssClass: 'testee'});
    await expectAsync(menubar).toEqualMenubar([
      {
        type: 'menu-item',
        attributes: {attr1: 'testee-1', attr2: 'testee-2'},
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

    // Contribute to menubar.
    contributeMenu('menubar:testee', menubar => menubar
      .addMenu({label: 'label', menu: {width: '500px'}, cssClass: 'item-1'}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Open menu.
    const menubar = new MenubarPO(fixture, {cssClass: 'testee'});
    menubar.item({cssClass: 'item-1'}).nativeElement.click();
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

    // Contribute to menubar.
    contributeMenu('menubar:testee', menubar => menubar
      .addMenu({label: 'label', menu: {minWidth: '500px'}, cssClass: 'item-1'}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Open menu.
    const menubar = new MenubarPO(fixture, {cssClass: 'testee'});
    menubar.item({cssClass: 'item-1'}).nativeElement.click();
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

    // Contribute to menubar.
    contributeMenu('menubar:testee', menubar => menubar
      .addMenu({label: 'label', menu: {maxWidth: '200px'}, cssClass: 'item-1'}, menu => menu.addMenuItem({label: 'long label text to exceed maximum width', onSelect: noop})), {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Open menu.
    const menubar = new MenubarPO(fixture, {cssClass: 'testee'});
    menubar.item({cssClass: 'item-1'}).nativeElement.click();
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

    // Contribute to menubar.
    contributeMenu('menubar:testee', menubar => menubar
      .addMenu({label: 'label', menu: {maxHeight: '200px'}, cssClass: 'item-1'}, menu => menu
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
    const menubar = new MenubarPO(fixture, {cssClass: 'testee'});
    menubar.item({cssClass: 'item-1'}).nativeElement.click();
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

  describe('Context', () => {

    describe('Menubar', () => {

      it('should run factory function per context', async () => {
        @Component({
          selector: 'spec-testee',
          template: `
            <sci-menubar name="menubar:testee" [context]="contextMenubar1()" class="testee-1"/>
            <sci-menubar name="menubar:testee" [context]="contextMenubar2()" class="testee-2"/>
          `,
          imports: [SciMenubarComponent],
        })
        class SpecTesteeComponent {
          public contextMenubar1 = signal(new Map());
          public contextMenubar2 = signal(new Map());
        }

        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecTesteeComponent);

        // Contribute to menubar.
        contributeMenu('menubar:testee', menubar => {
          const checked = signal(false);
          menubar.addMenu({label: 'label', cssClass: 'testee-1'}, menu => menu.addMenuItem({label: 'label', cssClass: 'testee-2', checked, onSelect: () => checked.update(checked => !checked)}));
        }, {injector: TestBed.inject(Injector)});

        await fixture.whenStable();

        const menubar1 = new MenubarPO(fixture, {selector: 'sci-menubar.testee-1'});
        const menubar2 = new MenubarPO(fixture, {selector: 'sci-menubar.testee-2'});

        const menu = new MenuPO(fixture);

        // Open menu 1.
        menubar1.item({cssClass: 'testee-1'}).nativeElement.click();
        await fixture.whenStable();

        // Click button in menu 1.
        menu.item({cssClass: 'testee-2'}).nativeElement.click();
        await fixture.whenStable();
        await expectAsync(menu).toEqualMenu([{type: 'menu-item', checked: true}]);

        // Open menu 2.
        menubar2.item({cssClass: 'testee-1'}).nativeElement.click();
        await fixture.whenStable();
        await expectAsync(menu).toEqualMenu([{type: 'menu-item', checked: true}]);

        // Set context on menubar 1.
        fixture.componentInstance.contextMenubar1.set(new Map().set('context', 'A'));
        await fixture.whenStable();

        // Open menu 1.
        menubar1.item({cssClass: 'testee-1'}).nativeElement.click();
        await fixture.whenStable();
        await expectAsync(menu).toEqualMenu([{type: 'menu-item', checked: false}]);

        // Open menu 2.
        await new Promise<void>(resolve => requestIdleCallback(() => resolve()));
        menubar2.item({cssClass: 'testee-1'}).nativeElement.click();
        await fixture.whenStable();
        await expectAsync(menu).toEqualMenu([{type: 'menu-item', checked: true}]);

        // Set context on menubar 2.
        fixture.componentInstance.contextMenubar2.set(new Map().set('context', 'B'));
        await fixture.whenStable();

        // Open menu 1.
        menubar1.item({cssClass: 'testee-1'}).nativeElement.click();
        await fixture.whenStable();
        await expectAsync(menu).toEqualMenu([{type: 'menu-item', checked: false}]);

        // Open menu 2.
        menubar2.item({cssClass: 'testee-1'}).nativeElement.click();
        await fixture.whenStable();
        await expectAsync(menu).toEqualMenu([{type: 'menu-item', checked: false}]);

        // Open menu 1.
        await new Promise<void>(resolve => requestIdleCallback(() => resolve()));
        menubar1.item({cssClass: 'testee-1'}).nativeElement.click();
        await fixture.whenStable();

        // Click button in menu 1.
        menu.item({cssClass: 'testee-2'}).nativeElement.click();
        await fixture.whenStable();
        await expectAsync(menu).toEqualMenu([{type: 'menu-item', checked: true}]);

        // Open menu 2.
        await new Promise<void>(resolve => requestIdleCallback(() => resolve()));
        menubar2.item({cssClass: 'testee-1'}).nativeElement.click();
        await fixture.whenStable();
        await expectAsync(menu).toEqualMenu([{type: 'menu-item', checked: false}]);

        // Click button in menu 2.
        menu.item({cssClass: 'testee-2'}).nativeElement.click();
        await fixture.whenStable();
        await expectAsync(menu).toEqualMenu([{type: 'menu-item', checked: true}]);

        // Open menu 1.
        menubar1.item({cssClass: 'testee-1'}).nativeElement.click();
        await fixture.whenStable();
        await expectAsync(menu).toEqualMenu([{type: 'menu-item', checked: true}]);
      });

      it('should inherit context from environment', async () => {
        const rootContext = signal(new Map());
        const componentContext = signal(new Map());

        @Component({
          selector: 'spec-testee',
          template: `
            <sci-menubar name="menubar:testee" [context]="context()"/>
          `,
          imports: [SciMenubarComponent],
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

        // Contribute to menubar requiring context A.
        contributeMenu('menubar:testee', (menubar, context) => {
          menubar.addMenu({label: `${context.get('context')}`}, menu => menu.addMenuItem({label: 'label', onSelect: noop}));
        }, {requiredContext: new Map().set('context', 'A'), injector: TestBed.inject(Injector)});

        // Contribute to menubar requiring context B.
        contributeMenu('menubar:testee', (menubar, context) => {
          menubar.addMenu({label: `${context.get('context')}`}, menu => menu.addMenuItem({label: 'label', onSelect: noop}));
        }, {requiredContext: new Map().set('context', 'B'), injector: TestBed.inject(Injector)});
        await fixture.whenStable();

        const menubar = new MenubarPO(fixture, {selector: 'sci-menubar'});

        // Expect menubar.
        await expectAsync(menubar).toEqualMenubar([]);

        // Set root context to A.
        rootContext.set(new Map().set('context', 'A'));
        await fixture.whenStable();
        await expectAsync(menubar).toEqualMenubar([{type: 'menu-item', label: 'A'}]);

        // Set component context to B.
        componentContext.set(new Map().set('context', 'B'));
        await fixture.whenStable();
        await expectAsync(menubar).toEqualMenubar([{type: 'menu-item', label: 'B'}]);

        // Clear component context.
        componentContext.set(new Map());
        await fixture.whenStable();
        await expectAsync(menubar).toEqualMenubar([{type: 'menu-item', label: 'A'}]);

        // Set context on menubar to B.
        fixture.componentInstance.context.set(new Map().set('context', 'B'));
        await fixture.whenStable();
        await expectAsync(menubar).toEqualMenubar([{type: 'menu-item', label: 'B'}]);

        // Set context on menubar to C.
        fixture.componentInstance.context.set(new Map().set('context', 'C'));
        await fixture.whenStable();
        await expectAsync(menubar).toEqualMenubar([]);

        // Set context on menubar to undefined.
        fixture.componentInstance.context.set(new Map().set('context', undefined));
        await fixture.whenStable();
        await expectAsync(menubar).toEqualMenubar([]);
      });
    });

    describe('Contribution', () => {

      it('should inherit context from environment', async () => {
        @Component({
          selector: 'spec-testee',
          template: `
            <sci-menubar name="menubar:testee" [context]="context()"/>
          `,
          imports: [SciMenubarComponent],
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

        // Set context on menubar to A.
        fixture.componentInstance.context.set(new Map().set('context', 'A'));

        // Contribute to menubar.
        const contribution1 = contributeMenu('menubar:testee', (menubar, context) => {
          menubar.addMenu({label: `${context.get('context')}`}, menu => menu.addMenuItem({label: 'label', onSelect: noop}));
        }, {injector: childContributionInjector});
        await fixture.whenStable();

        const menubar = new MenubarPO(fixture, {selector: 'sci-menubar'});

        // Expect menubar.
        await expectAsync(menubar).toEqualMenubar([{type: 'menu-item', icon: 'A'}]);

        // Set parent context to B.
        parentContributionContext.set(new Map().set('context', 'B'));
        await fixture.whenStable();
        await expectAsync(menubar).toEqualMenubar([]);

        // Set child context to A.
        childContributionContext.set(new Map().set('context', 'A'));
        await fixture.whenStable();
        await expectAsync(menubar).toEqualMenubar([{type: 'menu-item', icon: 'A'}]);

        // Dispose contribution 1.
        contribution1.dispose();

        // Contribute to menubar with required context C.
        const contribution2 = contributeMenu('menubar:testee', (menubar, context) => {
          menubar.addMenu({label: `${context.get('context')}`}, menu => menu.addMenuItem({label: 'label', onSelect: noop}));
        }, {requiredContext: new Map().set('context', 'C'), injector: childContributionInjector});
        await fixture.whenStable();
        await expectAsync(menubar).toEqualMenubar([]);

        // Set context on menubar to C.
        fixture.componentInstance.context.set(new Map().set('context', 'C'));
        await fixture.whenStable();
        await expectAsync(menubar).toEqualMenubar([{type: 'menu-item', icon: 'C'}]);

        // Dispose contribution 2.
        contribution2.dispose();

        // Contribute to menubar with required context undefined.
        contributeMenu('menubar:testee', (menubar, context) => {
          menubar.addMenu({label: `${context.get('context')}`}, menu => menu.addMenuItem({label: 'label', onSelect: noop}));
        }, {requiredContext: new Map().set('context', undefined), injector: childContributionInjector});
        await fixture.whenStable();
        await expectAsync(menubar).toEqualMenubar([{type: 'menu-item', icon: 'C'}]);
      });

      it('should inherit injection tokens from environment', async () => {
        const PARENT_PROVIDER = new InjectionToken<string>('PARENT_PROVIDER');
        const CHILD_PROVIDER = new InjectionToken<string>('CHILD_PROVIDER');
        const LEVEL = new InjectionToken<string>('LEVEL');
        const TOKEN = new InjectionToken<string>('CONTEXT');

        @Component({
          selector: 'spec-parent',
          template: `
            <spec-child/>
          `,
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
          template: `
            <sci-menubar name="menubar:testee" [context]="context()"/>
          `,
          imports: [SciMenubarComponent],
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

        // Set context on menubar to A.
        (fixture.debugElement.query(By.directive(SpecChildComponent)).componentInstance as SpecChildComponent).context.set(new Map().set('context', 'A'));

        // Contribute to menubar.
        contributeMenu('menubar:testee', menubar => {
          menubar.addMenu({label: `[PARENT_PROVIDER=${inject(PARENT_PROVIDER)}, CHILD_PROVIDER=${inject(CHILD_PROVIDER)}, TOKEN=${inject(TOKEN)}]`}, menu => menu.addMenuItem({label: 'label', onSelect: noop}));
        }, {injector: TestBed.inject(Injector)});
        await fixture.whenStable();

        const menubar = new MenubarPO(fixture, {selector: 'sci-menubar'});

        // Expect menubar.
        await expectAsync(menubar).toEqualMenubar([{type: 'menu-item', label: '[PARENT_PROVIDER=parent, CHILD_PROVIDER=child, TOKEN=level-2-A]'}]);
      });

      it('should require any context value (*)', async () => {
        @Component({
          selector: 'spec-testee',
          template: `
            <sci-menubar name="menubar:testee" [context]="context()"/>
          `,
          imports: [SciMenubarComponent],
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

        // Contribute to menubar.
        contributeMenu('menubar:testee', (menubar, context) => {
          menubar.addMenu({label: `${context.get('context')}`}, menu => menu.addMenuItem({label: 'label', onSelect: noop}));
        }, {requiredContext: new Map().set('context', '*'), injector: TestBed.inject(Injector)});
        await fixture.whenStable();

        const menubar = new MenubarPO(fixture, {selector: 'sci-menubar'});

        // Expect menubar.
        await expectAsync(menubar).toEqualMenubar([]);

        // Set context on menubar to A.
        fixture.componentInstance.context.set(new Map().set('context', 'A'));
        await fixture.whenStable();
        await expectAsync(menubar).toEqualMenubar([{type: 'menu-item', icon: 'A'}]);

        // Set context on menubar to B.
        fixture.componentInstance.context.set(new Map().set('context', 'B'));
        await fixture.whenStable();
        await expectAsync(menubar).toEqualMenubar([{type: 'menu-item', icon: 'B'}]);

        // Set context on menubar to undefined.
        fixture.componentInstance.context.set(new Map().set('context', undefined));
        await fixture.whenStable();
        await expectAsync(menubar).toEqualMenubar([]);

        // Clear context on menubar.
        fixture.componentInstance.context.set(new Map());
        await fixture.whenStable();
        await expectAsync(menubar).toEqualMenubar([]);
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
            <sci-menubar name="menubar:testee" [acceleratorTarget]="acceleratorTargets()"/>
          `,
          imports: [SciMenubarComponent],
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

        // Contribute to menubar.
        contributeMenu('menubar:testee', menubar => {
          menubar.addMenu({label: 'label'}, menu => menu.addMenuItem({label: 'label', accelerator: {alt: true, key: '1'}, onSelect: () => console.log('onSelect item')}));
        }, {injector: TestBed.inject(Injector)});
        await fixture.whenStable();

        const menubar = new MenubarPO(fixture, {selector: 'sci-menubar'});
        await expectAsync(menubar).toEqualMenubar([{type: 'menu-item', label: 'label'}]);

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

        // Set accelerator target 4 on menubar.
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
});

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop(): void {
}

@Component({
  selector: 'spec-root',
  template: '<sci-menubar name="menubar:testee" class="testee"/>',
  imports: [SciMenubarComponent],
})
class SpecRootComponent {
}
