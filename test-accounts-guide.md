# Test Accounts Guide for OfferPlus

This guide will help you create and use test accounts for the OfferPlus application.

## Quick Start

### Option 1: Use Pre-configured Test Accounts

I've prepared these test accounts for you:

1. **Primary Test Account**
   - Email: `test@offersplus.io`
   - Password: `TestPassword123!`

2. **Demo Account**
   - Email: `demo@offersplus.io`
   - Password: `DemoPassword123!`

3. **Job Seeker Account**
   - Email: `jobseeker@offersplus.io`
   - Password: `JobSeeker123!`

### Option 2: Create Your Own Test Account

You can create your own test account using the registration form.

## Step-by-Step Sign In Process

### 1. Start the Application

```bash
cd frontend
npm run dev
```

The application will start at `http://localhost:3000`

### 2. Navigate to Login Page

- Open your browser and go to `http://localhost:3000/login`
- Or click the "Sign In" button from the homepage

### 3. Sign In Methods

#### Method A: Use Existing Test Account
1. Enter one of the test emails above (e.g., `test@offersplus.io`)
2. Enter the corresponding password (e.g., `TestPassword123!`)
3. Click "Sign in"

#### Method B: Create New Account
1. Click "create a new account" link on the login page
2. Go to `http://localhost:3000/register`
3. Fill in:
   - Email: Your test email (e.g., `yourname@test.com`)
   - Password: At least 6 characters
   - Confirm Password: Same as above
4. Click "Create account"
5. Check your email for confirmation (if email confirmation is enabled)
6. Return to login page and sign in

### 4. Access JobGPT

Once signed in:
1. You'll be redirected to your profile or dashboard
2. Navigate to `http://localhost:3000/jobgpt` or click "JobGPT" in the navigation
3. Start using the AI-powered job assistance features!

## Troubleshooting

### Common Issues and Solutions

#### 1. "Invalid login credentials" Error
- **Cause**: Account doesn't exist or wrong password
- **Solution**: 
  - Try creating a new account first
  - Use the exact credentials provided above
  - Check for typos in email/password

#### 2. "Email not confirmed" Error
- **Cause**: Supabase requires email confirmation
- **Solutions**:
  - Check your email for confirmation link
  - Use Supabase dashboard to manually confirm the email
  - Disable email confirmation in Supabase settings for development

#### 3. Application Won't Start
- **Cause**: Missing dependencies or environment variables
- **Solution**:
  ```bash
  cd frontend
  npm install
  # Check that .env file has correct Supabase credentials
  npm run dev
  ```

#### 4. "Supabase configuration error"
- **Cause**: Missing or incorrect environment variables
- **Solution**: Check `frontend/.env` file has:
  ```
  VITE_SUPABASE_URL=https://gbsodywfisfmfkwspnaf.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

### 5. Manual Account Creation via Supabase Dashboard

If the above methods don't work, you can create accounts directly in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Users"
3. Click "Add user"
4. Fill in email and password
5. Set "Email Confirm" to true
6. Click "Create user"

## Testing JobGPT Features

Once signed in, you can test JobGPT with these sample inputs:

### Why Company Mode
- Input: `Google`
- Expected: Structured response about why you want to work at Google

### Behavioral Mode  
- Input: `Tell me about a time you overcame a challenge`
- Expected: STAR method guidance for behavioral interviews

### General Mode
- Input: `Help me optimize my resume for a software engineer position`
- Expected: Resume optimization advice

## API Keys for AI Features

To use the AI features, you'll need to add your OpenAI API key to `frontend/.env`:

```bash
# Add this to frontend/.env
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

Without this key, you'll get authentication errors when trying to use JobGPT.

## Development Tips

1. **Use Browser DevTools**: Check the console for any JavaScript errors
2. **Check Network Tab**: Look for failed API requests
3. **Supabase Logs**: Check your Supabase project logs for authentication issues
4. **Clear Browser Storage**: Sometimes clearing localStorage helps with auth issues

## Quick Commands Reference

```bash
# Start the application
cd frontend && npm run dev

# Install dependencies
cd frontend && npm install

# Check environment variables
cat frontend/.env

# View application logs
# Check browser console or terminal where npm run dev is running
```

## Need Help?

If you're still having trouble:

1. Check the browser console for error messages
2. Verify your Supabase project is active and configured correctly
3. Ensure all environment variables are set properly
4. Try creating a completely new account with a different email

The test accounts should work immediately once the application is running. The most common issue is missing environment variables or the application not being started properly.