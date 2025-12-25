import 'dotenv/config';
import { handler } from '../src/functions/savings-goal-allocation';

async function main() {
    console.log('🚀 Starting Manual Test: Savings Goal Auto-Allocation');
    console.log('---------------------------------------------------');

    const startTime = performance.now();
    const result = await handler();
    const endTime = performance.now();

    console.log('---------------------------------------------------');
    console.log('✅ Execution Finished');
    console.log(`⏱️ Duration: ${(endTime - startTime).toFixed(2)}ms`);
    console.log('📝 Result:', JSON.stringify(result, null, 2));
}

main().catch((err) => {
    console.error('❌ Test Failed:', err);
    process.exit(1);
});
