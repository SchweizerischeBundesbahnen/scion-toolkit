/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Pipe, PipeTransform} from '@angular/core';
import {SciKeyboardAccelerator} from '../menu-accelerators';

/**
 * Formats a keyboard accelerator for display.
 *
 * If `leadingText` is specified, appends the accelerator in parentheses.
 */
@Pipe({name: 'sciFormatAccelerator'})
export class SciFormatAcceleratorPipe implements PipeTransform {

  public transform(accelerator: SciKeyboardAccelerator | undefined, leadingText?: string): string | undefined {
    if (!accelerator) {
      return leadingText;
    }

    const modifiers = [];
    if (accelerator.ctrl) {
      modifiers.push(ctrlKeySymbol);
    }
    if (accelerator.shift) {
      modifiers.push('Shift');
    }
    if (accelerator.alt) {
      modifiers.push('Alt');
    }

    const key = accelerator.location === 'numpad' ? `NumPad ${formatKey(accelerator)}` : formatKey(accelerator);
    const formattedAccelerator = modifiers.concat(key).join('+');
    return leadingText ? `${leadingText} (${formattedAccelerator})` : formattedAccelerator;
  }
}

function formatKey(accelerator: SciKeyboardAccelerator): string {
  switch (accelerator.key.toLowerCase()) {
    case ' ':
      return 'Space';
    case 'arrowdown':
      return 'Down';
    case 'arrowup':
      return 'Up';
    case 'arrowleft':
      return 'Left';
    case 'arrowright':
      return 'Right';
    default:
      return accelerator.key[0]!.toUpperCase() + accelerator.key.substring(1);
  }
}

/**
 * Platform-specific name for the Control modifier key.
 *
 * Resolves to `⌘` on macOS and `Ctrl` on other operating systems.
 */
const ctrlKeySymbol = navigator.platform.startsWith('Mac') ? '⌘' : 'Ctrl';
