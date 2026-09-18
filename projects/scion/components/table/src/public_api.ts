/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

export {table, type SciTableFactoryFn} from './table';
export {SciTableComponent} from './table.component';
export {type SciTable, type SciCellContext, type SciTableDescriptor, type SciRowActionFactoryFn, type SciColumnType, type ChildProvider, type PageableChildProvider, provideTableDatasource, provideHierarchicalTableDatasource, providePageableTableDatasource, providePageableHierarchicalTableDatasource, SciHierarchicalTableDatasource, SciPageableHierarchicalTableDatasource} from './table.model';
export {ɵSciTable} from './ɵtable.model';
export {type SciTableRowBinding, classBinding, attributeBinding, partBinding, provideTableRowBinding} from './table-row-binding';
export {type SciDataLoaderFn, type SciTableResponse, type SciTableRequest, type SciColumnFilter, type SciSortCriterion} from './table-data-source';
export {type SciTableFactory, type SciTableColumnDescriptor, type SciColumnDescriptor, type SciStringColumnDescriptor, type SciNumberColumnDescriptor, type SciBooleanColumnDescriptor, type SciComponentColumnDescriptor, type SciTemplateColumnDescriptor} from './table.factory';
export {type SciTableStorage, provideTableStorage} from './table-storage';
