import { Request, Response } from 'express';
import { AuthenticationService } from '../../services';

export class AuthenticateUserController {
  async handle(req: Request, res: Response) {
    const { email, password } = req.body;

    const authenticationService = new AuthenticationService();

    const accessToken = await authenticationService.execute(email, password);

    return res.json({ accessToken });
  }
}
