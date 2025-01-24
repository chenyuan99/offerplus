import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-white mt-auto">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="text-center md:text-left">
            <div className="space-y-4">
              <div className="text-sm text-gray-500">
                <p>© 2024</p>
                <p>Created with ❤️ by @chenyuan99</p>
              </div>
              <div>
                <a 
                  href="https://www.producthunt.com/products/offers-plus?utm_source=badge-follow&utm_medium=badge&utm_souce=badge-offers&#0045;plus"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="https://api.producthunt.com/widgets/embed-image/v1/follow.svg?product_id=577338&theme=neutral"
                    alt="Offers Plus - AI Job Hunter | Product Hunt"
                    className="h-14 w-auto mx-auto md:mx-0"
                  />
                </a>
              </div>
            </div>
          </div>

          {/* Education Resources */}
          <div>
            <h5 className="text-sm font-semibold text-gray-700 tracking-wider uppercase mb-4">
              Education
            </h5>
            <ul className="space-y-3">
              <li>
                <a 
                  href="https://cs.vt.edu/"
                  className="text-base text-gray-500 hover:text-gray-900"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Virginia Tech CS
                </a>
              </li>
              <li>
                <a 
                  href="https://csweb.rice.edu/academics/graduate-programs/online-mcs"
                  className="text-base text-gray-500 hover:text-gray-900"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Rice University MCS
                </a>
              </li>
            </ul>
          </div>

          {/* Career Resources */}
          <div>
            <h5 className="text-sm font-semibold text-gray-700 tracking-wider uppercase mb-4">
              Resources
            </h5>
            <ul className="space-y-3">
              <li>
                <a 
                  href="https://levels.fyi"
                  className="text-base text-gray-500 hover:text-gray-900"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Levels.fyi
                </a>
              </li>
              <li>
                <a 
                  href="https://layoffs.fyi"
                  className="text-base text-gray-500 hover:text-gray-900"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Layoffs.fyi
                </a>
              </li>
              <li>
                <a 
                  href="https://docs.google.com/spreadsheets/d/17nKMpi_Dh5slCqzLSFBoWMxNvWiwt2R-t4e_l7LPLhU/edit#gid=0"
                  className="text-base text-gray-500 hover:text-gray-900"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Source Companies
                </a>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h5 className="text-sm font-semibold text-gray-700 tracking-wider uppercase mb-4">
              About
            </h5>
            <ul className="space-y-3">
              <li>
                <Link to="/team" className="text-base text-gray-500 hover:text-gray-900">
                  Team
                </Link>
              </li>
              <li>
                <Link to="/locations" className="text-base text-gray-500 hover:text-gray-900">
                  Locations
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-base text-gray-500 hover:text-gray-900">
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-base text-gray-500 hover:text-gray-900">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
