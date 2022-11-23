/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js';
import 'zone.js/testing';
import {getTestBed} from '@angular/core/testing';
import {BrowserDynamicTestingModule, platformBrowserDynamicTesting} from '@angular/platform-browser-dynamic/testing';

/**
 * TODO [Angular 16]
 * Starting with Angular 15, this file can be removed and 'zone.js' polyfills can be specified directly in angular.json.
 * However, when removing this file and specifying polyfills in angular.json, we experienced unexpected promise rejection errors in tests.
 * We have reported an issue to Angular. https://github.com/angular/angular/issues/48386
 */

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);
