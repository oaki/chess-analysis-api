export const gameDatabase = {
    type: process.env.DB_GAMES_TYPE,
    host: process.env.DB_GAMES_HOST,
    database: process.env.DB_GAMES_NAME,
    user: process.env.DB_GAMES_USER,
    password: process.env.DB_GAMES_PASS,
    port: parseInt(process.env.DB_GAMES_PORT, 10),
    synchronize: !!process.env.DB_GAMES_SYNCHRONIZE || false
};