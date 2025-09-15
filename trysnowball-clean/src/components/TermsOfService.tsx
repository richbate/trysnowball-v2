import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
            <p className="text-gray-600">Last updated: September 14, 2025</p>
          </div>

          <div className="space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                Welcome to TrySnowball. These Terms of Service ("Terms") govern your use of the TrySnowball website and service located at trysnowball.co.uk (the "Service") operated by TrySnowball ("us", "we", or "our").
              </p>
              <p className="text-gray-700">
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these terms, then you may not access the Service.
              </p>
            </section>

            {/* Description of Service */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                TrySnowball is a debt management tool that helps users create and manage debt payoff strategies using various methodologies including debt snowball and debt avalanche approaches.
              </p>
              <p className="text-gray-700">
                <strong>Important:</strong> TrySnowball provides educational tools and calculators. We do not provide financial advice, credit counseling, or debt management services. Always consult with qualified financial professionals for personalized advice.
              </p>
            </section>

            {/* User Accounts and Responsibilities */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts and Responsibilities</h2>
              <h3 className="text-lg font-medium text-gray-900 mb-2">3.1 Account Security</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>You are responsible for maintaining the confidentiality of your account</li>
                <li>You agree to notify us immediately of any unauthorized use of your account</li>
                <li>You must provide accurate and complete information when creating your account</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mb-2">3.2 Acceptable Use</h3>
              <p className="text-gray-700 mb-4">You agree not to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Use the Service for any unlawful purpose or in violation of any laws</li>
                <li>Attempt to gain unauthorized access to our systems or other users' data</li>
                <li>Upload or transmit malicious code, viruses, or other harmful content</li>
                <li>Interfere with or disrupt the Service or servers or networks</li>
                <li>Impersonate any person or entity or misrepresent your affiliation</li>
              </ul>
            </section>

            {/* Financial Information Disclaimer */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Financial Information Disclaimer</h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 font-medium">
                      <strong>Important Financial Disclaimer</strong>
                    </p>
                    <p className="text-sm text-yellow-700 mt-2">
                      TrySnowball is an educational tool and calculator. It is not a substitute for professional financial advice.
                    </p>
                  </div>
                </div>
              </div>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Not Financial Advice:</strong> Our calculations and recommendations are for educational purposes only</li>
                <li><strong>Consult Professionals:</strong> Always consult with qualified financial advisors for personalized advice</li>
                <li><strong>Accuracy Not Guaranteed:</strong> While we strive for accuracy, calculations may contain errors</li>
                <li><strong>Your Responsibility:</strong> You are solely responsible for your financial decisions</li>
              </ul>
            </section>

            {/* Privacy and Data */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Privacy and Data</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Financial data is stored locally in your browser when possible</li>
                <li>We use minimal data collection practices</li>
                <li>You can export or delete your data at any time</li>
                <li>We do not sell or share your personal financial information</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property Rights</h2>
              <p className="text-gray-700 mb-4">
                The Service and its original content, features, and functionality are and will remain the exclusive property of TrySnowball and its licensors.
              </p>
              <p className="text-gray-700">
                The Service is protected by copyright, trademark, and other laws. Our trademarks and trade dress may not be used without our prior written consent.
              </p>
            </section>

            {/* Service Availability */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Service Availability</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>No Guarantee:</strong> We do not guarantee that the Service will be available 24/7</li>
                <li><strong>Maintenance:</strong> We may perform maintenance that temporarily interrupts service</li>
                <li><strong>Updates:</strong> We may modify or discontinue features with or without notice</li>
                <li><strong>Third-party Dependencies:</strong> Our service relies on third-party infrastructure (Cloudflare)</li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-700 font-medium">
                      <strong>Important Legal Notice</strong>
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>We provide the Service "as is" without warranties of any kind</li>
                <li>We are not liable for any financial decisions you make based on our Service</li>
                <li>We are not responsible for any direct, indirect, or consequential damages</li>
                <li>Our total liability shall not exceed the amount you paid for the Service</li>
                <li>These limitations apply even if we have been advised of the possibility of damages</li>
              </ul>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Termination</h2>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
              </p>
              <p className="text-gray-700">
                You may terminate your use of the Service at any time. Upon termination, your right to use the Service will cease immediately.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Governing Law</h2>
              <p className="text-gray-700">
                These Terms shall be governed and construed in accordance with the laws of the United Kingdom, without regard to its conflict of law provisions. Any disputes arising from these Terms or the Service shall be subject to the jurisdiction of the courts of England and Wales.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
              </p>
              <p className="text-gray-700">
                By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> <a href="mailto:legal@trysnowball.co.uk" className="text-blue-600 hover:underline">legal@trysnowball.co.uk</a>
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

export default TermsOfService;