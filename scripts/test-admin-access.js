const fetch = require('node-fetch');

async function testAdminAccess() {
    const urls = [
        'http://localhost:3000/admin/dashboard',
        'http://localhost:3000/admin/users',
        'http://localhost:3000/admin/videos'
    ];

    console.log('--- ADMIN ACCESS SECURITY TEST ---');
    console.log('Note: This test assumes the dev server is running on localhost:3000');

    for (const url of urls) {
        try {
            const res = await fetch(url, { redirect: 'manual' });
            console.log(`Checking: ${url}`);
            console.log(`Status: ${res.status}`);
            
            if (res.status === 307 || res.status === 302) {
                const location = res.headers.get('location');
                console.log(`PASS: Redirected to ${location} (Protection active)`);
            } else if (res.status === 200) {
                console.log('FAIL: Unauthorized access allowed (200 OK)');
            } else {
                console.log(`UNEXPECTED: Status ${res.status}`);
            }
            console.log('---');
        } catch (e) {
            console.error(`ERROR: Could not connect to ${url}. Is the server running?`);
            break;
        }
    }
}

testAdminAccess();
