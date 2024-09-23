import { Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';
dotenv.config();


import mongoSanitize from "express-mongo-sanitize";

export default function sanitizeRoute(req: Request, res: Response, next: NextFunction) {
  req.body = mongoSanitize.sanitize(req.body);
  next();
};