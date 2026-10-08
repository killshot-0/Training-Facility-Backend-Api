import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";

export function validate(schema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
      file: req.file
    });

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const parsed = result.data as {
      body?: unknown;
      params?: unknown;
      query?: unknown;
      file?: unknown;
    };

    if (parsed.body !== undefined) req.body = parsed.body;
    res.locals.validated = parsed;

    return next();
  };
};