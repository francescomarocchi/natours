import bcrypt from 'bcryptjs';
import { Response } from 'express';
import { inject } from 'inversify';
import jwt from 'jsonwebtoken';
import { Observable, combineLatest, from, map, of, switchMap } from 'rxjs';
import { AppError } from '../../model/error';
import { IUser, User, UserRoles } from '../../model/user';
import { UserService } from '../../services/users.service';
import { controller } from '../../utils/decorators/controller.decorator';
import { httpMethod } from '../../utils/decorators/http-method.decorator';
import { params } from '../../utils/decorators/parameters.decorator';
import { Document } from 'mongoose';

@controller('/')
export class AuthController {
	constructor(@inject(UserService) private readonly userService: UserService) { }

	@httpMethod('post', '/signup')
	public signup(@params('body') user: IUser): Observable<IUser> {
		return this.userService.createUser$(user).pipe(
			map((newUser: Document<unknown, {}, IUser>) => {
				const token = this.createToken(newUser.id, newUser.get('role'));
				return { ...newUser.get('_doc'), token };
			})
		);
	}

	@httpMethod('post', '/login')
	public login(
		@params('body') credentials: { email: string; password: string },
		@params('response') response: Response
	): Observable<string | AppError> {
		const { email, password } = credentials;

		if (!email || !password) {
			throw new AppError('Please provide correct email address and password', 400);
		}

		// TODO: this crap should be refactored
		response.locals.statusCode = 200;

		return from(User.findOne({ email }).select('+password')).pipe(
			switchMap((user) => {
				if (!user?.password) {
					return of([undefined, false]);
				}
				return combineLatest([of(user.id), of(user.get('role')), from(bcrypt.compare(password, user?.password))]);
			}),
			map(([id, role, logged]) =>
				logged ? this.createToken(id, role) : new AppError('Incorrect email or password', 401)
			)
		);
	}

	private createToken(id: string, role: UserRoles): string {
		return jwt.sign({ id, role }, process.env.JWT_SECRET as jwt.Secret, {
			expiresIn: process.env.JWT_EXPIRES_IN,
		});
	}
}
