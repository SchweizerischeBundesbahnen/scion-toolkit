import {ComponentFixture, TestBed} from '@angular/core/testing';
import {SciTree, SciTreeComponent} from '@scion/components/tree';
import {EnvironmentProviders, inputBinding} from '@angular/core';
import {Objects} from '@scion/toolkit/util';
import {ɵSciTree} from '../ɵtree.model';
import {provideComponentsStorage} from '@scion/components/common';

/**
 * Creates {@link SciTreeComponent}, configuring the tree using the passed callback function.
 */
export function createSciTreeComponent<T, ID = T>(table: SciTree<ID>, options?: {name?: `tree:${string}`; height?: string; width?: string; designTokens?: {[name: `--${string}`]: string}}): {model: ɵSciTree<T, ID>; fixture: ComponentFixture<SciTreeComponent>} {
  const fixture = TestBed.createComponent(SciTreeComponent, {
    bindings: [
      inputBinding('name', () => options?.name ?? 'tree:testee'),
      inputBinding('tree', () => table),
    ],
    inferTagName: true,
  });

  // Style fixture.
  const element = fixture.nativeElement as HTMLElement;
  element.style.height = options?.height ?? '500px';
  element.style.width = options?.width ?? '600px';
  element.style.border = '1px solid var(--sci-color-border)';
  element.style.borderRadius = 'var(--sci-corner)';
  element.style.boxSizing = 'content-box';

  // Set CSS variables.
  Objects.entries(options?.designTokens ?? {}).forEach(([key, value]) => element.style.setProperty(key, value));

  return {model: table as ɵSciTree<T, ID>, fixture};
}

export function provideNullTableStorage(): EnvironmentProviders {
  return provideComponentsStorage(class {
    public load(): null {
      return null;
    }

    public store(): void {
      // NOOP
    }
  });
}
