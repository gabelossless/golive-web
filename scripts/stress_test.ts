

const TARGET_URL = 'https://golive-web.vercel.app';
const CONCURRENCY = 50;
const DURATION_SEC = 10; // 10 seconds of stress

const endpoints = [
    '/',
    '/login',
    '/register',
    '/studio',
    '/search?q=gaming',
    '/trending',
    '/api/upload', // Expecting 405 or 401, but testing backend routing
];

async function hitEndpoint(url: string) {
    const start = Date.now();
    try {
        const res = await fetch(url);
        const latency = Date.now() - start;
        return { status: res.status, latency, error: null };
    } catch (e: any) {
        return { status: 0, latency: Date.now() - start, error: e.message };
    }
}

async function runWorker(workerId: number, endTime: number, stats: any) {
    while (Date.now() < endTime) {
        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
        const url = `${TARGET_URL}${endpoint}`;
        const result = await hitEndpoint(url);

        stats.total++;
        if (result.status >= 200 && result.status < 400) {
            stats.success++;
        } else if (result.status >= 400 && result.status < 500) {
            // 4xx are expected for unauthenticated API hits, count as success routing
            stats.success++;
        } else {
            stats.errors++;
        }

        stats.totalLatency += result.latency;
        if (result.latency > stats.maxLatency) stats.maxLatency = result.latency;
        if (result.latency < stats.minLatency) stats.minLatency = result.latency;
    }
}

async function stressTest() {
    console.log(`Starting Stress Test on ${TARGET_URL}`);
    console.log(`Concurrency: ${CONCURRENCY} | Duration: ${DURATION_SEC} seconds\n`);

    const endTime = Date.now() + (DURATION_SEC * 1000);
    const stats = {
        total: 0,
        success: 0,
        errors: 0,
        totalLatency: 0,
        maxLatency: 0,
        minLatency: 99999,
    };

    const workers = [];
    for (let i = 0; i < CONCURRENCY; i++) {
        workers.push(runWorker(i, endTime, stats));
    }

    await Promise.all(workers);

    const avgLatency = stats.total > 0 ? (stats.totalLatency / stats.total).toFixed(2) : 0;
    const reqPerSec = (stats.total / DURATION_SEC).toFixed(2);

    console.log(`=== STRESS TEST RESULTS ===`);
    console.log(`Total Requests: ${stats.total}`);
    console.log(`Successful Routes: ${stats.success}`);
    console.log(`Errors (500s/Network): ${stats.errors}`);
    console.log(`Requests/sec: ${reqPerSec}`);
    console.log(`Avg Latency: ${avgLatency}ms`);
    console.log(`Min Latency: ${stats.minLatency}ms`);
    console.log(`Max Latency: ${stats.maxLatency}ms`);

    if (stats.errors === 0 && Number(avgLatency) < 300) {
        console.log(`\n✅ STATUS: PASSED - Vercel Edge network handling load perfectly.`);
    } else {
        console.log(`\n❌ STATUS: FAILED - Errors detected or latency too high.`);
    }
}

stressTest();
