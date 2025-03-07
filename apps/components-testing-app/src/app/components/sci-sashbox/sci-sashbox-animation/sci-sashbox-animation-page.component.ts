/*
 * Copyright (c) 2018-2025 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {booleanAttribute, Component, inject, Injector, signal} from '@angular/core';
import {SciSashboxComponent, SciSashDirective} from '@scion/components/sashbox';
import {NgComponentOutlet} from '@angular/common';
import {CONTENT, LABEL, SashContentComponent} from './sash-content/sash-content.component';
import {CdkPortalOutlet, ComponentPortal} from '@angular/cdk/portal';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {AnimationComponent} from './animation/animation.component';

@Component({
  selector: 'app-sashbox-animation-page',
  templateUrl: './sci-sashbox-animation-page.component.html',
  styleUrls: ['./sci-sashbox-animation-page.component.scss'],
  imports: [
    SciSashboxComponent,
    SciSashDirective,
    SashContentComponent,
    NgComponentOutlet,
    CdkPortalOutlet,
    FormsModule,
    AnimationComponent,
  ],
})
export default class SciSashboxAnimationPageComponent {

  protected readonly SashContentComponent = SashContentComponent;

  protected visible = {
    sash1: signal(parseMatrixParam('sash1Visible')),
    sash2: signal(parseMatrixParam('sash2Visible')),
    sash3: signal(parseMatrixParam('sash3Visible')),
    sash4: signal(parseMatrixParam('sash4Visible')),
    sash5: signal(parseMatrixParam('sash5Visible')),
  };

  protected animated = {
    sash1: signal(parseMatrixParam('sash1Animated')),
    sash2: signal(parseMatrixParam('sash2Animated')),
    sash3: signal(parseMatrixParam('sash3Animated')),
    sash4: signal(parseMatrixParam('sash4Animated')),
    sash5: signal(parseMatrixParam('sash5Animated')),
  };

  protected readonly portal = new ComponentPortal(SashContentComponent, null, Injector.create({
    parent: inject(Injector),
    providers: [
      {provide: LABEL, useValue: 'sash-3'},
      {provide: CONTENT, useValue: 'CDK Portal'},
    ],
  }));
}

function parseMatrixParam(param: string): boolean {
  return booleanAttribute(inject(ActivatedRoute).snapshot.paramMap.get(param) ?? false);
}
