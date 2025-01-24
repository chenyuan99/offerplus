import React from 'react';

export function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          <p className="text-gray-600 mb-6">Last updated: January 24th, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Terms</h2>
            <p className="text-gray-600 mb-4">
              By accessing and using Offers+, you agree to be bound by these Terms of Service and comply with all applicable laws and regulations. If you do not agree with these terms, please do not use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Use License</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                Permission is granted to temporarily use Offers+ for personal, non-commercial job search purposes, subject to the following restrictions:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You may not modify or copy the materials</li>
                <li>You may not use the materials for any commercial purpose</li>
                <li>You may not attempt to reverse engineer any software contained in Offers+</li>
                <li>You may not remove any copyright or proprietary notations from the materials</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                To use certain features of Offers+, you must register for an account. You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Promptly update your account information when necessary</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Service Modifications</h2>
            <p className="text-gray-600">
              We reserve the right to modify, suspend, or discontinue any part of Offers+ at any time without notice. We will not be liable to you or any third party for any modification, suspension, or discontinuation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Usage</h2>
            <p className="text-gray-600">
              By using Offers+, you grant us permission to use your data as described in our Privacy Policy. This includes tracking your job applications and providing personalized recommendations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Disclaimer</h2>
            <p className="text-gray-600">
              Offers+ is provided "as is" without warranties of any kind. We do not guarantee job placement or application success. Use of our service is at your own risk.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Contact</h2>
            <p className="text-gray-600">
              For questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:support@offersplus.com" className="text-indigo-600 hover:text-indigo-800">
                support@offersplus.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
