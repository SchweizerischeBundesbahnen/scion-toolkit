/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import CustomMatcherResult = jasmine.CustomMatcherResult;
import CustomAsyncMatcher = jasmine.CustomAsyncMatcher;
import {retryOnError} from '@scion/toolkit/testing';
import {ComponentFixture} from '@angular/core/testing';
import {DebugElement} from '@angular/core';
import {ComponentType} from '@angular/cdk/portal';
import {By} from '@angular/platform-browser';

/**
 * Provides the implementation of {@link CustomAsyncMatcherFactories#toEqualIcon}.
 */
export const toEqualIconCustomMatcher: jasmine.CustomAsyncMatcherFactories = {
  toEqualIcon: (): CustomAsyncMatcher => {
    return {
      async compare(actual: ComponentFixture<unknown> | DebugElement, expected: ExpectedIcon, failOutput: string | undefined): Promise<CustomMatcherResult> {
        try {
          await retryOnError(() => assertIcon(actual, expected));
          return pass();
        }
        catch (error) {
          return fail(error instanceof Error ? error.message : `${error}`);
        }

        function pass(): CustomMatcherResult {
          return {pass: true};
        }

        function fail(message: string): CustomMatcherResult {
          return {pass: false, message: message.concat(failOutput ? `(${failOutput})` : '')};
        }
      },
    };
  },
};

/**
 * Expects the specified icon to display.
 */
function assertIcon(actual: ComponentFixture<unknown> | DebugElement, expected: ExpectedIcon): void {
  const debugElement = actual instanceof ComponentFixture ? actual.debugElement : actual;

  const actualIconDebugElement = debugElement.query(By.css('sci-icon')) as DebugElement | null;

  // Expect icon to be in the DOM.
  if (!actualIconDebugElement) {
    throw Error(`Expected 'sci-icon' element to be in the DOM, but is not.`);
  }

  // Expect icon attribute.
  const actualIconElement = actualIconDebugElement.nativeElement as HTMLElement;
  if (actualIconElement.getAttribute('icon') !== expected.icon) {
    throw Error(`Expected 'sci-icon' to have icon attribute '${expected.icon}', but is '${actualIconElement.getAttribute('icon')}'.`);
  }

  // Expect component.
  if (expected.component && !(actualIconDebugElement.query(By.directive(expected.component)) as DebugElement | null)) {
    throw Error(`Expected '${expected.component.name}' element to be in the DOM, but is not.`);
  }

  if (expected.component === null && actualIconDebugElement.children.length) {
    throw Error(`Expected 'sci-icon' to be empty, but is not.`);
  }

  // Expect text content.
  if (expected.textContent !== undefined) {
    const actualTextContent = actualIconElement.textContent;
    if (actualTextContent !== expected.textContent) {
      throw Error(`Expected 'sci-icon' to have text content '${expected.textContent ?? ''}', but is '${actualTextContent}'.`);
    }
  }

  // Expect CSS context.
  if (expected.cssContent !== undefined) {
    const actualCssContent = getComputedStyle(actualIconElement.children[0]!, '::before').content;
    if (actualCssContent !== expected.cssContent) {
      throw Error(`Expected 'sci-icon' to have CSS content '${expected.cssContent ?? ''}', but is '${actualCssContent}'.`);
    }
  }

  // Expect font family.
  if (expected.fontFamily !== undefined) {
    const actualFontFamily = getComputedStyle(actualIconElement.children[0]!).fontFamily;
    if (expected.fontFamily !== actualFontFamily) {
      throw Error(`Expected 'sci-icon' to have CSS font '${expected.fontFamily ?? ''}', but is '${actualFontFamily}'.`);
    }
  }
}

export interface ExpectedIcon {
  icon: string | null;
  textContent?: string;
  cssContent?: string;
  fontFamily?: string;
  component?: ComponentType<unknown> | null;
}
