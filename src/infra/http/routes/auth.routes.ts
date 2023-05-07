import { Router } from 'express';
import { AuthenticateUserController } from '../../../controllers/auth';

const authRoutes = Router();

const authenticateUserController = new AuthenticateUserController();

authRoutes.post('/', authenticateUserController.handle);

export { authRoutes };
