export const firstAccessEmailTemplate = (
  name: string,
  email: string,
  password: string
) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
  </head>

  <body>
    <h1>Olá ${name.split(' ')[0]}, seja bem-vindo(a) ao Athena!</h1>

    <p>Estas são suas informações de acesso ao sistema:</p>

    <p><strong>E-mail:</strong> ${email}</p>
    <p><strong>Senha:</strong> ${password}</p>

    <footer>
      <i>Atenciosamente, equipe Athena.</i>
    </footer>
  </body>
</html>
`;
