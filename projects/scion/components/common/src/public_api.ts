/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

/*
 * Secondary entrypoint: '@scion/components/common'
 *
 * @see https://github.com/ng-packagr/ng-packagr/blob/master/docs/secondary-entrypoints.md
 */
export {coerceSignal, type MaybeSignal, toLazyObservable} from './signal.util';
export {ɵcreateDestroyableInjector, ɵassertInInjectionContext, ɵSingleActiveInjectorFactory} from './injector.util';
export {type SciComponentDescriptor, SciComponentOutletDirective} from './component-outlet.directive';
export {SciAttributesDirective} from './attributes.directive';
export {type SciTemplateDescriptor} from './template-descriptor';
export {SCI_LOCALE} from './locale';
export {SciTooltipOnOverflowDirective, TOOLTIP_ON_OVERFLOW_DIRECTIVE_SOURCE_ELEMENT, TOOLTIP_ON_OVERFLOW_DIRECTIVE_ADDITIONAL_TEXT} from './tooltip-on-overflow.directive';
export {SCI_COMPONENTS_STORAGE, provideComponentsStorage} from './storage';
