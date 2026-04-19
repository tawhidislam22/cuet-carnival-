declare global {
  namespace Express {
    interface Request {
      authUserId?: string;
      authUserRole?: string;
    }
  }
}

export {};
