import { NextFunction, Request, Response } from 'express';

export function LoggerMidleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const actualdate = new Date();
  const date = actualdate.toLocaleDateString();
  const time = actualdate.toLocaleTimeString();
  const url = req.url;
  const method = req.method;
  const ip = req.ip;

  console.log(`[${date} ${time}] IP: ${ip} - ${method} ${url}`);
  next();
}
