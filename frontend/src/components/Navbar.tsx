import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, FileText, Info, BarChart2, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (isCollapsed: boolean) => void;
}

export function Navbar({ 
  isMenuOpen, 
  setIsMenuOpen, 
  isSidebarCollapsed, 
  setIsSidebarCollapsed 
}: NavbarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="container-fluid px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {user && (
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
                >
                  {isSidebarCollapsed ? (
                    <ChevronRight className="h-6 w-6" />
                  ) : (
                    <ChevronLeft className="h-6 w-6" />
                  )}
                </button>
              )}
              <Link to="/" className="text-2xl font-bold">
                <span className="text-[#861F41]">Offers+</span>
              </Link>
            </div>
            
            <div className="hidden sm:flex sm:items-center sm:space-x-4">
              {user ? (
                <>
                  <Link 
                    to="/jobgpt" 
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    jobGPT
                  </Link>
                  <Link 
                    to="/companies" 
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Company
                  </Link>
                  <Link 
                    to="/profile" 
                    className="px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    {user.username}
                  </Link>
                  <button
                    onClick={logout}
                    className="px-4 py-2 rounded-md text-sm font-medium border border-red-500 text-red-500 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Log In
                  </Link>
                  <Link 
                    to="/register" 
                    className="px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden border-b border-gray-200`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            {user ? (
              <>
                <Link
                  to="/jobgpt"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  jobGPT
                </Link>
                <Link
                  to="/companies"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Company
                </Link>
                <Link
                  to="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-900 hover:bg-gray-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      {user && (
        <aside 
          className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-gray-50 hidden md:block transition-all duration-300 ${
            isSidebarCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          <div className="h-full px-3 py-4 overflow-y-auto">
            <ul className="space-y-2">
              <li>
                <Link
                  to="/dashboard"
                  className={`flex items-center p-2 rounded-lg ${
                    location.pathname === '/dashboard'
                      ? 'bg-[#00b7a6] text-white'
                      : 'text-gray-900 hover:bg-[#00b7a6] hover:text-white'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  {!isSidebarCollapsed && <span className="ml-3">Dashboard</span>}
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className={`flex items-center p-2 rounded-lg ${
                    location.pathname === '/faq'
                      ? 'bg-[#00b7a6] text-white'
                      : 'text-gray-900 hover:bg-[#00b7a6] hover:text-white'
                  }`}
                >
                  <Info className="w-5 h-5" />
                  {!isSidebarCollapsed && <span className="ml-3">FAQ</span>}
                </Link>
              </li>
              <li>
                <Link
                  to="/history"
                  className={`flex items-center p-2 rounded-lg ${
                    location.pathname === '/history'
                      ? 'bg-[#00b7a6] text-white'
                      : 'text-gray-900 hover:bg-[#00b7a6] hover:text-white'
                  }`}
                >
                  <BarChart2 className="w-5 h-5" />
                  {!isSidebarCollapsed && <span className="ml-3">History</span>}
                </Link>
              </li>
            </ul>
            {!isSidebarCollapsed && (
              <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-gray-500">
                2025 RiseWorks
              </div>
            )}
          </div>
        </aside>
      )}
    </>
  );
}
