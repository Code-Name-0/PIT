module.exports = {
  development: {
    client: 'sqlite3',
    connection: { filename: './src/database.db' },
    useNullAsDefault: true,
    migrations: { directory: './src/migrations' },
    seeds: { directory: './src/seeds' }
  }
};
