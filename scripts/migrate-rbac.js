const { Pool } = require('pg')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') })
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables')
    process.exit(1)
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : {
        rejectUnauthorized: false
    }
})

async function migrateRBAC() {
    const client = await pool.connect()

    try {
        console.log('🔄 Starting RBAC Migration...')
        await client.query('BEGIN')

        // 1. Create Roles Table
        console.log('📌 Creating roles table...')
        await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        description TEXT,
        tenant_id VARCHAR(255), -- Null for System Roles
        permissions JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `)

        // 2. Add role_id to Admins and Users tables
        console.log('📌 Updating admins and users tables...')

        // Check if role_id exists in admins
        const adminColCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'admins' AND column_name = 'role_id'
    `)

        if (adminColCheck.rows.length === 0) {
            await client.query(`
        ALTER TABLE admins 
        ADD COLUMN role_id INTEGER REFERENCES roles(id),
        ADD COLUMN tenant_id VARCHAR(255);
      `)
            console.log('   ✅ Added role_id and tenant_id to admins')
        }

        // Check if role_id exists in users
        const userColCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'role_id'
    `)

        if (userColCheck.rows.length === 0) {
            await client.query(`
        ALTER TABLE users 
        ADD COLUMN role_id INTEGER REFERENCES roles(id),
        ADD COLUMN tenant_id VARCHAR(255);
      `)
            console.log('   ✅ Added role_id and tenant_id to users')
        }

        // 3. Create Default System Roles
        console.log('📌 Creating default system roles...')

        // Define default permissions based on current lib/rbac.ts
        const defaultRoles = [
            {
                name: 'Super Admin',
                description: 'Full system access',
                permissions: { "*": ["manage"] }
            },
            {
                name: 'Admin',
                description: 'Business Administrator',
                permissions: {
                    "dashboard": ["read"],
                    "suppliers": ["write"],
                    "purchases": ["write"],
                    "inventory": ["write"],
                    "customers": ["write"],
                    "catalogues": ["write"],
                    "sales": ["write"],
                    "invoices": ["write"],
                    "business": ["write"],
                    "admins": ["read"],
                    "users": ["read"]
                }
            },
            {
                name: 'User',
                description: 'Standard User',
                permissions: {
                    "catalogues": ["read"],
                    "products": ["read"]
                }
            }
        ]

        for (const role of defaultRoles) {
            // Upsert roles to ensure they exist and rely on ID later
            const res = await client.query(`
        INSERT INTO roles (name, description, permissions, tenant_id)
        VALUES ($1, $2, $3, NULL)
        ON CONFLICT DO NOTHING -- Avoid duplicates if running multiple times? 
        -- Actually, strictly checking by name might differ if tenants make roles.
        -- For now, we assume this script runs once or checks specifically.
        RETURNING id
      `, [role.name, role.description, JSON.stringify(role.permissions)])

            // If inserted new, log it. If likely exists, we might need to fetch it.
        }

        // Fetch IDs for migration
        const rolesRes = await client.query(`SELECT id, name FROM roles WHERE tenant_id IS NULL`)
        const rolesMap = {}
        rolesRes.rows.forEach(r => {
            rolesMap[r.name.replace(' ', '').toLowerCase()] = r.id // superadmin, admin, user
        })

        // 4. Migrate Existing Data
        console.log('📌 Migrating existing admins/users to role_ids...')

        // Migrate Admins
        // Note: Assuming 'role' column has values 'superadmin', 'admin', 'user'
        await client.query(`
      UPDATE admins 
      SET role_id = $1 
      WHERE role = 'superadmin' AND role_id IS NULL
    `, [rolesMap['superadmin']])

        await client.query(`
      UPDATE admins 
      SET role_id = $1 
      WHERE role = 'admin' AND role_id IS NULL
    `, [rolesMap['admin']])

        // Users are usually 'user' role
        await client.query(`
      UPDATE users 
      SET role_id = $1 
      WHERE role_id IS NULL
    `, [rolesMap['user']])

        await client.query('COMMIT')
        console.log('✅ Migration complete successfully!')

    } catch (error) {
        await client.query('ROLLBACK')
        console.error('❌ Migration failed:', error)
        process.exit(1)
    } finally {
        client.release()
        await pool.end()
    }
}

migrateRBAC()
