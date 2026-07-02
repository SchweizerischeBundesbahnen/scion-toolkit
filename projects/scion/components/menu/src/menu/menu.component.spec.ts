/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, DestroyRef, inject, Injector, signal} from '@angular/core';
import {ComponentFixtureAutoDetect, TestBed} from '@angular/core/testing';
import {SUB_MENU_VERTICAL_OFFSET, toHaveMenuPositionCustomMatcher} from '../testing/jasmine/matcher/to-have-menu-position.matcher';
import {MenuPO} from './menu.po';
import {SciMenuService} from '../menu.service';
import {contributeMenu} from '../menu-contribution';
import {installMenuAccelerators} from '../menu-accelerators';
import {SciMenuFactoryFn} from '../menu-contribution.model';
import {toBeAttachedCustomMatcher} from '../testing/jasmine/matcher/to-be-attached.matcher';
import {toBeVisibleCustomMatcher} from '../testing/jasmine/matcher/to-be-visible.matcher';
import {By} from '@angular/platform-browser';
import {provideMenuAcceleratorTargetProvider, provideMenuContextProvider} from '../menu-environment/menu-environment.provider';
import {toEqualMenuCustomMatcher} from '../testing/jasmine/matcher/to-equal-menu.matcher';
import {noop} from 'rxjs';
import {NO_ITEMS_FOUND} from '../testing/jasmine/matcher/expected-menu.model';

