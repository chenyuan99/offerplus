import React from 'react';
import { Building2, Menu, X } from 'lucide-react';

interface NavbarProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
}

export default function Navbar({ isMenuOpen, setIsMenuOpen }: NavbarProps) {
  return (
    <nav className="fixed w-full bg-white/90 backdrop-blur-sm z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">OfferPlus</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#jobs" className="text-gray-600 hover:text-indigo-600">Find Jobs</a>
            <a href="#salary" className="text-gray-600 hover:text-indigo-600">Salary Guide</a>
            <a href="#companies" className="text-gray-600 hover:text-indigo-600">Companies</a>
            <button className="text-gray-600 hover:text-indigo-600">Post a Job</button>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Sign In
            </button>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-b">
            <a href="#jobs" className="block px-3 py-2 text-gray-600 hover:text-indigo-600">Find Jobs</a>
            <a href="#salary" className="block px-3 py-2 text-gray-600 hover:text-indigo-600">Salary Guide</a>
            <a href="#companies" className="block px-3 py-2 text-gray-600 hover:text-indigo-600">Companies</a>
            <button className="w-full text-left px-3 py-2 text-gray-600 hover:text-indigo-600">Post a Job</button>
            <button className="w-full text-left px-3 py-2 text-indigo-600 hover:text-indigo-700">Sign In</button>
          </div>
        </div>
      )}
    </nav>
  );
}