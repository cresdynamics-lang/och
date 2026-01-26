/**
 * Lighthouse performance testing script for missions page.
 * 
 * Usage:
 *   npm run lighthouse:missions
 * 
 * Or run directly:
 *   node scripts/lighthouse-test.js
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function runLighthouseTest() {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance'],
    port: chrome.port,
  };

  const url = process.env.TEST_URL || 'http://localhost:3000/dashboard/student/missions';
  
  console.log(`Running Lighthouse test on ${url}...`);
  
  try {
    const runnerResult = await lighthouse(url, options);
    
    // Extract performance score
    const performanceScore = runnerResult.lhr.categories.performance.score * 100;
    const metrics = runnerResult.lhr.audits;
    
    console.log('\n=== Lighthouse Performance Results ===');
    console.log(`Performance Score: ${performanceScore.toFixed(1)}/100`);
    console.log(`Target: 95+ (Mobile)`);
    console.log(`Status: ${performanceScore >= 95 ? '✅ PASS' : '❌ FAIL'}`);
    
    // Key metrics
    console.log('\n=== Key Metrics ===');
    console.log(`First Contentful Paint: ${(metrics['first-contentful-paint'].numericValue / 1000).toFixed(2)}s`);
    console.log(`Largest Contentful Paint: ${(metrics['largest-contentful-paint'].numericValue / 1000).toFixed(2)}s`);
    console.log(`Time to Interactive: ${(metrics['interactive'].numericValue / 1000).toFixed(2)}s`);
    console.log(`Total Blocking Time: ${metrics['total-blocking-time'].numericValue.toFixed(0)}ms`);
    console.log(`Cumulative Layout Shift: ${metrics['cumulative-layout-shift'].numericValue.toFixed(3)}`);
    
    // Opportunities
    console.log('\n=== Performance Opportunities ===');
    const opportunities = Object.values(metrics)
      .filter(metric => metric.details && metric.details.type === 'opportunity')
      .sort((a, b) => b.numericValue - a.numericValue)
      .slice(0, 5);
    
    opportunities.forEach(opp => {
      console.log(`${opp.title}: ${(opp.numericValue / 1000).toFixed(2)}s savings`);
    });
    
    // Check if mission list loads in <300ms
    const missionListLoad = metrics['server-response-time']?.numericValue || 0;
    console.log(`\n=== Mission-Specific Metrics ===`);
    console.log(`Mission List Load Time: ${missionListLoad.toFixed(0)}ms`);
    console.log(`Target: <300ms`);
    console.log(`Status: ${missionListLoad < 300 ? '✅ PASS' : '❌ FAIL'}`);
    
    await chrome.kill();
    
    // Exit with error code if performance score is below 95
    if (performanceScore < 95) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Lighthouse test failed:', error);
    await chrome.kill();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runLighthouseTest().catch(console.error);
}

module.exports = { runLighthouseTest };

