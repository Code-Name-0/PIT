exports.up = async (knex) => {
    return knex.schema.createTable('users', (table) => {
        table.increments('id').primary();
        table.string('username', 20).unique().notNullable();
        table.string('password_hash').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = async (knex) => {
    return knex.schema.dropTableIfExists('users');
};
