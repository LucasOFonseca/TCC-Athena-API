declare namespace Express {
  export interface Request {
    user: {
      guid: string;
      roles: string[];
    };
  }
}
