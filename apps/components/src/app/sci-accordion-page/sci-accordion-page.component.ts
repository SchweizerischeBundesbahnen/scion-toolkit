/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, inject} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {SciCheckboxComponent} from '@scion/components.internal/checkbox';
import {SciAccordionComponent, SciAccordionItemDirective} from '@scion/components.internal/accordion';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';

@Component({
  selector: 'sci-accordion-page',
  templateUrl: './sci-accordion-page.component.html',
  styleUrls: ['./sci-accordion-page.component.scss'],
  imports: [
    ReactiveFormsModule,
    SciFormFieldComponent,
    SciCheckboxComponent,
    SciAccordionComponent,
    SciAccordionItemDirective,
    SciTabDirective,
    SciTabbarComponent,
  ],
})
export default class SciAccordionPageComponent {

  private readonly _formBuilder = inject(NonNullableFormBuilder);

  protected readonly form = this._formBuilder.group({
    variant: this._formBuilder.control<'solid' | 'bubble'>('bubble'),
    multi: this._formBuilder.control(false),
  });

  public items: Item[] = [
    {title: 'SCION', description: 'SCION provides fundamental building blocks for implementing a microfrontend architecture and facilitates the development of Angular web applications that require a complex workbench layout of multiple views and windows.'},
    {title: 'SCION Microfrontend Platform', description: 'SCION Microfrontend Platform is a TypeScript-based open-source library that helps to implement a microfrontend architecture using iframes.'},
    {title: 'SCION Workbench', description: 'SCION Workbench helps to build multi-view web applications and integrates separate micro frontends into a consistent rich web application. Views are shown within tabs which can be flexibly arranged and dragged around by the user.'},
    {title: 'SCION Toolkit', description: 'SCION Toolkit is a collection of UI components and utilities designed primarily for use in SCION libraries and their demo and test applications.'},
    {title: 'SCION Toolkit INTERNAL', description: 'SCION Toolkit INTERNAL is a collection of UI components and utilities designed exclusively for use in SCION applications.'},
    {title: 'Angular', description: 'Angular is an application design framework and development platform for creating efficient and sophisticated single-page apps.'},
    {title: 'Angular CDK', description: 'The Component Dev Kit (CDK) is a set of tools that implement common interaction patterns whilst being unopinionated about their presentation.'},
    {title: 'Angular Material', description: 'Angular Material comprises a range of components which implement common interaction patterns according to the Material Design specification.'},
    {title: 'Angular Schematics', description: 'A schematic is a template-based code generator that supports complex logic. It is a set of instructions for transforming a software project by generating or modifying code.'},
    {title: 'Angular Google Maps Component', description: 'Angular components built on top of the Google Maps JavaScript API.'},
    {title: 'Angular Youtube Component', description: 'Angular component built on top of the YouTube Player API.'},
  ];

}

export interface Item {
  title: string;
  description: string;
}
