# Project Name

![Team Photo](Insert a Team Photo URL here)
[*how?*](https://help.github.com/articles/about-readmes/#relative-links-and-image-paths-in-readme-files)

TODO: short project description, some sample screenshots or mockups

## Architecture

TODO:  descriptions of code organization and tools and libraries used

## Setup

Backend local setup (PostgreSQL + Prisma + Express):

1. Start PostgreSQL (Homebrew):
```bash
brew services start postgresql@17
```

2. Create the project database (one-time):
```bash
createdb puente
```

3. Install dependencies:
```bash
npm install
```

4. Create `.env`:
```bash
PORT=3000
DATABASE_URL="postgresql://<db_user>:<db_password>@localhost:5432/puente?schema=public"
```

Note: if your local Postgres user has no password configured, this often works:
```bash
DATABASE_URL="postgresql://<db_user>@localhost:5432/puente?schema=public"
```

5. Apply Prisma migrations:
```bash
npm run prisma:migrate -- --name init
```

6. Run the API server:
```bash
npm run dev
```

7. Quick checks:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/hello
```

## Deployment

TODO: how to deploy the project

## Authors

TODO: list of authors

## Acknowledgments
