/*
 * Copyright (c) 2018-2025 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, effect, ElementRef, input, signal, viewChild} from '@angular/core';
import {animate, AnimationMetadata, sequence, style, transition, trigger} from '@angular/animations';
import {fromResize$} from '@scion/toolkit/observable';

@Component({
  selector: 'app-animation',
  templateUrl: './animation.component.html',
  styleUrls: ['./animation.component.scss'],
  animations: [
    trigger('size', provideSizeAnimation()),
  ],
})
export class AnimationComponent {

  public readonly content = input.required<string>();
  public readonly label = input.required<string>();

  private readonly _animatedContent = viewChild.required<ElementRef<HTMLElement>>('animated_content');

  protected readonly state = signal<boolean | undefined>(undefined);

  constructor() {
    this.installSizeLogger();
  }

  protected onAnimate(): void {
    this.state.update(state => !state);
  }

  private installSizeLogger(): void {
    effect(onCleanup => {
      const element = this._animatedContent().nativeElement;
      const subscription = fromResize$(element).subscribe(() => console.log(`[SashContentComponent][${this.label()}] resize to ${element.clientWidth}`));
      onCleanup(() => subscription.unsubscribe());
    });
  }
}

function provideSizeAnimation(): AnimationMetadata[] {
  return [
    transition('* => false', [
      sequence([
        animate('500ms', style({width: '100px', height: '100px'})),
        animate('500ms', style({width: '*', height: '*'})),
      ]),
    ]),
    transition('* => true', [
      sequence([
        animate('500ms', style({width: '100px', height: '100px'})),
        animate('500ms', style({width: '*', height: '*'})),
      ]),
    ]),
  ];
}
