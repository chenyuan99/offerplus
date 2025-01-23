import React, { useState } from 'react';
import { Briefcase, TrendingUp, Building2, Shield } from 'lucide-react';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import FeatureCard from './components/FeatureCard';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = [
    {
      icon: Briefcase,
      title: "Smart Job Matching",
      description: "AI-powered job recommendations based on your skills and experience"
    },
    {
      icon: TrendingUp,
      title: "Salary Insights",
      description: "Real-time salary data and career growth opportunities"
    },
    {
      icon: Building2,
      title: "Company Reviews",
      description: "Authentic reviews and ratings from current and former employees"
    },
    {
      icon: Shield,
      title: "Verified Employers",
      description: "All job postings are verified to ensure legitimacy and quality"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      {/* Hero Section */}
      <div className="relative pt-16 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="text-center">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Find Your Dream Job</span>
                  <span className="block text-indigo-600">Advance Your Career</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl">
                  Discover opportunities that match your skills and aspirations. Join thousands of professionals finding their perfect roles.
                </p>
                <div className="mt-8 flex justify-center">
                  <SearchBar />
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  Popular: Software Engineer, Product Manager, Data Scientist, Remote Jobs
                </p>
              </div>
            </main>
          </div>
        </div>
        <div className="relative mt-12">
          <img
            className="w-full h-64 sm:h-72 md:h-96 object-cover"
            src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80"
            alt="People working in modern office"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent"></div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Your Career Success Starts Here
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Tools and insights to help you make your next career move with confidence
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              <span className="block">Ready to take the next step?</span>
              <span className="block text-indigo-200">Create your profile today.</span>
            </h2>
            <p className="mt-4 text-lg text-indigo-100">
              Join millions of professionals who've found their dream jobs through OfferPlus.
            </p>
          </div>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0 space-x-4">
            <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50">
              Upload Resume
            </button>
            <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-400">
              Create Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;