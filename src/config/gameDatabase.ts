export const gameDatabase = {
    type: process.env.POSTGRE_DB_TYPE,
    host: process.env.POSTGRE_DB_HOST,
    database: process.env.POSTGRE_DB_NAME,
    user: process.env.POSTGRE_DB_USER,
    password: process.env.POSTGRE_DB_PASS,
    port: parseInt(process.env.POSTGRE_DB_PORT, 10),
};