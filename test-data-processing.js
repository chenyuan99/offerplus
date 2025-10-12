/**
 * Node.js Test Runner for H1B Data Processing
 * This file tests the core data processing functionality
 */

// Mock DataManager class for testing (extracted from the HTML file)
class DataManager {
    constructor(rawData = []) {
        this.rawData = rawData;
        this.processedData = [];
        this.filteredData = [];
        
        if (rawData.length > 0) {
            this.processData();
        }
    }

    parseDate(dateString) {
        if (!dateString || dateString === '' || dateString === 'N/A') {
            return null;
        }
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return null;
            }
            return date;
        } catch (error) {
            console.warn(`Failed to parse date: ${dateString}`, error);
            return null;
        }
    }

    normalizeSalary(wageAmount, wageUnit) {
        if (!wageAmount || isNaN(parseFloat(wageAmount))) {
            return 0;
        }
        
        const amount = parseFloat(wageAmount);
        const unit = (wageUnit || '').toLowerCase().trim();
        
        const conversionFactors = {
            'year': 1,
            'yearly': 1,
            'annual': 1,
            'month': 12,
            'monthly': 12,
            'week': 52,
            'weekly': 52,
            'hour': 2080,
            'hourly': 2080,
            'bi-weekly': 26,
            'biweekly': 26
        };
        
        for (const [key, factor] of Object.entries(conversionFactors)) {
            if (unit.includes(key)) {
                return Math.round(amount * factor);
            }
        }
        
        return Math.round(amount);
    }

    validateRecord(record) {
        const errors = [];
        
        if (!record.CASE_NUMBER) {
            errors.push('Missing case number');
        }
        
        if (!record.EMPLOYER_NAME) {
            errors.push('Missing employer name');
        }
        
        if (!record.JOB_TITLE) {
            errors.push('Missing job title');
        }
        
        if (!record.CASE_STATUS) {
            errors.push('Missing case status');
        }
        
        return errors;
    }

    processData() {
        this.processedData = this.rawData.map(record => {
            const processed = { ...record };
            
            processed.RECEIVED_DATE_PARSED = this.parseDate(record.RECEIVED_DATE);
            processed.DECISION_DATE_PARSED = this.parseDate(record.DECISION_DATE);
            processed.BEGIN_DATE_PARSED = this.parseDate(record.BEGIN_DATE);
            processed.END_DATE_PARSED = this.parseDate(record.END_DATE);
            
            processed.ANNUAL_SALARY = this.normalizeSalary(
                record.WAGE_RATE_OF_PAY_FROM, 
                record.WAGE_UNIT_OF_PAY
            );
            
            return processed;
        });
        
        this.filteredData = [...this.processedData];
    }
}

