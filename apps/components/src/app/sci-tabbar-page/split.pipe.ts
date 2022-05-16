import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'appSplit'})
export class SplitPipe implements PipeTransform {

  public transform(value: string, separator: string): string[] {
    return value ? value.split(separator) : [];
  }
}
