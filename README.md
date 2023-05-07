<h1 align="center"><img width="50%" src=".github/logo.svg" alt="Athena API"/></h1>

API desenvolvida como parte do Trabalho de Conclusão de Curso (TCC) do Curso de Sistemas de Informação.

## Descrição

O sistema desenvolvido tem como objetivo oferecer uma ferramenta completa para a gestão acadêmica de instituições de ensino de diferentes tipos e portes, permitindo a gestão de funcionários, cursos, turmas, alunos e etc.

## Instalação

1. Clone o repositório:

```
git clone https://github.com/LucasOFonseca/TCC-Athena-API.git
```

2. Instale as dependências:

```
yarn
```

3. Configure as variáveis de ambiente criando um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```.env
DATABASE_URL = mysql://user:password@localhost:3306/database
EMAIL_PROVIDER_USER = example@gmail.com
EMAIL_PROVIDER_PASSWORD = password
BCRYPT_SALT = 17
PORT = 3333
```

(Lembre-se de substituir os valores das variáveis após criar o arquivo)

4. Execute a aplicação:

```
yarn dev
```

## Tecnologias

As seguntes tecnologias foram utilizadas para o desenvolvimento dessa API:

- Node.js
- TypeScript
- Prisma ORM
- MySQL
