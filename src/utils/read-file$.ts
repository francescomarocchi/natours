import fs from 'fs';
import { Observable } from 'rxjs';

export const readFile$ = (filename: string): Observable<string> =>
  new Observable((subscriber) => {
    fs.readFile(filename, 'utf-8', (error, data) => (error ? subscriber.error(error) : subscriber.next(data)));
  });
