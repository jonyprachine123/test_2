export const config = {
    port: process.env.PORT || 3000,
    databaseUrl: process.env.DATABASE_URL || './shop.db',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    nodeEnv: process.env.NODE_ENV || 'development'
};
