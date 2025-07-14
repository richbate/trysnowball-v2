import React from 'react';

const ThankYou = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white px-6 py-12 text-center">
      <h1 className="text-4xl font-bold text-blue-400 mb-4">Thank You!</h1>
      <p className="text-xl mb-6">You're on the waitlist. We'll be in touch soon!</p>
      <a href="/" className="text-blue-400 hover:text-blue-300">← Back to home</a>
    </div>
  );
};

export default ThankYou;