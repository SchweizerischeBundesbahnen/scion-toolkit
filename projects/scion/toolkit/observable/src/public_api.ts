/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

/*
 * Secondary entrypoint: '@scion/toolkit/observable'
 * This module does not depend on Angular.
 *
 * @see https://github.com/ng-packagr/ng-packagr/blob/master/docs/secondary-entrypoints.md
 */
export {fromResize$} from './resize.observable';
export {fromIntersection$} from './intersection.observable';
export {fromMutation$} from './mutation.observable';
export {fromBoundingClientRect$} from './bounding-client-rect.observable';
