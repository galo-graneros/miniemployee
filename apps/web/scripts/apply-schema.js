// Script to apply schema to Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://obywcznebprplrxuikph.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ieXdjem5lYnBycGxyeHVpa3BoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA2MDUyNCwiZXhwIjoyMDgyNjM2NTI0fQ.Y7SwwIDc84kDLAFDw9jfTix0FNOYwpM7RnntvIMvJIw';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function applySchema() {
    console.log('Reading schema file...');
    const schemaPath = path.join(__dirname, '..', '..', 'supabase_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by statements (simplified - may need adjustment for complex SQL)
    const statements = schema
        .split(/;[\r\n]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (!stmt || stmt.startsWith('--')) continue;
        
        try {
            console.log(`Executing statement ${i + 1}/${statements.length}...`);
            const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
            if (error) {
                console.log(`Statement ${i + 1} skipped or already exists: ${error.message}`);
            }
        } catch (e) {
            console.log(`Statement ${i + 1} skipped: ${e.message}`);
        }
    }
    
    console.log('Done!');
}

applySchema().catch(console.error);
