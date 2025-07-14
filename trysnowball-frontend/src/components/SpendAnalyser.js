import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SpendAnalyser = () => {
  const navigate = useNavigate();
  const [csvData, setCsvData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUsingDemoData, setIsUsingDemoData] = useState(false);

  // Category mapping for spending analysis
  const categoryKeywords = {
    'Takeaways & Dining': ['mcdonalds', 'kfc', 'subway', 'pizza', 'deliveroo', 'uber eats', 'just eat', 'restaurant', 'cafe', 'pub', 'bar', 'takeaway'],
    'Subscriptions': ['netflix', 'spotify', 'amazon prime', 'disney', 'apple music', 'gym', 'fitness', 'membership', 'subscription'],
    'Coffee & Drinks': ['costa', 'starbucks', 'coffee', 'pret', 'greggs', 'cafe nero'],
    'Shopping': ['amazon', 'ebay', 'asos', 'next', 'h&m', 'primark', 'argos', 'currys', 'shopping'],
    'Transport': ['uber', 'taxi', 'fuel', 'petrol', 'parking', 'train', 'bus', 'transport'],
    'Entertainment': ['cinema', 'netflix', 'game', 'spotify', 'entertainment', 'leisure'],
    'Groceries': ['tesco', 'asda', 'sainsbury', 'morrisons', 'aldi', 'lidl', 'co-op', 'waitrose', 'iceland']
  };

  // Demo data generator
  const generateDemoData = () => {
    const demoTransactions = [
      // Takeaways & Dining
      { amount: 28.50, description: 'Deliveroo - Pizza Express', date: '2024-12-15', category: 'Takeaways & Dining' },
      { amount: 12.90, description: 'McDonalds Drive Thru', date: '2024-12-14', category: 'Takeaways & Dining' },
      { amount: 45.80, description: 'The Red Lion Pub', date: '2024-12-13', category: 'Takeaways & Dining' },
      { amount: 22.40, description: 'Subway - Lunch', date: '2024-12-12', category: 'Takeaways & Dining' },
      { amount: 65.30, description: 'Bella Italia Restaurant', date: '2024-12-10', category: 'Takeaways & Dining' },
      { amount: 18.75, description: 'KFC Family Feast', date: '2024-12-08', category: 'Takeaways & Dining' },
      { amount: 35.60, description: 'Just Eat - Thai Food', date: '2024-12-07', category: 'Takeaways & Dining' },
      { amount: 15.20, description: 'Burger King', date: '2024-12-05', category: 'Takeaways & Dining' },
      
      // Subscriptions
      { amount: 15.99, description: 'Netflix Monthly', date: '2024-12-15', category: 'Subscriptions' },
      { amount: 10.99, description: 'Spotify Premium', date: '2024-12-14', category: 'Subscriptions' },
      { amount: 35.99, description: 'PureGym Membership', date: '2024-12-13', category: 'Subscriptions' },
      { amount: 8.99, description: 'Amazon Prime', date: '2024-12-12', category: 'Subscriptions' },
      { amount: 12.99, description: 'Disney+ Monthly', date: '2024-12-11', category: 'Subscriptions' },
      { amount: 4.99, description: 'Apple Music', date: '2024-12-10', category: 'Subscriptions' },
      
      // Coffee & Drinks
      { amount: 4.85, description: 'Costa Coffee', date: '2024-12-15', category: 'Coffee & Drinks' },
      { amount: 5.20, description: 'Starbucks Venti Latte', date: '2024-12-14', category: 'Coffee & Drinks' },
      { amount: 3.60, description: 'Pret A Manger Coffee', date: '2024-12-13', category: 'Coffee & Drinks' },
      { amount: 4.95, description: 'Costa Coffee', date: '2024-12-12', category: 'Coffee & Drinks' },
      { amount: 2.85, description: 'Greggs Coffee & Pastry', date: '2024-12-11', category: 'Coffee & Drinks' },
      { amount: 5.40, description: 'Starbucks Frappuccino', date: '2024-12-10', category: 'Coffee & Drinks' },
      { amount: 3.25, description: 'Cafe Nero Cappuccino', date: '2024-12-09', category: 'Coffee & Drinks' },
      
      // Shopping
      { amount: 89.99, description: 'Amazon UK - Electronics', date: '2024-12-15', category: 'Shopping' },
      { amount: 45.50, description: 'ASOS - Clothing', date: '2024-12-14', category: 'Shopping' },
      { amount: 125.00, description: 'Next - Winter Coat', date: '2024-12-13', category: 'Shopping' },
      { amount: 32.99, description: 'H&M - Accessories', date: '2024-12-12', category: 'Shopping' },
      { amount: 67.80, description: 'Argos - Home Items', date: '2024-12-11', category: 'Shopping' },
      { amount: 25.99, description: 'Primark - Basics', date: '2024-12-10', category: 'Shopping' },
      
      // Transport
      { amount: 15.60, description: 'Uber Trip', date: '2024-12-15', category: 'Transport' },
      { amount: 45.80, description: 'Shell Petrol Station', date: '2024-12-14', category: 'Transport' },
      { amount: 8.90, description: 'City Centre Parking', date: '2024-12-13', category: 'Transport' },
      { amount: 12.40, description: 'Uber Trip', date: '2024-12-12', category: 'Transport' },
      { amount: 42.50, description: 'BP Petrol Station', date: '2024-12-11', category: 'Transport' },
      
      // Groceries
      { amount: 78.45, description: 'Tesco Weekly Shop', date: '2024-12-15', category: 'Groceries' },
      { amount: 52.30, description: 'Sainsburys Groceries', date: '2024-12-13', category: 'Groceries' },
      { amount: 34.90, description: 'Aldi Food Shop', date: '2024-12-11', category: 'Groceries' },
      { amount: 89.60, description: 'Asda Weekly Shop', date: '2024-12-09', category: 'Groceries' },
      { amount: 15.80, description: 'Co-op Quick Shop', date: '2024-12-08', category: 'Groceries' },
      
      // Entertainment
      { amount: 28.50, description: 'Vue Cinema Tickets', date: '2024-12-14', category: 'Entertainment' },
      { amount: 45.00, description: 'Bowling & Arcade', date: '2024-12-12', category: 'Entertainment' },
      { amount: 15.99, description: 'PlayStation Store', date: '2024-12-10', category: 'Entertainment' }
    ];
    
    return demoTransactions;
  };

  const useDemoData = () => {
    const demoTransactions = generateDemoData();
    setCsvData(demoTransactions);
    const analysisResult = analyzeSpending(demoTransactions);
    setAnalysis(analysisResult);
    setIsUsingDemoData(true);
  };

  const categorizeTransaction = (description) => {
    const desc = description.toLowerCase();
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => desc.includes(keyword))) {
        return category;
      }
    }
    return 'Other';
  };

  const parseCSV = (csvText) => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Try to identify common column names
    const amountCol = headers.findIndex(h => 
      h.toLowerCase().includes('amount') || 
      h.toLowerCase().includes('value') ||
      h.toLowerCase().includes('debit') ||
      h.toLowerCase().includes('credit')
    );
    
    const descCol = headers.findIndex(h => 
      h.toLowerCase().includes('description') || 
      h.toLowerCase().includes('merchant') ||
      h.toLowerCase().includes('payee') ||
      h.toLowerCase().includes('detail')
    );
    
    const dateCol = headers.findIndex(h => 
      h.toLowerCase().includes('date') ||
      h.toLowerCase().includes('transaction date')
    );

    const transactions = [];
    
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(cell => cell.trim().replace(/"/g, ''));
      if (row.length < headers.length) continue;
      
      const amount = parseFloat(row[amountCol]?.replace(/[£$-]/g, ''));
      const description = row[descCol] || '';
      const date = row[dateCol] || '';
      
      if (!isNaN(amount) && amount > 0) {
        transactions.push({
          amount,
          description,
          date,
          category: categorizeTransaction(description)
        });
      }
    }
    
    return transactions;
  };

  const analyzeSpending = (transactions) => {
    const categoryTotals = {};
    let totalSpending = 0;
    
    transactions.forEach(transaction => {
      const category = transaction.category;
      if (!categoryTotals[category]) {
        categoryTotals[category] = { total: 0, count: 0, transactions: [] };
      }
      categoryTotals[category].total += transaction.amount;
      categoryTotals[category].count += 1;
      categoryTotals[category].transactions.push(transaction);
      totalSpending += transaction.amount;
    });

    // Calculate potential savings
    const savingsOpportunities = [
      {
        category: 'Takeaways & Dining',
        current: categoryTotals['Takeaways & Dining']?.total || 0,
        suggestion: 'Cook 3 more meals at home per week',
        potential: Math.min((categoryTotals['Takeaways & Dining']?.total || 0) * 0.5, 150),
        difficulty: 'Easy'
      },
      {
        category: 'Subscriptions',
        current: categoryTotals['Subscriptions']?.total || 0,
        suggestion: 'Cancel unused subscriptions',
        potential: Math.min((categoryTotals['Subscriptions']?.total || 0) * 0.3, 80),
        difficulty: 'Very Easy'
      },
      {
        category: 'Coffee & Drinks',
        current: categoryTotals['Coffee & Drinks']?.total || 0,
        suggestion: 'Make coffee at home 3 days per week',
        potential: Math.min((categoryTotals['Coffee & Drinks']?.total || 0) * 0.4, 60),
        difficulty: 'Easy'
      },
      {
        category: 'Shopping',
        current: categoryTotals['Shopping']?.total || 0,
        suggestion: 'Implement 24-hour rule for non-essential purchases',
        potential: Math.min((categoryTotals['Shopping']?.total || 0) * 0.2, 100),
        difficulty: 'Medium'
      }
    ].filter(opp => opp.potential > 10);

    const totalPotentialSavings = savingsOpportunities.reduce((sum, opp) => sum + opp.potential, 0);

    return {
      totalSpending,
      categoryTotals,
      savingsOpportunities,
      totalPotentialSavings,
      transactionCount: transactions.length,
      averageTransaction: totalSpending / transactions.length
    };
  };

  const saveSnowballToWhatIf = () => {
  if (!analysis || analysis.totalPotentialSavings === 0) {
    alert('No savings analysis available to transfer.');
    return;
  }

  const snowballData = {
    amount: Math.round(analysis.totalPotentialSavings),
    source: 'spend_analysis',
    date: new Date().toISOString(),
    breakdown: analysis.savingsOpportunities.map(opp => ({
      category: opp.category,
      potential: Math.round(opp.potential),
      suggestion: opp.suggestion
    }))
  };

  localStorage.setItem('trysnowball-pending-snowball', JSON.stringify(snowballData));
  navigate('/what-if');
};

  const handleFileUpload = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvText = e.target.result;
        const transactions = parseCSV(csvText);
        setCsvData(transactions);
        const analysisResult = analyzeSpending(transactions);
        setAnalysis(analysisResult);
        setIsUsingDemoData(false);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Error parsing CSV file. Please check the format.');
      }
    };
    
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', { 
      style: 'currency', 
      currency: 'GBP',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔍 AI Spend Analyser
          </h1>
          <p className="text-xl text-gray-600">
            Upload your bank transactions to discover how much you could save
          </p>
        </div>

        {!csvData ? (
          // Upload Section
          <div className="max-w-2xl mx-auto">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Upload Your Bank Transactions
              </h3>
              <p className="text-gray-600 mb-6">
                Export your transactions as CSV from your bank and drop them here, or try our demo
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload(e.target.files[0])}
                className="hidden"
                id="csv-upload"
              />
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="csv-upload"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-block mr-4"
                  >
                    Choose CSV File
                  </label>
                  <button
                    onClick={useDemoData}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Use Demo Data
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Try the demo to see how it works with realistic spending data
                </p>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-green-900 mb-3">
                🔒 Your Data Stays Private
              </h4>
              <ul className="text-sm text-green-800 space-y-2">
                <li>• All processing happens in your browser</li>
                <li>• Your data never leaves your device</li>
                <li>• No servers, no storage, no sharing</li>
                <li>• You're in complete control</li>
              </ul>
            </div>

            {/* How to Export */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-blue-900 mb-3">
                📥 How to Export from Your Bank
              </h4>
              <div className="text-sm text-blue-800 space-y-2">
                <p><strong>Most UK banks:</strong> Online banking → Statements → Download as CSV</p>
                <p><strong>Popular banks:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Barclays: Online banking → 'Export' → CSV format</li>
                  <li>HSBC: Online banking → 'Download transactions' → CSV</li>
                  <li>Santander: Online banking → 'Export' → CSV file</li>
                  <li>Lloyds: Internet banking → 'Export' → CSV format</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          // Analysis Results
          <div className="space-y-8">
            {/* Magic Snowball Number */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">✨ Potential savings to add to your snowball</h2>
              <div className="text-6xl font-bold mb-4">
                {formatCurrency(analysis.totalPotentialSavings)}
              </div>
              <p className="text-xl opacity-90">
                Extra monthly payment you could make toward debt freedom
              </p>
              <p className="text-lg opacity-75 mt-2">
                {csvData.length === generateDemoData().length ? 
                  'Based on demo data - upload your own for personalized results' : 
                  `Based on ${analysis.transactionCount} transactions analyzed`
                }
              </p>
            </div>

            {/* Spending Breakdown */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Spending Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(analysis.categoryTotals)
                  .sort(([,a], [,b]) => b.total - a.total)
                  .map(([category, data]) => (
                    <div key={category} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{category}</h4>
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {formatCurrency(data.total)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {data.count} transactions
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Savings Opportunities */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">💰 Savings Opportunities</h3>
              <div className="space-y-4">
                {analysis.savingsOpportunities.map((opportunity, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{opportunity.category}</h4>
                        <p className="text-sm text-gray-600">{opportunity.suggestion}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">
                          {formatCurrency(opportunity.potential)}
                        </div>
                        <div className="text-sm text-gray-500">per month</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Current spending: {formatCurrency(opportunity.current)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        opportunity.difficulty === 'Very Easy' ? 'bg-green-100 text-green-800' :
                        opportunity.difficulty === 'Easy' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {opportunity.difficulty}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                🎯 Next Steps to Debt Freedom
              </h3>
              <div className="space-y-3 text-blue-800">
<p>1. <strong>It might be tough, but you could use this {formatCurrency(analysis.totalPotentialSavings)} as extra monthly payment</strong> toward your existing debts</p>
                <p>2. <strong>Start with the "Very Easy" changes</strong> - cancel unused subscriptions</p>
                <p>3. <strong>Track your progress</strong> - upload transactions monthly to verify</p>
                <p>4. <strong>Celebrate wins</strong> - every pound saved speeds up your debt freedom!</p>
              </div>
              <div className="mt-6 text-center">
                <button
  onClick={saveSnowballToWhatIf}
  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
>
  Apply £{Math.round(analysis.totalPotentialSavings)} to Debt Snowball →
</button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="text-center space-y-4">
              {/* Demo Data Call-to-Action */}
              {analysis && analysis.totalPotentialSavings > 0 && isUsingDemoData && (
                <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                    📊 This is just demo data!
                  </h3>
                  <p className="text-yellow-800 mb-4">
                    You found £{Math.round(analysis.totalPotentialSavings)} in potential savings with demo data. 
                    <strong> What could YOUR real transactions reveal?</strong>
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => {
                        setCsvData(null);
                        setAnalysis(null);
                        setIsUsingDemoData(false);
                      }}
                      className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                    >
                      📤 Upload Your Real Data
                    </button>
                    <button
                      onClick={() => navigate('/debts')}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      🎯 Setup Your Real Debts
                    </button>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => {
                  setCsvData(null);
                  setAnalysis(null);
                }}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Analyze Different Transactions
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpendAnalyser;