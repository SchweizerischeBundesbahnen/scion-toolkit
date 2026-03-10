import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'sciMapGet'})
export class MapGetPipe implements PipeTransform {
  public transform<K, V>(map: Map<K, V>, key: K): V | undefined {
    return map.get(key);
  }
}
