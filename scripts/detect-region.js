const postgres = require('postgres');

const projectRef = "vzohoiwmjcuqhndsoazx";
const password = process.env.SUPABASE_DB_PASSWORD || "NlyTLzO7lefMGGsC";
const regions = ["us-east-2", "us-east-1", "us-west-1", "us-west-2", "sa-east-1", "eu-west-1", "eu-central-1", "ap-southeast-1"];
const ports = [5432, 6543];

async function checkRegion(region, port) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const url = `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@${host}:${port}/postgres`;

    console.log(`Checking ${region} port ${port} (${host})...`);
    const sql = postgres(url, { connect_timeout: 5 });

    try {
        await sql`SELECT 1`;
        console.log(`SUCCESS: Found project in region ${region} on port ${port}`);
        process.exit(0);
    } catch (error) {
        if (error.code === 'XX000' && error.message.includes('Tenant or user not found')) {
            console.log(`Failed ${region}:${port}: Tenant not found.`);
        } else {
            console.log(`Error ${region}:${port}: ${error.message}`);
        }
    } finally {
        await sql.end();
    }
}

async function run() {
    for (const region of regions) {
        for (const port of ports) {
            await checkRegion(region, port);
        }
    }
}

run();
