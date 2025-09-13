/**
 * Demo Scenarios - Realistic UK Household Debt Situations
 * Pre-built scenarios for demonstrations and user onboarding
 */

export interface DemoDebt {
  id: string;
  name: string;
  amount: number;
  interest_rate: number;
  min_payment: number;
  debt_type: 'credit_card' | 'personal_loan' | 'car_finance' | 'student_loan' | 'overdraft' | 'mortgage';
}

export interface DemoScenario {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  persona: {
    name: string;
    age: number;
    situation: string;
    location: string;
  };
  debts: DemoDebt[];
  totalDebt: number;
  monthlyPayments: number;
  estimatedPayoffMonths: number;
  keyInsights: string[];
}

export const demoScenarios: DemoScenario[] = [
  {
    id: 'young-professional',
    title: 'Young Professional',
    subtitle: 'Graduate starting career in Manchester',
    description: 'Recent university graduate with student loans and credit card debt from university years. Starting first job and looking to become debt-free.',
    persona: {
      name: 'Emma Johnson',
      age: 24,
      situation: 'Graduate Software Developer',
      location: 'Manchester'
    },
    debts: [
      {
        id: 'student-loan-1',
        name: 'Student Loan Plan 2',
        amount: 24500,
        interest_rate: 6.25,
        min_payment: 89,
        debt_type: 'student_loan'
      },
      {
        id: 'credit-card-1',
        name: 'Barclaycard',
        amount: 3200,
        interest_rate: 19.9,
        min_payment: 96,
        debt_type: 'credit_card'
      },
      {
        id: 'overdraft-1',
        name: 'NatWest Overdraft',
        amount: 1800,
        interest_rate: 35.0,
        min_payment: 45,
        debt_type: 'overdraft'
      }
    ],
    totalDebt: 29500,
    monthlyPayments: 230,
    estimatedPayoffMonths: 48,
    keyInsights: [
      'Focus on overdraft first - highest interest at 35%',
      'Could save £2,400 in interest with debt avalanche method',
      'Free from non-student debt in 3.2 years with extra £100/month'
    ]
  },

  {
    id: 'family-household',
    title: 'Growing Family',
    subtitle: 'Young family managing multiple debts',
    description: 'Married couple with two children juggling mortgage, car payments, and credit cards while managing family expenses.',
    persona: {
      name: 'Sarah & James Mitchell',
      age: 32,
      situation: 'Married couple, 2 children',
      location: 'Birmingham'
    },
    debts: [
      {
        id: 'car-finance-1',
        name: 'Ford Focus PCP',
        amount: 12500,
        interest_rate: 8.9,
        min_payment: 285,
        debt_type: 'car_finance'
      },
      {
        id: 'credit-card-2',
        name: 'Halifax Clarity',
        amount: 4800,
        interest_rate: 18.9,
        min_payment: 144,
        debt_type: 'credit_card'
      },
      {
        id: 'credit-card-3',
        name: 'Tesco Clubcard Credit Card',
        amount: 2100,
        interest_rate: 22.9,
        min_payment: 63,
        debt_type: 'credit_card'
      },
      {
        id: 'personal-loan-1',
        name: 'Santander Personal Loan',
        amount: 8500,
        interest_rate: 6.4,
        min_payment: 195,
        debt_type: 'personal_loan'
      }
    ],
    totalDebt: 27900,
    monthlyPayments: 687,
    estimatedPayoffMonths: 52,
    keyInsights: [
      'Tesco card has highest rate - tackle first',
      'Personal loan has lowest rate - pay last',
      'Could save £1,850 by consolidating credit cards',
      'Debt-free in 4.1 years with snowball method'
    ]
  },

  {
    id: 'post-divorce',
    title: 'Fresh Start',
    subtitle: 'Rebuilding finances after divorce',
    description: 'Recently divorced professional taking control of finances and working toward independence with split assets and responsibilities.',
    persona: {
      name: 'Claire Thompson',
      age: 38,
      situation: 'Divorced, Marketing Manager',
      location: 'Leeds'
    },
    debts: [
      {
        id: 'credit-card-4',
        name: 'MBNA Low Rate Card',
        amount: 6200,
        interest_rate: 13.9,
        min_payment: 186,
        debt_type: 'credit_card'
      },
      {
        id: 'personal-loan-2',
        name: 'Zopa Personal Loan',
        amount: 15000,
        interest_rate: 7.2,
        min_payment: 445,
        debt_type: 'personal_loan'
      },
      {
        id: 'car-finance-2',
        name: 'Mini Cooper Finance',
        amount: 8900,
        interest_rate: 9.9,
        min_payment: 198,
        debt_type: 'car_finance'
      }
    ],
    totalDebt: 30100,
    monthlyPayments: 829,
    estimatedPayoffMonths: 44,
    keyInsights: [
      'Strong monthly payment capacity',
      'Could be debt-free in 3.5 years',
      'Car finance has highest rate after credit card',
      'Building strong credit score for future mortgage'
    ]
  },

  {
    id: 'small-business',
    title: 'Small Business Owner',
    subtitle: 'Entrepreneur managing business and personal debt',
    description: 'Self-employed tradesperson with mixed personal and business borrowing, working to separate and optimize debt structure.',
    persona: {
      name: 'Michael Roberts',
      age: 29,
      situation: 'Self-employed Electrician',
      location: 'Bristol'
    },
    debts: [
      {
        id: 'credit-card-5',
        name: 'American Express',
        amount: 8500,
        interest_rate: 24.9,
        min_payment: 255,
        debt_type: 'credit_card'
      },
      {
        id: 'personal-loan-3',
        name: 'Metro Bank Business Loan',
        amount: 18500,
        interest_rate: 8.9,
        min_payment: 425,
        debt_type: 'personal_loan'
      },
      {
        id: 'car-finance-3',
        name: 'Ford Transit Van',
        amount: 22000,
        interest_rate: 7.4,
        min_payment: 389,
        debt_type: 'car_finance'
      },
      {
        id: 'credit-card-6',
        name: 'Barclays Business Card',
        amount: 3800,
        interest_rate: 21.9,
        min_payment: 114,
        debt_type: 'credit_card'
      }
    ],
    totalDebt: 52800,
    monthlyPayments: 1183,
    estimatedPayoffMonths: 56,
    keyInsights: [
      'American Express highest priority - 24.9% APR',
      'Van finance is business-essential, lowest priority',
      'Could save £4,200 with debt consolidation',
      'Strong income allows aggressive payoff strategy'
    ]
  },

  {
    id: 'pre-retirement',
    title: 'Pre-Retirement',
    subtitle: 'Clearing debt before retirement',
    description: 'Experienced professional in final working years focused on becoming debt-free before retirement for financial security.',
    persona: {
      name: 'David & Susan Wilson',
      age: 58,
      situation: 'Pre-retirement couple',
      location: 'Edinburgh'
    },
    debts: [
      {
        id: 'personal-loan-4',
        name: 'Nationwide Personal Loan',
        amount: 12500,
        interest_rate: 5.9,
        min_payment: 285,
        debt_type: 'personal_loan'
      },
      {
        id: 'credit-card-7',
        name: 'John Lewis Partnership Card',
        amount: 2800,
        interest_rate: 16.9,
        min_payment: 84,
        debt_type: 'credit_card'
      },
      {
        id: 'car-finance-4',
        name: 'BMW 3 Series',
        amount: 16200,
        interest_rate: 6.9,
        min_payment: 298,
        debt_type: 'car_finance'
      }
    ],
    totalDebt: 31500,
    monthlyPayments: 667,
    estimatedPayoffMonths: 54,
    keyInsights: [
      'Credit card highest rate - clear first',
      'On track to be debt-free before retirement',
      'Strong pension contributions maintained',
      'Conservative approach with steady payments'
    ]
  }
];

// Helper function to get scenario by ID
export const getDemoScenario = (id: string): DemoScenario | undefined => {
  return demoScenarios.find(scenario => scenario.id === id);
};

// Helper function to get all scenario IDs and titles for selection
export const getScenarioOptions = () => {
  return demoScenarios.map(scenario => ({
    id: scenario.id,
    title: scenario.title,
    subtitle: scenario.subtitle,
    totalDebt: scenario.totalDebt,
    monthlyPayments: scenario.monthlyPayments
  }));
};