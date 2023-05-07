import { compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { AppError, ErrorMessages } from '../infra/http/errors';
import { EmployeeRepository } from '../models/repositories';

export class AuthenticationService {
  private employeeRepository = new EmployeeRepository();

  async execute(email: string, password: string) {
    const employee = await this.employeeRepository.findByEmail(email);

    const isValidPassword = await compare(password, employee.password);

    if (!isValidPassword) {
      throw new AppError(ErrorMessages.MSGE13);
    }

    const token = sign(
      {
        email: employee.email,
        roles: employee.roles,
      },
      process.env.JWT_SECRET,
      {
        subject: employee.guid,
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    return token;
  }
}
