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
    });
    const adminId = adminResult[0];

    // Assign all 4 roles to admin
    await knex('user_roles').insert({
        user_id: adminId,
        role: 'create',
        created_at: knex.fn.now()
    });
    await knex('user_roles').insert({
        user_id: adminId,
        role: 'modify',
        created_at: knex.fn.now()
    });
    await knex('user_roles').insert({
        user_id: adminId,
        role: 'delete',
        created_at: knex.fn.now()
    });
    await knex('user_roles').insert({
        user_id: adminId,
        role: 'admin',
        created_at: knex.fn.now()
    });

    console.log('✓ Admin user created (username: admin, password: admin123)');

    // 2. Create guest user (for unauthenticated visitors)
    const guestHash = await bcryptjs.hash('guest_password_' + Date.now(), 10);
    await knex('users').insert({
        username: 'guest',
        password_hash: guestHash,
        created_at: knex.fn.now()
    });

    // Guest has ZERO roles (no create, modify, delete, admin)
    console.log('✓ Guest user created (special user for unauthenticated visitors)');

    // 3. Create test users (optional, for testing)
    const testUser1Hash = await bcryptjs.hash('test123', 10);
    const testUser1Result = await knex('users').insert({
        username: 'testuser1',
        password_hash: testUser1Hash,
        created_at: knex.fn.now()
    });
    const testUser1Id = testUser1Result[0];

    await knex('user_roles').insert({
        user_id: testUser1Id,
        role: 'create',
        created_at: knex.fn.now()
    });
    await knex('user_roles').insert({
        user_id: testUser1Id,
        role: 'modify',
        created_at: knex.fn.now()
    });
    await knex('user_roles').insert({
        user_id: testUser1Id,
        role: 'delete',
        created_at: knex.fn.now()
    });

    const testUser2Hash = await bcryptjs.hash('test456', 10);
    const testUser2Result = await knex('users').insert({
        username: 'testuser2',
        password_hash: testUser2Hash,
        created_at: knex.fn.now()
    });
    const testUser2Id = testUser2Result[0];

    await knex('user_roles').insert({
        user_id: testUser2Id,
        role: 'create',
        created_at: knex.fn.now()
    });

    console.log('✓ Test users created');
    console.log('  - testuser1 (password: test123) - create, modify, delete roles');
    console.log('  - testuser2 (password: test456) - create role only');
};
