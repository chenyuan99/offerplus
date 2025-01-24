# Offers+ Frontend

A modern React application for tracking job applications and managing your job search process. Built with React, TypeScript, and Tailwind CSS.

## Features

- **Dashboard**: Track and visualize your job application progress
- **JobGPT**: AI-powered job search assistant
- **Application Management**: Create, update, and track job applications
- **Company Insights**: View and manage company information
- **Authentication**: Secure user authentication system
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **State Management**: React Context + Custom Hooks
- **API Client**: Axios
- **Icons**: Lucide Icons
- **Build Tool**: Vite
- **Package Manager**: npm

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Backend API running (see main project README)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/chenyuan99/offersplus.git
   cd offersplus/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`.

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts for state management
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility functions and helpers
│   ├── pages/         # Page components
│   ├── services/      # API service functions
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Helper utilities
├── public/            # Static assets
└── index.html         # Entry HTML file
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Development Guidelines

### Code Style

- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Write meaningful component and function names
- Add JSDoc comments for complex functions

### Component Structure

```tsx
// Example component structure
import React from 'react';
import { ComponentProps } from './types';

export function MyComponent({ prop1, prop2 }: ComponentProps) {
  // Hooks at the top
  const [state, setState] = useState();

  // Event handlers
  const handleEvent = () => {
    // ...
  };

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### API Integration

- Use the `api.ts` service for all API calls
- Implement proper error handling
- Use TypeScript interfaces for API responses
- Handle loading and error states

## Deployment

### Building for Production

1. Update environment variables for production:
   ```env
   VITE_API_URL=https://api.offerplus.io
   ```

2. Build the application:
   ```bash
   npm run build
   ```

3. Test the production build:
   ```bash
   npm run preview
   ```

### Deployment Platforms

The frontend can be deployed to:
- Vercel (recommended)
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

Please follow our [contribution guidelines](../CONTRIBUTING.md).

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## Support

For support, please:
1. Check the [documentation](https://docs.offerplus.io)
2. Create an issue in the GitHub repository
3. Contact the development team

## Acknowledgments

- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)