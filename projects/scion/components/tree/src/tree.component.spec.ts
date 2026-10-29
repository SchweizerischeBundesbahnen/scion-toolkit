/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {TestBed} from '@angular/core/testing';
import {provideTableRowBinding} from '@scion/components/table';
import {Component, DestroyRef, inject, Injector, input, inputBinding, signal, TemplateRef, viewChild} from '@angular/core';
import {tree as sciTree} from './tree';
import {provideAsyncTreeDatasource, provideTreeDatasource} from './tree-datasource';
import {TablePO} from '../../table/src/table.po';
import {createSciTreeComponent, provideNullTableStorage} from './testing/testing.util';

describe('Tree', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideNullTableStorage(),
        provideTableRowBinding((bindings, _item, index) => {
          // Add row index attribute to locate rows by dataset index.
          bindings.addAttributeBinding('data-row-index', index);
        }),
      ],
    });
  });

  describe('Labels', () => {

    it('should render string labels', async () => {
      const {fixture} = createSciTreeComponent(sciTree<{name: string}, {name: string}>({
        datasource: provideTreeDatasource(signal([{name: 'Alpha'}, {name: 'Beta'}]), () => []),
        label: item => item.name,
      }, {injector: TestBed.inject(Injector)}));

      const tree = new TablePO(fixture, 'sci-tree');
      await tree.waitUntilStable();

      expect(tree.columns).toHaveSize(1);
      expect(await tree.column({index: 0})!.values()).toEqual(['Alpha', 'Beta']);
      expect(tree.column({index: 0})!.sortable).toBeFalse();
      expect(tree.column({index: 0})!.splitter).toBeNull();
      expect(tree.header.element).toBeNull();
    });

    it('should render component labels', async () => {
      const {fixture} = createSciTreeComponent(sciTree<string, string>({
        datasource: provideTreeDatasource(signal(['Alpha', 'Beta']), () => []),
        label: {
          component: item => ({component: NodeLabelComponent, bindings: [inputBinding('label', () => item)]}),
        },
      }, {injector: TestBed.inject(Injector)}));

      const tree = new TablePO(fixture, 'sci-tree');
      await tree.waitUntilStable();

      expect(await tree.column({index: 0})!.values()).toEqual(['Alpha', 'Beta']);
    });

    it('should render template labels', async () => {
      const template = TestBed.createComponent(NodeLabelTemplateComponent).componentInstance.template();
      const {fixture} = createSciTreeComponent(sciTree<string, string>({
        datasource: provideTreeDatasource(signal(['Alpha', 'Beta']), () => []),
        label: {
          template: item => ({template, context: {suffix: `(${item.length})`}}),
        },
      }, {injector: TestBed.inject(Injector)}));

      const tree = new TablePO(fixture, 'sci-tree');
      await tree.waitUntilStable();

      expect(await tree.column({index: 0})!.values()).toEqual(['Alpha (5)', 'Beta (4)']);
    });
  });

  describe('Public API', () => {

    it('should expand and collapse all nodes', async () => {
      const children = new Map([['parent', ['child']], ['child', ['grandchild']]]);
      const {fixture, model} = createSciTreeComponent(sciTree<string, string>({
        datasource: provideTreeDatasource(signal(['parent', 'leaf']), item => children.get(item) ?? []),
        label: item => item,
      }, {injector: TestBed.inject(Injector)}));

      const tree = new TablePO(fixture, 'sci-tree');
      await tree.waitUntilStable();
      expect(await tree.column({index: 0})!.values()).toEqual(['parent', 'leaf']);

      model.expandAll();
      await tree.waitUntilStable();
      expect(await tree.column({index: 0})!.values()).toEqual(['parent', 'child', 'grandchild', 'leaf']);

      model.collapseAll();
      await tree.waitUntilStable();
      expect(await tree.column({index: 0})!.values()).toEqual(['parent', 'leaf']);
    });

    it('should select a node by its ID', async () => {
      const child = {id: 'child', name: 'Child'};
      const parent = {id: 'parent', name: 'Parent'};
      const {fixture, model} = createSciTreeComponent(sciTree<{id: string; name: string}, string>({
        datasource: provideTreeDatasource(signal([parent]), item => item.id === 'parent' ? [child] : []),
        label: item => item.name,
        trackBy: item => item.id,
      }, {injector: TestBed.inject(Injector)}));

      const tree = new TablePO(fixture, 'sci-tree');
      await tree.waitUntilStable();
      expect(model.selectedItems()).toEqual([]);
      expect(model.activeItem()).toBeUndefined();

      model.select('child');
      await tree.waitUntilStable();

      expect(await tree.column({index: 0})!.values()).toEqual(['Parent', 'Child']);
      expect(model.selectedItems()).toEqual(['child']);
      expect(model.activeItem()).toBe('child');
      expect(tree.row({index: 1}).isSelected()).toBeTrue();
      expect(tree.row({index: 1}).isActive()).toBeTrue();
    });

    it('should select multiple IDs', async () => {
      const {fixture, model} = createSciTreeComponent(sciTree<string, string>({
        datasource: provideTreeDatasource(signal(['Alpha', 'Beta', 'Gamma']), () => []),
        label: item => item,
      }, {injector: TestBed.inject(Injector)}));
      const tree = new TablePO(fixture, 'sci-tree');
      await tree.waitUntilStable();

      model.select(['Alpha', 'Gamma']);
      await tree.waitUntilStable();

      expect(model.selectedItems()).toEqual(['Alpha', 'Gamma']);
      expect(model.activeItem()).toBe('Gamma');
      expect(tree.rows.map(row => row.isSelected())).toEqual([true, false, true]);
    });

    it('should initialize selection mode from the tree descriptor', async () => {
      const {fixture, model} = createSciTreeComponent(sciTree<string, string>({
        datasource: provideTreeDatasource(signal(['Alpha']), () => []),
        label: item => item,
        selectable: false,
      }, {injector: TestBed.inject(Injector)}));

      const tree = new TablePO(fixture, 'sci-tree');
      await tree.waitUntilStable();
      tree.row({index: 0}).select();

      await tree.waitUntilStable();
      expect(tree.row({index: 0}).isSelected()).toBeFalse();
      expect(model.selectedItems()).toEqual([]);
    });

    it('should apply changes to the public selection mode signal', async () => {
      const {fixture, model} = createSciTreeComponent(sciTree<string, string>({
        datasource: provideTreeDatasource(signal(['Alpha', 'Beta']), () => []),
        label: item => item,
      }, {injector: TestBed.inject(Injector)}));

      const tree = new TablePO(fixture, 'sci-tree');
      await tree.waitUntilStable();
      expect(model.selectable()).toBe('multi');

      model.selectable.set(false);
      await tree.waitUntilStable();
      tree.row({index: 0}).select();
      await tree.waitUntilStable();
      expect(model.selectedItems()).toEqual([]);

      model.selectable.set('single');
      await tree.waitUntilStable();
      tree.row({index: 0}).select();
      await tree.waitUntilStable();
      expect(model.selectedItems()).toEqual(['Alpha']);
    });

    it('should filter by label', async () => {
      const {fixture, model} = createSciTreeComponent(sciTree<string, string>({
        datasource: provideTreeDatasource(signal(['Alpha', 'Beta']), () => []),
        label: item => item,
      }, {injector: TestBed.inject(Injector)}));

      const tree = new TablePO(fixture, 'sci-tree');
      await tree.waitUntilStable();

      model.filter('Beta');
      await tree.waitUntilStable();
      expect(tree.rows.map(row => row.cells[0]!.value)).toEqual(['Beta']);

      model.filter(null);
      await tree.waitUntilStable();
      expect(await tree.column({index: 0})!.values()).toEqual(['Alpha', 'Beta']);
    });

    it('should filter by custom matcher', async () => {
      const {fixture, model} = createSciTreeComponent(sciTree<string, string>({
        datasource: provideTreeDatasource(signal(['Alpha', 'Beta']), () => []),
        label: item => item,
        filterable: {matcher: (text, context) => text === 'test' && context.label === 'Alpha'},
      }, {injector: TestBed.inject(Injector)}));

      const tree = new TablePO(fixture, 'sci-tree');
      await tree.waitUntilStable();

      model.filter('Alpha');
      await tree.waitUntilStable();
      expect(tree.rows.map(row => row.cells[0]!.value)).toEqual([]);

      model.filter('test');
      await tree.waitUntilStable();
      expect(tree.rows.map(row => row.cells[0]!.value)).toEqual(['Alpha']);

      model.filter(null);
      await tree.waitUntilStable();
      expect(await tree.column({index: 0})!.values()).toEqual(['Alpha', 'Beta']);
    });

    it('should enable the node filter through the public filterable signal', async () => {
      const {fixture, model} = createSciTreeComponent(sciTree<string, string>({
        datasource: provideTreeDatasource(signal(['Alpha', 'Beta']), () => []),
        label: item => item,
      }, {injector: TestBed.inject(Injector)}));

      const tree = new TablePO(fixture, 'sci-tree');
      await tree.waitUntilStable();
      expect(model.filterable()).toBeFalse();
      expect(tree.column({index: 0})!.filterable).toBeFalse();

      model.filterable.set(true);
      await tree.waitUntilStable();
      expect(tree.column({index: 0})!.filterable).toBeTrue();
      expect(tree.column({index: 0})!.sortable).toBeFalse();

      await tree.column({index: 0})!.filter('Beta');
      expect(await tree.column({index: 0})!.values()).toEqual(['Beta']);

      model.filterable.set(false);
      await tree.waitUntilStable();
      expect(tree.column({index: 0})!.filterable).toBeFalse();
    });

    it('should pass the item and label to the tree filter matcher', async () => {
      const alpha = {name: 'Alpha'};
      const beta = {name: 'Beta'};
      const matcher = jasmine.createSpy().and.callFake((text: string, context: {label?: string}) => context.label === text);
      const {fixture, model} = createSciTreeComponent(sciTree<{name: string}, {name: string}>({
        datasource: provideTreeDatasource(signal([alpha, beta]), () => []),
        label: item => item.name,
        filterable: {matcher},
      }, {injector: TestBed.inject(Injector)}));

      const tree = new TablePO(fixture, 'sci-tree');
      await tree.waitUntilStable();
      expect(model.filterable()).toBeTrue();

      model.filter('Beta');
      await tree.waitUntilStable();

      expect(matcher).toHaveBeenCalledWith('Beta', jasmine.objectContaining({item: beta, label: 'Beta'}));
      expect(tree.rows.map(row => row.cells[0]!.value)).toEqual(['Beta']);
    });

    it('should apply node actions', async () => {
      const onSelect = jasmine.createSpy();
      const {fixture} = createSciTreeComponent(sciTree<string, string>({
        datasource: provideTreeDatasource(signal(['Alpha', 'Beta']), () => []),
        label: item => item,
        nodeActions: (toolbar, item) => toolbar.addToolbarButton({
          icon: 'delete',
          cssClass: 'spec-node-action',
          onSelect: () => {
            onSelect(item);
          },
        }),
      }, {injector: TestBed.inject(Injector)}));
      const tree = new TablePO(fixture, 'sci-tree');
      await tree.waitUntilStable();

      tree.row({index: 1}).hover();
      await tree.waitUntilStable();
      tree.row({index: 1}).rowAction({cssClass: 'spec-node-action'}).click();
      await tree.waitUntilStable();

      expect(onSelect).toHaveBeenCalledOnceWith('Beta');
    });

    it('should apply node bindings', async () => {
      const {fixture, model} = createSciTreeComponent(sciTree<string, string>({
        datasource: provideTreeDatasource(signal(['parent']), item => item === 'parent' ? ['child'] : []),
        label: item => item,
        nodeBindings: (bindings, item, index) => bindings
          .addAttributeBinding('data-spec-node', `${index}:${item}`)
          .addClassBinding(`spec-${item}`)
          .addPartBinding(`node:${item}`)
          .addIconBinding('icon')
          .addIconBinding(item),
      }, {injector: TestBed.inject(Injector)}));
      const tree = new TablePO(fixture, 'sci-tree');
      await tree.waitUntilStable();

      model.expandAll();
      await tree.waitUntilStable();

      expect(tree.row({index: 0}).element.getAttribute('data-spec-node')).toBe('0:parent');
      expect(tree.row({index: 1}).element.getAttribute('data-spec-node')).toBe('1:child');
      expect(tree.row({index: 1}).element).toHaveClass('spec-child');
      expect(tree.row({index: 1}).cells[0]!.element.part).toContain('node:child');
      expect(tree.row({index: 0}).icon()).toEqual(['icon', 'parent']);
      expect(tree.row({index: 1}).icon()).toEqual(['icon', 'child']);
    });
  });

  describe('Async Data Source', () => {

    it('should translate column and global filters into the tree IDs request', async () => {
      const getIds = jasmine.createSpy().and.returnValue([{item: 'parent'}, {item: 'child', parent: 'parent'}]);
      const getItems = jasmine.createSpy().and.callFake((ids: string[]) => ids);
      const {fixture, model} = createSciTreeComponent(sciTree<string, string>({
        datasource: provideAsyncTreeDatasource(getIds, getItems),
        label: item => item,
        filterable: true,
      }, {injector: TestBed.inject(Injector)}));

      const tree = new TablePO(fixture, 'sci-tree');
      await tree.waitUntilStable();
      expect(getIds).toHaveBeenCalledOnceWith({filter: []});
      expect(getItems).toHaveBeenCalledOnceWith(['parent']);
      getIds.calls.reset();

      model.filter('global');
      await tree.waitUntilStable();
      expect(getIds).toHaveBeenCalledOnceWith({filter: ['global']});
      getIds.calls.reset();

      await tree.column({index: 0})!.filter('node');
      expect(getIds).toHaveBeenCalledOnceWith({filter: ['node', 'global']});
      getIds.calls.reset();

      model.filter(null);
      await tree.waitUntilStable();
      expect(getIds).toHaveBeenCalledOnceWith({filter: ['node']});
    });

    it('should expand and collapse async tree', async () => {
      const {fixture, model} = createSciTreeComponent(sciTree<string, string>({
        datasource: provideAsyncTreeDatasource(
          () => [{item: 'parent'}, {item: 'child', parent: 'parent'}, {item: 'grandchild', parent: 'child'}],
          ids => ids,
        ),
        label: item => item,
      }, {injector: TestBed.inject(Injector)}));

      const tree = new TablePO(fixture, 'sci-tree');
      await tree.waitUntilStable();

      model.expandAll();
      await tree.waitUntilStable();
      expect(await tree.column({index: 0})!.values()).toEqual(['parent', 'child', 'grandchild']);

      model.collapseAll();
      await tree.waitUntilStable();
      expect(await tree.column({index: 0})!.values()).toEqual(['parent']);
    });

    it('should use pageSize, bufferSize and nodeHeight', async () => {
      const getItems = jasmine.createSpy().and.callFake((ids: string[]) => ids);

      const {fixture, model} = createSciTreeComponent(sciTree<string, string>({
        datasource: provideAsyncTreeDatasource(
          () => [{item: 'parent'}, {item: 'child', parent: 'parent'}, {item: 'grandchild', parent: 'child'}, {item: 'sibling1'}, {item: 'sibling2'}, {item: 'sibling3'}],
          getItems,
        ),
        label: item => item,
        bufferSize: 0,
        pageSize: 2,
      }, {injector: TestBed.inject(Injector)}), {designTokens: {'--sci-tree-node-height': '50px'}, height: '100px'});

      const tree = new TablePO(fixture, 'sci-tree');
      await tree.waitUntilStable();
      expect(getItems).toHaveBeenCalledTimes(1);
      expect(getItems).toHaveBeenCalledWith(['parent', 'sibling1']);
      getItems.calls.reset();

      model.expandAll();
      await tree.waitUntilStable();
      expect(await tree.column({index: 0})!.values({rows: 'dom'})).toEqual(['parent', 'child']);
      expect(getItems).toHaveBeenCalledWith(['child']);

      await tree.scrollY({y: 100});
      expect(await tree.column({index: 0})!.values({rows: 'dom'})).toEqual(['grandchild', 'sibling1']);
      expect(getItems).toHaveBeenCalledWith(['grandchild']);
      expect(getItems).toHaveBeenCalledTimes(2);
    });
  });

  describe('Component', () => {

    it('should forward the primary action event through the tree output', async () => {
      const item = {id: 'Alpha'};
      const {fixture} = createSciTreeComponent(sciTree<{id: string}, {id: string}>({
        datasource: provideTreeDatasource(signal([item]), () => []),
        label: item => item.id,
      }, {injector: TestBed.inject(Injector)}));
      const onPrimaryAction = jasmine.createSpy();
      fixture.componentInstance.primaryAction.subscribe(onPrimaryAction);
      const tree = new TablePO(fixture, 'sci-tree');
      await tree.waitUntilStable();

      tree.row({index: 0}).dblClick();

      expect(onPrimaryAction).toHaveBeenCalledOnceWith(jasmine.objectContaining({items: [item], sourceEvent: jasmine.any(MouseEvent)}));
    });

    it('should destroy the attached table and node components when the tree is destroyed', async () => {
      const onDestroy = jasmine.createSpy();
      const {fixture} = createSciTreeComponent(sciTree<string, string>({
        datasource: provideTreeDatasource(signal(['Alpha']), () => []),
        label: {
          component: item => ({
            component: NodeLabelComponent,
            bindings: [inputBinding('label', () => item), inputBinding('onDestroy', () => onDestroy)],
          }),
        },
      }, {injector: TestBed.inject(Injector)}));
      const tree = new TablePO(fixture, 'sci-tree');
      await tree.waitUntilStable();
      expect(await tree.column({index: 0})!.values()).toEqual(['Alpha']);
      expect(onDestroy).not.toHaveBeenCalled();

      fixture.destroy();

      expect(onDestroy).toHaveBeenCalledTimes(1);
    });
  });
});

@Component({
  selector: 'spec-node-label',
  template: '{{label()}}',
})
class NodeLabelComponent {
  public readonly label = input.required<string>();
  public readonly onDestroy = input<() => void>();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.onDestroy()?.());
  }
}

@Component({
  selector: 'spec-node-label-template',
  template: '<ng-template let-item let-suffix="suffix">{{item}} {{suffix}}</ng-template>',
})
class NodeLabelTemplateComponent {
  public readonly template = viewChild.required<TemplateRef<unknown>>(TemplateRef);
}
