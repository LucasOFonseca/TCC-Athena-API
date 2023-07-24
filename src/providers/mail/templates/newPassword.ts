export const newPasswordEmailTemplate = (
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
    <h1>Olá ${name.split(' ')[0]}, seus dados de acesso mudaram!</h1>

    <p>
      Esqueceu sua senha ou não encontrou o e-mail com seus dados de acesso? Por questões de segurança geramos uma nova senha para você.
    </p>

    <p><strong>E-mail:</strong> ${email}</p>
    <p><strong>Senha:</strong> ${password}</p>

    <footer>
      <i>Atenciosamente, equipe Athena.</i>
    </footer>
  </body>
</html>
`;
