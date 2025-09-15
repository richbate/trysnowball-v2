import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-gray-600">Last updated: September 14, 2025</p>
          </div>

          <div className="space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                Welcome to TrySnowball ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you understand how we collect, use, and safeguard your personal information.
              </p>
              <p className="text-gray-700">
                This Privacy Policy explains our practices regarding the collection, use, and disclosure of information we receive when you use our debt management service at trysnowball.co.uk (the "Service").
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>

              <h3 className="text-lg font-medium text-gray-900 mb-2">2.1 Information You Provide</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li><strong>Email address:</strong> When you sign up for our waitlist or create an account</li>
                <li><strong>Financial information:</strong> Debt amounts, interest rates, and payment details you enter to use our debt management tools</li>
                <li><strong>Personal preferences:</strong> Settings and preferences for your debt payoff strategy</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mb-2">2.2 Information Collected Automatically</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li><strong>Usage analytics:</strong> How you interact with our service via PostHog analytics</li>
                <li><strong>Device information:</strong> Browser type, device type, and IP address (anonymized)</li>
                <li><strong>Performance data:</strong> Page load times and error reports to improve our service</li>
              </ul>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Provide debt management calculations and recommendations</li>
                <li>Send you updates about our service and your debt payoff progress</li>
                <li>Improve our service through anonymized usage analytics</li>
                <li>Ensure the security and proper functioning of our platform</li>
                <li>Comply with legal obligations and respond to lawful requests</li>
              </ul>
            </section>

            {/* Data Storage and Security */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Storage and Security</h2>
              <p className="text-gray-700 mb-4">
                <strong>Local Storage First:</strong> Your financial data is primarily stored locally in your browser to ensure maximum privacy and security.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>Cloudflare Infrastructure:</strong> When data is transmitted or stored remotely, we use Cloudflare's secure infrastructure, which includes:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>SSL/TLS encryption for data in transit</li>
                <li>Encrypted databases (Cloudflare D1) for data at rest</li>
                <li>Access controls and security monitoring</li>
                <li>Regular security updates and patches</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Information Sharing</h2>
              <p className="text-gray-700 mb-4">
                <strong>We do not sell, trade, or otherwise transfer your personal information to third parties.</strong>
              </p>
              <p className="text-gray-700 mb-4">
                We may share anonymized, aggregated data that cannot identify you individually for research or improvement purposes.
              </p>
              <p className="text-gray-700">
                We may disclose your information only if required by law or to protect our rights, property, or safety, or that of others.
              </p>
            </section>

            {/* Analytics and Cookies */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Analytics and Cookies</h2>
              <p className="text-gray-700 mb-4">
                We use PostHog for privacy-friendly analytics to understand how our service is used and to improve user experience.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Analytics data is anonymized and aggregated</li>
                <li>We do not track personally identifiable information in analytics</li>
                <li>You can opt out of analytics tracking in your browser settings</li>
              </ul>
            </section>

            {/* Your Rights (GDPR) */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights (GDPR)</h2>
              <p className="text-gray-700 mb-4">
                If you are in the European Union, you have the following rights:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li><strong>Right to access:</strong> Request copies of your personal data</li>
                <li><strong>Right to rectification:</strong> Request correction of inaccurate data</li>
                <li><strong>Right to erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Right to restrict processing:</strong> Request limitation of how we use your data</li>
                <li><strong>Right to data portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Right to object:</strong> Object to our processing of your personal data</li>
              </ul>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li><strong>Waitlist emails:</strong> Retained until you unsubscribe or request deletion</li>
                <li><strong>Financial data:</strong> Stored locally in your browser; removed when you clear your browser data</li>
                <li><strong>Analytics data:</strong> Anonymized and retained for service improvement purposes</li>
              </ul>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-700">
                Our service is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children under 18.
              </p>
            </section>

            {/* Changes to Privacy Policy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Privacy Policy</h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> <a href="mailto:privacy@trysnowball.co.uk" className="text-blue-600 hover:underline">privacy@trysnowball.co.uk</a>
                </p>
                <p className="text-gray-700 mt-2">
                  <strong>Website:</strong> <a href="https://trysnowball.co.uk" className="text-blue-600 hover:underline">trysnowball.co.uk</a>
                </p>
              </div>
            </section>
          </div>

          {/* Back to Home */}
          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <a
              href="/"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to TrySnowball
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;