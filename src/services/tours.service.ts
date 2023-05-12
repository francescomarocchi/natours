import { Observable, map, shareReplay } from "rxjs";
import { readFile$ } from "../utils/read-file$";
import { DATA_FOLDER_PATH } from "../utils/constants";
import { inject, injectable } from "inversify";
import { Tour } from "../routes/interfaces/tour";

@injectable()
export class ToursService {
  constructor(@inject(DATA_FOLDER_PATH) private readonly appRoot: string) { }

  private readonly tours$ = readFile$(`${this.appRoot}/tours-simple.json`).pipe(
    map((tours) => JSON.parse(tours)),
    shareReplay(1),
  );

  public getTours$(): Observable<Tour[]> {
    return this.tours$;
  }
}
