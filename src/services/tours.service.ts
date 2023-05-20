import { injectable } from "inversify";
import { Observable, from } from "rxjs";
import { ITour, Tour } from "../model/tour";

@injectable()
export class ToursService {
	public getTours$(): Observable<ITour[]> {
		return from(Tour.find().exec());
	}

	public getTour$(id: string): Observable<ITour | null> {
		return from(Tour.findById(id).exec());
	}

	public createTour$(tour: ITour): Observable<ITour> {
		return from(Tour.create(tour));
	}
}
