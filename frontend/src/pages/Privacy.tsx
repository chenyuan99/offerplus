import React from 'react';

export function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          <p className="text-gray-600 mb-6">Last updated: January 24th, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">GDPR</h2>
            <h3 className="text-xl font-medium text-gray-900 mb-3">Personal data collected, and why!</h3>
            <ol className="list-decimal pl-6 space-y-2 text-gray-600">
              <li>Username you choose - This is how you are identified on the website</li>
              <li>Password - this is how we confirm it's really you</li>
              <li>Email - this is how you can recover your account. We do not require email validation</li>
              <li>Application tracking data - Information about your job applications and their status</li>
              <li>Account activity - Including login times and feature usage to improve our service</li>
            </ol>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-medium text-gray-900 mb-3">Data Retention</h3>
            <p className="text-gray-600 mb-4">
              Your data is retained for as long as you maintain an active account with us. You can request data deletion at any time.
              Analytics data is retained for 14 months after your last activity.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-medium text-gray-900 mb-3">Data Sharing</h3>
            <p className="text-gray-600 mb-4">
              We do not share your personal data with third parties except:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>When required by law</li>
              <li>With your explicit consent</li>
              <li>For processing payments (with our payment processor)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-medium text-gray-900 mb-3">Your Rights</h3>
            <p className="text-gray-600 mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Access your personal data</li>
              <li>Correct your personal data</li>
              <li>Delete your personal data</li>
              <li>Export your personal data</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="text-gray-600 mt-4">
              To exercise any of these rights, please contact us at{' '}
              <a href="mailto:support@offersplus.com" className="text-indigo-600 hover:text-indigo-800">
                support@offersplus.com
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-medium text-gray-900 mb-3">Analytics and Cookies</h3>
            <p className="text-gray-600">
              We use analytics tools to improve our service. These tools may use cookies and similar technologies.
              You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-medium text-gray-900 mb-3">Changes to Privacy Policy</h3>
            <p className="text-gray-600">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new
              privacy policy on this page and updating the "Last updated" date.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
