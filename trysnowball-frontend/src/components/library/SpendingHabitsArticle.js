import React from 'react';

const SpendingHabitsArticle = () => {
  const moneyDrains = [
    {
      title: "1. The Convenience Tax",
      description: "Takeaways, meal delivery, grab-and-go lunches. You're not just paying for food — you're paying for convenience. Often 3-4x what it would cost to prepare at home.",
      icon: "🍔"
    },
    {
      title: "2. The Subscription Creep",
      description: "Netflix, Spotify, gym memberships, cloud storage, news subscriptions. They're small individually, but the average person pays over £200/month for services they barely use.",
      icon: "💳"
    },
    {
      title: "3. The Impulse Purchase",
      description: "Amazon one-clicks, social media ads, \"limited time offers.\" These purchases feel small in the moment but add up to hundreds each month.",
      icon: "🛒"
    },
    {
      title: "4. The Interest Trap",
      description: "Credit card interest isn't just a cost — it's a cost that compounds. Every pound you spend on unnecessary items is a pound that could have reduced your debt and saved you interest.",
      icon: "💸"
    }
  ];

  const weeklySteps = [
    {
      week: "Week 1",
      action: "Just track. Don't change anything. Notice patterns."
    },
    {
      week: "Week 2",
      action: "Start categorising: Needs, Wants, Waste."
    },
    {
      week: "Week 3",
      action: "Ask \"Is this worth staying in debt longer?\" before each purchase."
    },
    {
      week: "Week 4",
      action: "Identify your top 3 money drains and create a plan to address them."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8 border border-gray-200">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Where Does Your Money Actually Go?
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            The hidden spending leaks that keep you stuck in debt — and the simple fixes that free up hundreds each month.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8 border border-gray-200">
          <p className="text-lg text-gray-700 mb-6 italic">
            It's the last week of the month. You check your bank balance and think: "Where did it all go?"
          </p>

          <p className="text-gray-700 mb-6">
            If this sounds familiar, you're not alone. Most people underestimate their spending by 20-30%. Those "small" purchases add up faster than you think — and they're often the biggest obstacle between you and financial freedom.
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              The £3 Coffee That Costs £1,000
            </h2>
            <p className="text-gray-700 mb-4">
              Let's be clear: this isn't about shaming you for buying coffee. It's about understanding the true cost of unconscious spending.
            </p>
            <p className="text-gray-700 mb-4">
              That £3 daily coffee? Over a year, it's £1,095. But here's the kicker — if you're carrying debt at 20% interest, that money could have saved you hundreds more in interest payments.
            </p>
            <p className="text-lg font-semibold text-blue-800">
              The real question isn't "Can I afford this coffee?" It's "Is this coffee worth staying in debt longer?"
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8 border border-gray-200">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">
            The Big Four Money Drains
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            {moneyDrains.map((drain, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{drain.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {drain.title}
                    </h3>
                    <p className="text-gray-700 text-sm">
                      {drain.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8 border border-gray-200">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">
            The One-Month Money Tracking Challenge
          </h2>
          <p className="text-gray-700 mb-6">
            Here's what actually works: track every single purchase for 30 days. Not to judge yourself — to get real data.
          </p>
          
          <div className="space-y-4">
            {weeklySteps.map((step, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {step.week}:
                  </h3>
                  <p className="text-gray-700 text-sm">
                    {step.action}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8 border border-gray-200">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">
            The Power of Intention
          </h2>
          <p className="text-gray-700 mb-6">
            You don't need to live like a monk. But you do need to spend with intention.
          </p>
          <p className="text-gray-700 mb-6">
            Love your daily coffee? Keep it — but maybe skip the £12 delivery fee on takeaway. Enjoy streaming services? Pick your top 2 and cancel the rest. The goal isn't deprivation — it's making conscious choices.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-green-900 mb-4">
            Take Action This Week:
          </h2>
          <ul className="space-y-2 text-green-800">
            <li className="flex items-start space-x-2">
              <span className="text-green-600">•</span>
              <span>Download a spending tracking app or use a simple notes app</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-600">•</span>
              <span>Track every purchase for 7 days</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-600">•</span>
              <span>At the end of the week, identify your top 3 spending categories</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-600">•</span>
              <span>Test one small change: cancel one subscription, cook one extra meal at home, skip one impulse purchase</span>
            </li>
          </ul>
        </div>

        <div className="bg-blue-600 text-white rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">
            Your Next Step
          </h2>
          <p className="mb-6">
            Try our What If Machine to see how redirecting just £50-100 of monthly spending toward debt could change your timeline. You might be surprised how much faster you could be debt-free.
          </p>
          <a
            href="/what-if"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Try the What If Machine
          </a>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/library"
            className="text-blue-600 hover:text-blue-700 transition-colors"
          >
            ← Back to Library
          </a>
        </div>
      </div>
    </div>
  );
};

export default SpendingHabitsArticle;