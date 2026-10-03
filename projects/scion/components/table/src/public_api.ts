/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

export {table, type SciTableColumnFactoryFn} from './table.factory';
export {SciTableComponent} from './table.component';
export {type SciTable, type SciTableDescriptor, type SciTableRowActionFactoryFn, type SciTableColumnType, type SciTableEvent, type SciTableCellContext} from './table.model';
export {type SciTableRowBindingFactoryFn, type SciTableRowBindingFactory, provideTableRowBinding} from './table-row-binding';
export {type SciTableDataLoaderFn, type SciTablePageResponse, type SciTablePageRequest, type SciTableColumnFilter, type SciTableSortCriterion, ɵillegaldatasource} from './table-datasource';
export {type SciTableColumnFactory, type SciTableColumnDescriptor, type SciStringColumnDescriptor, type SciNumberColumnDescriptor, type SciBooleanColumnDescriptor, type SciDateColumnDescriptor, type SciComponentColumnDescriptor, type SciTemplateColumnDescriptor, type SciTableColumnSortComparatorFn, type SciTableColumnFilterMatcherFn} from './table-column.factory';
export {type SciTableStorage, provideTableStorage} from './table-storage';
export {type SciDateLike} from './table-date-column.model';
