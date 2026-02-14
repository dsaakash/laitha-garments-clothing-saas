const { getAllAdmins } = require('./lib/db-auth');
const { Pool } = require('pg');
require('dotenv').config();

async function test() {
    try {
        console.log('--- Testing getAllAdmins(null) ---');
        const admins = await getAllAdmins(null);
        console.log('Count:', admins.length);
        console.table(admins.map(a => ({
            id: a.id,
            email: a.email,
            name: a.name,
            tenant_id: a.tenant_id,
            role: a.role
        })));
    } catch (error) {
        console.error(error);
    }
}

test();
