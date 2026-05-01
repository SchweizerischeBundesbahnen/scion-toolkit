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
import {Component, input, inputBinding, signal} from '@angular/core';
import {SciAttributesDirective} from './attributes.directive';
import {By} from '@angular/platform-browser';

describe('SciAttributesDirective', () => {

  it('should add specified attributes to the host', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const attributes = signal<{[name: string]: string | undefined | null} | undefined | null>(undefined);
    const fixture = TestBed.createComponent(TestComponent, {bindings: [inputBinding('attributes', attributes)]});
    const testee = fixture.debugElement.query(By.css('div'));

    // Add attribute.
    attributes.set({key1: 'value 1a', key2: 'value 2'});
    await fixture.whenStable();
    expect(testee.attributes).toEqual({key1: 'value 1a', key2: 'value 2'});

    // Change attribute.
    attributes.set({key1: 'value 1b'});
    await fixture.whenStable();
    expect(testee.attributes).toEqual({key1: 'value 1b'});

    // Add different attribute.
    attributes.set({key3: 'value 3'});
    await fixture.whenStable();
    expect(testee.attributes).toEqual({key3: 'value 3'});
  });

  it('should clear attributes on `null`, `undefined`, or `{}`', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const attributes = signal<{[name: string]: string | undefined | null} | undefined | null>(undefined);
    const fixture = TestBed.createComponent(TestComponent, {bindings: [inputBinding('attributes', attributes)]});
    const testee = fixture.debugElement.query(By.css('div'));

    // Add attribute.
    attributes.set({key: 'value'});
    await fixture.whenStable();
    expect(testee.attributes).toEqual({key: 'value'});

    // Set `null` attributes.
    attributes.set(null);
    await fixture.whenStable();
    expect(testee.attributes).toEqual({});

    // Add attribute.
    attributes.set({key: 'value'});
    await fixture.whenStable();
    expect(testee.attributes).toEqual({key: 'value'});

    // Set `undefined` attributes.
    attributes.set(undefined);
    await fixture.whenStable();
    expect(testee.attributes).toEqual({});

    // Add attribute.
    attributes.set({key: 'value'});
    await fixture.whenStable();
    expect(testee.attributes).toEqual({key: 'value'});

    // Set `{}` attributes.
    attributes.set({});
    await fixture.whenStable();
    expect(testee.attributes).toEqual({});
  });

  it('should remove attribute if value is `null`', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const attributes = signal<{[name: string]: string | undefined | null} | undefined | null>(undefined);
    const fixture = TestBed.createComponent(TestComponent, {bindings: [inputBinding('attributes', attributes)]});
    const testee = fixture.debugElement.query(By.css('div'));

    // Add attribute.
    attributes.set({key: 'value'});
    await fixture.whenStable();
    expect(testee.attributes).toEqual({key: 'value'});

    // Remove attribute.
    attributes.set({key: null});
    await fixture.whenStable();
    expect(testee.attributes).toEqual({});
  });

  it('should remove attribute if value is `undefined`', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const attributes = signal<{[name: string]: string | undefined | null} | undefined | null>(undefined);
    const fixture = TestBed.createComponent(TestComponent, {bindings: [inputBinding('attributes', attributes)]});
    const testee = fixture.debugElement.query(By.css('div'));

    // Add attribute.
    attributes.set({key: 'value'});
    await fixture.whenStable();
    expect(testee.attributes).toEqual({key: 'value'});

    // Remove attribute.
    attributes.set({key: undefined});
    await fixture.whenStable();
    expect(testee.attributes).toEqual({});
  });

  it('should add attribute without value', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const attributes = signal<{[name: string]: string | undefined | null} | undefined | null>(undefined);
    const fixture = TestBed.createComponent(TestComponent, {bindings: [inputBinding('attributes', attributes)]});
    const testee = fixture.debugElement.query(By.css('div'));

    // Add attribute.
    attributes.set({key: ''});
    await fixture.whenStable();

    expect(testee.attributes).toEqual({key: ''});
    expect((fixture.debugElement.nativeElement as HTMLElement).getAttribute('key')).toBeNull();
  });
});

@Component({
  selector: 'spec-component',
  template: `
    <div [sciAttributes]="attributes()">Testee</div>
  `,
  imports: [
    SciAttributesDirective,
  ],
})
class TestComponent {
  public attributes = input<{[name: string]: string | undefined | null} | undefined | null>();
}
