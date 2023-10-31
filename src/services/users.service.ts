import { injectable } from "inversify";
import { Observable, from } from "rxjs";
import { IUser, User } from "../model/user";
import { Document } from "mongoose";

@injectable()
export class UserService {
	public createUser$(user: IUser): Observable<Document<unknown, {}, IUser>> {
		return from(
			User.create({
				name: user.name,
				email: user.email,
				password: user.password,
				passwordConfirm: user.passwordConfirm,
			}),
		);
	}
}