describe('Menu', () => {

  beforeEach(() => {
    jasmine.addAsyncMatchers(toEqualMenuCustomMatcher);
    jasmine.addAsyncMatchers(toBeAttachedCustomMatcher);
    jasmine.addAsyncMatchers(toBeVisibleCustomMatcher);
    jasmine.addAsyncMatchers(toHaveMenuPositionCustomMatcher);
  });

  it('should contribute to menu', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);

    // Contribute to menu.
    contributeMenu('menu:testee', menu => menu
      .addMenuItem({label: 'testee-1', onSelect: noop}), {injector: TestBed.inject(Injector)},
    );
    await fixture.whenStable();

    // Open menu.
    TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
    const menu = new MenuPO(fixture);

    // Expect menu.
    await expectAsync(menu).toEqualMenu([
      {type: 'menu-item', label: 'testee-1'},
    ]);

    // Contribute to menu again.
    contributeMenu('menu:testee', menu => menu
      .addMenuItem({label: 'testee-2', onSelect: noop}), {injector: TestBed.inject(Injector)},
    );
    await fixture.whenStable();

    // Expect menu.
    await expectAsync(menu).toEqualMenu([
      {type: 'menu-item', label: 'testee-1'},
      {type: 'menu-item', label: 'testee-2'},
    ]);
  });

  it('should contribute to menu group', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);

    // Contribute to menu.
    contributeMenu('menu:testee', menu => menu
      .addMenuItem({label: 'label-1', onSelect: noop})
      .addGroup({name: 'menu:additions'}), {injector: TestBed.inject(Injector)},
    );
    await fixture.whenStable();

    // Open menu.
    TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
    const menu = new MenuPO(fixture);

    // Expect menu.
    await expectAsync(menu).toEqualMenu([
      {type: 'menu-item', label: 'label-1'},
    ]);

    // Contribute to menu group.
    contributeMenu('menu:additions', menu => menu
      .addMenuItem({label: 'label-2', onSelect: noop}), {injector: TestBed.inject(Injector)},
    );
    await fixture.whenStable();

    // Expect menu.
    await expectAsync(menu).toEqualMenu([
      {
        type: 'menu-item',
        label: 'label-1',
      },
      {
        type: 'group',
        children: [
          {
            type: 'menu-item',
            label: 'label-2',
          },
        ],
      },
    ]);
  });

  it('should contribute to nested menu groups', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);

    // Contribute to menu.
    contributeMenu('menu:testee', menu => menu
      .addMenuItem({label: 'label-1', onSelect: noop})
      .addGroup(group => group
        .addMenuItem({label: 'label-2', onSelect: noop})
        .addMenu({label: 'label-3', cssClass: 'submenu-3'}, menu => menu
          .addGroup(group => group
            .addMenuItem({label: 'label-3a', onSelect: noop}))
          .addMenuItem({label: 'label-3b', onSelect: noop})))
      .addMenuItem({label: 'label-4', onSelect: noop})
      .addGroup(group => group
        .addGroup(group => group
          .addGroup(group => group
            .addGroup(group => group.addMenuItem({label: 'label-5', onSelect: noop}))))), {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Open menu.
    TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
    const menu = new MenuPO(fixture);

    // Expect menu.
    await expectAsync(menu).toEqualMenu([
      {
        type: 'menu-item',
        label: 'label-1',
      },
      {
        type: 'group',
        children: [
          {
            type: 'menu-item',
            label: 'label-2',
          },
          {
            type: 'menu',
            label: 'label-3',
          },
        ],
      },
      {
        type: 'menu-item',
        label: 'label-4',
      },
      {
        type: 'group',
        children: [
          {
            type: 'group',
            children: [
              {
                type: 'group',
                children: [
                  {
                    type: 'group',
                    children: [
                      {
                        type: 'menu-item',
                        label: 'label-5',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);

    // Open submenu.
    await menu.openSubMenu({cssClass: 'submenu-3'});

    // Expect menu.
    await expectAsync(menu).toEqualMenu([
      {
        type: 'menu-item',
        label: 'label-1',
      },
      {
        type: 'group',
        children: [
          {
            type: 'menu-item',
            label: 'label-2',
          },
          {
            type: 'menu',
            label: 'label-3',
          },
        ],
      },
      {
        type: 'menu-item',
        label: 'label-4',
      },
      {
        type: 'group',
        children: [
          {
            type: 'group',
            children: [
              {
                type: 'group',
                children: [
                  {
                    type: 'group',
                    children: [
                      {
                        type: 'menu-item',
                        label: 'label-5',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);
  });

  it('should call menu factory function in reactive context', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);
    const itemVisible = signal(false);

    // Contribute to menu.
    contributeMenu('menu:testee', menu => {
      if (itemVisible()) {
        menu.addMenuItem({label: 'label', onSelect: noop});
      }
    }, {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Open menu.
    TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
    const menu = new MenuPO(fixture);

    // Show menu item.
    itemVisible.set(true);

    // Expect menu.
    await expectAsync(menu).toEqualMenu([{type: 'menu-item', label: 'label'}]);

    // Hide menu item.
    itemVisible.set(false);

    // Expect menu.
    await expectAsync(menu).toEqualMenu([]);
  });

  it('should call menu factory function only when tracked signal changes', async () => {
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

    // Contribute to menu.
    contributeMenu('menu:testee', menu => {
      contribution1.callCount++;
      contribution1.signal();
      menu.addMenuItem({label: 'label-1', onSelect: noop});
    }, {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Open menu.
    TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
    const menu = new MenuPO(fixture);

    // Expect menu.
    expect(contribution1.callCount).toBe(1);
    expect(contribution2.callCount).toBe(0);
    await expectAsync(menu).toEqualMenu([
      {type: 'menu-item', label: 'label-1'},
    ]);

    // Contribute to menu again.
    contributeMenu('menu:testee', menu => {
      contribution2.callCount++;
      contribution2.signal();
      menu.addMenuItem({label: 'label-2', onSelect: noop});
    }, {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect menu.
    expect(contribution1.callCount).toBe(1);
    expect(contribution2.callCount).toBe(1);
    await expectAsync(menu).toEqualMenu([
      {type: 'menu-item', label: 'label-1'},
      {type: 'menu-item', label: 'label-2'},
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

  it('should not call menu factory function again when signal of menu item changes', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);
    let menuFactoryFunctionCallCount = 0;
    const visible = signal(true);

    // Contribute to menu.
    contributeMenu('menu:testee', menu => {
      menuFactoryFunctionCallCount++;
      menu.addMenuItem({label: 'label', visible: visible, onSelect: noop});
    }, {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Open menu.
    TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
    const menu = new MenuPO(fixture);

    // Expect menu.
    expect(menuFactoryFunctionCallCount).toBe(1);
    await expectAsync(menu).toEqualMenu([
      {type: 'menu-item', label: 'label'},
    ]);

    // Change signal.
    visible.set(false);
    await fixture.whenStable();

    // Expect menu.
    await expectAsync(menu).toEqualMenu([]);
    expect(menuFactoryFunctionCallCount).toBe(1);
  });

  it('should remove contribution on dispose', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);

    // Contribute to menu.
    const menuContribution1 = contributeMenu('menu:testee', menu => menu.addMenuItem({label: 'label-1', onSelect: noop}), {injector: TestBed.inject(Injector)});
    const menuContribution2 = contributeMenu('menu:testee', menu => menu.addMenuItem({label: 'label-2', onSelect: noop}), {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Open menu.
    TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
    const menu = new MenuPO(fixture);

    // Expect menu.
    await expectAsync(menu).toEqualMenu([
      {type: 'menu-item', label: 'label-1'},
      {type: 'menu-item', label: 'label-2'},
    ]);

    // Dispose menu contribution 1.
    menuContribution1.dispose();
    await fixture.whenStable();

    // Expect menu.
    await expectAsync(menu).toEqualMenu([
      {type: 'menu-item', label: 'label-2'},
    ]);

    // Dispose menu contribution 2.
    menuContribution2.dispose();

    // Expect menu.
    await expectAsync(menu).toEqualMenu([]);
  });

  it('should destroy injector when closing menu', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);
    let destroyed = false;

    // Contribute to menu.
    contributeMenu('menu:testee', menu => {
      menu.addMenuItem({label: 'label', onSelect: noop});
      inject(DestroyRef).onDestroy(() => destroyed = true);
    }, {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Open menu.
    const menuRef = TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
    await fixture.whenStable();

    // Expect injector not to be destroyed.
    expect(destroyed).toBeFalse();

    // Close menu.
    menuRef.close();
    await fixture.whenStable();

    // Expect injector to be destroyed.
    expect(destroyed).toBeTrue();
  });

  it('should not federate contributions again', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);

    // Contribute to menu.
    contributeMenu({location: 'menu:testee'}, menu => menu
      .addMenu({label: 'submenu-1', menu: {name: 'menu:submenu-1'}, cssClass: 'submenu-1'}, menu => menu)
      .addGroup({label: 'group-1', name: 'menu:1'}, group => group), {injector: TestBed.inject(Injector)});

    contributeMenu({location: 'menu:submenu-1'}, menu => menu
      .addMenu({label: 'submenu-2', menu: {name: 'menu:submenu-2'}, cssClass: 'submenu-2'}, menu => menu)
      .addGroup({label: 'group-2', name: 'menu:2'}, group => group), {injector: TestBed.inject(Injector)});

    contributeMenu({location: 'menu:submenu-2'}, menu => menu
      .addMenuItem({label: 'label-4', onSelect: noop})
      .addGroup({label: 'group-3', name: 'menu:3'}, group => group), {injector: TestBed.inject(Injector)});

    contributeMenu({location: 'menu:1'}, menu => menu
      .addMenuItem({label: 'label-1', onSelect: noop}), {injector: TestBed.inject(Injector)});

    contributeMenu({location: 'menu:2'}, menu => menu
      .addMenuItem({label: 'label-2', onSelect: noop}), {injector: TestBed.inject(Injector)});

    contributeMenu({location: 'menu:3'}, menu => menu
      .addMenuItem({label: 'label-3', onSelect: noop}), {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Open menu.
    TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
    const menu = new MenuPO(fixture);

    // Open submenu 1.
    const submenu1 = await menu.openSubMenu({cssClass: 'submenu-1'});

    // Open submenu 2.
    await submenu1.openSubMenu({cssClass: 'submenu-2'});

    // Expect menu.
    await expectAsync(menu).toEqualMenu([
      {
        type: 'menu',
        label: 'submenu-1',
        children: [
          {
            type: 'menu',
            label: 'submenu-2',
            children: [
              {
                type: 'menu-item',
                label: 'label-4',
              },
              {
                type: 'group',
                label: 'group-3',
                children: [
                  {
                    type: 'menu-item',
                    label: 'label-3',
                  },
                ],
              },
            ],
          },
          {
            type: 'group',
            label: 'group-2',
            children: [
              {
                type: 'menu-item',
                label: 'label-2',
              },
            ],
          },
        ],
      },
      {
        type: 'group',
        label: 'group-1',
        children: [
          {
            type: 'menu-item',
            label: 'label-1',
          },
        ],
      },
    ]);
  });

  it('should close child menu when filtering', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);

    // Contribute to menu.
    contributeMenu('menu:testee', menu => menu
      .addMenu({label: 'label', cssClass: 'submenu'}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)},
    );
    await fixture.whenStable();

    // Open menu.
    TestBed.inject(SciMenuService).open('menu:testee', {filter: true, anchor: {x: 0, y: 0}});
    await fixture.whenStable();
    const menu = new MenuPO(fixture);

    // Focus filter field.
    menu.filterInputElement!.nativeElement.focus();

    // Open submenu.
    const subMenu = await menu.openSubMenu({cssClass: 'submenu'});

    // Filter menu items.
    menu.filterMenuItems('xyz');
    await fixture.whenStable();

    // Expect submenu not to be attached.
    await expectAsync(() => subMenu.debugElement).not.toBeAttached();
  });

  it('should not open submenu when hovering disabled menu item', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);

    // Contribute to menu.
    contributeMenu('menu:testee', menu => menu
      .addMenu({label: 'submenu', disabled: true, cssClass: 'testee'}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)},
    );
    await fixture.whenStable();

    // Open menu.
    TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
    const menu = new MenuPO(fixture);

    // Hover disabled submenu item.
    const menuItem = menu.item({cssClass: 'testee'});
    menuItem.nativeElement.dispatchEvent(new MouseEvent('mouseenter'));
    await fixture.whenStable();

    // Expect submenu not to be visible.
    const subMenu = new MenuPO(fixture, {selector: 'sci-menu sci-menu'});
    await expectAsync(() => subMenu.debugElement).not.toBeVisible();
  });

  it('should not display empty submenu', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);

    // Contribute to menu.
    contributeMenu('menu:testee', menu => menu
      .addMenuItem({label: 'label-1', onSelect: noop})
      .addMenu({label: 'label-2'}, menu => menu)
      .addMenu({label: 'label-3', menu: {name: 'menu:testee-1'}}, menu => menu)
      .addMenu({label: 'label-4', menu: {name: 'menu:testee-2'}}, menu => menu), {injector: TestBed.inject(Injector)});

    contributeMenu('menu:testee-2', menu => menu, {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect empty submenus not to show.
    TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
    const menu = new MenuPO(fixture);
    await expectAsync(menu).toEqualMenu([
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

    // Contribute to menu.
    contributeMenu('menu:testee', menu => menu
      .addMenuItem({label: 'label-1', onSelect: noop})
      .addGroup(group => group)
      .addGroup({})
      .addGroup({}, group => group)
      .addGroup({label: 'label-2'}, group => group)
      .addGroup({label: 'label-3', name: 'menu:testee-1'})
      .addGroup({label: 'label-4', name: 'menu:testee-2'})
      .addGroup({label: 'label-5', name: 'menu:testee-3'}, group => group)
      .addGroup({label: 'label-6', name: 'menu:testee-4'}, group => group), {injector: TestBed.inject(Injector)});

    contributeMenu('menu:testee-2', menu => menu, {injector: TestBed.inject(Injector)});
    contributeMenu('menu:testee-4', menu => menu, {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect empty groups not to show.
    TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
    const menu = new MenuPO(fixture);
    await expectAsync(menu).toEqualMenu([
      {type: 'menu-item', label: 'label-1'},
    ]);
  });

  describe('Context', () => {

    describe('Contribution', () => {

      it('should inherit context from environment', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

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

        // Contribute to menu.
        const contribution1 = contributeMenu('menu:testee', (menu, context) => {
          menu.addMenuItem({label: `${context.get('context')}`, onSelect: noop});
        }, {injector: childContributionInjector});
        await fixture.whenStable();

        const menu = new MenuPO(fixture);

        // Open menu with context A.
        TestBed.inject(SciMenuService).open('menu:testee', {context: new Map().set('context', 'A'), anchor: {x: 0, y: 0}});
        await expectAsync(menu).toEqualMenu([{type: 'menu-item', label: 'A'}]);

        // Set parent context to B.
        parentContributionContext.set(new Map().set('context', 'B'));
        await fixture.whenStable();
        await expectAsync(menu).toEqualMenu([]);

        // Set child context to A.
        childContributionContext.set(new Map().set('context', 'A'));
        await fixture.whenStable();
        await expectAsync(menu).toEqualMenu([{type: 'menu-item', label: 'A'}]);

        // Dispose contribution 1.
        contribution1.dispose();

        // Contribute to menu with required context C.
        const contribution2 = contributeMenu('menu:testee', (menu, context) => {
          menu.addMenuItem({label: `${context.get('context')}`, onSelect: noop});
        }, {requiredContext: new Map().set('context', 'C'), injector: childContributionInjector});
        await fixture.whenStable();
        await expectAsync(menu).toEqualMenu([]);

        // Open menu with context C.
        TestBed.inject(SciMenuService).open('menu:testee', {context: new Map().set('context', 'C'), anchor: {x: 0, y: 0}});
        await fixture.whenStable();
        await expectAsync(menu).toEqualMenu([{type: 'menu-item', label: 'C'}]);

        // Dispose contribution 2.
        contribution2.dispose();

        // Contribute to menu with required context undefined.
        contributeMenu('menu:testee', (menu, context) => {
          menu.addMenuItem({label: `${context.get('context')}`, onSelect: noop});
        }, {requiredContext: new Map().set('context', undefined), injector: childContributionInjector});
        await fixture.whenStable();
        await expectAsync(menu).toEqualMenu([{type: 'menu-item', label: 'C'}]);
      });

      it('should require any context value (*)', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', (menu, context) => {
          menu.addMenuItem({label: `${context.get('context')}`, onSelect: noop});
        }, {requiredContext: new Map().set('context', '*'), injector: TestBed.inject(Injector)});
        await fixture.whenStable();

        const menu = new MenuPO(fixture);

        // Open menu with empty context.
        TestBed.inject(SciMenuService).open('menu:testee', {context: new Map(), anchor: {x: 0, y: 0}});
        await expectAsync(menu).toEqualMenu([]);

        // Open menu with context A.
        TestBed.inject(SciMenuService).open('menu:testee', {context: new Map().set('context', 'A'), anchor: {x: 0, y: 0}});
        await fixture.whenStable();
        await expectAsync(menu).toEqualMenu([{type: 'menu-item', label: 'A'}]);

        // Open menu with context B.
        TestBed.inject(SciMenuService).open('menu:testee', {context: new Map().set('context', 'B'), anchor: {x: 0, y: 0}});
        await fixture.whenStable();
        await expectAsync(menu).toEqualMenu([{type: 'menu-item', label: 'B'}]);

        // Open menu with context undefined.
        TestBed.inject(SciMenuService).open('menu:testee', {context: new Map().set('context', undefined), anchor: {x: 0, y: 0}});
        await fixture.whenStable();
        await expectAsync(menu).toEqualMenu([]);

        // Open menu with empty context.
        TestBed.inject(SciMenuService).open('menu:testee', {context: new Map(), anchor: {x: 0, y: 0}});
        await fixture.whenStable();
        await expectAsync(menu).toEqualMenu([]);
      });
    });

    describe('AcceleratorTarget', () => {

      it('should inherit target from environment', async () => {
        const rootAcceleratorTargets = signal<Element[]>([]);

        @Component({
          selector: 'spec-testee',
          template: `
            <div id="accelerator-target-1"></div>
            <div id="accelerator-target-2"></div>
          `,
        })
        class SpecTesteeComponent {
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

        // Spy console.
        const spy = spyOn(console, 'log').and.callThrough();

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({label: 'label-1', cssClass: 'testee-1', accelerator: {alt: true, key: '1'}, onSelect: () => console.log('onSelect item')}), {injector: TestBed.inject(Injector)});
        await fixture.whenStable();

        // Install accelerators.
        installMenuAccelerators('menu:testee', {injector: TestBed.inject(Injector)});
        await fixture.whenStable();

        // Press alt-1 on document.
        document.dispatchEvent(new KeyboardEvent('keydown', {key: '1', altKey: true}));
        expect(console.log).toHaveBeenCalledWith('onSelect item');
        spy.calls.reset();

        // Set accelerator target 1.
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

        // Set accelerator target 1 and target 2.
        rootAcceleratorTargets.set([acceleratorTarget1, acceleratorTarget2]);
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
      });
    });
  });

  describe('Accelerator', () => {

    it('should not invoke onSelect callback before installing accelerators', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Spy console.
      spyOn(console, 'log').and.callThrough();

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenuItem({label: 'label-1', cssClass: 'testee-1', accelerator: {alt: true, key: '1'}, onSelect: () => console.log('onSelect item')}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Press alt-1.
      document.dispatchEvent(new KeyboardEvent('keydown', {altKey: true, key: '1'}));
      expect(console.log).not.toHaveBeenCalledWith('onSelect item');

      // Install accelerators.
      installMenuAccelerators('menu:testee', {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Press alt-1.
      document.dispatchEvent(new KeyboardEvent('keydown', {altKey: true, key: '1', bubbles: true}));
      expect(console.log).toHaveBeenCalledWith('onSelect item');
    });

    it('should invoke onSelect callback when pressing accelerator (menu closed)', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Spy console.
      spyOn(console, 'log').and.callThrough();

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenuItem({label: 'label-1', cssClass: 'testee-1', accelerator: {alt: true, key: '1'}, onSelect: () => console.log('onSelect item 1')})
        .addMenu({label: 'submenu'}, menu => menu
          .addMenuItem({label: 'label-2', cssClass: 'testee-2', accelerator: {alt: true, key: '2'}, onSelect: () => console.log('onSelect item 2')})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Install accelerators.
      installMenuAccelerators('menu:testee', {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Press alt-1.
      document.dispatchEvent(new KeyboardEvent('keydown', {altKey: true, key: '1', bubbles: true}));
      expect(console.log).toHaveBeenCalledWith('onSelect item 1');

      // Press alt-2.
      document.dispatchEvent(new KeyboardEvent('keydown', {altKey: true, key: '2', bubbles: true}));
      expect(console.log).toHaveBeenCalledWith('onSelect item 2');
    });

    it('should invoke onSelect when pressing accelerator (menu open)', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenuItem({label: 'label-1', cssClass: 'testee-1', accelerator: {alt: true, key: '1'}, onSelect: () => console.log('onSelect item 1')})
        .addMenu({label: 'submenu', cssClass: 'submenu'}, menu => menu
          .addMenuItem({label: 'label-2', cssClass: 'testee-2', accelerator: {alt: true, key: '2'}, onSelect: () => console.log('onSelect item 2')})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Spy console.
      const spyLog = spyOn(console, 'log').and.callThrough();

      // Install accelerators.
      installMenuAccelerators('menu:testee', {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);
      await fixture.whenStable();

      // Press alt-1.
      document.dispatchEvent(new KeyboardEvent('keydown', {altKey: true, key: '1', bubbles: true}));
      expect(console.log).toHaveBeenCalledWith('onSelect item 1');

      // Press alt-2.
      document.dispatchEvent(new KeyboardEvent('keydown', {altKey: true, key: '2', bubbles: true}));
      expect(console.log).toHaveBeenCalledWith('onSelect item 2');
      spyLog.calls.reset();

      // Open submenu
      await menu.openSubMenu({cssClass: 'submenu'});
      await fixture.whenStable();

      // Press alt-1.
      document.dispatchEvent(new KeyboardEvent('keydown', {altKey: true, key: '1', bubbles: true}));
      expect(console.log).toHaveBeenCalledWith('onSelect item 1');

      // Press alt-2.
      document.dispatchEvent(new KeyboardEvent('keydown', {altKey: true, key: '2', bubbles: true}));
      expect(console.log).toHaveBeenCalledWith('onSelect item 2');
    });

    it('should not invoke onSelect callback when pressing accelerator (different menu open)', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu 1.
      contributeMenu('menu:testee-1', menu => menu.addMenuItem({label: 'label', onSelect: noop}), {injector: TestBed.inject(Injector)});

      // Contribute to menu 2.
      contributeMenu('menu:testee-2', menu => menu
        .addMenuItem({label: 'label-1', cssClass: 'testee-1', accelerator: {alt: true, key: '1'}, onSelect: () => console.log('onSelect item 1')})
        .addMenu({label: 'submenu', cssClass: 'submenu'}, menu => menu
          .addMenuItem({label: 'label-2', cssClass: 'testee-2', accelerator: {alt: true, key: '2'}, onSelect: () => console.log('onSelect item 2')})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Spy console.
      spyOn(console, 'log').and.callThrough();

      // Install accelerators.
      installMenuAccelerators('menu:testee-1', {injector: TestBed.inject(Injector)});
      installMenuAccelerators('menu:testee-2', {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu 1.
      TestBed.inject(SciMenuService).open('menu:testee-1', {anchor: {x: 0, y: 0}});
      const menu1 = new MenuPO(fixture);
      await fixture.whenStable();

      // Press alt-1.
      menu1.nativeElement.dispatchEvent(new KeyboardEvent('keydown', {altKey: true, key: '1', bubbles: true}));
      expect(console.log).not.toHaveBeenCalledWith('onSelect item 1');

      // Press alt-2.
      menu1.nativeElement.dispatchEvent(new KeyboardEvent('keydown', {altKey: true, key: '2', bubbles: true}));
      expect(console.log).not.toHaveBeenCalledWith('onSelect item 2');
    });
  });

  describe('Menu Item', () => {

    it('should provide label', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const label = signal('testee-2');

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenuItem({label: 'testee-1', onSelect: noop})
        .addMenuItem({label: label, onSelect: noop})
        .addMenuItem({label: SpecControlComponent, onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
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
      await expectAsync(menu).toEqualMenu([
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

    it('should provide icon', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const icon = signal('testee-2');

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenuItem({icon: 'testee-1', label: 'label', onSelect: noop})
        .addMenuItem({icon: icon, label: 'label', onSelect: noop})
        .addMenuItem({icon: SpecControlComponent, label: 'label', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
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
      await expectAsync(menu).toEqualMenu([
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

    it('should provide tooltip', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const tooltip = signal('testee-1');

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenuItem({tooltip: 'testee', label: 'label', onSelect: noop})
        .addMenuItem({tooltip: tooltip, label: 'label', onSelect: noop})
        .addMenuItem({tooltip: 'testee', label: 'icon', accelerator: {key: 'F1'}, onSelect: noop, actions: toolbar => toolbar.addToolbarButton({icon: 'icon', onSelect: noop})})
        .addMenuItem({tooltip: 'testee', label: 'icon', accelerator: {alt: true, key: '1'}, onSelect: noop, actions: toolbar => toolbar.addToolbarButton({icon: 'icon', onSelect: noop})})
        .addMenuItem({tooltip: 'testee', label: 'icon', accelerator: {shift: true, key: '2'}, onSelect: noop, actions: toolbar => toolbar.addToolbarButton({icon: 'icon', onSelect: noop})})
        .addMenuItem({tooltip: 'testee', label: 'icon', accelerator: {ctrl: true, key: '3'}, onSelect: noop, actions: toolbar => toolbar.addToolbarButton({icon: 'icon', onSelect: noop})})
        .addMenuItem({tooltip: 'testee', label: 'icon', accelerator: {shift: true, alt: true, key: '4'}, onSelect: noop, actions: toolbar => toolbar.addToolbarButton({icon: 'icon', onSelect: noop})})
        .addMenuItem({tooltip: 'testee', label: 'icon', accelerator: {ctrl: true, shift: true, key: '5'}, onSelect: noop, actions: toolbar => toolbar.addToolbarButton({icon: 'icon', onSelect: noop})})
        .addMenuItem({tooltip: 'testee', label: 'icon', accelerator: {ctrl: true, alt: true, key: '6'}, onSelect: noop, actions: toolbar => toolbar.addToolbarButton({icon: 'icon', onSelect: noop})})
        .addMenuItem({tooltip: 'testee', label: 'icon', accelerator: {ctrl: true, shift: true, alt: true, key: '7'}, onSelect: noop, actions: toolbar => toolbar.addToolbarButton({icon: 'icon', onSelect: noop})})
        .addMenuItem({tooltip: 'testee', label: 'icon', accelerator: {ctrl: true, key: ' '}, onSelect: noop, actions: toolbar => toolbar.addToolbarButton({icon: 'icon', onSelect: noop})}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
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
      await expectAsync(menu).toEqualMenu([
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

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenuItem({label: 'label', onSelect: noop})
        .addMenuItem({disabled: true, label: 'label', onSelect: noop})
        .addMenuItem({disabled: false, label: 'label', onSelect: noop})
        .addMenuItem({disabled: disabled, label: 'label', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu-item',
          disabled: false,
        },
        {
          type: 'menu-item',
          disabled: true,
        },
        {
          type: 'menu-item',
          disabled: false,
        },
        {
          type: 'menu-item',
          disabled: true,
        },
      ]);

      // Update disabled.
      disabled.set(false);
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu-item',
          disabled: false,
        },
        {
          type: 'menu-item',
          disabled: true,
        },
        {
          type: 'menu-item',
          disabled: false,
        },
        {
          type: 'menu-item',
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

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenuItem({label: 'label', onSelect: noop})
        .addMenuItem({checked: true, label: 'label', onSelect: noop})
        .addMenuItem({checked: false, label: 'label', onSelect: noop})
        .addMenuItem({checked: checked, label: 'label', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
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
      await expectAsync(menu).toEqualMenu([
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

    it('should provide active', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const active = signal(true);

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenuItem({label: 'label', onSelect: noop})
        .addMenuItem({active: true, label: 'label', onSelect: noop})
        .addMenuItem({active: false, label: 'label', onSelect: noop})
        .addMenuItem({active: active, label: 'label', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu-item',
          active: false,
        },
        {
          type: 'menu-item',
          active: true,
        },
        {
          type: 'menu-item',
          active: false,
        },
        {
          type: 'menu-item',
          active: true,
        },
      ]);

      // Update active.
      active.set(false);
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu-item',
          active: false,
        },
        {
          type: 'menu-item',
          active: true,
        },
        {
          type: 'menu-item',
          active: false,
        },
        {
          type: 'menu-item',
          active: false,
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

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenuItem({label: 'testee-1', cssClass: 'testee-1', onSelect: () => console.log('Click item 1')})
        .addMenuItem({label: 'testee-2', cssClass: 'testee-2', onSelect: () => console.log('Click item 2')}), {injector: TestBed.inject(Injector)},
      );
      await fixture.whenStable();

      // Spy console.
      spyOn(console, 'log').and.callThrough();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Click on item 1.
      menu.item({cssClass: 'testee-1'}).nativeElement.click();

      // Expect onSelect function of item 1 to be invoked.
      expect(console.log).toHaveBeenCalledWith('Click item 1');

      // Click on item 2.
      menu.item({cssClass: 'testee-2'}).nativeElement.click();

      // Expect onSelect function of item 2 to be invoked.
      expect(console.log).toHaveBeenCalledWith('Click item 2');
    });

    it('should close menu on click (onSelect => void)', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenuItem({
          label: 'label', cssClass: 'testee', onSelect: () => {
            return;
          },
        }), {injector: TestBed.inject(Injector)},
      );
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Click on menu item.
      menu.item({cssClass: 'testee'}).nativeElement.click();
      await fixture.whenStable();

      // Expect menu not to be attached.
      await expectAsync(() => menu.debugElement).not.toBeAttached();
    });

    it('should close menu on click (onSelect => true)', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenuItem({
          label: 'label', cssClass: 'testee', onSelect: () => true,
        }), {injector: TestBed.inject(Injector)},
      );
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Click on menu item.
      menu.item({cssClass: 'testee'}).nativeElement.click();

      // Expect menu not to be attached.
      await expectAsync(() => menu.debugElement).not.toBeAttached();
    });

    it('should not close menu on click (onSelect => false)', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenuItem({
          label: 'label', cssClass: 'testee', onSelect: () => false,
        }), {injector: TestBed.inject(Injector)},
      );
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Click on menu item.
      menu.item({cssClass: 'testee'}).nativeElement.click();
      await fixture.whenStable();

      // Expect menu to be visible.
      await expectAsync(() => menu.debugElement).toBeVisible();
    });

    it('should close menu on submenu item click (onSelect => void)', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenu({label: 'submenu', cssClass: 'submenu'}, menu => menu.addMenuItem({
          label: 'label', cssClass: 'testee', onSelect: () => {
            return;
          },
        })), {injector: TestBed.inject(Injector)},
      );
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Open submenu.
      const subMenu = await menu.openSubMenu({cssClass: 'submenu'});

      // Click on menu item in submenu.
      subMenu.item({cssClass: 'testee'}).nativeElement.click();
      await fixture.whenStable();

      // Expect menu not to be attached.
      await expectAsync(() => menu.debugElement).not.toBeAttached();
      await expectAsync(() => subMenu.debugElement).not.toBeAttached();
    });

    it('should close menu on submenu item click (onSelect => true)', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenu({label: 'submenu', cssClass: 'submenu'}, menu => menu.addMenuItem({
          label: 'label', cssClass: 'testee', onSelect: () => true,
        })), {injector: TestBed.inject(Injector)},
      );
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Open submenu.
      const subMenu = await menu.openSubMenu({cssClass: 'submenu'});

      // Click on menu item in submenu.
      subMenu.item({cssClass: 'testee'}).nativeElement.click();
      await fixture.whenStable();

      // Expect menu not to be attached.
      await expectAsync(() => menu.debugElement).not.toBeAttached();
      await expectAsync(() => subMenu.debugElement).not.toBeAttached();
    });

    it('should not close menu on submenu item click (onSelect => false)', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenu({label: 'submenu', cssClass: 'submenu'}, menu => menu.addMenuItem({
          label: 'label', cssClass: 'testee', onSelect: () => false,
        })), {injector: TestBed.inject(Injector)},
      );
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Open submenu.
      const subMenu = await menu.openSubMenu({cssClass: 'submenu'});

      // Click on menu item in submenu.
      subMenu.item({cssClass: 'testee'}).nativeElement.click();
      await fixture.whenStable();

      // Expect menu to be visible.
      await expectAsync(() => menu.debugElement).toBeVisible();
      await expectAsync(() => subMenu.debugElement).toBeVisible();
    });

    it('should provide attributes', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenuItem({attributes: {attr1: 'testee-1', attr2: 'testee-2'}, label: 'label', onSelect: noop}), {injector: TestBed.inject(Injector)},
      );
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {type: 'menu-item', attributes: {attr1: 'testee-1', attr2: 'testee-2'}},
      ]);
    });

    it('should provide css class', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenuItem({cssClass: ['testee-1', 'testee-2'], label: 'label', onSelect: noop}), {injector: TestBed.inject(Injector)},
      );
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {type: 'menu-item', cssClass: ['testee-1', 'testee-2']},
      ]);
    });

    describe('Actions', () => {

      it('should provide actions', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({
            label: 'label',
            onSelect: noop,
            actions: toolbar => toolbar
              .addToolbarButton({icon: 'icon-1', onSelect: noop})
              .addToolbarButton({icon: 'icon-2', onSelect: noop}),
          }), {injector: TestBed.inject(Injector)});

        // Open menu.
        TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
        const menu = new MenuPO(fixture);

        // Expect menu.
        await expectAsync(menu).toEqualMenu([
          {
            type: 'menu-item',
            label: 'label',
            actions: [
              {
                type: 'menu-item',
                icon: 'icon-1',
              },
              {
                type: 'menu-item',
                icon: 'icon-2',
              },
            ],
          },
        ]);
      });

      it('should show actions if menu item is active', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({
            label: 'label',
            active: true,
            cssClass: 'testee-menu-item',
            onSelect: noop,
            actions: toolbar => toolbar
              .addToolbarButton({icon: 'icon-1', onSelect: noop}),
          }), {injector: TestBed.inject(Injector)});

        // Open menu.
        TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
        const menu = new MenuPO(fixture);
        await fixture.whenStable();

        // Expect actions to be visible.
        const actions = menu.item({cssClass: 'testee-menu-item'}).actions;
        await expectAsync(() => actions.debugElement).toBeVisible();
      });

      it('should not show actions if menu item is checked', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({
            label: 'label',
            checked: true,
            cssClass: 'testee-menu-item',
            onSelect: noop,
            actions: toolbar => toolbar
              .addToolbarButton({icon: 'icon-1', onSelect: noop}),
          }), {injector: TestBed.inject(Injector)});

        // Open menu.
        TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
        await fixture.whenStable();
        const menu = new MenuPO(fixture);

        // Expect actions not to be visible.
        const actions = menu.item({cssClass: 'testee-menu-item'}).actions;
        await expectAsync(() => actions.debugElement).not.toBeVisible();
      });

      it('should close menu on action click (onSelect => void)', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({
            label: 'label',
            cssClass: 'testee-menu-item',
            onSelect: noop,
            actions: toolbar => toolbar.addToolbarButton({
              icon: 'icon', cssClass: 'testee', onSelect: () => {
                return;
              },
            }),
          }), {injector: TestBed.inject(Injector)});

        // Open menu.
        TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
        const menu = new MenuPO(fixture);
        await fixture.whenStable();

        // Expect menu to be visible.
        await expectAsync(() => menu.debugElement).toBeVisible();

        // Click action.
        const menuItem = menu.item({cssClass: 'testee-menu-item'});
        const action = menuItem.actions.button({cssClass: 'testee'});
        action.nativeElement.click();
        await fixture.whenStable();

        // Expect menu not to be attached.
        await expectAsync(() => menu.debugElement).not.toBeAttached();
      });

      it('should close menu on action click (onSelect => true)', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({
            label: 'label',
            cssClass: 'testee-menu-item',
            onSelect: noop,
            actions: toolbar => toolbar.addToolbarButton({icon: 'icon', cssClass: 'testee', onSelect: () => true}),
          }), {injector: TestBed.inject(Injector)});

        // Open menu.
        TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
        const menu = new MenuPO(fixture);
        await fixture.whenStable();

        // Expect menu to be visible.
        await expectAsync(() => menu.debugElement).toBeVisible();

        // Click action.
        const menuItem = menu.item({cssClass: 'testee-menu-item'});
        const action = menuItem.actions.button({cssClass: 'testee'});
        action.nativeElement.click();
        await fixture.whenStable();

        // Expect menu not to be attached.
        await expectAsync(() => menu.debugElement).not.toBeAttached();
      });

      it('should not close menu on action click (onSelect => false)', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({
            label: 'label',
            cssClass: 'testee-menu-item',
            onSelect: noop,
            actions: toolbar => toolbar.addToolbarButton({icon: 'icon', cssClass: 'testee', onSelect: () => false}),
          }), {injector: TestBed.inject(Injector)});

        // Open menu.
        TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
        const menu = new MenuPO(fixture);
        await fixture.whenStable();

        // Expect menu to be visible.
        await expectAsync(() => menu.debugElement).toBeVisible();

        // Click action.
        const menuItem = menu.item({cssClass: 'testee-menu-item'});
        const action = menuItem.actions.button({cssClass: 'testee'});
        action.nativeElement.click();
        await fixture.whenStable();

        // Expect menu to be visible.
        await expectAsync(() => menu.debugElement).toBeVisible();
      });
    });
  });

  describe('Submenu', () => {

    it('should provide label', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const label = signal('testee-2');

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenu({label: 'testee-1'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
        .addMenu({label: label}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
        .addMenu({label: SpecControlComponent}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
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
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu',
          label: 'testee-1',
        },
        {
          type: 'menu',
          label: 'TESTEE-2',
        },
        {
          type: 'menu',
          labelComponent: {selector: 'spec-control'},
        },
      ]);
    });

    it('should provide icon', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const icon = signal('testee-2');

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenu({icon: 'testee-1', label: 'label'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
        .addMenu({icon: icon, label: 'label'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
        .addMenu({icon: SpecControlComponent, label: 'label'}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
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
      await expectAsync(menu).toEqualMenu([
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

    it('should provide disabled', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const disabled = signal(true);

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenu({label: 'label'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
        .addMenu({disabled: true, label: 'label'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
        .addMenu({disabled: false, label: 'label'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
        .addMenu({disabled: disabled, label: 'label'}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu',
          disabled: false,
        },
        {
          type: 'menu',
          disabled: true,
        },
        {
          type: 'menu',
          disabled: false,
        },
        {
          type: 'menu',
          disabled: true,
        },
      ]);

      // Update disabled.
      disabled.set(false);
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu',
          disabled: false,
        },
        {
          type: 'menu',
          disabled: true,
        },
        {
          type: 'menu',
          disabled: false,
        },
        {
          type: 'menu',
          disabled: false,
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

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenu({cssClass: ['testee-1', 'testee-2'], label: 'label'}, menu => menu
          .addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {type: 'menu', cssClass: ['testee-1', 'testee-2']},
      ]);
    });

    it('should provide attributes', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenu({attributes: {attr1: 'testee-1', attr2: 'testee-2'}, label: 'label'}, menu => menu
          .addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {type: 'menu', attributes: {attr1: 'testee-1', attr2: 'testee-2'}},
      ]);
    });

    describe('Filter', () => {

      it('should provide filter', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenu({label: 'label', cssClass: 'testee-1'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
          .addMenu({menu: {filter: false}, label: 'label', cssClass: 'testee-2'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
          .addMenu({menu: {filter: true}, label: 'label', cssClass: 'testee-3'}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)},
        );
        await fixture.whenStable();

        // Open menu.
        TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
        const menu = new MenuPO(fixture);

        // Open submenu 1 (omit filter option).
        const submenu1 = await menu.openSubMenu({cssClass: 'testee-1'});

        // Expect filter field not to be attached.
        await expectAsync(() => submenu1.filterInputElement).not.toBeAttached();

        // Open submenu 2 (filter=false).
        const submenu2 = await menu.openSubMenu({cssClass: 'testee-2'});

        // Expect filter field not to be attached.
        await expectAsync(() => submenu2.filterInputElement).not.toBeAttached();

        // Open submenu 3 (filter=true).
        const submenu3 = await menu.openSubMenu({cssClass: 'testee-2'});

        // Expect filter field to be visible.
        await expectAsync(() => submenu3.filterInputElement).not.toBeAttached();
      });

      it('should provide filter placeholder', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenu({menu: {filter: {placeholder: 'testee-placeholder'}}, label: 'label', cssClass: 'testee'}, menu => menu
            .addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
        await fixture.whenStable();

        // Open menu.
        TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
        const menu = new MenuPO(fixture);

        // Open submenu.
        const submenu = await menu.openSubMenu({cssClass: 'testee'});

        // Expect placeholder to match.
        await expectAsync(() => submenu.filterInputElement).toBeAttached();
        expect(submenu.filterInputElement!.nativeElement.placeholder).toEqual('testee-placeholder');
      });

      it('should provide filter notFoundMessage', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenu({menu: {filter: {notFoundMessage: 'testee-not-found-message'}}, label: 'label', cssClass: 'testee'}, menu => menu
            .addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
        await fixture.whenStable();

        // Open menu (filter notFoundMessage).
        TestBed.inject(SciMenuService).open('menu:testee', {filter: {notFoundMessage: 'testee-not-found-message'}, anchor: {x: 0, y: 0}});
        const menu = new MenuPO(fixture);

        // Open submenu.
        const submenu = await menu.openSubMenu({cssClass: 'testee'});

        // Filter to show no results.
        submenu.filterMenuItems('xyz');
        await new Promise(resolve => requestIdleCallback(resolve));

        // Expect not found message to match.
        expect(submenu.noItemsFoundMessage!.nativeElement.innerText).toEqual('testee-not-found-message');
      });
    });

    describe('Size', () => {

      it('should configure width', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenu({menu: {width: '500px'}, label: 'label', cssClass: 'testee'}, menu => menu
            .addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
        await fixture.whenStable();

        // Open menu.
        TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
        const menu = new MenuPO(fixture);

        // Open submenu.
        const submenu = await menu.openSubMenu({cssClass: 'testee'});
        await fixture.whenStable();

        // Expect width to be 500.
        expect(submenu.nativeElement.getBoundingClientRect().width).toEqual(500);
      });

      it('should configure menu minWidth', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenu({menu: {minWidth: '500px'}, label: 'label', cssClass: 'testee'}, menu => menu
            .addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
        await fixture.whenStable();

        // Open menu.
        TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
        const menu = new MenuPO(fixture);

        // Open submenu.
        const submenu = await menu.openSubMenu({cssClass: 'testee'});
        await fixture.whenStable();

        // Expect width to be 500.
        expect(submenu.nativeElement.getBoundingClientRect().width).toEqual(500);
      });

      it('should configure menu maxWidth', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenu({menu: {maxWidth: '200px'}, label: 'label', cssClass: 'testee'}, menu => menu
            .addMenuItem({label: 'long label text to exceed maximum width', onSelect: noop})), {injector: TestBed.inject(Injector)});
        await fixture.whenStable();

        // Open menu.
        TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
        const menu = new MenuPO(fixture);

        // Open submenu.
        const submenu = await menu.openSubMenu({cssClass: 'testee'});
        await fixture.whenStable();

        // Expect submenu width to be 200.
        expect(submenu.nativeElement.getBoundingClientRect().width).toEqual(200);
      });

      it('should configure menu maxHeight', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        contributeMenu('menu:testee', menu => menu
          .addMenu({menu: {maxHeight: '200px'}, label: 'label', cssClass: 'testee'}, menu => menu
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
        TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});

        // Open submenu.
        const submenu = await menu.openSubMenu({cssClass: 'testee'});
        await fixture.whenStable();

        // Expect overflow.
        const viewport = submenu.debugElement.query(By.css('sci-viewport'));
        const viewportClient = viewport.query(By.css('div.viewport-client'));
        expect((viewportClient.nativeElement as HTMLElement).clientHeight).toBeGreaterThan((viewport.nativeElement as HTMLElement).clientHeight);

        // Expect submenu viewport height to be 200.
        expect(submenu.viewport!.nativeElement.getBoundingClientRect().height).toEqual(200);

        // Expect submenu.
        await expectAsync(submenu).toEqualMenu([
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

      it('should not inherit width from parent menu', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenu({label: 'label', cssClass: 'testee-1'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
          .addMenu({label: 'label', cssClass: 'testee-2', menu: {width: '600px'}}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
        await fixture.whenStable();

        // Open menu.
        TestBed.inject(SciMenuService).open('menu:testee', {width: '500px', anchor: {x: 0, y: 0}});
        const menu = new MenuPO(fixture);

        // Open submenu 1.
        const submenu1 = await menu.openSubMenu({cssClass: 'testee-1'});
        await fixture.whenStable();

        // Expect submenu 1 width to be smaller than 500px.
        expect(submenu1.nativeElement.getBoundingClientRect().width).toBeLessThan(500);

        // Open submenu 2.
        const submenu2 = await menu.openSubMenu({cssClass: 'testee-2'});
        await fixture.whenStable();

        // Expect submenu 2 width to be 600.
        expect(submenu2.nativeElement.getBoundingClientRect().width).toBe(600);
      });

      it('should not inherit maxHeight from parent menu', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenu({label: 'label', cssClass: 'testee-1'}, menu => menu
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
            .addMenuItem({label: 'label', onSelect: noop}))
          .addMenu({label: 'label', cssClass: 'testee-2', menu: {maxHeight: '100px'}}, menu => menu
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

        // Open menu.
        TestBed.inject(SciMenuService).open('menu:testee', {maxHeight: '200px', anchor: {x: 0, y: 0}});
        const menu = new MenuPO(fixture);

        // Open submenu 1.
        const submenu1 = await menu.openSubMenu({cssClass: 'testee-1'});
        await fixture.whenStable();

        // Expect viewport not to be attached in submenu 1.
        await expectAsync(() => submenu1.viewport).not.toBeAttached();

        // Open submenu 2.
        const submenu2 = await menu.openSubMenu({cssClass: 'testee-2'});
        await fixture.whenStable();

        // Expect submenu 2 max height to be 100.
        expect(submenu2.viewport!.nativeElement.getBoundingClientRect().height).toEqual(100);
      });
    });
  });

  describe('Group', () => {

    it('should call menu factory function in reactive context', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);
      const itemVisible = signal(false);

      // Contribute to menu.
      contributeMenu('menu:testee', menu => {
        menu.addGroup({name: 'menu:group'});
      }, {injector: TestBed.inject(Injector)});

      contributeMenu('menu:group', menu => {
        if (itemVisible()) {
          menu.addMenuItem({label: 'label', onSelect: noop});
        }
      }, {injector: TestBed.inject(Injector)});

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([]);

      // Show menu item.
      itemVisible.set(true);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'group',
          children: [
            {type: 'menu-item', label: 'label'},
          ],
        },
      ]);

      // Hide menu item.
      itemVisible.set(false);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([]);
    });

    it('should call menu factory function only when tracked signal changes', async () => {
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

      // Contribute to menu.
      contributeMenu('menu:testee', menu => {
        contribution1.callCount++;
        contribution1.signal();
        menu.addMenuItem({label: 'label-1', onSelect: noop});
        menu.addGroup({name: 'menu:group'});
      }, {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      expect(contribution1.callCount).toBe(1);
      expect(contribution2.callCount).toBe(0);
      await expectAsync(menu).toEqualMenu([
        {type: 'menu-item', label: 'label-1'},
      ]);

      // Contribute to group.
      contributeMenu('menu:group', menu => {
        contribution2.callCount++;
        contribution2.signal();
        menu.addMenuItem({label: 'label-2', onSelect: noop});
      }, {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect menu.
      expect(contribution1.callCount).toBe(1);
      expect(contribution2.callCount).toBe(1);
      await expectAsync(menu).toEqualMenu([
        {type: 'menu-item', label: 'label-1'},
        {
          type: 'group',
          children: [
            {type: 'menu-item', label: 'label-2'},
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

    it('should not call menu factory function again when signal of menu item changes', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);
      const contribution1 = {
        callCount: 0,
        label: signal('label-1'),
      };

      const contribution2 = {
        callCount: 0,
        label: signal('label-2'),
      };

      // Contribute to menu.
      contributeMenu('menu:testee', menu => {
        contribution1.callCount++;
        menu.addMenuItem({label: contribution1.label, onSelect: noop});
        menu.addGroup({name: 'menu:group'});
      }, {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      expect(contribution1.callCount).toBe(1);
      await expectAsync(menu).toEqualMenu([
        {type: 'menu-item', label: 'label-1'},
      ]);

      // Contribute to group.
      contributeMenu('menu:group', menu => {
        contribution2.callCount++;
        menu.addMenuItem({label: contribution2.label, onSelect: noop});
      }, {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect menu.
      expect(contribution1.callCount).toBe(1);
      expect(contribution2.callCount).toBe(1);
      await expectAsync(menu).toEqualMenu([
        {type: 'menu-item', label: 'label-1'},
        {
          type: 'group',
          children: [
            {type: 'menu-item', label: 'label-2'},
          ],
        },
      ]);

      // Change signal in factory function of contribution 1.
      contribution1.label.set('label-1a');
      await fixture.whenStable();

      // Expect factory function not to be called again.
      expect(contribution1.callCount).toBe(1);
      expect(contribution2.callCount).toBe(1);
      await expectAsync(menu).toEqualMenu([
        {type: 'menu-item', label: 'label-1a'},
        {
          type: 'group',
          children: [
            {type: 'menu-item', label: 'label-2'},
          ],
        },
      ]);

      // Change tracked signal in factory function of contribution 2.
      contribution2.label.set('label-2a');
      await fixture.whenStable();

      // Expect factory function not to be called again.
      expect(contribution1.callCount).toBe(1);
      expect(contribution2.callCount).toBe(1);
      await expectAsync(menu).toEqualMenu([
        {type: 'menu-item', label: 'label-1a'},
        {
          type: 'group',
          children: [
            {type: 'menu-item', label: 'label-2a'},
          ],
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

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addGroup({}, group => group.addMenuItem({label: 'label', onSelect: noop}))
        .addGroup({label: 'testee-1'}, group => group.addMenuItem({label: 'label', onSelect: noop}))
        .addGroup({label: label}, group => group.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'group',
          label: '',
        },
        {
          type: 'group',
          label: 'testee-1',
        },
        {
          type: 'group',
          label: 'testee-2',
        },
      ]);

      // Update label.
      label.set('TESTEE-2');
      await expectAsync(menu).toEqualMenu([
        {
          type: 'group',
          label: '',
        },
        {
          type: 'group',
          label: 'testee-1',
        },
        {
          type: 'group',
          label: 'TESTEE-2',
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

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addGroup({}, group => group.addMenuItem({label: 'label', onSelect: noop}))
        .addGroup({disabled: true}, group => group.addMenuItem({label: 'label', onSelect: noop}))
        .addGroup({disabled: false}, group => group.addMenuItem({label: 'label', onSelect: noop}))
        .addGroup({disabled: disabled}, group => group.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
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
      await expectAsync(menu).toEqualMenu([
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

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addGroup({cssClass: ['testee-1', 'testee-2']}, group => group.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'group',
          cssClass: ['testee-1', 'testee-2'],
        },
      ]);
    });

    it('should provide actions', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addGroup({
          label: 'label',
          actions: toolbar => toolbar
            .addToolbarButton({icon: 'icon-1', onSelect: noop})
            .addToolbarButton({icon: 'icon-2', onSelect: noop}),
        }, group => group
          .addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'group',
          actions: [
            {
              type: 'menu-item',
              icon: 'icon-1',
            },
            {
              type: 'menu-item',
              icon: 'icon-2',
            },
          ],
        },
      ]);
    });

    it('should provide collapsible', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addGroup({collapsible: true}, group => group.addMenuItem({label: 'label-1', onSelect: noop}))
        .addGroup({collapsible: {collapsed: false}}, group => group.addMenuItem({label: 'label-2', onSelect: noop}))
        .addGroup({collapsible: {collapsed: true}}, group => group.addMenuItem({label: 'label-3', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'group',
          collapsible: {collapsed: false},
          children: [
            {
              type: 'menu-item',
              label: 'label-1',
            },
          ],
        },
        {
          type: 'group',
          collapsible: {collapsed: false},
          children: [
            {
              type: 'menu-item',
              label: 'label-2',
            },
          ],
        },
        {
          type: 'group',
          collapsible: {collapsed: true},
          children: [],
        },
      ]);
    });

    it('should toggle collapsed', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addGroup({collapsible: true, cssClass: 'testee'}, group => group.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'group',
          collapsible: {collapsed: false},
          children: [
            {
              type: 'menu-item',
              label: 'label',
            },
          ],
        },
      ]);

      // Toggle collapsed.
      const groupHeader = menu.group({cssClass: 'testee'}).header!.nativeElement as HTMLElement;
      groupHeader.click();
      await fixture.whenStable();

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'group',
          collapsible: {collapsed: true},
          children: [],
        },
      ]);
    });
  });

  describe('Menu Position', () => {

    describe('x/y coordinates', () => {

      it('should position menu (center)', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({label: 'label-1', onSelect: noop})
          .addMenuItem({label: 'label-2', onSelect: noop})
          .addMenuItem({label: 'label-3', onSelect: noop})
          .addMenu({label: 'submenu-1', cssClass: 'submenu-1'}, menu => menu
            .addMenuItem({label: 'label-1', onSelect: noop})
            .addMenuItem({label: 'label-2', onSelect: noop})
            .addMenuItem({label: 'label-3', onSelect: noop})), {injector: TestBed.inject(Injector)},
        );
        await fixture.whenStable();

        // Open menu.
        const anchor = {x: document.documentElement.clientWidth / 2, y: document.documentElement.clientHeight / 2};
        TestBed.inject(SciMenuService).open('menu:testee', {anchor});
        const menu = new MenuPO(fixture);
        const submenu = await menu.openSubMenu({cssClass: 'submenu-1'});

        // Expect menu.
        await expectAsync(menu).toHaveMenuPosition({
          anchor: anchor,
          menuX: 'left',
          menuY: 'top',
        });

        // Expect submenu.
        const subMenuAnchor = menu.item({cssClass: 'submenu-1'}).nativeElement;
        await expectAsync(submenu).toHaveMenuPosition({
          anchor: subMenuAnchor,
          anchorX: 'right',
          anchorY: 'top',
          anchorYOffset: -SUB_MENU_VERTICAL_OFFSET,
          menuX: 'left',
          menuY: 'top',
        });
      });

      it('should position menu (top-right)', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({label: 'label-1', onSelect: noop})
          .addMenuItem({label: 'label-2', onSelect: noop})
          .addMenuItem({label: 'label-3', onSelect: noop})
          .addMenu({label: 'submenu-1', cssClass: 'submenu-1'}, menu => menu
            .addMenuItem({label: 'label-1', onSelect: noop})
            .addMenuItem({label: 'label-2', onSelect: noop})
            .addMenuItem({label: 'label-3', onSelect: noop})), {injector: TestBed.inject(Injector)},
        );
        await fixture.whenStable();

        // Open menu.
        const anchor = {x: document.documentElement.clientWidth, y: 0};
        TestBed.inject(SciMenuService).open('menu:testee', {anchor});
        const menu = new MenuPO(fixture);
        const submenu = await menu.openSubMenu({cssClass: 'submenu-1'});

        // Expect menu.
        await expectAsync(menu).toHaveMenuPosition({
          anchor: anchor,
          menuX: 'right',
          menuY: 'top',
        });

        // Expect submenu.
        const subMenuAnchor = menu.item({cssClass: 'submenu-1'}).nativeElement;
        await expectAsync(submenu).toHaveMenuPosition({
          anchor: subMenuAnchor,
          anchorX: 'left',
          anchorY: 'top',
          anchorYOffset: -SUB_MENU_VERTICAL_OFFSET,
          menuX: 'right',
          menuY: 'top',
        });
      });

      it('should position menu (right)', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({label: 'label-1', onSelect: noop})
          .addMenuItem({label: 'label-2', onSelect: noop})
          .addMenuItem({label: 'label-3', onSelect: noop})
          .addMenu({label: 'submenu-1', cssClass: 'submenu-1'}, menu => menu
            .addMenuItem({label: 'label-1', onSelect: noop})
            .addMenuItem({label: 'label-2', onSelect: noop})
            .addMenuItem({label: 'label-3', onSelect: noop})), {injector: TestBed.inject(Injector)},
        );
        await fixture.whenStable();

        // Open menu.
        const anchor = {x: document.documentElement.clientWidth, y: document.documentElement.clientHeight / 2};
        TestBed.inject(SciMenuService).open('menu:testee', {anchor});
        const menu = new MenuPO(fixture);
        const submenu = await menu.openSubMenu({cssClass: 'submenu-1'});

        // Expect menu.
        await expectAsync(menu).toHaveMenuPosition({
          anchor: anchor,
          menuX: 'right',
          menuY: 'top',
        });

        // Expect submenu.
        const subMenuAnchor = menu.item({cssClass: 'submenu-1'}).nativeElement;
        await expectAsync(submenu).toHaveMenuPosition({
          anchor: subMenuAnchor,
          anchorX: 'left',
          anchorY: 'top',
          anchorYOffset: -SUB_MENU_VERTICAL_OFFSET,
          menuX: 'right',
          menuY: 'top',
        });
      });

      it('should position menu (bottom-right)', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({label: 'label-1', onSelect: noop})
          .addMenuItem({label: 'label-2', onSelect: noop})
          .addMenuItem({label: 'label-3', onSelect: noop})
          .addMenu({label: 'submenu-1', cssClass: 'submenu-1'}, menu => menu
            .addMenuItem({label: 'label-1', onSelect: noop})
            .addMenuItem({label: 'label-2', onSelect: noop})
            .addMenuItem({label: 'label-3', onSelect: noop})), {injector: TestBed.inject(Injector)},
        );
        await fixture.whenStable();

        // Open menu.
        const anchor = {x: document.documentElement.clientWidth, y: document.documentElement.clientHeight};
        TestBed.inject(SciMenuService).open('menu:testee', {anchor});
        const menu = new MenuPO(fixture);
        const submenu = await menu.openSubMenu({cssClass: 'submenu-1'});

        // Expect menu.
        await expectAsync(menu).toHaveMenuPosition({
          anchor: anchor,
          menuX: 'right',
          menuY: 'bottom',
        });

        // Expect submenu.
        const subMenuAnchor = menu.item({cssClass: 'submenu-1'}).nativeElement;
        await expectAsync(submenu).toHaveMenuPosition({
          anchor: subMenuAnchor,
          anchorX: 'left',
          anchorY: 'bottom',
          anchorYOffset: SUB_MENU_VERTICAL_OFFSET,
          menuX: 'right',
          menuY: 'bottom',
        });
      });

      it('should position menu (top-left)', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({label: 'label-1', onSelect: noop})
          .addMenuItem({label: 'label-2', onSelect: noop})
          .addMenuItem({label: 'label-3', onSelect: noop})
          .addMenu({label: 'submenu-1', cssClass: 'submenu-1'}, menu => menu
            .addMenuItem({label: 'label-1', onSelect: noop})
            .addMenuItem({label: 'label-2', onSelect: noop})
            .addMenuItem({label: 'label-3', onSelect: noop})), {injector: TestBed.inject(Injector)},
        );
        await fixture.whenStable();

        // Open menu.
        const anchor = {x: 0, y: 0};
        TestBed.inject(SciMenuService).open('menu:testee', {anchor});
        const menu = new MenuPO(fixture);
        const submenu = await menu.openSubMenu({cssClass: 'submenu-1'});

        // Expect menu.
        await expectAsync(menu).toHaveMenuPosition({
          anchor: anchor,
          menuX: 'left',
          menuY: 'top',
        });

        // Expect submenu.
        const subMenuAnchor = menu.item({cssClass: 'submenu-1'}).nativeElement;
        await expectAsync(submenu).toHaveMenuPosition({
          anchor: subMenuAnchor,
          anchorX: 'right',
          anchorY: 'top',
          anchorYOffset: -SUB_MENU_VERTICAL_OFFSET,
          menuX: 'left',
          menuY: 'top',
        });
      });

      it('should position menu (left)', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({label: 'label-1', onSelect: noop})
          .addMenuItem({label: 'label-2', onSelect: noop})
          .addMenuItem({label: 'label-3', onSelect: noop})
          .addMenu({label: 'submenu-1', cssClass: 'submenu-1'}, menu => menu
            .addMenuItem({label: 'label-1', onSelect: noop})
            .addMenuItem({label: 'label-2', onSelect: noop})
            .addMenuItem({label: 'label-3', onSelect: noop})), {injector: TestBed.inject(Injector)},
        );
        await fixture.whenStable();

        // Open menu.
        const anchor = {x: 0, y: document.documentElement.clientHeight / 2};
        TestBed.inject(SciMenuService).open('menu:testee', {anchor});
        const menu = new MenuPO(fixture);
        const submenu = await menu.openSubMenu({cssClass: 'submenu-1'});

        // Expect menu.
        await expectAsync(menu).toHaveMenuPosition({
          anchor: anchor,
          menuX: 'left',
          menuY: 'top',
        });

        // Expect submenu.
        const subMenuAnchor = menu.item({cssClass: 'submenu-1'}).nativeElement;
        await expectAsync(submenu).toHaveMenuPosition({
          anchor: subMenuAnchor,
          anchorX: 'right',
          anchorY: 'top',
          anchorYOffset: -SUB_MENU_VERTICAL_OFFSET,
          menuX: 'left',
          menuY: 'top',
        });
      });

      it('should position menu (bottom-left)', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({label: 'label-1', onSelect: noop})
          .addMenuItem({label: 'label-2', onSelect: noop})
          .addMenuItem({label: 'label-3', onSelect: noop})
          .addMenu({label: 'submenu-1', cssClass: 'submenu-1'}, menu => menu
            .addMenuItem({label: 'label-1', onSelect: noop})
            .addMenuItem({label: 'label-2', onSelect: noop})
            .addMenuItem({label: 'label-3', onSelect: noop})), {injector: TestBed.inject(Injector)},
        );
        await fixture.whenStable();

        // Open menu.
        const anchor = {x: 0, y: document.documentElement.clientHeight};
        TestBed.inject(SciMenuService).open('menu:testee', {anchor});
        const menu = new MenuPO(fixture);
        const submenu = await menu.openSubMenu({cssClass: 'submenu-1'});

        // Expect menu.
        await expectAsync(menu).toHaveMenuPosition({
          anchor: anchor,
          menuX: 'left',
          menuY: 'bottom',
        });

        // Expect submenu.
        const subMenuAnchor = menu.item({cssClass: 'submenu-1'}).nativeElement;
        await expectAsync(submenu).toHaveMenuPosition({
          anchor: subMenuAnchor,
          anchorX: 'right',
          anchorY: 'bottom',
          anchorYOffset: SUB_MENU_VERTICAL_OFFSET,
          menuX: 'left',
          menuY: 'bottom',
        });
      });

      it('should position menu (top)', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({label: 'label-1', onSelect: noop})
          .addMenuItem({label: 'label-2', onSelect: noop})
          .addMenuItem({label: 'label-3', onSelect: noop})
          .addMenu({label: 'submenu-1', cssClass: 'submenu-1'}, menu => menu
            .addMenuItem({label: 'label-1', onSelect: noop})
            .addMenuItem({label: 'label-2', onSelect: noop})
            .addMenuItem({label: 'label-3', onSelect: noop})), {injector: TestBed.inject(Injector)},
        );
        await fixture.whenStable();

        // Open menu.
        const anchor = {x: document.documentElement.clientWidth / 2, y: 0};
        TestBed.inject(SciMenuService).open('menu:testee', {anchor});
        const menu = new MenuPO(fixture);
        const submenu = await menu.openSubMenu({cssClass: 'submenu-1'});

        // Expect menu.
        await expectAsync(menu).toHaveMenuPosition({
          anchor: anchor,
          menuX: 'left',
          menuY: 'top',
        });

        // Expect submenu.
        const subMenuAnchor = menu.item({cssClass: 'submenu-1'}).nativeElement;
        await expectAsync(submenu).toHaveMenuPosition({
          anchor: subMenuAnchor,
          menuX: 'left',
          menuY: 'top',
          anchorX: 'right',
          anchorY: 'top',
          anchorYOffset: -SUB_MENU_VERTICAL_OFFSET,
        });
      });

      it('should position menu (bottom)', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({label: 'label-1', onSelect: noop})
          .addMenuItem({label: 'label-2', onSelect: noop})
          .addMenuItem({label: 'label-3', onSelect: noop})
          .addMenu({label: 'submenu-1', cssClass: 'submenu-1'}, menu => menu
            .addMenuItem({label: 'label-1', onSelect: noop})
            .addMenuItem({label: 'label-2', onSelect: noop})
            .addMenuItem({label: 'label-3', onSelect: noop})), {injector: TestBed.inject(Injector)},
        );
        await fixture.whenStable();

        // Open menu.
        const anchor = {x: document.documentElement.clientWidth / 2, y: document.documentElement.clientHeight};
        TestBed.inject(SciMenuService).open('menu:testee', {anchor});
        const menu = new MenuPO(fixture);
        const submenu = await menu.openSubMenu({cssClass: 'submenu-1'});

        // Expect menu.
        await expectAsync(menu).toHaveMenuPosition({
          anchor: anchor,
          menuX: 'left',
          menuY: 'bottom',
        });

        // Expect submenu.
        const subMenuAnchor = menu.item({cssClass: 'submenu-1'}).nativeElement;
        await expectAsync(submenu).toHaveMenuPosition({
          anchor: subMenuAnchor,
          anchorX: 'right',
          anchorY: 'bottom',
          anchorYOffset: SUB_MENU_VERTICAL_OFFSET,
          menuX: 'left',
          menuY: 'bottom',
        });
      });
    });

    describe('Anchor HTML Element', () => {

      it('should position menu (html element center)', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({label: 'label-1', onSelect: noop})
          .addMenuItem({label: 'label-2', onSelect: noop})
          .addMenuItem({label: 'label-3', onSelect: noop})
          .addMenu({label: 'submenu-1', cssClass: 'submenu-1'}, menu => menu
            .addMenuItem({label: 'label-1', onSelect: noop})
            .addMenuItem({label: 'label-2', onSelect: noop})
            .addMenuItem({label: 'label-3', onSelect: noop})), {injector: TestBed.inject(Injector)},
        );
        await fixture.whenStable();

        // Create anchor.
        const anchor = fixture.componentInstance.createAnchorElement('div', {
          position: 'absolute',
          width: '50px',
          height: '20px',
          top: '50%',
          left: '50%',
        });

        // Open menu.
        TestBed.inject(SciMenuService).open('menu:testee', {anchor});
        const menu = new MenuPO(fixture);
        const submenu = await menu.openSubMenu({cssClass: 'submenu-1'});

        // Expect menu.
        await expectAsync(menu).toHaveMenuPosition({
          anchor: anchor,
          anchorX: 'left',
          anchorY: 'bottom',
          menuX: 'left',
          menuY: 'top',
        });

        // Expect submenu.
        const subMenuAnchor = menu.item({cssClass: 'submenu-1'}).nativeElement;
        await expectAsync(submenu).toHaveMenuPosition({
          anchor: subMenuAnchor,
          anchorX: 'right',
          anchorY: 'top',
          anchorYOffset: -SUB_MENU_VERTICAL_OFFSET,
          menuX: 'left',
          menuY: 'top',
        });
      });

      it('should position menu (html element top-right)', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({label: 'label-1', onSelect: noop})
          .addMenuItem({label: 'label-2', onSelect: noop})
          .addMenuItem({label: 'label-3', onSelect: noop})
          .addMenu({label: 'submenu-1', cssClass: 'submenu-1'}, menu => menu
            .addMenuItem({label: 'label-1', onSelect: noop})
            .addMenuItem({label: 'label-2', onSelect: noop})
            .addMenuItem({label: 'label-3', onSelect: noop})), {injector: TestBed.inject(Injector)},
        );
        await fixture.whenStable();

        // Create anchor.
        const anchor = fixture.componentInstance.createAnchorElement('div', {
          position: 'absolute',
          width: '50px',
          height: '20px',
          top: '0',
          right: '0',
        });

        // Open menu.
        TestBed.inject(SciMenuService).open('menu:testee', {anchor});
        const menu = new MenuPO(fixture);
        const submenu = await menu.openSubMenu({cssClass: 'submenu-1'});

        // Expect menu.
        await expectAsync(menu).toHaveMenuPosition({
          anchor: anchor,
          anchorX: 'right',
          anchorY: 'bottom',
          menuX: 'right',
          menuY: 'top',
        });

        // Expect submenu.
        const subMenuAnchor = menu.item({cssClass: 'submenu-1'}).nativeElement;
        await expectAsync(submenu).toHaveMenuPosition({
          anchor: subMenuAnchor,
          anchorX: 'left',
          anchorY: 'top',
          anchorYOffset: -SUB_MENU_VERTICAL_OFFSET,
          menuX: 'right',
          menuY: 'top',
        });
      });

      it('should position menu (html element near top-right)', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({label: 'label-1', onSelect: noop})
          .addMenuItem({label: 'label-2', onSelect: noop})
          .addMenuItem({label: 'label-3', onSelect: noop})
          .addMenu({label: 'submenu-1', cssClass: 'submenu-1'}, menu => menu
            .addMenuItem({label: 'label-1', onSelect: noop})
            .addMenuItem({label: 'label-2', onSelect: noop})
            .addMenuItem({label: 'label-3', onSelect: noop})), {injector: TestBed.inject(Injector)},
        );
        await fixture.whenStable();

        // Create anchor.
        const anchor = fixture.componentInstance.createAnchorElement('div', {
          position: 'absolute',
          width: '50px',
          height: '20px',
          top: '50px',
          right: '50px',
        });

        // Open menu.
        TestBed.inject(SciMenuService).open('menu:testee', {anchor});
        const menu = new MenuPO(fixture);
        const submenu = await menu.openSubMenu({cssClass: 'submenu-1'});

        // Expect menu.
        await expectAsync(menu).toHaveMenuPosition({
          anchor: anchor,
          anchorX: 'right',
          anchorY: 'bottom',
          anchorXOffset: 50,
          menuX: 'right',
          menuY: 'top',
        });

        // Expect submenu.
        const subMenuAnchor = menu.item({cssClass: 'submenu-1'}).nativeElement;
        await expectAsync(submenu).toHaveMenuPosition({
          anchor: subMenuAnchor,
          anchorX: 'left',
          anchorY: 'top',
          anchorYOffset: -SUB_MENU_VERTICAL_OFFSET,
          menuX: 'right',
          menuY: 'top',
        });
      });

      it('should position menu (html element right)', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({label: 'label-1', onSelect: noop})
          .addMenuItem({label: 'label-2', onSelect: noop})
          .addMenuItem({label: 'label-3', onSelect: noop})
          .addMenu({label: 'submenu-1', cssClass: 'submenu-1'}, menu => menu
            .addMenuItem({label: 'label-1', onSelect: noop})
            .addMenuItem({label: 'label-2', onSelect: noop})
            .addMenuItem({label: 'label-3', onSelect: noop})), {injector: TestBed.inject(Injector)},
        );
        await fixture.whenStable();

        // Create anchor.
        const anchor = fixture.componentInstance.createAnchorElement('div', {
          position: 'absolute',
          width: '50px',
          height: '20px',
          top: '50%',
          right: '0',
        });

        // Open menu.
        TestBed.inject(SciMenuService).open('menu:testee', {anchor});
        const menu = new MenuPO(fixture);
        const submenu = await menu.openSubMenu({cssClass: 'submenu-1'});

        // Expect menu.
        await expectAsync(menu).toHaveMenuPosition({
          anchor: anchor,
          anchorX: 'right',
          anchorY: 'bottom',
          menuX: 'right',
          menuY: 'top',
        });

        // Expect submenu.
        const subMenuAnchor = menu.item({cssClass: 'submenu-1'}).nativeElement;
        await expectAsync(submenu).toHaveMenuPosition({
          anchor: subMenuAnchor,
          anchorX: 'left',
          anchorY: 'top',
          anchorYOffset: -SUB_MENU_VERTICAL_OFFSET,
          menuX: 'right',
          menuY: 'top',
        });
      });

      it('should position menu (html element near right)', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({label: 'label-1', onSelect: noop})
          .addMenuItem({label: 'label-2', onSelect: noop})
          .addMenuItem({label: 'label-3', onSelect: noop})
          .addMenu({label: 'submenu-1', cssClass: 'submenu-1'}, menu => menu
            .addMenuItem({label: 'label-1', onSelect: noop})
            .addMenuItem({label: 'label-2', onSelect: noop})
            .addMenuItem({label: 'label-3', onSelect: noop})), {injector: TestBed.inject(Injector)},
        );
        await fixture.whenStable();

        // Create anchor.
        const anchor = fixture.componentInstance.createAnchorElement('div', {
          position: 'absolute',
          width: '50px',
          height: '20px',
          top: '50%',
          right: '50px',
        });

        // Open menu.
        TestBed.inject(SciMenuService).open('menu:testee', {anchor});
        const menu = new MenuPO(fixture);
        const submenu = await menu.openSubMenu({cssClass: 'submenu-1'});

        // Expect menu.
        await expectAsync(menu).toHaveMenuPosition({
          anchor: anchor,
          anchorX: 'right',
          anchorY: 'bottom',
          anchorXOffset: 50,
          menuX: 'right',
          menuY: 'top',
        });

        // Expect submenu.
        const subMenuAnchor = menu.item({cssClass: 'submenu-1'}).nativeElement;
        await expectAsync(submenu).toHaveMenuPosition({
          anchor: subMenuAnchor,
          anchorX: 'left',
          anchorY: 'top',
          anchorYOffset: -SUB_MENU_VERTICAL_OFFSET,
          menuX: 'right',
          menuY: 'top',
        });
      });

      it('should position menu (html element bottom-right)', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({label: 'label-1', onSelect: noop})
          .addMenuItem({label: 'label-2', onSelect: noop})
          .addMenuItem({label: 'label-3', onSelect: noop})
          .addMenu({label: 'submenu-1', cssClass: 'submenu-1'}, menu => menu
            .addMenuItem({label: 'label-1', onSelect: noop})
            .addMenuItem({label: 'label-2', onSelect: noop})
            .addMenuItem({label: 'label-3', onSelect: noop})), {injector: TestBed.inject(Injector)},
        );
        await fixture.whenStable();

        // Create anchor.
        const anchor = fixture.componentInstance.createAnchorElement('div', {
          position: 'absolute',
          width: '50px',
          height: '20px',
          bottom: '0',
          right: '0',
        });

        // Open menu.
        TestBed.inject(SciMenuService).open('menu:testee', {anchor});
        const menu = new MenuPO(fixture);
        const submenu = await menu.openSubMenu({cssClass: 'submenu-1'});

        // Expect menu.
        await expectAsync(menu).toHaveMenuPosition({
          anchor: anchor,
          anchorX: 'right',
          anchorY: 'top',
          menuX: 'right',
          menuY: 'bottom',
        });

        // Expect submenu.
        const subMenuAnchor = menu.item({cssClass: 'submenu-1'}).nativeElement;
        await expectAsync(submenu).toHaveMenuPosition({
          anchor: subMenuAnchor,
          anchorX: 'left',
          anchorY: 'bottom',
          anchorYOffset: SUB_MENU_VERTICAL_OFFSET,
          menuX: 'right',
          menuY: 'bottom',
        });
      });

      it('should position menu (html element near bottom-right)', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({label: 'label-1', onSelect: noop})
          .addMenuItem({label: 'label-2', onSelect: noop})
          .addMenuItem({label: 'label-3', onSelect: noop})
          .addMenu({label: 'submenu-1', cssClass: 'submenu-1'}, menu => menu
            .addMenuItem({label: 'label-1', onSelect: noop})
            .addMenuItem({label: 'label-2', onSelect: noop})
            .addMenuItem({label: 'label-3', onSelect: noop})), {injector: TestBed.inject(Injector)},
        );
        await fixture.whenStable();

        // Create anchor.
        const anchor = fixture.componentInstance.createAnchorElement('div', {
          position: 'absolute',
          width: '50px',
          height: '20px',
          bottom: '50px',
          right: '50px',
        });

        // Open menu.
        TestBed.inject(SciMenuService).open('menu:testee', {anchor});
        const menu = new MenuPO(fixture);
        const submenu = await menu.openSubMenu({cssClass: 'submenu-1'});

        // Expect menu.
        await expectAsync(menu).toHaveMenuPosition({
          anchor: anchor,
          anchorX: 'right',
          anchorY: 'top',
          anchorXOffset: 50,
          menuX: 'right',
          menuY: 'bottom',
        });

        // Expect submenu.
        const subMenuAnchor = menu.item({cssClass: 'submenu-1'}).nativeElement;
        await expectAsync(submenu).toHaveMenuPosition({
          anchor: subMenuAnchor,
          anchorX: 'left',
          anchorY: 'top',
          anchorYOffset: -SUB_MENU_VERTICAL_OFFSET,
          menuX: 'right',
          menuY: 'top',
        });
      });

      it('should position menu (html element top-left)', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({label: 'label-1', onSelect: noop})
          .addMenuItem({label: 'label-2', onSelect: noop})
          .addMenuItem({label: 'label-3', onSelect: noop})
          .addMenu({label: 'submenu-1', cssClass: 'submenu-1'}, menu => menu
            .addMenuItem({label: 'label-1', onSelect: noop})
            .addMenuItem({label: 'label-2', onSelect: noop})
            .addMenuItem({label: 'label-3', onSelect: noop})), {injector: TestBed.inject(Injector)},
        );
        await fixture.whenStable();

        // Create anchor.
        const anchor = fixture.componentInstance.createAnchorElement('div', {
          position: 'absolute',
          width: '50px',
          height: '20px',
          top: '0',
          left: '0',
        });

        // Open menu.
        TestBed.inject(SciMenuService).open('menu:testee', {anchor});
        const menu = new MenuPO(fixture);
        const submenu = await menu.openSubMenu({cssClass: 'submenu-1'});

        // Expect menu.
        await expectAsync(menu).toHaveMenuPosition({
          anchor: anchor,
          anchorX: 'left',
          anchorY: 'bottom',
          menuX: 'left',
          menuY: 'top',
        });

        // Expect submenu.
        const subMenuAnchor = menu.item({cssClass: 'submenu-1'}).nativeElement;
        await expectAsync(submenu).toHaveMenuPosition({
          anchor: subMenuAnchor,
          anchorX: 'right',
          anchorY: 'top',
          anchorYOffset: -SUB_MENU_VERTICAL_OFFSET,
          menuX: 'left',
          menuY: 'top',
        });
      });

      it('should position menu (html element near top-left)', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({label: 'label-1', onSelect: noop})
          .addMenuItem({label: 'label-2', onSelect: noop})
          .addMenuItem({label: 'label-3', onSelect: noop})
          .addMenu({label: 'submenu-1', cssClass: 'submenu-1'}, menu => menu
            .addMenuItem({label: 'label-1', onSelect: noop})
            .addMenuItem({label: 'label-2', onSelect: noop})
            .addMenuItem({label: 'label-3', onSelect: noop})), {injector: TestBed.inject(Injector)},
        );
        await fixture.whenStable();

        // Create anchor.
        const anchor = fixture.componentInstance.createAnchorElement('div', {
          position: 'absolute',
          width: '50px',
          height: '20px',
          top: '50px',
          left: '50px',
        });

        // Open menu.
        TestBed.inject(SciMenuService).open('menu:testee', {anchor});
        const menu = new MenuPO(fixture);
        const submenu = await menu.openSubMenu({cssClass: 'submenu-1'});

        // Expect menu.
        await expectAsync(menu).toHaveMenuPosition({
          anchor: anchor,
          anchorX: 'left',
          anchorY: 'bottom',
          menuX: 'left',
          menuY: 'top',
        });

        // Expect submenu.
        const subMenuAnchor = menu.item({cssClass: 'submenu-1'}).nativeElement;
        await expectAsync(submenu).toHaveMenuPosition({
          anchor: subMenuAnchor,
          anchorX: 'right',
          anchorY: 'top',
          anchorYOffset: -SUB_MENU_VERTICAL_OFFSET,
          menuX: 'left',
          menuY: 'top',
        });
      });

      it('should position menu (html element left)', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({label: 'label-1', onSelect: noop})
          .addMenuItem({label: 'label-2', onSelect: noop})
          .addMenuItem({label: 'label-3', onSelect: noop})
          .addMenu({label: 'submenu-1', cssClass: 'submenu-1'}, menu => menu
            .addMenuItem({label: 'label-1', onSelect: noop})
            .addMenuItem({label: 'label-2', onSelect: noop})
            .addMenuItem({label: 'label-3', onSelect: noop})), {injector: TestBed.inject(Injector)},
        );
        await fixture.whenStable();

        // Create anchor.
        const anchor = fixture.componentInstance.createAnchorElement('div', {
          position: 'absolute',
          width: '50px',
          height: '20px',
          top: '50%',
          left: '0',
        });

        // Open menu.
        TestBed.inject(SciMenuService).open('menu:testee', {anchor});
        const menu = new MenuPO(fixture);
        const submenu = await menu.openSubMenu({cssClass: 'submenu-1'});

        // Expect menu.
        await expectAsync(menu).toHaveMenuPosition({
          anchor: anchor,
          anchorX: 'left',
          anchorY: 'bottom',
          menuX: 'left',
          menuY: 'top',
        });

        // Expect submenu.
        const subMenuAnchor = menu.item({cssClass: 'submenu-1'}).nativeElement;
        await expectAsync(submenu).toHaveMenuPosition({
          anchor: subMenuAnchor,
          anchorX: 'right',
          anchorY: 'top',
          anchorYOffset: -SUB_MENU_VERTICAL_OFFSET,
          menuX: 'left',
          menuY: 'top',
        });
      });

      it('should position menu (html element bottom-left)', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({label: 'label-1', onSelect: noop})
          .addMenuItem({label: 'label-2', onSelect: noop})
          .addMenuItem({label: 'label-3', onSelect: noop})
          .addMenu({label: 'submenu-1', cssClass: 'submenu-1'}, menu => menu
            .addMenuItem({label: 'label-1', onSelect: noop})
            .addMenuItem({label: 'label-2', onSelect: noop})
            .addMenuItem({label: 'label-3', onSelect: noop})), {injector: TestBed.inject(Injector)},
        );
        await fixture.whenStable();

        // Create anchor.
        const anchor = fixture.componentInstance.createAnchorElement('div', {
          position: 'absolute',
          width: '50px',
          height: '20px',
          bottom: '0',
          left: '0',
        });

        // Open menu.
        TestBed.inject(SciMenuService).open('menu:testee', {anchor});
        const menu = new MenuPO(fixture);
        const submenu = await menu.openSubMenu({cssClass: 'submenu-1'});

        // Expect menu.
        await expectAsync(menu).toHaveMenuPosition({
          anchor: anchor,
          anchorX: 'left',
          anchorY: 'top',
          menuX: 'left',
          menuY: 'bottom',
        });

        // Expect submenu.
        const subMenuAnchor = menu.item({cssClass: 'submenu-1'}).nativeElement;
        await expectAsync(submenu).toHaveMenuPosition({
          anchor: subMenuAnchor,
          anchorX: 'right',
          anchorY: 'bottom',
          anchorYOffset: SUB_MENU_VERTICAL_OFFSET,
          menuX: 'left',
          menuY: 'bottom',
        });
      });

      it('should position menu (html element near bottom-left)', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({label: 'label-1', onSelect: noop})
          .addMenuItem({label: 'label-2', onSelect: noop})
          .addMenuItem({label: 'label-3', onSelect: noop})
          .addMenu({label: 'submenu-1', cssClass: 'submenu-1'}, menu => menu
            .addMenuItem({label: 'label-1', onSelect: noop})
            .addMenuItem({label: 'label-2', onSelect: noop})
            .addMenuItem({label: 'label-3', onSelect: noop})), {injector: TestBed.inject(Injector)},
        );
        await fixture.whenStable();

        // Create anchor.
        const anchor = fixture.componentInstance.createAnchorElement('div', {
          position: 'absolute',
          width: '50px',
          height: '20px',
          bottom: '50px',
          left: '50px',
        });

        // Open menu.
        TestBed.inject(SciMenuService).open('menu:testee', {anchor});
        const menu = new MenuPO(fixture);
        const submenu = await menu.openSubMenu({cssClass: 'submenu-1'});

        // Expect menu.
        await expectAsync(menu).toHaveMenuPosition({
          anchor: anchor,
          anchorX: 'left',
          anchorY: 'top',
          menuX: 'left',
          menuY: 'bottom',
        });

        // Expect submenu.
        const subMenuAnchor = menu.item({cssClass: 'submenu-1'}).nativeElement;
        await expectAsync(submenu).toHaveMenuPosition({
          anchor: subMenuAnchor,
          anchorX: 'right',
          anchorY: 'top',
          anchorYOffset: -SUB_MENU_VERTICAL_OFFSET,
          menuX: 'left',
          menuY: 'top',
        });
      });

      it('should position menu (html element top)', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({label: 'label-1', onSelect: noop})
          .addMenuItem({label: 'label-2', onSelect: noop})
          .addMenuItem({label: 'label-3', onSelect: noop})
          .addMenu({label: 'submenu-1', cssClass: 'submenu-1'}, menu => menu
            .addMenuItem({label: 'label-1', onSelect: noop})
            .addMenuItem({label: 'label-2', onSelect: noop})
            .addMenuItem({label: 'label-3', onSelect: noop})), {injector: TestBed.inject(Injector)},
        );
        await fixture.whenStable();

        // Create anchor.
        const anchor = fixture.componentInstance.createAnchorElement('div', {
          position: 'absolute',
          width: '50px',
          height: '20px',
          top: '0',
          left: '50%',
        });

        // Open menu.
        TestBed.inject(SciMenuService).open('menu:testee', {anchor});
        const menu = new MenuPO(fixture);
        const submenu = await menu.openSubMenu({cssClass: 'submenu-1'});

        // Expect menu.
        await expectAsync(menu).toHaveMenuPosition({
          anchor: anchor,
          anchorX: 'left',
          anchorY: 'bottom',
          menuX: 'left',
          menuY: 'top',
        });

        // Expect submenu.
        const subMenuAnchor = menu.item({cssClass: 'submenu-1'}).nativeElement;
        await expectAsync(submenu).toHaveMenuPosition({
          anchor: subMenuAnchor,
          anchorX: 'right',
          anchorY: 'top',
          anchorYOffset: -SUB_MENU_VERTICAL_OFFSET,
          menuX: 'left',
          menuY: 'top',
        });
      });

      it('should position menu (html element bottom)', async () => {
        TestBed.configureTestingModule({
          providers: [
            {provide: ComponentFixtureAutoDetect, useValue: true},
          ],
        });

        const fixture = TestBed.createComponent(SpecRootComponent);

        // Contribute to menu.
        contributeMenu('menu:testee', menu => menu
          .addMenuItem({label: 'label-1', onSelect: noop})
          .addMenuItem({label: 'label-2', onSelect: noop})
          .addMenuItem({label: 'label-3', onSelect: noop})
          .addMenu({label: 'submenu-1', cssClass: 'submenu-1'}, menu => menu
            .addMenuItem({label: 'label-1', onSelect: noop})
            .addMenuItem({label: 'label-2', onSelect: noop})
            .addMenuItem({label: 'label-3', onSelect: noop})), {injector: TestBed.inject(Injector)},
        );
        await fixture.whenStable();

        // Create anchor.
        const anchor = fixture.componentInstance.createAnchorElement('div', {
          position: 'absolute',
          width: '50px',
          height: '20px',
          bottom: '0',
          left: '50%',
        });

        // Open menu.
        TestBed.inject(SciMenuService).open('menu:testee', {anchor});
        const menu = new MenuPO(fixture);
        const submenu = await menu.openSubMenu({cssClass: 'submenu-1'});

        // Expect menu.
        await expectAsync(menu).toHaveMenuPosition({
          anchor: anchor,
          anchorX: 'left',
          anchorY: 'top',
          menuX: 'left',
          menuY: 'bottom',
        });

        // Expect submenu.
        const subMenuAnchor = menu.item({cssClass: 'submenu-1'}).nativeElement;
        await expectAsync(submenu).toHaveMenuPosition({
          anchor: subMenuAnchor,
          anchorX: 'right',
          anchorY: 'bottom',
          anchorYOffset: SUB_MENU_VERTICAL_OFFSET,
          menuX: 'left',
          menuY: 'bottom',
        });
      });
    });
  });

  describe('Menu Filtering', () => {

    const menuFactoryFn: SciMenuFactoryFn = menu => menu
      // ========== TOP LEVEL (simple + overlapping) ==========
      .addMenuItem({label: 'Open', onSelect: noop})
      .addMenuItem({label: 'Open File', onSelect: noop})
      .addMenuItem({label: 'Open Folder', onSelect: noop})
      .addMenuItem({label: 'Close', onSelect: noop})
      .addMenuItem({label: 'Save', onSelect: noop})

      // ========== FILE OPERATIONS (branch A) ==========
      .addMenu({label: 'File', cssClass: 'file'}, menu => menu
        .addMenuItem({label: 'New File', onSelect: noop})
        .addMenuItem({label: 'Open Recent', onSelect: noop})
        .addMenuItem({label: 'Save As', onSelect: noop})
        .addMenuItem({label: 'Close File', onSelect: noop})

        // nested overlap zone
        .addMenu({label: 'Recent', cssClass: 'recent'}, menu => menu
          .addMenuItem({label: 'project-alpha', onSelect: noop})
          .addMenuItem({label: 'project-beta', onSelect: noop})
          .addMenuItem({label: 'open-log.txt', onSelect: noop}),
        ),
      )

      // ========== EDIT (branch B, shared terms like "Copy") ==========
      .addMenu({label: 'Edit'}, menu => menu
        .addMenuItem({label: 'Undo', onSelect: noop})
        .addMenuItem({label: 'Redo', onSelect: noop})
        .addMenuItem({label: 'Copy', onSelect: noop})
        .addMenuItem({label: 'Cut', onSelect: noop})
        .addMenuItem({label: 'Paste', onSelect: noop})

        .addMenu({label: 'Clipboard'}, menu => menu
          .addMenuItem({label: 'Copy Special', onSelect: noop})
          .addMenuItem({label: 'Paste Without Formatting', onSelect: noop})
          .addMenuItem({label: 'Clear Clipboard', onSelect: noop}),
        ),
      )

      // ========== SEARCH (heavy overlap domain) ==========
      .addMenu({label: 'Search', cssClass: 'search'}, menu => menu
        .addMenuItem({label: 'Find', onSelect: noop})
        .addMenuItem({label: 'Find in Files', onSelect: noop})
        .addMenuItem({label: 'Replace', onSelect: noop})

        .addMenu({label: 'Find'}, menu => menu
          .addMenuItem({label: 'Find Next', onSelect: noop})
          .addMenuItem({label: 'Find Previous', onSelect: noop})
          .addMenuItem({label: 'Find All References', onSelect: noop}),
        ),
      )

      // ========== SETTINGS (case + substring + nested matching) ==========
      .addMenu({label: 'Settings'}, menu => menu
        .addMenuItem({label: 'Settings', onSelect: noop})
        .addMenuItem({label: 'User Settings', onSelect: noop})
        .addMenuItem({label: 'Workspace Settings', onSelect: noop})
        .addMenuItem({label: 'Reset Settings', onSelect: noop})

        .addMenu({label: 'Advanced Settings'}, menu => menu
          .addMenuItem({label: 'Editor Settings', onSelect: noop})
          .addMenuItem({label: 'System Settings', onSelect: noop})
          .addMenuItem({label: 'Reset Layout', onSelect: noop}),
        ),
      )

      // ========== GIT (deep nesting + hierarchical filtering) ==========
      .addMenu({label: 'Git', cssClass: 'git'}, menu => menu
        .addMenuItem({label: 'Commit', onSelect: noop})
        .addMenuItem({label: 'Push', onSelect: noop})
        .addMenuItem({label: 'Pull', onSelect: noop})

        .addMenu({label: 'Branches', cssClass: 'branches'}, menu => menu
          .addMenuItem({label: 'Create Branch', onSelect: noop})
          .addMenuItem({label: 'Delete Branch', onSelect: noop})
          .addMenuItem({label: 'Checkout Branch', onSelect: noop})

          .addMenu({label: 'Remote', cssClass: 'remote'}, menu => menu
            .addMenuItem({label: 'origin/main', onSelect: noop})
            .addMenuItem({label: 'origin/feature/open-ui', onSelect: noop})
            .addMenuItem({label: 'origin/fix-copy-bug', onSelect: noop}),
          ),
        ),
      )

      // ========== MIXED EDGE CASES ==========
      .addMenu({label: 'Mixed Case', cssClass: 'mixed-case'}, menu => menu
        .addMenuItem({label: 'alpha', onSelect: noop})
        .addMenuItem({label: 'Alpha', onSelect: noop})
        .addMenuItem({label: 'ALPHA', onSelect: noop})
        .addMenuItem({label: 'alpha-beta', onSelect: noop})
        .addMenuItem({label: 'AlphaBeta', onSelect: noop})

        .addMenu({label: 'alpha', cssClass: 'alpha'}, menu => menu
          .addMenuItem({label: 'alpha child', onSelect: noop})
          .addMenuItem({label: 'beta child', onSelect: noop}),
        ),
      )

      // ========== ISOLATED BRANCH (for negative tests) ==========
      .addMenu({label: 'Isolated'}, menu => menu
        .addMenuItem({label: 'zzz-should-not-match-often', onSelect: noop})
        .addMenuItem({label: 'qwerty-only', onSelect: noop}),
      );

    it('should match basic: "open"', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menuFactoryFn, {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {filter: true, anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Filter: open
      menu.filterMenuItems('open');

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu-item',
          label: 'Open',
        },
        {
          type: 'menu-item',
          label: 'Open File',
        },
        {
          type: 'menu-item',
          label: 'Open Folder',
        },
        {
          type: 'menu',
          label: 'File',
        },
        {
          type: 'menu',
          label: 'Git',
        },
      ]);

      // Open File -> Recent.
      const fileMenu = await menu.openSubMenu({cssClass: 'file'});
      await fileMenu.openSubMenu({cssClass: 'recent'});

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu-item',
          label: 'Open',
        },
        {
          type: 'menu-item',
          label: 'Open File',
        },
        {
          type: 'menu-item',
          label: 'Open Folder',
        },
        {
          type: 'menu',
          label: 'File',
          children: [
            {
              type: 'menu-item',
              label: 'Open Recent',
            },
            {
              type: 'menu',
              label: 'Recent',
              children: [
                {
                  type: 'menu-item',
                  label: 'open-log.txt',
                },
              ],
            },
          ],
        },
        {
          type: 'menu',
          label: 'Git',
        },
      ]);

      // Open Git -> Branches -> Remote.
      const gitMenu = await menu.openSubMenu({cssClass: 'git'});
      const branchesMenu = await gitMenu.openSubMenu({cssClass: 'branches'});
      await branchesMenu.openSubMenu({cssClass: 'remote'});

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu-item',
          label: 'Open',
        },
        {
          type: 'menu-item',
          label: 'Open File',
        },
        {
          type: 'menu-item',
          label: 'Open Folder',
        },
        {
          type: 'menu',
          label: 'File',
        },
        {
          type: 'menu',
          label: 'Git',
          children: [
            {
              type: 'menu',
              label: 'Branches',
              children: [
                {
                  type: 'menu',
                  label: 'Remote',
                  children: [
                    {
                      type: 'menu-item',
                      label: 'origin/feature/open-ui',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]);
    });

    it('should match partial: "fil"', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menuFactoryFn, {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {filter: true, anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Filter: fil
      menu.filterMenuItems('fil');

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu-item',
          label: 'Open File',
        },
        {
          type: 'menu',
          label: 'File',
        },
        {
          type: 'menu',
          label: 'Search',
        },
      ]);

      // Open File.
      await menu.openSubMenu({cssClass: 'file'});

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu-item',
          label: 'Open File',
        },
        {
          type: 'menu',
          label: 'File',
          children: [
            {
              type: 'menu-item',
              label: 'New File',
            },
            {
              type: 'menu-item',
              label: 'Close File',
            },
          ],
        },
        {
          type: 'menu',
          label: 'Search',
        },
      ]);

      // Open Search.
      await menu.openSubMenu({cssClass: 'search'});

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu-item',
          label: 'Open File',
        },
        {
          type: 'menu',
          label: 'File',
        },
        {
          type: 'menu',
          label: 'Search',
          children: [
            {
              type: 'menu-item',
              label: 'Find in Files',
            },
          ],
        },
      ]);
    });

    it('should match case insensitive: "ALPHA"', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menuFactoryFn, {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {filter: true, anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Filter: ALPHA
      menu.filterMenuItems('ALPHA');

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu',
          label: 'File',
        },
        {
          type: 'menu',
          label: 'Mixed Case',
        },
      ]);

      // Open File -> Recent.
      const fileMenu = await menu.openSubMenu({cssClass: 'file'});
      await fileMenu.openSubMenu({cssClass: 'recent'});

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu',
          label: 'File',
          children: [
            {
              type: 'menu',
              label: 'Recent',
              children: [
                {
                  type: 'menu-item',
                  label: 'project-alpha',
                },
              ],
            },
          ],
        },
        {
          type: 'menu',
          label: 'Mixed Case',
        },
      ]);

      // Open Mixed Case -> alpha.
      const mixedCaseMenu = await menu.openSubMenu({cssClass: 'mixed-case'});
      await mixedCaseMenu.openSubMenu({cssClass: 'alpha'});

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu',
          label: 'File',
        },
        {
          type: 'menu',
          label: 'Mixed Case',
          children: [
            {
              type: 'menu-item',
              label: 'alpha',
            },
            {
              type: 'menu-item',
              label: 'Alpha',
            },
            {
              type: 'menu-item',
              label: 'ALPHA',
            },
            {
              type: 'menu-item',
              label: 'alpha-beta',
            },
            {
              type: 'menu-item',
              label: 'AlphaBeta',
            },
            {
              type: 'menu',
              label: 'alpha',
              children: [
                {
                  type: 'menu-item',
                  label: 'alpha child',
                },
              ],
            },
          ],
        },
      ]);
    });

    it('should match case insensitive: "alpha"', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menuFactoryFn, {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {filter: true, anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Filter: alpha
      menu.filterMenuItems('alpha');

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu',
          label: 'File',
        },
        {
          type: 'menu',
          label: 'Mixed Case',
        },
      ]);

      // Open File -> Recent.
      const fileMenu = await menu.openSubMenu({cssClass: 'file'});
      await fileMenu.openSubMenu({cssClass: 'recent'});

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu',
          label: 'File',
          children: [
            {
              type: 'menu',
              label: 'Recent',
              children: [
                {
                  type: 'menu-item',
                  label: 'project-alpha',
                },
              ],
            },
          ],
        },
        {
          type: 'menu',
          label: 'Mixed Case',
        },
      ]);

      // Open Mixed Case -> alpha.
      const mixedCaseMenu = await menu.openSubMenu({cssClass: 'mixed-case'});
      await mixedCaseMenu.openSubMenu({cssClass: 'alpha'});

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu',
          label: 'File',
        },
        {
          type: 'menu',
          label: 'Mixed Case',
          children: [
            {
              type: 'menu-item',
              label: 'alpha',
            },
            {
              type: 'menu-item',
              label: 'Alpha',
            },
            {
              type: 'menu-item',
              label: 'ALPHA',
            },
            {
              type: 'menu-item',
              label: 'alpha-beta',
            },
            {
              type: 'menu-item',
              label: 'AlphaBeta',
            },
            {
              type: 'menu',
              label: 'alpha',
              children: [
                {
                  type: 'menu-item',
                  label: 'alpha child',
                },
              ],
            },
          ],
        },
      ]);
    });

    it('should match negative case: "should-match-nothing"', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menuFactoryFn, {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {filter: true, anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Filter: should-match-nothing
      menu.filterMenuItems('should-match-nothing');
      await new Promise(resolve => requestIdleCallback(resolve));

      // Expect not found message to match.
      expect(menu.noItemsFoundMessage!.nativeElement.innerText).toEqual(NO_ITEMS_FOUND);
    });

    it('should match negative case: "\\/().+*"', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menuFactoryFn, {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {filter: true, anchor: {x: 0, y: 0}});
      await fixture.whenStable();

      // Filter: \/().+*
      const menu = new MenuPO(fixture);
      menu.filterMenuItems('\\/().+*');
      await new Promise(resolve => requestIdleCallback(resolve));

      // Expect not found message to match.
      expect(menu.noItemsFoundMessage!.nativeElement.innerText).toEqual(NO_ITEMS_FOUND);
    });

    it('should open collapsed group when filtering', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addGroup({collapsible: {collapsed: true}}, group => group.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {filter: true, anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'group',
          collapsible: {collapsed: true},
          children: [],
        },
      ]);

      // Filter menu items.
      menu.filterMenuItems('label');

      // Expect group not to be collapsed.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'group',
          collapsible: {collapsed: false},
          children: [
            {
              type: 'menu-item',
              label: 'label',
            },
          ],
        },
      ]);
    });

    it('should filter in submenu', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenu({label: 'File', cssClass: 'file', menu: {filter: true}}, menu => menu
          .addMenuItem({label: 'New File', onSelect: noop})
          .addMenuItem({label: 'Open Recent', onSelect: noop})
          .addMenuItem({label: 'Save As', onSelect: noop})
          .addMenuItem({label: 'Close File', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {filter: true, anchor: {x: 0, y: 0}});
      await fixture.whenStable();
      const menu = new MenuPO(fixture);

      // Open submenu.
      const submenu = await menu.openSubMenu({cssClass: 'file'});

      // Filter in submenu.
      submenu.filterMenuItems('close');

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu',
          label: 'File',
          children: [
            {
              type: 'menu-item',
              label: 'Close File',
            },
          ],
        },
      ]);
    });

    it('should filter in menu and submenu', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenu({label: 'File', cssClass: 'file', menu: {filter: true}}, menu => menu
          .addMenuItem({label: 'New File', onSelect: noop})
          .addMenuItem({label: 'Open Recent', onSelect: noop})
          .addMenuItem({label: 'Save As', onSelect: noop})
          .addMenuItem({label: 'Close File', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {filter: true, anchor: {x: 0, y: 0}});
      await fixture.whenStable();
      const menu = new MenuPO(fixture);

      // Filter in menu.
      menu.filterMenuItems('File');

      // Open submenu.
      const submenu = await menu.openSubMenu({cssClass: 'file'});

      // Filter in submenu.
      submenu.filterMenuItems('close');

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu',
          label: 'File',
          children: [
            {
              type: 'menu-item',
              label: 'Close File',
            },
          ],
        },
      ]);
    });

    it('should filter with custom filter', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenuItem({label: 'New File', onFilter: filter => filter === 'filter-token', onSelect: noop})
        .addMenuItem({label: 'Open Recent', onSelect: noop})
        .addMenuItem({label: 'Save As', onFilter: filter => filter === 'FILTER-TOKEN', onSelect: noop})
        .addMenuItem({label: 'Close File', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {filter: true, anchor: {x: 0, y: 0}});
      await fixture.whenStable();
      const menu = new MenuPO(fixture);

      // Filter by 'filter-token'.
      menu.filterMenuItems('filter-token');

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu-item',
          label: 'New File',
        },
      ]);

      // Filter by 'FILTER-TOKEN'.
      menu.filterMenuItems('FILTER-TOKEN');

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu-item',
          label: 'Save As',
        },
      ]);
    });
  });

  describe('Menu Contribution Position', () => {

    it('should contribute at position start', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenuItem({label: 'label-1', onSelect: noop})
        .addMenuItem({label: 'label-2', onSelect: noop})
        .addMenuItem({label: 'label-3', onSelect: noop}), {injector: TestBed.inject(Injector)});

      // Contribute to menu at position start.
      contributeMenu({location: 'menu:testee', position: 'start'}, menu => menu.addMenuItem({label: 'label-testee', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu-item',
          label: 'label-testee',
        },
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
          label: 'label-3',
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

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenuItem({label: 'label-1', onSelect: noop})
        .addMenuItem({label: 'label-2', onSelect: noop})
        .addMenuItem({label: 'label-3', onSelect: noop}), {injector: TestBed.inject(Injector)});

      // Contribute to menu at position end.
      contributeMenu({location: 'menu:testee', position: 'end'}, menu => menu.addMenuItem({label: 'label-testee', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
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
          label: 'label-3',
        },
        {
          type: 'menu-item',
          label: 'label-testee',
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

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenuItem({label: 'label-1', onSelect: noop})
        .addMenuItem({label: 'label-2', name: 'menuitem:2', onSelect: noop})
        .addMenuItem({label: 'label-3', onSelect: noop}), {injector: TestBed.inject(Injector)});

      // Contribute to menu before menuitem:2.
      contributeMenu({location: 'menu:testee', before: 'menuitem:2'}, menu => menu.addMenuItem({label: 'label-testee', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu-item',
          label: 'label-1',
        },
        {
          type: 'menu-item',
          label: 'label-testee',
        },
        {
          type: 'menu-item',
          label: 'label-2',
        },
        {
          type: 'menu-item',
          label: 'label-3',
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

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenuItem({label: 'label-1', onSelect: noop})
        .addMenuItem({label: 'label-2', name: 'menuitem:2', onSelect: noop})
        .addMenuItem({label: 'label-3', onSelect: noop}), {injector: TestBed.inject(Injector)});

      // Contribute to menu after menuitem:2.
      contributeMenu({location: 'menu:testee', after: 'menuitem:2'}, menu => menu.addMenuItem({label: 'label-testee', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
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
          label: 'label-testee',
        },
        {
          type: 'menu-item',
          label: 'label-3',
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

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenuItem({label: 'label-1', onSelect: noop})
        .addMenu({label: 'label-2', name: 'menuitem:2'}, menu => menu
          .addMenuItem({label: 'label-2', onSelect: noop}))
        .addMenuItem({label: 'label-3', onSelect: noop}), {injector: TestBed.inject(Injector)});

      // Contribute to menu before menu:2.
      contributeMenu({location: 'menu:testee', before: 'menuitem:2'}, menu => menu.addMenuItem({label: 'label-testee', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu-item',
          label: 'label-1',
        },
        {
          type: 'menu-item',
          label: 'label-testee',
        },
        {
          type: 'menu',
          label: 'label-2',
        },
        {
          type: 'menu-item',
          label: 'label-3',
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

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenuItem({label: 'label-1', onSelect: noop})
        .addMenu({name: 'menuitem:2', label: 'label-2'}, menu => menu
          .addMenuItem({label: 'label-2', onSelect: noop}))
        .addMenuItem({label: 'label-3', onSelect: noop}), {injector: TestBed.inject(Injector)});

      // Contribute to menu after menu:2.
      contributeMenu({location: 'menu:testee', after: 'menuitem:2'}, menu => menu.addMenuItem({label: 'label-testee', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu-item',
          label: 'label-1',
        },
        {
          type: 'menu',
          label: 'label-2',
        },
        {
          type: 'menu-item',
          label: 'label-testee',
        },
        {
          type: 'menu-item',
          label: 'label-3',
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

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenuItem({label: 'label-1', onSelect: noop})
        .addGroup({name: 'menu:2'}, group => group
          .addMenuItem({label: 'label-2', onSelect: noop}))
        .addMenuItem({label: 'label-3', onSelect: noop}), {injector: TestBed.inject(Injector)});

      // Contribute to menu before group menu:2.
      contributeMenu({location: 'menu:testee', before: 'menu:2'}, menu => menu.addMenuItem({label: 'label-testee', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu-item',
          label: 'label-1',
        },
        {
          type: 'menu-item',
          label: 'label-testee',
        },
        {
          type: 'group',
          children: [
            {
              type: 'menu-item',
              label: 'label-2',
            },
          ],
        },
        {
          type: 'menu-item',
          label: 'label-3',
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

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
        .addMenuItem({label: 'label-1', onSelect: noop})
        .addGroup({name: 'menu:2'}, group => group
          .addMenuItem({label: 'label-2', onSelect: noop}))
        .addMenuItem({label: 'label-3', onSelect: noop}), {injector: TestBed.inject(Injector)});

      // Contribute to menu after group menu:2.
      contributeMenu({location: 'menu:testee', after: 'menu:2'}, menu => menu.addMenuItem({label: 'label-testee', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu([
        {
          type: 'menu-item',
          label: 'label-1',
        },
        {
          type: 'group',
          children: [
            {
              type: 'menu-item',
              label: 'label-2',
            },
          ],
        },
        {
          type: 'menu-item',
          label: 'label-testee',
        },
        {
          type: 'menu-item',
          label: 'label-3',
        },
      ]);
    });
  });

  describe('Menu Size', () => {

    it('should configure menu width', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu.addMenuItem({label: 'label', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {width: '500px', anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

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

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu.addMenuItem({label: 'label', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {minWidth: '500px', anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

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

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu.addMenuItem({label: 'long label text to exceed maximum width', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {maxWidth: '200px', anchor: {x: 0, y: 0}});
      await fixture.whenStable();
      const menu = new MenuPO(fixture);

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

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu
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
        .addMenuItem({label: 'label', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {maxHeight: '200px', anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

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
  });

  describe('Menu Filter', () => {

    it('should provide filter', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu.addMenuItem({label: 'label', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      const menu = new MenuPO(fixture);

      // Open menu (omit filter option).
      TestBed.inject(SciMenuService).open('menu:testee', {anchor: {x: 0, y: 0}});
      await expectAsync(() => menu.filterInputElement).not.toBeAttached();

      // Open menu (filter=false).
      TestBed.inject(SciMenuService).open('menu:testee', {filter: false, anchor: {x: 0, y: 0}});
      await expectAsync(() => menu.filterInputElement).not.toBeAttached();

      // Open menu (filter=true).
      TestBed.inject(SciMenuService).open('menu:testee', {filter: true, anchor: {x: 0, y: 0}});
      await expectAsync(() => menu.filterInputElement).toBeAttached();
    });

    it('should provide filter placeholder', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu.addMenuItem({label: 'label', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      TestBed.inject(SciMenuService).open('menu:testee', {filter: {placeholder: 'testee-placeholder'}, anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Expect placeholder to match.
      await expectAsync(() => menu.filterInputElement).toBeAttached();
      expect(menu.filterInputElement!.nativeElement.placeholder).toEqual('testee-placeholder');
    });

    it('should provide filter notFoundMessage', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to menu.
      contributeMenu('menu:testee', menu => menu.addMenuItem({label: 'label', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu (filter notFoundText).
      TestBed.inject(SciMenuService).open('menu:testee', {filter: {notFoundMessage: 'testee-not-found-message'}, anchor: {x: 0, y: 0}});
      const menu = new MenuPO(fixture);

      // Filter to show no results.
      menu.filterMenuItems('xyz');
      await new Promise(resolve => requestIdleCallback(resolve));

      // Expect not found message to match.
      expect(menu.noItemsFoundMessage!.nativeElement.innerText).toEqual('testee-not-found-message');
    });
  });
});

@Component({
  selector: 'spec-root',
  template: ``,
})
class SpecRootComponent {

  private readonly _destroyRef = inject(DestroyRef);

  public createAnchorElement(tagName: string, styles: Partial<CSSStyleDeclaration>): HTMLElement {
    const element = document.createElement(tagName);
    Object.assign(element.style, styles);
    document.body.appendChild(element);
    this._destroyRef.onDestroy(() => element.remove());
    return element;
  }
}

@Component({
  selector: 'spec-control',
  template: 'spec-control',
})
class SpecControlComponent {
}
