import React from 'react';

function App() {
  return (
    <div className="bg-white text-gray-900">
      {/* Hero */}
      <header className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-24 px-6 text-center shadow-lg">
        <h1 className="text-5xl font-extrabold mb-4 drop-shadow-lg">TrySnowball</h1>
        <p className="text-xl max-w-2xl mx-auto mb-6 opacity-90">
          Smash your debt with smart tools, clear insight, and a dose of momentum.
        </p>
        <p className="text-md max-w-xl mx-auto mb-8 opacity-80">
          Make better decisions. Get back in control.
        </p>
        <a
          href="#signup"
          className="inline-block bg-white text-blue-600 font-semibold px-6 py-3 rounded-full shadow-lg hover:bg-blue-100 transition"
        >
          Join the waitlist
        </a>
      </header>

      {/* About */}
      <section className="py-16 px-6 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-6">What is TrySnowball?</h2>
        <p className="text-lg opacity-80 leading-relaxed">
          TrySnowball is part planner, part progress tracker, part motivational coach. It helps you stay focused, build better money habits, and clear debt faster — with less stress and more clarity.
        </p>
      </section>

      {/* What If Machine Teaser */}
      <section className="bg-gray-50 py-16 px-6 text-center border-t">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Coming Soon: The What If Machine</h2>
          <div className="bg-white shadow-md rounded-xl p-6 max-w-xl mx-auto">
            <p className="text-gray-700 text-lg mb-4">
              Ever wonder how much faster you’d be debt-free if you skipped that £80 gym membership or cut Friday takeaways?
            </p>
            <p className="text-gray-600 mb-6">
              TrySnowball shows you how small changes lead to big progress. No judgment. Just smart insight.
            </p>
            <a
              href="#"
              className="inline-block bg-indigo-600 text-white px-5 py-2 rounded-full font-medium hover:bg-indigo-700 transition"
            >
              Preview
            </a>
          </div>
        </div>
      </section>

      {/* Signup Form */}
      <section id="signup" className="py-20 px-6 bg-white border-t text-center">
        <h2 className="text-2xl font-semibold mb-6">Be first in line</h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Sign up for early access and start your journey to financial freedom.
        </p>
        <form
  name="signup"
  method="POST"
  data-netlify="true"
  action="/thank-you.html"
  className="max-w-md mx-auto flex flex-col gap-4"
>
  <input type="hidden" name="form-name" value="signup" />
  <input
    type="email"
    name="email"
    placeholder="you@example.com"
    required
    className="px-4 py-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
  />
  <button
    type="submit"
    className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition font-medium"
  >
    Join the waitlist
  </button>
</form>
      </section>

      {/* Footer */}
      <footer className="text-center text-sm py-8 bg-gray-100 border-t text-gray-500">
        © {new Date().getFullYear()} TrySnowball. Built in the UK with caffeine, clarity, and care.
      </footer>
    </div>
  );
}

export default App;