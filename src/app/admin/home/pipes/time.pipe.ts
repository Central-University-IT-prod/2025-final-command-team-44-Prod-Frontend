import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'time',
  standalone: true
})
export class TimePipe implements PipeTransform {
  transform(value: number, ...args: unknown[]): string {
    return (String(Math.floor(value/60)).length == 1 ? "0" : "")
    + String(Math.floor(value/60))
    + ":"
    + (String(value % 60).length == 1 ? "0" : "")
    +  String(value % 60)
  }

}
