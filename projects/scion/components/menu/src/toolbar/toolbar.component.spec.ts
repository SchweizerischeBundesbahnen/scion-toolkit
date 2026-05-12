/*
 * Copyright (c) 2018-2025 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, Injector, signal} from '@angular/core';
import {ComponentFixtureAutoDetect, TestBed} from '@angular/core/testing';
import {toEqualToolbarCustomMatcher} from '../testing/jasmine/matcher/to-equal-toolbar.matcher';
import {expectAsync} from '../testing/jasmine/matcher/custom-async-matchers.definition';
import {toEqualMenuCustomMatcher} from '../testing/jasmine/matcher/to-equal-menu.matcher';
import {ToolbarPO} from './toolbar.po';
import {contributeMenu} from '../menu-contribution';
import {SciToolbarComponent} from './toolbar.component';
import {MenuPO} from '../menu/menu.po';

describe('Toolbar', () => {

  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000000;
    jasmine.addAsyncMatchers(toEqualToolbarCustomMatcher);
    jasmine.addAsyncMatchers(toEqualMenuCustomMatcher);
  });

  it('should contribute to toolbar', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);

    let toolbarFactoryFunctionCallCount = 0;

    // Contribute to toolbar.
    contributeMenu('toolbar:testee', toolbar => {
      toolbarFactoryFunctionCallCount++;
      toolbar.addToolbarButton({icon: 'icon-1', onSelect: noop});
    }, {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect toolbar.
    const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
    expect(toolbarFactoryFunctionCallCount).toBe(1);
    await expectAsync(toolbar).toEqualToolbar([
      {
        type: 'menu-item',
        iconLigature: 'icon-1',
      },
    ]);

    // Contribute to toolbar again.
    contributeMenu('toolbar:testee', toolbar => toolbar.addToolbarButton({icon: 'icon-2', onSelect: noop}), {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect toolbar.
    expect(toolbarFactoryFunctionCallCount).toBe(1);
    await expectAsync(toolbar).toEqualToolbar([
      {
        type: 'menu-item',
        iconLigature: 'icon-1',
      },
      {
        type: 'menu-item',
        iconLigature: 'icon-2',
      },
    ]);
  });

  it('should contribute to toolbar group', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);

    let toolbarFactoryFunctionCallCount = 0;

    // Contribute to toolbar.
    contributeMenu('toolbar:testee', toolbar => {
      toolbarFactoryFunctionCallCount++;
      toolbar
        .addToolbarButton({icon: 'icon-1', onSelect: noop})
        .addGroup({name: 'toolbar:additions'});
    }, {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect toolbar.
    expect(toolbarFactoryFunctionCallCount).toBe(1);
    const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
    await expectAsync(toolbar).toEqualToolbar([
      {
        type: 'menu-item',
        iconLigature: 'icon-1',
      },
    ]);

    // Contribute to toolbar group.
    contributeMenu('toolbar:additions', toolbar => toolbar.addToolbarButton({icon: 'icon-2', onSelect: noop}), {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect toolbar.
    expect(toolbarFactoryFunctionCallCount).toBe(1);
    await expectAsync(toolbar).toEqualToolbar([
      {
        type: 'menu-item',
        iconLigature: 'icon-1',
      },
      {
        type: 'group',
        children: [
          {
            type: 'menu-item',
            iconLigature: 'icon-2',
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

    let toolbarFactoryFunction1CallCount = 0;
    let toolbarFactoryFunction2CallCount = 0;

    // Signal that tracks if item 2 is visible.
    const item2Visible = signal(false);

    // Contribute to toolbar (track signal).
    contributeMenu('toolbar:testee', toolbar => {
      toolbarFactoryFunction1CallCount++;
      toolbar.addToolbarButton({icon: 'icon-1', onSelect: noop});

      if (item2Visible()) {
        toolbar.addToolbarButton({icon: 'icon-2', onSelect: noop});
      }
    }, {injector: TestBed.inject(Injector)});

    // Contribute to toolbar.
    contributeMenu('toolbar:testee', toolbar => {
      toolbarFactoryFunction2CallCount++;
      toolbar.addToolbarButton({icon: 'icon-3', onSelect: noop});
    }, {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect toolbar.
    expect(toolbarFactoryFunction1CallCount).toBe(1);
    expect(toolbarFactoryFunction2CallCount).toBe(1);
    const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
    await expectAsync(toolbar).toEqualToolbar([
      {
        type: 'menu-item',
        iconLigature: 'icon-1',
      },
      {
        type: 'menu-item',
        iconLigature: 'icon-3',
      },
    ]);

    // Make item 2 visible.
    item2Visible.set(true);
    await fixture.whenStable();

    // Expect toolbar.
    expect(toolbarFactoryFunction1CallCount).toBe(2);
    expect(toolbarFactoryFunction2CallCount).toBe(1);
    await expectAsync(toolbar).toEqualToolbar([
      {
        type: 'menu-item',
        iconLigature: 'icon-1',
      },
      {
        type: 'menu-item',
        iconLigature: 'icon-2',
      },
      {
        type: 'menu-item',
        iconLigature: 'icon-3',
      },
    ]);
  });

  it('should not call toolbar factory again when tracked signals change', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);

    let toolbarFactoryFunctionCallCount = 0;

    const icon = signal('icon-1');

    // Contribute to toolbar.
    contributeMenu('toolbar:testee', toolbar => {
      toolbarFactoryFunctionCallCount++;
      toolbar.addToolbarButton({icon: icon, onSelect: noop});
    }, {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect toolbar.
    expect(toolbarFactoryFunctionCallCount).toBe(1);
    const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
    await expectAsync(toolbar).toEqualToolbar([
      {
        type: 'menu-item',
        iconLigature: 'icon-1',
      },
    ]);

    // Change signal.
    icon.set('icon-2');

    // Expect toolbar.
    expect(toolbarFactoryFunctionCallCount).toBe(1);
    await expectAsync(toolbar).toEqualToolbar([
      {
        type: 'menu-item',
        iconLigature: 'icon-2',
      },
    ]);
  });

  it('should call toolbar factory function once (multiple toolbars)', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
      teardown: {destroyAfterEach: false},
    });

    const fixture = TestBed.createComponent(SpecTwoToolbarsComponent);
    fixture.componentInstance.class1.set('testee-1');
    fixture.componentInstance.class2.set('testee-2');

    let toolbarFactoryFunction1CallCount = 0;

    // Contribute to toolbar.
    contributeMenu('toolbar:testee', toolbar => {
      toolbarFactoryFunction1CallCount++;
      toolbar.addToolbarButton({icon: 'icon', onSelect: noop});
    }, {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect toolbar.
    const toolbar1 = new ToolbarPO(fixture, {cssClass: 'testee-1'});

    expect(toolbarFactoryFunction1CallCount).toBe(1);
    await expectAsync(toolbar1).toEqualToolbar([
      {
        type: 'menu-item',
        iconLigature: 'icon',
      },
    ]);

    const toolbar2 = new ToolbarPO(fixture, {cssClass: 'testee-2'});
    await expectAsync(toolbar2).toEqualToolbar([
      {
        type: 'menu-item',
        iconLigature: 'icon',
      },
    ]);
  });

  it('should remove contribution on dispose', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);

    // Contribute to toolbar.
    const toolbarContribution = contributeMenu('toolbar:testee', toolbar => toolbar.addToolbarButton({icon: 'icon', onSelect: noop}), {injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect toolbar.
    const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
    await expectAsync(toolbar).toEqualToolbar([
      {
        type: 'menu-item',
        iconLigature: 'icon',
      },
    ]);

    // Dispose toolbar contribution.
    toolbarContribution.dispose();

    await fixture.whenStable();

    // Expect toolbar.
    await expectAsync(toolbar).toEqualToolbar([]);
  });

  it('should match required context', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);

    // Contribute to toolbar with required context {key1: value1}.
    contributeMenu('toolbar:testee', toolbar => toolbar.addToolbarButton({icon: 'icon-1', onSelect: noop}), {requiredContext: new Map().set('key1', 'value1'), injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect toolbar to have no items (context does not match).
    const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
    await expectAsync(toolbar).toEqualToolbar([]);

    // Set context {key1: value1} on toolbar.
    fixture.componentInstance.context.set(new Map<string, unknown>().set('key1', 'value1'));
    await fixture.whenStable();

    // Expect toolbar.
    await expectAsync(toolbar).toEqualToolbar([
      {
        type: 'menu-item',
        iconLigature: 'icon-1',
      },
    ]);

    // Contribute to toolbar with required context {key2: value2}.
    contributeMenu('toolbar:testee', toolbar => toolbar.addToolbarButton({icon: 'icon-2', onSelect: noop}), {requiredContext: new Map().set('key2', 'value2'), injector: TestBed.inject(Injector)});
    await fixture.whenStable();

    // Expect toolbar (context only matches item 1).
    await expectAsync(toolbar).toEqualToolbar([
      {
        type: 'menu-item',
        iconLigature: 'icon-1',
      },
    ]);

    // Set context {key1: value1, key2: value2} on toolbar.
    fixture.componentInstance.context.set(new Map<string, unknown>().set('key1', 'value1').set('key2', 'value2'));
    await fixture.whenStable();

    // Expect toolbar.
    await expectAsync(toolbar).toEqualToolbar([
      {
        type: 'menu-item',
        iconLigature: 'icon-1',
      },
      {
        type: 'menu-item',
        iconLigature: 'icon-2',
      },
    ]);
  });

  it('should change toolbar name', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);

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
      {
        type: 'menu-item',
        iconLigature: 'icon-1',
      },
    ]);

    // Set toolbar name to testee-2.
    fixture.componentInstance.name.set('toolbar:testee-2');
    await fixture.whenStable();

    // Expect toolbar.
    expect(toolbarFactoryFunction1CallCount).toBe(1);
    expect(toolbarFactoryFunction2CallCount).toBe(1);
    await expectAsync(toolbar).toEqualToolbar([
      {
        type: 'menu-item',
        iconLigature: 'icon-2',
      },
    ]);

    // Set toolbar name to testee-1.
    fixture.componentInstance.name.set('toolbar:testee-1');
    await fixture.whenStable();

    // Expect toolbar.
    expect(toolbarFactoryFunction1CallCount).toBe(1);
    expect(toolbarFactoryFunction2CallCount).toBe(1);
    await expectAsync(toolbar).toEqualToolbar([
      {
        type: 'menu-item',
        iconLigature: 'icon-1',
      },
    ]);
  });

  it('should close menu when clicking toolbar item again', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
      teardown: {destroyAfterEach: false},
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
      {
        type: 'menu-item',
        labelText: 'label',
      },
    ]);

    // Click toolbar item again.
    toolbar.button({cssClass: 'testee'}).nativeElement.click();
    await fixture.whenStable();

    // Expect menu.
    await expectAsync(menu).not.toBeAttached();
  });

  describe('Toolbar Button', () => {

    it('should provide icon', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar.addToolbarButton({icon: 'testee', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          iconLigature: 'testee',
        },
      ]);
    });

    it('should provide icon (signal)', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const icon = signal('testee-1');

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar.addToolbarButton({icon: icon, onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          iconLigature: 'testee-1',
        },
      ]);

      // Update icon.
      icon.set('testee-2');

      // Expect toolbar.
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          iconLigature: 'testee-2',
        },
      ]);
    });

    it('should provide icon (component)', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar.addToolbarButton({icon: SpecTesteeComponent, onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          iconComponent: {
            selector: 'spec-testee',
          },
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

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar.addToolbarButton({icon: 'icon', label: 'testee', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          labelText: 'testee',
        },
      ]);
    });

    it('should provide label (signal)', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const label = signal('testee-1');

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar.addToolbarButton({icon: 'icon', label: label, onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          labelText: 'testee-1',
        },
      ]);

      // Update label.
      label.set('testee-2');
      await fixture.whenStable();

      // Expect toolbar.
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          labelText: 'testee-2',
        },
      ]);
    });

    it('should provide label (component)', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar.addToolbarButton({icon: 'icon', label: SpecTesteeComponent, onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          iconLigature: 'icon',
          labelComponent: {
            selector: 'spec-testee',
          },
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
        .addToolbarButton({tooltip: 'testee', icon: 'icon', onSelect: noop})
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

    it('should provide tooltip (signal)', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const tooltip = signal('testee-1');

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar.addToolbarButton({tooltip: tooltip, icon: 'icon', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          tooltip: 'testee-1',
        },
      ]);

      // Update tooltip.
      tooltip.set('testee-2');
      await fixture.whenStable();

      // Expect toolbar.
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          tooltip: 'testee-2',
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

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarButton({icon: 'icon-1', disabled: true, onSelect: noop})
        .addToolbarButton({icon: 'icon-2', disabled: false, onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          iconLigature: 'icon-1',
          disabled: true,
        },
        {
          type: 'menu-item',
          iconLigature: 'icon-2',
          disabled: false,
        },
      ]);
    });

    it('should provide disabled (signal)', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const disabled = signal(true);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar.addToolbarButton({icon: 'icon', disabled: disabled, onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          disabled: true,
        },
      ]);

      // Update disabled.
      disabled.set(false);
      await fixture.whenStable();

      // Expect toolbar.
      await expectAsync(toolbar).toEqualToolbar([
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

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarButton({checked: true, icon: 'icon', onSelect: noop})
        .addToolbarButton({checked: false, icon: 'icon', onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          checked: true,
        },
        {
          type: 'menu-item',
          checked: false,
        },
      ]);
    });

    it('should provide checked (signal)', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const checked = signal(true);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar.addToolbarButton({icon: 'icon', checked: checked, onSelect: noop}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          iconLigature: 'icon',
          checked: true,
        },
      ]);

      // Update checked.
      checked.set(false);
      await fixture.whenStable();

      // Expect toolbar.
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          iconLigature: 'icon',
          checked: false,
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

      // Expect onSelect function of item 1 to be invoked.
      expect(console.log).toHaveBeenCalledWith('Click item 1');

      // Click on item 2.
      toolbar.button({cssClass: 'testee-2'}).nativeElement.click();

      // Expect onSelect function of item 2 to be invoked.
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

      // Press alt-1.
      document.dispatchEvent(new KeyboardEvent('keydown', {key: '1', altKey: true}));

      // Expect onSelect function of item 1 to be invoked.
      expect(console.log).toHaveBeenCalledWith('Click item 1');

      // Press alt-2.
      document.dispatchEvent(new KeyboardEvent('keydown', {key: '2', altKey: true}));

      // Expect onSelect function of item 2 to be invoked.
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

      // Expect onSelect function of item 1 to be invoked.
      expect(console.log).toHaveBeenCalledWith('Click item 1');

      // Click on item 2.
      toolbar.splitButton({cssClass: 'testee-2'}).primaryButton.nativeElement.click();

      // Expect onSelect function of item 2 to be invoked.
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
          labelText: 'label',
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
      contributeMenu('toolbar:testee', toolbar => toolbar.addToolbarControl({component: SpecTesteeComponent}), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          control: {
            selector: 'spec-testee',
          },
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
        .addToolbarControl({tooltip: 'testee', component: SpecTesteeComponent}), {injector: TestBed.inject(Injector)});
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
        .addToolbarControl({cssClass: ['testee-1', 'testee-2'], component: SpecTesteeComponent}), {injector: TestBed.inject(Injector)});
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
        .addToolbarControl({attributes: {attr1: 'testee-1', attr2: 'testee-2'}, component: SpecTesteeComponent}), {injector: TestBed.inject(Injector)});
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

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar.addToolbarMenu({icon: 'testee'}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu',
          iconLigature: 'testee',
        },
      ]);
    });

    it('should provide icon (signal)', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const icon = signal('testee-1');

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarMenu({icon: icon}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          iconLigature: 'testee-1',
        },
      ]);

      // Update icon.
      icon.set('testee-2');

      // Expect toolbar.
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu-item',
          iconLigature: 'testee-2',
        },
      ]);
    });

    it('should provide icon (component)', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarMenu({icon: SpecTesteeComponent}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu',
          iconComponent: {
            selector: 'spec-testee',
          },
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

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarMenu({label: 'testee'}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu',
          labelText: 'testee',
        },
      ]);
    });

    it('should provide label (signal)', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const label = signal('testee-1');

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarMenu({label: label}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu',
          labelText: 'testee-1',
        },
      ]);

      // Update label.
      label.set('testee-2');
      await fixture.whenStable();

      // Expect toolbar.
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu',
          labelText: 'testee-2',
        },
      ]);
    });

    it('should provide label (component)', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarMenu({label: SpecTesteeComponent}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu',
          labelComponent: {
            selector: 'spec-testee',
          },
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
        .addToolbarMenu({tooltip: 'testee', label: 'label'}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu',
          tooltip: 'testee',
        },
      ]);
    });

    it('should provide tooltip (signal)', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const tooltip = signal('testee-1');

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarMenu({tooltip: tooltip, label: 'label'}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu',
          tooltip: 'testee-1',
        },
      ]);

      // Update tooltip.
      tooltip.set('testee-2');
      await fixture.whenStable();

      // Expect toolbar.
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu',
          tooltip: 'testee-2',
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

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarMenu({disabled: true, label: 'label-1'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
        .addToolbarMenu({disabled: false, label: 'label-2'}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu',
          disabled: true,
        },
        {
          type: 'menu',
          disabled: false,
        },
      ]);
    });

    it('should provide disabled (signal)', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const disabled = signal(true);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarMenu({disabled: disabled, label: 'label'}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu',
          disabled: true,
        },
      ]);

      // Update disabled.
      disabled.set(false);
      await fixture.whenStable();

      // Expect toolbar.
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu',
          disabled: false,
        },
      ]);
    });

    it('should provide visualMenuHint', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addToolbarMenu({visualMenuHint: true, icon: 'icon'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
        .addToolbarMenu({visualMenuHint: true, label: 'label'}, menu => menu.addMenuItem({label: 'label-1', onSelect: noop}))
        .addToolbarMenu({visualMenuHint: true, icon: 'icon', label: 'label'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
        .addToolbarMenu({visualMenuHint: false, icon: 'icon'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
        .addToolbarMenu({visualMenuHint: false, label: 'label'}, menu => menu.addMenuItem({label: 'label', onSelect: noop}))
        .addToolbarMenu({visualMenuHint: false, icon: 'icon', label: 'label'}, menu => menu.addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
        {
          type: 'menu',
          visualMenuHint: true,
        },
        {
          type: 'menu',
          visualMenuHint: false,
        },
        {
          type: 'menu',
          visualMenuHint: false,
        },
        {
          type: 'menu',
          visualMenuHint: false,
        },
        {
          type: 'menu',
          visualMenuHint: false,
        },
        {
          type: 'menu',
          visualMenuHint: false,
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

      // Expect menu.
      await expectAsync(menu).toEqualMenu({
        width: 500,
      });
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

      // Expect menu.
      await expectAsync(menu).toEqualMenu({
        width: 500,
      });
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

      // Expect menu.
      await expectAsync(menu).toEqualMenu({
        width: 200,
      });
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
          .addMenuItem({label: 'label', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Open menu.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      toolbar.button({cssClass: 'item-1'}).nativeElement.click();
      const menu = new MenuPO(fixture);

      // Expect menu.
      await expectAsync(menu).toEqualMenu({
        height: 200,
      });
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

    it('should provide disabled', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
        .addGroup({disabled: true}, toolbar => toolbar.addToolbarButton({icon: 'icon', onSelect: noop}))
        .addGroup({disabled: false}, toolbar => toolbar.addToolbarButton({icon: 'icon', onSelect: noop})), {injector: TestBed.inject(Injector)});
      await fixture.whenStable();

      // Expect toolbar.
      const toolbar = new ToolbarPO(fixture, {cssClass: 'testee'});
      await expectAsync(toolbar).toEqualToolbar([
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
      ]);
    });

    it('should provide disabled (signal)', async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const fixture = TestBed.createComponent(SpecRootComponent);

      const disabled = signal(true);

      // Contribute to toolbar.
      contributeMenu('toolbar:testee', toolbar => toolbar
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
              disabled: true,
            },
          ],
        },
      ]);

      // Update disabled.
      disabled.set(false);
      await fixture.whenStable();

      // Expect toolbar.
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
          iconLigature: 'icon-testee',
        },
        {
          type: 'menu-item',
          iconLigature: 'icon-1',
        },
        {
          type: 'menu-item',
          iconLigature: 'icon-2',
        },
        {
          type: 'menu-item',
          iconLigature: 'icon-3',
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
          iconLigature: 'icon-1',
        },
        {
          type: 'menu-item',
          iconLigature: 'icon-2',
        },
        {
          type: 'menu-item',
          iconLigature: 'icon-3',
        },
        {
          type: 'menu-item',
          iconLigature: 'icon-testee',
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
          iconLigature: 'icon-1',
        },
        {
          type: 'menu-item',
          iconLigature: 'icon-testee',
        },
        {
          type: 'menu-item',
          iconLigature: 'icon-2',
        },
        {
          type: 'menu-item',
          iconLigature: 'icon-3',
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
          iconLigature: 'icon-1',
        },
        {
          type: 'menu-item',
          iconLigature: 'icon-2',
        },
        {
          type: 'menu-item',
          iconLigature: 'icon-testee',
        },
        {
          type: 'menu-item',
          iconLigature: 'icon-3',
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
          iconLigature: 'icon-1',
        },
        {
          type: 'menu-item',
          iconLigature: 'icon-testee',
        },
        {
          type: 'menu',
          iconLigature: 'icon-2',
        },
        {
          type: 'menu-item',
          iconLigature: 'icon-3',
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
          iconLigature: 'icon-1',
        },
        {
          type: 'menu',
          iconLigature: 'icon-2',
        },
        {
          type: 'menu-item',
          iconLigature: 'icon-testee',
        },
        {
          type: 'menu-item',
          iconLigature: 'icon-3',
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
          iconLigature: 'icon-1',
        },
        {
          type: 'menu-item',
          iconLigature: 'icon-testee',
        },
        {
          type: 'group',
          children: [
            {
              type: 'menu-item',
              iconLigature: 'icon-2',
            },
          ],
        },
        {
          type: 'menu-item',
          iconLigature: 'icon-3',
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
          iconLigature: 'icon-1',
        },
        {
          type: 'group',
          children: [
            {
              type: 'menu-item',
              iconLigature: 'icon-2',
            },
          ],
        },
        {
          type: 'menu-item',
          iconLigature: 'icon-testee',
        },
        {
          type: 'menu-item',
          iconLigature: 'icon-3',
        },
      ]);
    });
  });
});

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop(): void {
}

@Component({
  selector: 'spec-root',
  template: '<sci-toolbar [name]="name()" [context]="context()" [class]="class()"/>',
  imports: [SciToolbarComponent],
})
class SpecRootComponent {
  public name = signal<`toolbar:${string}`>('toolbar:testee');
  public context = signal<Map<string, unknown>>(new Map());
  public class = signal('testee');
}

@Component({
  selector: 'spec-two-toolbars',
  template: `
    <sci-toolbar [name]="name1()" [class]="class1()"/>
    <sci-toolbar [name]="name2()" [class]="class2()"/>
  `,
  imports: [SciToolbarComponent],
})
class SpecTwoToolbarsComponent {
  public name1 = signal<`toolbar:${string}`>('toolbar:testee');
  public name2 = signal<`toolbar:${string}`>('toolbar:testee');
  public class1 = signal('testee');
  public class2 = signal('testee');
}

@Component({
  selector: 'spec-testee',
  template: 'spec-testee',
  imports: [],
  host: {
    'class': 'e2e-menu-item',
  },
})
class SpecTesteeComponent {
}
