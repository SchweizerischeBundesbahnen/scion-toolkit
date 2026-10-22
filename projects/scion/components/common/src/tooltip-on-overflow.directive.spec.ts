/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ComponentFixtureAutoDetect, TestBed} from '@angular/core/testing';
import {Component, inject, input, inputBinding, signal, viewChild} from '@angular/core';
import {SciTooltipOnOverflowDirective, TOOLTIP_ON_OVERFLOW_DIRECTIVE_ADDITIONAL_TEXT, TOOLTIP_ON_OVERFLOW_DIRECTIVE_SOURCE_ELEMENT} from './tooltip-on-overflow.directive';
import {ComponentType} from '@angular/cdk/portal';
import {FormsModule} from '@angular/forms';

describe('SciTooltipOnOverflowDirective', () => {

  const testComponents = new Map<string, () => ComponentType<unknown>>()
    .set('TestComponentDefaultSource', () => TestComponentDefaultSource)
    .set('TestComponentCustomSource', () => TestComponentCustomSource)
    .set('TestInputComponentDefaultSource', () => TestInputComponentDefaultSource)
    .set('TestInputComponentCustomSource', () => TestInputComponentCustomSource)
    .set('HostDirective.TestComponentDefaultSource', () => HostDirective.TestComponentDefaultSource)
    .set('HostDirective.TestComponentCustomSource', () => HostDirective.TestComponentCustomSource)
    .set('HostDirective.TestInputComponentCustomSource', () => HostDirective.TestInputComponentCustomSource);

  testComponents.forEach((testComponent, name) => {

    it(`should display text content as tooltip on overflow [${name}]`, async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const textContent = signal('Text Content');
      const fixture = TestBed.createComponent(testComponent(), {bindings: [inputBinding('textContent', textContent)]});
      const fixtureElement = fixture.debugElement.nativeElement as HTMLElement;
      const testee = fixtureElement.querySelector('div.testee') ?? fixtureElement.querySelector('input.testee') ?? fixtureElement;

      await fixture.whenStable();
      expect(testee.getAttribute('title')).toBeNull();

      // Simulate 'hover'.
      testee.dispatchEvent(new MouseEvent('mouseenter'));
      await fixture.whenStable();
      expect(testee.getAttribute('title')).toBeNull();

      // Simulate 'unhover'.
      testee.dispatchEvent(new MouseEvent('mouseleave'));
      await fixture.whenStable();
      expect(testee.getAttribute('title')).toBeNull();

      // Force overflow.
      textContent.set('Lorem ipsum dolor sit amet');
      await fixture.whenStable();

      // Simulate 'hover'.
      testee.dispatchEvent(new MouseEvent('mouseenter'));
      await fixture.whenStable();
      expect(testee.getAttribute('title')).toEqual('Lorem ipsum dolor sit amet');

      // Simulate 'unhover'.
      testee.dispatchEvent(new MouseEvent('mouseleave'));
      await fixture.whenStable();
      expect(testee.getAttribute('title')).toBeNull();

      // Unset overflow.
      textContent.set('Text Content');
      await fixture.whenStable();

      // Simulate 'hover'.
      testee.dispatchEvent(new MouseEvent('mouseenter'));
      await fixture.whenStable();
      expect(testee.getAttribute('title')).toBeNull();

      // Simulate 'unhover'.
      testee.dispatchEvent(new MouseEvent('mouseleave'));
      await fixture.whenStable();
      expect(testee.getAttribute('title')).toBeNull();
    });

    it(`should display custom tooltip with text content on overflow [${name}]`, async () => {
      TestBed.configureTestingModule({
        providers: [
          {provide: ComponentFixtureAutoDetect, useValue: true},
        ],
      });

      const textContent = signal('Text Content');
      const additionalText = signal('Tooltip');
      const fixture = TestBed.createComponent(testComponent(), {bindings: [inputBinding('textContent', textContent), inputBinding('additionalText', additionalText)]});
      const fixtureElement = fixture.debugElement.nativeElement as HTMLElement;
      const testee = fixtureElement.querySelector('div.testee') ?? fixtureElement.querySelector('input.testee') ?? fixtureElement;

      await fixture.whenStable();
      expect(testee.getAttribute('title')).toEqual('Tooltip');

      // Simulate 'hover'.
      testee.dispatchEvent(new MouseEvent('mouseenter'));
      await fixture.whenStable();
      expect(testee.getAttribute('title')).toEqual('Tooltip');

      // Simulate 'unhover'.
      testee.dispatchEvent(new MouseEvent('mouseleave'));
      await fixture.whenStable();
      expect(testee.getAttribute('title')).toEqual('Tooltip');

      // Force overflow.
      textContent.set('Lorem ipsum dolor sit amet');
      await fixture.whenStable();

      // Simulate 'hover'.
      testee.dispatchEvent(new MouseEvent('mouseenter'));
      await fixture.whenStable();
      expect(testee.getAttribute('title')).toEqual('Lorem ipsum dolor sit amet\nTooltip');

      // Simulate 'unhover'.
      testee.dispatchEvent(new MouseEvent('mouseleave'));
      await fixture.whenStable();
      expect(testee.getAttribute('title')).toEqual('Tooltip');

      // Unset overflow.
      textContent.set('Text Content');
      await fixture.whenStable();

      // Simulate 'hover'.
      testee.dispatchEvent(new MouseEvent('mouseenter'));
      await fixture.whenStable();
      expect(testee.getAttribute('title')).toEqual('Tooltip');

      // Simulate 'unhover'.
      testee.dispatchEvent(new MouseEvent('mouseleave'));
      await fixture.whenStable();
      expect(testee.getAttribute('title')).toEqual('Tooltip');
    });
  });
});

