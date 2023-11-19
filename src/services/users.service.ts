import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { injectable } from 'inversify';
import jwt from 'jsonwebtoken';
import { Document } from 'mongoose';
import { Observable, combineLatest, from, map, of, switchMap } from 'rxjs';
import { AppError } from '../model/error';
import { IUser, User, UserRoles } from '../model/user';
import { sendForgotPasswordEmail } from '../utils/operators/send-forgot-password-email';

@injectable()
export class UserService {
  public createUserAndToken$(user: IUser): Observable<IUser> {
    return from(
      User.create({
        name: user.name,
        email: user.email,
        role: user.role,
        password: user.password,
        passwordConfirm: user.passwordConfirm,
      }),
    ).pipe(
      map((newUser: Document<unknown, {}, IUser>) => {
        const token = this.createToken(newUser.id, newUser.get('role'));
        return { ...newUser.get('_doc'), token };
      }),
    );
  }

  public getUser$(email: string): Observable<IUser | null> {
    return from(User.findOne<IUser>({ email }));
  }

  public login$(email: string, password: string) {
    return from(User.findOne({ email }).select('+password')).pipe(
      switchMap((user) => {
        if (!user?.password) {
          return of([undefined, false]);
        }
        return combineLatest([
          of(user.id),
          of(user.get('role')),
          from(bcrypt.compare(password, user?.password)),
        ]);
      }),
      map(([id, role, logged]) =>
        logged
          ? this.createToken(id, role)
          : new AppError('Incorrect email or password', 401),
      ),
    );
  }

  public createResetToken$(email: string): Observable<AppError | string> {
    return this.getUser$(email).pipe(
      switchMap((user) => {
        if (!user) {
          return of(new AppError('User not found'));
        }

        const resetToken = user.createPasswordResetToken();
        return resetToken;
      }),
      sendForgotPasswordEmail(),
      map((emailSent) => {
        if (emailSent instanceof AppError) {
          return emailSent;
        }

        return 'Reset token has been sent by email!';
      }),
    );
  }

  public resetPassword$(
    resetToken: string,
    password: string,
    passwordConfirm: string,
  ): Observable<string | AppError> {
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    return from(
      User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpireDate: { $gt: Date.now() },
      }),
    ).pipe(
      switchMap((user) => {
        if (!user) {
          return of(new AppError('Token is invalid or has expired', 400));
        }

        user.password = password;
        user.passwordConfirm = passwordConfirm;
        user.passwordResetToken = undefined;
        user.passwordResetExpireDate = undefined;

        return user.save();
      }),
      map((user) =>
        user instanceof AppError ? user : this.createToken(user.id, user.role),
      ),
    );
  }

  private createToken(id: string, role: UserRoles): string {
    return jwt.sign({ id, role }, process.env.JWT_SECRET as jwt.Secret, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
  }
}
