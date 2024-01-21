import express from 'express';
export interface ExtendedRequest extends express.Request {
  locals: {
    id: string;
    role: string;
  };
}
