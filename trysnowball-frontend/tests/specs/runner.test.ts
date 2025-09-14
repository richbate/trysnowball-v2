/**
 * @jest-environment jsdom
 */

/**
 * Contract Test Runner
 * Executes all feature contracts automatically
 */

import { featureContracts, checkExecutors } from './contracts';

describe('Feature Evaluation Matrix', () => {
  for (const spec of featureContracts) {
    describe(spec.feature, () => {
      let target: any;
      
      beforeAll(async () => { 
        target = await spec.setup(); 
      });
      
      for (const testCase of spec.cases) {
        it(testCase.name, async () => {
          const result = await testCase.call(target);
          
          for (const check of testCase.checks) {
            // Handle parameterized checks like 'contains:id=eval_1'
            if (check.includes(':')) {
              const [checkType, param] = check.split(':');
              if (checkType === 'contains:id') {
                const expectedId = param.split('=')[1];
                checkExecutors['contains:id='](result, expectedId);
              }
              continue;
            }
            
            // Handle simple checks
            if (checkExecutors[check as keyof typeof checkExecutors]) {
              checkExecutors[check as keyof typeof checkExecutors](result);
            } else {
              throw new Error(`Unknown check type: ${check}`);
            }
          }
        });
      }
    });
  }
});