import { Request, Response, NextFunction } from "express";

export function Authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "No token provided",
    });
  }
  if (token != process.env.SECRET_TOKEN) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }
  next();
}
