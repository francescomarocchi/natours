import { UploadedFile } from 'express-fileupload';
import path from 'path';

export const getUploadPath = (folder: string, photo: string): string => {
  const main = path.dirname(require.main?.filename ?? '');
  const uploadPath = main + folder + photo;
  return uploadPath;
};