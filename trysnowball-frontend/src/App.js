import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="hero">
        <h1>TrySnowball</h1>
        <p>Debt payoff made simple. Make better decisions. Get back in control.</p>
        <a href="#signup" className="cta">Join the waitlist</a>
      </header>

      <section className="intro">
        <h2>What is TrySnowball?</h2>
        <p>TrySnowball is a debt payoff planner, scenario modeller, and accountability coach—designed to help you clear debt faster and stay motivated.</p>
      </section>

      <section className="teaser">
        <h2>Coming Soon: The What If Machine</h2>
        <p>Wondering what happens if you skip takeaways for a month or cancel that unused subscription? See how small changes stack up to big progress.</p>
        <a href="#whatif">Preview</a>
      </section>

      <section id="signup" className="signup">
        <h2>Be the first to try it</h2>
        <form name="signup" method="POST" data-netlify="true">
          <input type="hidden" name="form-name" value="signup" />
          <input type="email" name="email" placeholder="Your email" required />
          <button type="submit">Join the waitlist</button>
        </form>
      </section>

      <footer>
        <p>© {new Date().getFullYear()} TrySnowball. Built in the UK.</p>
      </footer>
    </div>
  );
}

export default App;