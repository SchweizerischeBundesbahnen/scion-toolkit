import {TemplateRef} from '@angular/core';
import {MaybeSignal} from './signal.util';

export interface SciTemplateDescriptor {
  template: MaybeSignal<TemplateRef<unknown>>;
  context?: {[key: string]: MaybeSignal<unknown>};
}
