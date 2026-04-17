const knex = require('knex');
const path = require('path');

const db = knex({
    client: 'sqlite3',
    connection: {
        filename: path.resolve('src/database.db')
    },
    useNullAsDefault: true,
    migrations: {
        directory: path.resolve('src/migrations')
    }
});

module.exports = db;
