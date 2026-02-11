const { query } = require('../lib/db')

async function checkRoles() {
    try {
        const res = await query('SELECT * FROM roles ORDER BY id')
        console.log('Roles found:', res.rows)
    } catch (err) {
        console.error('Error fetching roles:', err)
    } finally {
        process.exit(0)
    }
}

checkRoles()