@Component({
  selector: 'spec-component',
  template: `
    <div sciTooltipOnOverflow
         [sciTooltipOnOverflowAdditionalText]="additionalText()"
         class="testee">
      {{textContent()}}
    </div>
  `,
  styles: `
    :host {
      display: block;
      border: 1px solid black;
      width: 100px;
      height: 20px;

      > div.testee {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }`,
  imports: [
    SciTooltipOnOverflowDirective,
  ],
})
class TestComponentDefaultSource {
  public readonly textContent = input<string>();
  public readonly additionalText = input<string>();
}

@Component({
  selector: 'spec-component',
  template: `
    <div sciTooltipOnOverflow
         [sciTooltipOnOverflowAdditionalText]="additionalText()"
         [sciTooltipOnOverflowSourceElement]="source_element"
         class="testee">
      Host Element
    </div>
    <div class="source" #source_element>
      {{textContent()}}
    </div>
  `,
  styles: `
    :host {
      display: block;
      border: 1px solid black;
      width: 100px;
      height: 20px;

      > div.source {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }`,
  imports: [
    SciTooltipOnOverflowDirective,
  ],
})
class TestComponentCustomSource {
  public readonly textContent = input<string>();
  public readonly additionalText = input<string>();
}

@Component({
  selector: 'spec-component',
  template: `
    <input sciTooltipOnOverflow
           [sciTooltipOnOverflowAdditionalText]="additionalText()"
           [ngModel]="textContent()"
           class="testee">
  `,
  styles: `
    :host {
      display: block;
      border: 1px solid black;
      width: 100px;
      height: 20px;

      > input {
        min-width: 0;
        width: 100%;
      }
    }`,
  imports: [
    SciTooltipOnOverflowDirective,
    FormsModule,
  ],
})
class TestInputComponentDefaultSource {
  public readonly textContent = input<string>();
  public readonly additionalText = input<string>();
}

@Component({
  selector: 'spec-component',
  template: `
    <div sciTooltipOnOverflow
         [sciTooltipOnOverflowAdditionalText]="additionalText()"
         [sciTooltipOnOverflowSourceElement]="source_element"
         class="testee">
      Host Element
    </div>
    <input class="source" #source_element [ngModel]="textContent()">
  `,
  styles: `
    :host {
      display: block;
      border: 1px solid black;
      width: 100px;
      height: 20px;

      > input {
        min-width: 0;
        width: 100%;
      }
    }`,
  imports: [
    SciTooltipOnOverflowDirective,
    FormsModule,
  ],
})
class TestInputComponentCustomSource {
  public readonly textContent = input<string>();
  public readonly additionalText = input<string>();
}

namespace HostDirective {

  @Component({
    selector: 'spec-component',
    template: '{{textContent()}}',
    hostDirectives: [SciTooltipOnOverflowDirective],
    providers: [
      {
        provide: TOOLTIP_ON_OVERFLOW_DIRECTIVE_ADDITIONAL_TEXT,
        useFactory: () => inject(TestComponentDefaultSource).additionalText,
      },
    ],
    styles: `
      :host {
        display: block;
        border: 1px solid black;
        width: 100px;
        height: 20px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }`,
  })
  export class TestComponentDefaultSource {
    public readonly textContent = input<string>();
    public readonly additionalText = input<string>();
  }

  @Component({
    selector: 'spec-component',
    template: `
      Host Element
      <div class="source" #source_element>
        {{textContent()}}
      </div>
    `,
    hostDirectives: [SciTooltipOnOverflowDirective],
    providers: [
      {
        provide: TOOLTIP_ON_OVERFLOW_DIRECTIVE_ADDITIONAL_TEXT,
        useFactory: () => inject(TestComponentCustomSource).additionalText,
      },
      {
        provide: TOOLTIP_ON_OVERFLOW_DIRECTIVE_SOURCE_ELEMENT,
        useFactory: () => inject(TestComponentCustomSource).sourceElement,
      },
    ],
    styles: `
      :host {
        display: block;
        border: 1px solid black;
        width: 100px;
        height: 20px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }`,
  })
  export class TestComponentCustomSource {
    public readonly textContent = input<string>();
    public readonly additionalText = input<string>();
    protected readonly sourceElement = viewChild('source_element');
  }

  @Component({
    selector: 'spec-component',
    template: `
      Host Element
      <input class="source" #source_element [ngModel]="textContent()">
    `,
    hostDirectives: [SciTooltipOnOverflowDirective],
    providers: [
      {
        provide: TOOLTIP_ON_OVERFLOW_DIRECTIVE_ADDITIONAL_TEXT,
        useFactory: () => inject(TestInputComponentCustomSource).additionalText,
      },
      {
        provide: TOOLTIP_ON_OVERFLOW_DIRECTIVE_SOURCE_ELEMENT,
        useFactory: () => inject(TestInputComponentCustomSource).sourceElement,
      },
    ],
    styles: `
      :host {
        display: block;
        border: 1px solid black;
        width: 100px;
        height: 20px;

        > input {
          min-width: 0;
          width: 100%;
        }
      }`,
    imports: [
      FormsModule,
    ],
  })
  export class TestInputComponentCustomSource {
    public readonly textContent = input<string>();
    public readonly additionalText = input<string>();
    protected readonly sourceElement = viewChild('source_element');
  }
}
