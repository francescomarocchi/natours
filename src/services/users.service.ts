import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { inject, injectable } from 'inversify';
import { Document } from 'mongoose';
import { Observable, combineLatest, from, map, of, switchMap, tap } from 'rxjs';
import { AppError } from '../model/error';
import { IUser, User, UserRoles } from '../model/user';
import { sendForgotPasswordEmail } from '../utils/operators/send-forgot-password-email';
import { EMPTY } from '../utils/types/empty';
import { ForCookie } from '../utils/types/for-cookie';
import { Rudi } from './rudi';
import { JWT_COOKIE_EXPIRES_IN } from '../utils/constants';

@injectable()
export class UserService extends Rudi<IUser> {

  constructor(@inject(JWT_COOKIE_EXPIRES_IN) private readonly jwtCookieExpiresIn: number) {
    super(User);
  }

  public createUserAndToken$(user: IUser): Observable<ForCookie<IUser>> {
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
        // Serializing and parsing newUser to have it on output.
        // newUser.get('doc') doesn't work as expected :(
        const serializedNewUser = JSON.stringify(newUser);
        const deserializedNewUser = JSON.parse(serializedNewUser);
        deserializedNewUser.password = undefined;
        return new ForCookie({ ...deserializedNewUser, token }, token, this.jwtCookieExpiresIn);
      }),
    );
  }

  public getUser$(email: string): Observable<IUser | null> {
    return from(User.findOne<IUser>({ email }));
  }

  public login$(
    email: string,
    password: string,
  ): Observable<AppError | ForCookie<string>> {
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
      map(([id, role, logged]) => {
        if (!logged) {
          return new AppError('Incorrect email or password', 401);
        }
        const token = this.createToken(id, role as UserRoles);
        return new ForCookie(token, token, this.jwtCookieExpiresIn);
      }),
    );
  }

  public logout$(): Observable<ForCookie<string>> {
    return of(new ForCookie('', '', 10 * 1_000));
  }

  public updateAuthenticatedUser$(
    userId: string,
    name: string,
    email: string,
    photo?: string,
  ): Observable<AppError | IUser> {
    return from(
      User.findByIdAndUpdate<IUser>(
        userId,
        { name, email, photo },
        { new: true, runValidators: true },
      ),
    ).pipe(map((user) => (user ? user : new AppError('User not found', 400))));
  }

  public deleteUser$(userId: string): Observable<AppError | EMPTY> {
    return from(User.findByIdAndUpdate<IUser>(userId, { active: false })).pipe(
      map((user) => (user ? 'empty' : new AppError('User not found'))),
    );
  }

  public createResetToken$(email: string): Observable<AppError | string> {
    return this.getUser$(email).pipe(
      switchMap((user) => {
        if (!user) {
          return of(new AppError('User not found', 400));
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
  ): Observable<ForCookie<string> | AppError> {
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
      map((user) => {
        if (user instanceof AppError) {
          return user;
        }
        const token = this.createToken(user.id, user.role);
        return new ForCookie(token, token, this.jwtCookieExpiresIn);
      }),
    );
  }

  public changePassword$(
    userId: string,
    currentPassword: string,
    password: string,
    passwordConfirm: string,
  ): Observable<ForCookie<string> | AppError> {
    return from(User.findById(userId).select('+password')).pipe(
      switchMap((user) => {
        return combineLatest([
          of(user),
          user ? bcrypt.compare(currentPassword, user.password) : of(false),
        ]);
      }),
      switchMap(([user, isPasswordMatching]) => {
        if (!user || !isPasswordMatching) {
          return of(
            new AppError('User id is not found or password not matching', 401),
          );
        }

        user.password = password;
        user.passwordConfirm = passwordConfirm;

        return user.save();
      }),
      map((user) => {
        if (user instanceof AppError) {
          return user;
        }
        const token = this.createToken(user.id, user.role);
        return new ForCookie(token, token, this.jwtCookieExpiresIn);
      }),
    );
  }

  private createToken(id: string, role: UserRoles): string {
    return jwt.sign({ id, role, iat: new Date().getTime() }, process.env.JWT_SECRET as jwt.Secret, {
      expiresIn: this.jwtCookieExpiresIn
    });
  }
}
