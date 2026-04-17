exports.up = async (knex) => {
    return knex.schema.createTable('posts', (table) => {
        table.increments('id').primary();
        table.text('text').notNullable();
        table.integer('author_id').unsigned().notNullable().references('users.id').onDelete('CASCADE');
        table.float('x').notNullable();
        table.float('y').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

exports.down = async (knex) => {
    return knex.schema.dropTableIfExists('posts');
};
