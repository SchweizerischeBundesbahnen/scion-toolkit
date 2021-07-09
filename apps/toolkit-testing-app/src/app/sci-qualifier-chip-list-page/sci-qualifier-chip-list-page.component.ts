/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component} from '@angular/core';

@Component({
  selector: 'sci-qualifier-chip-list-page-page',
  templateUrl: './sci-qualifier-chip-list-page.component.html',
  styleUrls: ['./sci-qualifier-chip-list-page.component.scss'],
})
export class SciQualifierChipListPageComponent {

  public items: Item[] = [
    {title: 'SCION', description: 'SCION Microfrontend Platform is a TypeScript-based open-source library that helps to implement a microfrontend architecture using iframes.'},
    {title: 'SCION Microfrontend Platform', description: 'SCION Microfrontend Platform is a TypeScript-based open-source library that helps to implement a microfrontend architecture using iframes.'},
    {title: 'SCION Workbench', description: 'SCION Workbench helps to build multi-view web applications and integrates separate micro frontends into a consistent rich web application. Views are shown within tabs which can be flexibly arranged and dragged around by the user.'},
    {title: 'SCION Toolkit', description: 'SCION Toolkit provides components and utilities used in the SCION libraries.'},
    {title: 'SCION Toolkit INTERNAL', description: 'SCION Toolkit INTERNAL provides a collection of tools for SCION web applications.'},
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
