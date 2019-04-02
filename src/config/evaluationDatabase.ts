export const evaluationDatabase = {
    database: process.env.DB_EVALUATION_NAME,
    user: process.env.DB_EVALUATION_USER,
    password: process.env.DB_EVALUATION_PASS,
    type: process.env.DB_EVALUATION_TYPE,
    host: process.env.DB_EVALUATION_HOST,
    port: process.env.DB_EVALUATION_PORT,
    synchronize: !!process.env.DB_EVALUATION_SYNCHRONIZE || false,
};
