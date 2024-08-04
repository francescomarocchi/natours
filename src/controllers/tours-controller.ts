import { inject } from 'inversify';
import { forkJoin, from, map, Observable, switchMap, tap } from 'rxjs';
import { controller } from '../utils/decorators/controller.decorator';
import { ToursService, Units } from '../services/tours.service';
import { RouterBinding } from '../utils/types/newable-function-with-properties';
import { httpMethod } from '../utils/decorators/http-method.decorator';
import { params } from '../utils/decorators/parameters.decorator';
import { ITour } from '../model/tour';
import { TourRatingAggregate } from '../model/tour-rating-aggregate';
import { AppError } from '../model/error';
import { authorize } from '../utils/decorators/authorize.decorator';
import { UserRoles } from '../model/user';
import { TourMonthlyPlanAggregate } from '../model/tour-monthly-plan-aggregate';
import { FileArray, UploadedFile } from 'express-fileupload';
import { getUploadPath } from '../utils/get-upload-path';
import sharp from 'sharp';

@controller('/api/v1/tours')
export class ToursController {
  constructor(
    @inject(ToursService) private readonly toursService: ToursService
  ) {
  }

  public bindRouter(): RouterBinding {
    return { local: '/:tourId/reviews', target: '/api/v1/reviews' };
  }

  @httpMethod('get', '/')
  public getTours(@params('query') query: ITour): Observable<ITour[]> {
    return this.toursService.getList$(query).pipe(
      tap((tours) => {
        if (!tours) throw new Error('could not get tours');
      })
    );
  }

  @httpMethod('get', '/:id')
  public getTour(@params('params', 'id') id: string): Observable<ITour | null> {
    return this.toursService.get$(id);
  }

  @httpMethod('get', '/top-5-cheap')
  public getTopCheapestFive(): Observable<ITour[]> {
    return this.toursService.getList$({
      sort: '-price -ratingsAverage',
      page: '1',
      limit: '5'
    } as unknown as ITour);
  }

  @httpMethod('get', '/tour-stats')
  public getTourStats(): Observable<TourRatingAggregate[]> {
    return this.toursService.getTourStatistics$();
  }

  @httpMethod('get', '/tours-within/:distance/center/:coords/unit/:unit')
  public getToursWithin(
    @params('params', 'distance') distance: number,
    @params('params', 'coords') coords: string,
    @params('params', 'unit') unit: Units
  ): Observable<ITour[]> {
    const [latitude, longitude] = coords.split(',');
    if (
      [latitude, longitude].some((coordinate) => isNaN(parseInt(coordinate)))
    ) {
      throw new AppError(
        `latitude "${latitude}" or longitude "${longitude}" are invalid`,
        400
      );
    }
    return this.toursService.getToursWithin$(
      distance,
      parseFloat(latitude),
      parseFloat(longitude),
      unit
    );
  }

  @httpMethod('get', '/distances/:coords/unit/:unit')
  public getToursDistances(
    @params('params', 'coords') coords: string,
    @params('params', 'unit') unit: Units
  ): Observable<ITour[]> {
    const [latitude, longitude] = coords.split(',');
    if (
      [latitude, longitude].some((coordinate) => isNaN(parseInt(coordinate)))
    ) {
      throw new AppError(
        `latitude "${latitude}" or longitude "${longitude}" are invalid`,
        400
      );
    }
    return this.toursService.getDistances$(
      parseFloat(latitude),
      parseFloat(longitude),
      unit
    );
  }

  @authorize([UserRoles.Admin, UserRoles.LeadGuide, UserRoles.Guide])
  @httpMethod('get', '/monthly-plan/:year')
  public getMonthlyPlan(
    @params('params', 'year') year: string
  ): Observable<TourMonthlyPlanAggregate[]> {
    return this.toursService.getMonthlyPlan$(+year);
  }

  @authorize([UserRoles.Admin, UserRoles.LeadGuide])
  @httpMethod('post', '/')
  public createTour(@params('body') tour: ITour): Observable<ITour> {
    return this.toursService.create$(tour);
  }

  @authorize([UserRoles.Admin, UserRoles.LeadGuide])
  @httpMethod('patch', '/:id/images')
  public uploadTourImages(
    @params('params', 'id') id: string,
    @params('files') files: FileArray): Observable<ITour | null> {
    if (!files?.imageCover || !files.images) {
      throw new AppError('Either imageCover and images have to be attached!', 400);
    }

    const sharpenedImages: Observable<{ name: string, image: sharp.OutputInfo }>[] = [];

    const imageCoverFile = files.imageCover as UploadedFile;
    const imageCoverFileName = `tour-${id}-${Date.now()}-cover.jpeg`;
    const uploadPath = getUploadPath('/../public/img/tours/', imageCoverFileName);

    // First image we need to take care of
    sharpenedImages.push(
      from(sharp(imageCoverFile.data).resize(2000, 1333).toFile(uploadPath)).pipe(map((img: sharp.OutputInfo) => ({
        name: imageCoverFileName,
        image: img
      }))));

    const imageFiles = files.images as UploadedFile[];
    const uploadPaths: Observable<{ name: string, image: sharp.OutputInfo }>[] = imageFiles.map(((imageFile, index) => {
        const imageName = `tour-${id}-${Date.now()}-${index}-image.jpeg`;
        return from(sharp(imageFile.data).resize(2000, 1333).toFile(getUploadPath('/../public/img/tours/', imageName))).pipe(
          map((img: sharp.OutputInfo) => ({
            name: imageName,
            image: img
          }))
        );
      })
    );
    sharpenedImages.push(...uploadPaths);

    return forkJoin(sharpenedImages).pipe(
      switchMap((images) => {
        const [imageCover, ...otherImages] = images;
        return this.toursService.update$(id, {
          imageCover: imageCover.name,
          images: otherImages.map(i => i.name)
        });
      })
    );
  }

  @authorize([UserRoles.Admin, UserRoles.LeadGuide])
  @httpMethod('patch', '/:id')
  public updateTour(
    @params('body') tour: ITour,
    @params('params', 'id') id: string
  ): Observable<ITour | null> {
    return this.toursService.update$(id, tour);
  }

  @authorize([UserRoles.Admin, UserRoles.LeadGuide])
  @httpMethod('delete', '/:id')
  public deleteTour(
    @params('params', 'id') id: string
  ): Observable<ITour | null> {
    return this.toursService.delete$(id);
  }
}
