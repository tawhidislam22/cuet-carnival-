declare module "express-serve-static-core" {
  interface Request {
    authUserId?: string;
    authUserRole?: string;
  }
}

export {};
