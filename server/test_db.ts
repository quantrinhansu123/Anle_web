import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!);

async function main() {
    console.log("Checking EXACT query...");
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('*, sales_items(*), shipments(*, customers(*), suppliers(*))', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(0, 10);
    console.log("Sales error exactly:", salesError);
}
main().catch(console.error);
