/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {DestroyRef, Directive, inject, signal} from '@angular/core';
import {SciToolGroupComponent} from './toolbar-group.component';

@Directive({
  selector: '[sciToolbarState]',
  host: {
    '[class.menu-open]': 'menuOpen()',
  },
})
export class ToolbarStateDirective {

  protected readonly menuOpen = signal(false);

  constructor() {
    this.installOpenListener();
  }

  private installOpenListener(): void {
    const toolbar = inject(SciToolGroupComponent);
    const ref = toolbar.menuOpen.subscribe(open => this.menuOpen.set(open));
    inject(DestroyRef).onDestroy(() => ref.unsubscribe());
  }
}
