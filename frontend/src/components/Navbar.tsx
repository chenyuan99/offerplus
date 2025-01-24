import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, FileText, BarChart2, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
}

export function Navbar({ 
  isMenuOpen, 
  setIsMenuOpen
}: NavbarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font">
                <span className="text-[#861F41]">OfferPlus</span>
              </Link>
            </div>
            
            <div className="hidden sm:flex sm:items-center sm:space-x-4">
              {user ? (
                <>
                  <Link 
                    to="/" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/' 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center">
                      <BarChart2 className="h-4 w-4 mr-2" />
                      Dashboard
                    </span>
                  </Link>
                  <Link 
                    to="/applications/add" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/applications/add' 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Add Application
                    </span>
                  </Link>
                  <Link 
                    to="/jobgpt" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/jobgpt' 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    JobGPT
                  </Link>
                  <button
                    onClick={logout}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span className="flex items-center">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  Login
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
              >
                {isMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-30 bg-gray-600 bg-opacity-75">
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                onClick={() => setIsMenuOpen(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <span className="text-2xl font-bold text-[#861F41]">Offers+</span>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {user ? (
                  <>
                    <Link
                      to="/"
                      className={`block px-3 py-2 rounded-md text-base font-medium ${
                        location.pathname === '/' 
                          ? 'bg-gray-100 text-gray-900' 
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="flex items-center">
                        <BarChart2 className="h-5 w-5 mr-3" />
                        Dashboard
                      </span>
                    </Link>
                    <Link
                      to="/applications/add"
                      className={`block px-3 py-2 rounded-md text-base font-medium ${
                        location.pathname === '/applications/add' 
                          ? 'bg-gray-100 text-gray-900' 
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="flex items-center">
                        <FileText className="h-5 w-5 mr-3" />
                        Add Application
                      </span>
                    </Link>
                    <Link
                      to="/jobgpt"
                      className={`block px-3 py-2 rounded-md text-base font-medium ${
                        location.pathname === '/jobgpt' 
                          ? 'bg-gray-100 text-gray-900' 
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      JobGPT
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                )}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
