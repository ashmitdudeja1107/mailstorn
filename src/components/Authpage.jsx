import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const API_BASE_URL = 'https://mailstorm-backend-1.onrender.com';

const AuthPage = ({ onLoginSuccess }) => {
  const [signInLoading, setSignInLoading] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const auth = getAuth();
  const provider = new GoogleAuthProvider();

  const callSignInAPI = async (idToken) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: idToken })
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Sign-in failed');
    }
    
    return data;
  };

  const callSignUpAPI = async (idToken) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/google-signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: idToken })
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Sign-up failed');
    }
    
    return data;
  };

  const storeTokenAndSetupAPI = (token) => {
    localStorage.setItem('token', token);
    console.log('✅ Token stored in localStorage:', token);

    const storedToken = localStorage.getItem('token');
    console.log('🔍 Retrieved token from localStorage:', storedToken);

    window.apiClient = {
      get: async (url) => {
        const response = await fetch(`${API_BASE_URL}${url}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        return handleResponse(response);
      },
      post: async (url, data) => {
        const response = await fetch(`${API_BASE_URL}${url}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });
        return handleResponse(response);
      },
      put: async (url, data) => {
        const response = await fetch(`${API_BASE_URL}${url}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });
        return handleResponse(response);
      },
      delete: async (url) => {
        const response = await fetch(`${API_BASE_URL}${url}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        return handleResponse(response);
      }
    };
  };

  const handleResponse = async (response) => {
    const text = await response.text();
    try {
      const data = text ? JSON.parse(text) : {};
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }
      return data;
    } catch (err) {
      console.error('API Error:', text);
      throw new Error(text || 'API request failed');
    }
  };

  const handleGoogleSignIn = async () => {
    setSignInLoading(true);
    setError(null);
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();
      const apiResponse = await callSignInAPI(idToken);
      
      if (!apiResponse.token) {
        throw new Error('No token received from backend');
      }
      
      localStorage.setItem('token', apiResponse.token);
      storeTokenAndSetupAPI(apiResponse.token);
      
      const storedToken = localStorage.getItem('token');
      if (!storedToken || storedToken !== apiResponse.token) {
        throw new Error('Failed to store authentication token');
      }
      
      onLoginSuccess({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        backendUser: apiResponse.user,
        token: apiResponse.token
      });
      
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      try {
        await signOut(auth);
        localStorage.removeItem('token');
        window.apiClient = null;
      } catch (signOutError) {
        console.error('Error cleaning up after failed auth:', signOutError);
      }
      
      handleAuthError(error);
    } finally {
      setSignInLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setSignUpLoading(true);
    setError(null);
    setSuccessMessage(null); 
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();
      const apiResponse = await callSignUpAPI(idToken);
      
      if (!apiResponse?.token || typeof apiResponse.token !== 'string') {
        throw new Error(`Invalid token response: ${JSON.stringify(apiResponse)}`);
      }
      
      if (apiResponse.token) {
        storeTokenAndSetupAPI(apiResponse.token);
      }
      setSuccessMessage('Account created successfully!  now logg in.');
      onLoginSuccess({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        backendUser: apiResponse.user,
        token: apiResponse.token
      });
      
    } catch (error) {
      console.error('Google sign-up error:', error);
      
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error('Error signing out after failed backend auth:', signOutError);
      }
      
      handleAuthError(error);
    } finally {
      setSignUpLoading(false);
    }
  };

  const handleAuthError = (error) => {
    let errorMessage = 'Authentication failed';
    
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Sign-in cancelled by user';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'Popup blocked. Please allow popups for this site';
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      errorMessage = 'An account already exists with this email';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    setError(errorMessage);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              MailStorm
            </h1>
            <p className="text-gray-600 mt-2">
              Welcome! Choose your preferred way to continue.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={signInLoading || signUpLoading}
              className="w-full bg-white border border-gray-300 text-gray-700 py-4 rounded-xl hover:bg-gray-50 transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
            >
              {signInLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            <button
              onClick={handleGoogleSignUp}
              disabled={signUpLoading || signInLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
            >
              {signUpLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing up...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Sign up with Google</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;