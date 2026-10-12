import {provideTreeDatasource, tree as sciTree} from '@scion/components/tree';
import {effect, Injector, runInInjectionContext, signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {TablePO} from '../../table/src/table.po';
import {createSciTreeComponent} from './testing/testing.util';

describe('Tree Factory', () => {

  it('should create tree (calling injection context)', async () => {
    const {fixture} = runInInjectionContext(TestBed.inject(Injector), () => createSciTreeComponent(sciTree<string, string>({
      datasource: provideTreeDatasource(signal(['parent']), () => []),
      label: item => item,
    })));

    const tree = new TablePO(fixture, 'sci-tree');
    await tree.waitUntilStable();

    expect(tree.rows[0]!.cells.map(cell => cell.value)).toEqual(['parent']);
  });

  it('should create tree (manual injector)', async () => {
    const {fixture} = createSciTreeComponent(sciTree<string, string>({
      datasource: provideTreeDatasource(signal(['parent']), () => []),
      label: item => item,
    }, {injector: TestBed.inject(Injector)}));

    const tree = new TablePO(fixture, 'sci-tree');
    await tree.waitUntilStable();

    expect(tree.rows[0]!.cells.map(cell => cell.value)).toEqual(['parent']);
  });

  it('should throw error if not called in injection context', () => {
    expect(() => sciTree({
      label: () => '',
      datasource: provideTreeDatasource(signal([]), () => []),
    })).toThrowError(/NG0203:/i);
  });

  it('should error if called in reactive context', done => {
    effect(() => {
      expect(() => sciTree({
        label: () => '',
        datasource: provideTreeDatasource(signal([]), () => []),
      }, {injector: TestBed.inject(Injector)})).toThrowError(/NG0602:/i);
      done();
    }, {injector: TestBed.inject(Injector)});
  });
});
