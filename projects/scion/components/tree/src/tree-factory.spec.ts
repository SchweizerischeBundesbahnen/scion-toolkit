import {effect, Injector, runInInjectionContext, signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {TablePO} from '../../table/src/table.po';
import {createSciTreeComponent} from './testing/testing.util';
import {tree} from './tree.factory';
import {provideTreeDatasource, SciTreeNode, ɵprovideTreeDatasource} from './tree-datasource';
import {SciTree} from './tree.model';

describe('Tree Factory', () => {

  it('should create tree (calling injection context)', async () => {
    const {fixture} = runInInjectionContext(TestBed.inject(Injector), () => createSciTreeComponent(tree<string>({
      datasource: provideTreeDatasource(signal(['parent']), () => []),
      label: item => item,
    })));

    const sciTree = new TablePO(fixture, 'sci-tree');
    await sciTree.waitUntilStable();

    expect(sciTree.rows[0]!.cells.map(cell => cell.value)).toEqual(['parent']);
  });

  it('should create tree (manual injector)', async () => {
    const {fixture} = createSciTreeComponent(tree<string>({
      datasource: provideTreeDatasource(signal(['parent']), () => []),
      label: item => item,
      injector: TestBed.inject(Injector),
    }));

    const sciTree = new TablePO(fixture, 'sci-tree');
    await sciTree.waitUntilStable();

    expect(sciTree.rows[0]!.cells.map(cell => cell.value)).toEqual(['parent']);
  });

  it('should throw error if not called in injection context', () => {
    expect(() => tree<string>({
      label: () => '',
      datasource: provideTreeDatasource(signal([] as string[]), () => []),
    })).toThrowError(/NG0203:/i);
  });

  it('should error if called in reactive context', done => {
    effect(() => {
      expect(() => tree<string>({
        label: () => '',
        datasource: provideTreeDatasource(signal([] as string[]), () => []),
        injector: TestBed.inject(Injector),
      })).toThrowError(/NG0602:/i);
      done();
    }, {injector: TestBed.inject(Injector)});
  });

  it('should infer data types (no type error)', () => {
    interface Item {
      id: string;
    }
    const data = signal<Item[]>([]);

    // In-Memory datasource, infer ID generic from datasource.
    expect(() => tree({
      datasource: provideTreeDatasource(data, () => new Array<Item>()),
      label: item => item.id,
      injector: TestBed.inject(Injector),
    }) satisfies SciTree<Item>).not.toThrow();

    // In-Memory datasource, infer ID generic from trackBy.
    expect(() => tree({
      datasource: provideTreeDatasource(data, () => new Array<Item>()),
      label: item => item.id,
      trackBy: item => item.id,
      injector: TestBed.inject(Injector),
    }) satisfies SciTree<string>).not.toThrow();

    // Custom datasource, infer ID generic from datasource.
    expect(() => tree({
      datasource: ɵprovideTreeDatasource({
        getTreeNodes: () => new Array<SciTreeNode<Item>>(),
        getItems: () => new Array<Item>(),
      }),
      label: item => item.id,
      injector: TestBed.inject(Injector),
    }) satisfies SciTree<Item>).not.toThrow();

    // Custom datasource, infer ID generic from datasource with trackBy.
    expect(() => tree({
      datasource: ɵprovideTreeDatasource({
        getTreeNodes: () => new Array<SciTreeNode<string>>(),
        getItems: () => new Array<Item>(),
      }),
      label: item => item.id,
      trackBy: item => item.id,
      injector: TestBed.inject(Injector),
    }) satisfies SciTree<string>).not.toThrow();
  });
});
