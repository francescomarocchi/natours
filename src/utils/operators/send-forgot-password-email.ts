import nodemailer, { SentMessageInfo, Transporter } from 'nodemailer';
import { MailOptions } from 'nodemailer/lib/json-transport';
import { Observable, OperatorFunction, switchMap } from 'rxjs';
import { AppError } from '../../model/error';

export const sendForgotPasswordEmail = (): ((source: Observable<string | AppError>) => Observable<void | AppError>) => {
  return (source: Observable<string | AppError>): Observable<void | AppError> =>
    source.pipe(
      switchMap(async (resetToken: string | AppError): Promise<void | AppError> => {
        try {
          if (resetToken instanceof AppError) {
            return resetToken;
          }

          const transporter: Transporter<SentMessageInfo> = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
              user: process.env.EMAIL_USERNAME,
              pass: process.env.EMAIL_PASSWORD,
            },
            // debug: true, => ?
            // logger: true, => prints everything on console

            // for gmail activate "less secure app" option
          } as any); // Typescript error, doesn't compile without as any

          const emailBody = `Forgot your password? Submith a PATCH request in 10 minutes with your new password and passwordConfirm at http://localhost:8080/api/v1/users/reset-password?${resetToken}`;

          const mailOptions: MailOptions = {
            from: 'jupiter@nowhere.com',
            to: 'nobody@nowhere.com',
            subject: 'nothing',
            text: emailBody,
          };

          await transporter.sendMail(mailOptions);
          transporter.close();
        } catch (error) {
          return new AppError('Error happened sending email. Try again later', 400);
        }
      })
    );
};
