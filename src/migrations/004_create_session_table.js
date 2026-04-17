exports.up = async (knex) => {
    // Create session table for connect-pg-simple
    // This table stores user session data on PostgreSQL
    return knex.schema.createTable('session', (table) => {
        table.string('sid').primary(); // Session ID
        table.json('sess').notNullable(); // Session data
        table.timestamp('expire').notNullable(); // Expiration time
    });
};

exports.down = async (knex) => {
    return knex.schema.dropTableIfExists('session');
};
