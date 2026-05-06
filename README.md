# chess-analysis-api

Free online chess analysis API.

## Requirements

- Node.js 14+ and npm
- PostgreSQL or MySQL (depending on your `DB_DIALECT`)
- Redis (optional, depending on runtime features)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root and configure variables:

```dotenv
APP_ENVIRONMENT=development

SWAGGER_HOST=localhost:8080

GOOGLE_BASE_URL=/
GOOGLE_REDIRECT_URL=/google-auth
GOOGLE_CLIENT_ID=id
GOOGLE_CLIENT_SECRET=secret

DB_NAME=db_name
DB_USER=db_user
DB_PASS=db_pass
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432

SERVER_PORT=8080
IO_PORT=8080

WORKER_HOST1=5557
WORKER_HOST2=5558

JWT_KEY=jwt_key
```

## Development

- Build the project:

```bash
npm run build
```

- Start the compiled server:

```bash
npm run server:start
```

- Start in development mode (watches `src` via `tsx`):

```bash
npm run server:start:dev
```

## Testing

- Run tests once:

```bash
npm run test
```

- Run tests in watch mode:

```bash
npm run test:watch
```

- Run tests with coverage:

```bash
npm run test:coverage
```

## Notes

- The build step copies opening book files from `src/books` into `dist/books`.
- Keep secrets only in `.env` and never commit them.
