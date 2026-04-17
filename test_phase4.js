const https = require('https');

async function testPhase4() {
    console.log('\n=== Testing Phase 4 Implementation ===\n');

    // Test 1: GET /liste (should return empty array or existing posts)
    console.log('Test 1: GET /liste');
    await makeRequest('GET', '/liste');

    // Test 2: POST /ajouter without auth (should fail)
    console.log('\nTest 2: POST /ajouter without authentication');
    await makeRequest('POST', '/ajouter', {
        text: 'Test post',
        x: 100,
        y: 200
    });

    // Test 3: POST /ajouter with invalid text (too long)
    console.log('\nTest 3: POST /ajouter with invalid text (>500 chars)');
    const longText = 'a'.repeat(501);
    await makeRequest('POST', '/ajouter', {
        text: longText,
        x: 100,
        y: 200
    });

    console.log('\n=== Tests Complete ===\n');
    process.exit(0);
}

function makeRequest(method, path, body = null) {
    return new Promise((resolve) => {
        const opts = {
            hostname: 'localhost',
            port: 3000,
            path,
            method,
            rejectUnauthorized: false,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(opts, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                try {
                    const parsed = JSON.parse(data);
                    console.log('Response:', JSON.stringify(parsed, null, 2));
                } catch {
                    console.log('Response:', data.substring(0, 200));
                }
                resolve();
            });
        });

        req.on('error', e => {
            console.error('Error:', e.message);
            resolve();
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

testPhase4();
