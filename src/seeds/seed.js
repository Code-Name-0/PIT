const bcryptjs = require('bcryptjs');

exports.seed = async (knex) => {
    // Delete existing data (in reverse order of foreign keys)
    await knex('user_roles').del();
    await knex('posts').del();
    await knex('users').del();

    // 1. Create admin user
    const adminHash = await bcryptjs.hash('admin123', 10);
    const adminResult = await knex('users').insert({
        username: 'admin',
        password_hash: adminHash,
        created_at: knex.fn.now()
    }).returning('id');

    const adminId = adminResult[0].id;

    // Assign all 4 roles to admin
    await knex('user_roles').insert([
        { user_id: adminId, role: 'create', created_at: knex.fn.now() },
        { user_id: adminId, role: 'modify', created_at: knex.fn.now() },
        { user_id: adminId, role: 'delete', created_at: knex.fn.now() },
        { user_id: adminId, role: 'admin', created_at: knex.fn.now() }
    ]);

    console.log('✓ Admin user created (username: admin, password: admin123)');

    // 2. Create normal user
    const userHash = await bcryptjs.hash('user123', 10);
    const userResult = await knex('users').insert({
        username: 'user',
        password_hash: userHash,
        created_at: knex.fn.now()
    }).returning('id');

    const userId = userResult[0].id;

    // Assign create role to normal user
    await knex('user_roles').insert({
        user_id: userId,
        role: 'create',
        created_at: knex.fn.now()
    });

    console.log('✓ Normal user created (username: user, password: user123)');

    // 3. Create seed posts (4 total: 2 from admin, 2 from user)
    const now = new Date();

    // Admin posts
    await knex('posts').insert([
        {
            text: 'Welcome to Post-it Social! This is my first post as admin.',
            author_id: adminId,
            x: 100,
            y: 100,
            created_at: new Date(now.getTime() - 3600000), // 1 hour ago
            updated_at: new Date(now.getTime() - 3600000)
        },
        {
            text: 'Admin can manage everything on this board including user posts.',
            author_id: adminId,
            x: 500,
            y: 150,
            created_at: new Date(now.getTime() - 1800000), // 30 minutes ago
            updated_at: new Date(now.getTime() - 1800000)
        }
    ]);

    // User posts
    await knex('posts').insert([
        {
            text: 'Hi everyone! I just created my first post on this awesome app.',
            author_id: userId,
            x: 300,
            y: 300,
            created_at: new Date(now.getTime() - 900000), // 15 minutes ago
            updated_at: new Date(now.getTime() - 900000)
        },
        {
            text: 'This is really cool - I can drag posts anywhere on the board!',
            author_id: userId,
            x: 700,
            y: 250,
            created_at: now,
            updated_at: now
        }
    ]);

    console.log('✓ Seed posts created');
    console.log('  - 2 posts from admin');
    console.log('  - 2 posts from user');
    console.log('\n=== Test Accounts ===');
    console.log('Admin:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('  Roles: create, modify, delete, admin');
    console.log('\nUser:');
    console.log('  Username: user');
    console.log('  Password: user123');
    console.log('  Roles: create');
};

