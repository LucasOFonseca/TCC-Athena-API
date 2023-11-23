import { compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { AppError, ErrorMessages } from '../infra/http/errors';
import { EmployeeRepository, StudentRepository } from '../models/repositories';

export class AuthenticationService {
  private employeeRepository = new EmployeeRepository();
  private studentRepository = new StudentRepository();

  async execute(email: string, password: string) {
    let user = await this.employeeRepository.findByEmail(email);

    if (!user) {
      user = {
        ...(await this.studentRepository.findByEmail(email)),
        roles: [],
      };
    }

    const isValidPassword = await compare(password, user.password);

    if (!isValidPassword) throw new AppError(ErrorMessages.MSGE13);

    const token = sign(
      {
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        roles: user.roles,
      },
      process.env.JWT_SECRET,
      {
        subject: user.guid,
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    return token;
  }
}
