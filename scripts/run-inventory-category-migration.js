const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Load environment variables from both .env and .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env') })
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables')
  console.error('Please make sure you have a .env or .env.local file with DATABASE_URL')
  process.exit(1)
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
})

async function runMigration() {
  const client = await pool.connect()
  
  try {
    console.log('Starting inventory category migration...')
    
    // Read SQL file
    const sqlFile = path.join(__dirname, 'migrate-inventory-category.sql')
    const sql = fs.readFileSync(sqlFile, 'utf8')
    
    // Start transaction
    await client.query('BEGIN')
    
    try {
      // Execute statements one by one
      // 1. Add category column
      console.log('1. Adding category column...')
      try {
        await client.query('ALTER TABLE inventory ADD COLUMN IF NOT EXISTS category VARCHAR(255);')
        console.log('✓ Category column added')
      } catch (error) {
        if (error.message.includes('already exists') || error.code === '42701') {
          console.log('⚠ Category column already exists')
        } else throw error
      }
      
      // 2. Create index
      console.log('2. Creating index...')
      try {
        await client.query('CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);')
        console.log('✓ Index created')
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠ Index already exists')
        } else throw error
      }
      
      // 3. Create function
      console.log('3. Creating determine_category function...')
      const functionSQL = `
        CREATE OR REPLACE FUNCTION determine_category(dress_type TEXT, dress_name TEXT DEFAULT '')
        RETURNS VARCHAR(255) AS $$
        DECLARE
          search_text TEXT;
        BEGIN
          -- Combine both dress_type and dress_name for better matching
          search_text := LOWER(TRIM(COALESCE(dress_type, '') || ' ' || COALESCE(dress_name, '')));
          
          IF search_text = '' THEN
            RETURN 'Kurtis'; -- default
          END IF;
          
          -- Home Textiles - check first for bedsheets, pillow covers, etc.
          IF search_text LIKE '%bedsheet%' OR 
             search_text LIKE '%bed sheet%' OR 
             search_text LIKE '%bed-sheet%' OR
             search_text LIKE '%pillow cover%' OR
             search_text LIKE '%pillowcover%' OR
             search_text LIKE '%pillow%' OR
             search_text LIKE '%sheeting%' OR
             search_text LIKE '%percale%' OR
             search_text LIKE '%duck%' OR
             search_text LIKE '%cashment%' OR
             search_text LIKE '%bedsheet-single%' OR
             search_text LIKE '%bedsheet-double%' OR
             search_text LIKE '%bedsheet-king%' OR
             search_text LIKE '%quilt%' OR
             search_text LIKE '%comforter%' OR
             search_text LIKE '%blanket%' OR
             search_text LIKE '%curtain%' OR
             search_text LIKE '%cushion%' THEN
            RETURN 'Home Textiles';
          END IF;
          
          -- Sarees - check for saree-related terms
          IF search_text LIKE '%saree%' OR 
             search_text LIKE '%sari%' OR 
             search_text LIKE '%sare%' THEN
            RETURN 'Sarees';
          END IF;
          
          -- Dresses - check for dress-related terms
          IF search_text LIKE '%dress%' OR 
             search_text LIKE '%anarkali%' OR 
             search_text LIKE '%gown%' OR
             search_text LIKE '%frock%' OR
             search_text LIKE '%lehenga%' OR
             search_text LIKE '%maxi%' OR
             search_text LIKE '%midi%' THEN
            RETURN 'Dresses';
          END IF;
          
          -- Kurtis - check for kurta/kurti related terms
          IF search_text LIKE '%kurta%' OR 
             search_text LIKE '%kurti%' OR
             search_text LIKE '%top%' OR
             search_text LIKE '%tunic%' OR
             search_text LIKE '%kameez%' THEN
            RETURN 'Kurtis';
          END IF;
          
          -- Default to Kurtis if no match
          RETURN 'Kurtis';
        END;
        $$ LANGUAGE plpgsql;
      `
      try {
        await client.query(functionSQL)
        console.log('✓ Function created')
      } catch (error) {
        console.log(`⚠ Function creation: ${error.message.split('\n')[0]}`)
      }
      
      // 4. Backfill categories
      console.log('4. Backfilling categories for existing items...')
      const updateResult = await client.query(`
        UPDATE inventory 
        SET category = determine_category(dress_type, dress_name)
        WHERE category IS NULL OR category = '';
      `)
      console.log(`✓ Updated ${updateResult.rowCount} items with categories`)
      
      // 5. Set default
      console.log('5. Setting default category...')
      try {
        await client.query('ALTER TABLE inventory ALTER COLUMN category SET DEFAULT \'Kurtis\';')
        console.log('✓ Default category set')
      } catch (error) {
        console.log(`⚠ Setting default: ${error.message.split('\n')[0]}`)
      }
      
      // 6. Ensure all items have category
      console.log('6. Ensuring all items have a category...')
      const finalUpdateResult = await client.query(`
        UPDATE inventory SET category = 'Kurtis' WHERE category IS NULL OR category = '';
      `)
      console.log(`✓ Updated ${finalUpdateResult.rowCount} items to default category`)
      
      await client.query('COMMIT')
      console.log('\n✅ All statements executed successfully!')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
    
    // Verify migration
    const result = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN category IS NOT NULL AND category != '' THEN 1 END) as with_category,
        COUNT(DISTINCT category) as unique_categories
      FROM inventory
    `)
    
    const stats = result.rows[0]
    console.log('\n✓ Migration completed successfully!')
    console.log(`  Total items: ${stats.total}`)
    console.log(`  Items with category: ${stats.with_category}`)
    console.log(`  Unique categories: ${stats.unique_categories}`)
    
    // Show category distribution
    const categoryStats = await client.query(`
      SELECT category, COUNT(*) as count
      FROM inventory
      GROUP BY category
      ORDER BY count DESC
    `)
    
    console.log('\nCategory distribution:')
    categoryStats.rows.forEach(row => {
      console.log(`  ${row.category}: ${row.count} items`)
    })
    
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

runMigration()