// Test framework
function runTests() {
    console.log('🧪 Running H1B Data Processing Unit Tests...\n');
    
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    
    function runTest(testName, testFunction) {
        totalTests++;
        try {
            testFunction();
            console.log(`✅ ${testName}`);
            passedTests++;
        } catch (error) {
            console.error(`❌ ${testName}: ${error.message}`);
            failedTests++;
        }
    }
    
    function expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${expected}, but got ${actual}`);
                }
            },
            toBeNull: () => {
                if (actual !== null) {
                    throw new Error(`Expected null, but got ${actual}`);
                }
            },
            toBeInstanceOf: (expectedClass) => {
                if (!(actual instanceof expectedClass)) {
                    throw new Error(`Expected instance of ${expectedClass.name}, but got ${typeof actual}`);
                }
            },
            toHaveLength: (expected) => {
                if (actual.length !== expected) {
                    throw new Error(`Expected length ${expected}, but got ${actual.length}`);
                }
            },
            toContain: (expected) => {
                if (!actual.includes(expected)) {
                    throw new Error(`Expected ${actual} to contain ${expected}`);
                }
            }
        };
    }
    
    console.log('📅 Testing Date Parsing Functionality...');
    
    runTest('Parse valid ISO date strings', () => {
        const dataManager = new DataManager();
        const result = dataManager.parseDate('2023-01-15');
        expect(result).toBeInstanceOf(Date);
        expect(result.getFullYear()).toBe(2023);
        expect(result.getMonth()).toBe(0);
        // Use getUTCDate() to avoid timezone issues
        expect(result.getUTCDate()).toBe(15);
    });
    
    runTest('Return null for empty date strings', () => {
        const dataManager = new DataManager();
        expect(dataManager.parseDate('')).toBeNull();
        expect(dataManager.parseDate(null)).toBeNull();
        expect(dataManager.parseDate(undefined)).toBeNull();
        expect(dataManager.parseDate('N/A')).toBeNull();
    });
    
    runTest('Return null for invalid date strings', () => {
        const dataManager = new DataManager();
        expect(dataManager.parseDate('invalid-date')).toBeNull();
        expect(dataManager.parseDate('not-a-date')).toBeNull();
    });
    
    console.log('\n💰 Testing Salary Normalization Functionality...');
    
    runTest('Normalize hourly wages to annual salary', () => {
        const dataManager = new DataManager();
        const result = dataManager.normalizeSalary('50', 'Hour');
        expect(result).toBe(104000);
    });
    
    runTest('Normalize monthly wages to annual salary', () => {
        const dataManager = new DataManager();
        const result = dataManager.normalizeSalary('5000', 'Month');
        expect(result).toBe(60000);
    });
    
    runTest('Return 0 for invalid wage amounts', () => {
        const dataManager = new DataManager();
        expect(dataManager.normalizeSalary('', 'Hour')).toBe(0);
        expect(dataManager.normalizeSalary(null, 'Hour')).toBe(0);
        expect(dataManager.normalizeSalary('invalid', 'Hour')).toBe(0);
    });
    
    console.log('\n🚨 Testing Error Handling for Malformed Data...');
    
    runTest('Validate required fields and return errors', () => {
        const dataManager = new DataManager();
        const malformedRecord = {};
        const errors = dataManager.validateRecord(malformedRecord);
        expect(errors).toContain('Missing case number');
        expect(errors).toContain('Missing employer name');
        expect(errors).toContain('Missing job title');
        expect(errors).toContain('Missing case status');
    });
    
    runTest('Return no errors for valid record', () => {
        const dataManager = new DataManager();
        const validRecord = {
            CASE_NUMBER: 'I-200-12345-123456',
            EMPLOYER_NAME: 'Test Company',
            JOB_TITLE: 'Software Engineer',
            CASE_STATUS: 'Certified'
        };
        const errors = dataManager.validateRecord(validRecord);
        expect(errors).toHaveLength(0);
    });
    
    runTest('Process data with mixed valid and invalid records', () => {
        const mixedData = [
            {
                CASE_NUMBER: 'I-200-12345-123456',
                EMPLOYER_NAME: 'Valid Company',
                JOB_TITLE: 'Software Engineer',
                CASE_STATUS: 'Certified',
                WAGE_RATE_OF_PAY_FROM: '75000',
                WAGE_UNIT_OF_PAY: 'Year',
                RECEIVED_DATE: '2023-01-15',
                DECISION_DATE: '2023-03-20'
            },
            {
                CASE_NUMBER: 'I-200-12345-123457',
                EMPLOYER_NAME: 'Another Company',
                JOB_TITLE: 'Data Scientist',
                CASE_STATUS: 'Denied',
                WAGE_RATE_OF_PAY_FROM: 'invalid-salary',
                WAGE_UNIT_OF_PAY: 'Hour',
                RECEIVED_DATE: 'invalid-date',
                DECISION_DATE: '2023-04-15'
            }
        ];
        
        const dataManager = new DataManager(mixedData);
        expect(dataManager.processedData).toHaveLength(2);
        
        expect(dataManager.processedData[0].ANNUAL_SALARY).toBe(75000);
        expect(dataManager.processedData[0].RECEIVED_DATE_PARSED).toBeInstanceOf(Date);
        
        expect(dataManager.processedData[1].ANNUAL_SALARY).toBe(0);
        expect(dataManager.processedData[1].RECEIVED_DATE_PARSED).toBeNull();
    });
    
    // Print test summary
    console.log(`\n📊 Test Results Summary:`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (failedTests === 0) {
        console.log('\n🎉 All tests passed! Data processing functionality is working correctly.');
    } else {
        console.log(`\n⚠️  ${failedTests} test(s) failed. Please review the implementation.`);
    }
    
    return {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: Math.round((passedTests / totalTests) * 100)
    };
}

// Run the tests
runTests();