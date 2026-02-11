import { query } from './db'
import bcrypt from 'bcryptjs'

export interface Admin {
  id: number
  email: string
  name?: string
  role: 'superadmin' | 'admin' | 'user'
  role_id?: number
  created_at: Date
  updated_at: Date
}

export interface User {
  id: number
  email: string
  name?: string
  role: 'user'
  role_id?: number
  created_at: Date
  updated_at: Date
}

// Hash password using bcrypt
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(password, salt)
}

// Verify password using bcrypt
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}

export async function createAdmin(email: string, password: string, name?: string, role: 'superadmin' | 'admin' | 'user' = 'admin', roleId?: number): Promise<Admin> {
  const passwordHash = await hashPassword(password)

  const result = await query(
    'INSERT INTO admins (email, password_hash, name, role, role_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role, role_id, created_at, updated_at',
    [email, passwordHash, name || null, role, roleId || null]
  )

  return result.rows[0]
}

export async function createUser(email: string, password: string, name?: string): Promise<User> {
  const passwordHash = await hashPassword(password)

  const result = await query(
    'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at, updated_at',
    [email, passwordHash, name || null, 'user']
  )

  return result.rows[0]
}

export async function getAdminByEmail(email: string): Promise<(Admin & { password_hash: string, role_details?: any }) | null> {
  const result = await query(
    `SELECT a.id, a.email, a.password_hash, a.name, a.role, a.role_id, a.tenant_id, a.created_at, a.updated_at,
            r.name as role_name, r.permissions as role_permissions
     FROM admins a
     LEFT JOIN roles r ON a.role_id = r.id
     WHERE a.email = $1`,
    [email]
  )

  return result.rows[0] || null
}

export async function getUserByEmail(email: string): Promise<(User & { password_hash: string, role_details?: any }) | null> {
  const result = await query(
    `SELECT u.id, u.email, u.password_hash, u.name, u.role, u.role_id, u.tenant_id, u.created_at, u.updated_at,
            r.name as role_name, r.permissions as role_permissions
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     WHERE u.email = $1`,
    [email]
  )

  return result.rows[0] || null
}

export async function getAdminById(id: number): Promise<Admin | null> {
  const result = await query(
    `SELECT a.id, a.email, a.name, a.role, a.role_id, a.created_at, a.updated_at,
            r.name as role_name, r.permissions as role_permissions
     FROM admins a
     LEFT JOIN roles r ON a.role_id = r.id
     WHERE a.id = $1`,
    [id]
  )

  return result.rows[0] || null
}

export async function getUserById(id: number): Promise<User | null> {
  const result = await query(
    `SELECT u.id, u.email, u.name, u.role, u.role_id, u.created_at, u.updated_at,
            r.name as role_name, r.permissions as role_permissions
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     WHERE u.id = $1`,
    [id]
  )

  return result.rows[0] || null
}


export async function verifyAdmin(email: string, password: string): Promise<Admin | null> {
  const admin = await getAdminByEmail(email)

  if (!admin) {
    return null
  }

  const isValid = await verifyPassword(password, admin.password_hash)

  if (!isValid) {
    return null
  }

  // Return admin without password
  const { password_hash, ...adminWithoutPassword } = admin
  return adminWithoutPassword
}

export async function getAllAdmins(): Promise<Admin[]> {
  const result = await query(
    'SELECT id, email, name, role, created_at, updated_at FROM admins ORDER BY created_at DESC'
  )

  return result.rows
}

export async function getAllUsers(): Promise<User[]> {
  const result = await query(
    'SELECT id, email, name, role, created_at, updated_at FROM users ORDER BY created_at DESC'
  )

  return result.rows
}

export async function verifyUser(email: string, password: string): Promise<User | null> {
  const user = await getUserByEmail(email)

  if (!user) {
    return null
  }

  const isValid = await verifyPassword(password, user.password_hash)

  if (!isValid) {
    return null
  }

  // Return user without password
  const { password_hash, ...userWithoutPassword } = user
  return userWithoutPassword
}

export async function updateAdminRole(id: number, role: 'superadmin' | 'admin' | 'user', roleId?: number): Promise<Admin | null> {
  const result = await query(
    'UPDATE admins SET role = $1, role_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, email, name, role, role_id, created_at, updated_at',
    [role, roleId || null, id]
  )

  return result.rows[0] || null
}

export async function deleteUser(id: number): Promise<boolean> {
  const result = await query('DELETE FROM users WHERE id = $1', [id])
  return result.rowCount !== null && result.rowCount > 0
}

export async function deleteAdmin(id: number): Promise<boolean> {
  const result = await query('DELETE FROM admins WHERE id = $1', [id])
  return result.rowCount !== null && result.rowCount > 0
}

