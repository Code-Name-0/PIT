exports.up = async (knex) => {
  return knex.schema.createTable('user_roles', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('users.id').onDelete('CASCADE');
    table.string('role', 20).notNullable(); // 'create', 'modify', 'delete', 'admin'
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['user_id', 'role']);
  });
};

exports.down = async (knex) => {
  return knex.schema.dropTableIfExists('user_roles');
};
