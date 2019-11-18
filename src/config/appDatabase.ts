export const appDatabase = {
    type: process.env.DB_APP_TYPE,
    host: process.env.DB_APP_HOST,
    database: process.env.DB_APP_NAME,
    user: process.env.DB_APP_USER,
    password: process.env.DB_APP_PASS,
    port: process.env.DB_APP_PORT,
    synchronize: !!process.env.DB_APP_SYNCHRONIZE || false,
};
