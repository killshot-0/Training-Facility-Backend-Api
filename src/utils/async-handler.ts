import type { NextFunction, Request, Response } from "express";

type AsyncController<P = any> = (
  req: Request<P>,
  res: Response,
  next: NextFunction, 
) => Promise<unknown>;

export function asyncHandler<P = any>(controller: AsyncController<P>) {
  return (req: Request<P>, res: Response, next: NextFunction) => {
    Promise.resolve(controller(req, res, next)).catch(next);
  };
}