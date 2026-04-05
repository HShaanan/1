import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { activityTracker } from '@/services/activityTracker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const returnUrl = localStorage.getItem('auth_return_url');
        localStorage.removeItem('auth_return_url');
        navigate(returnUrl || '/');
      }
    });
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      activityTracker.trackLogin();
      const returnUrl = localStorage.getItem('auth_return_url');
      localStorage.removeItem('auth_return_url');
      navigate(returnUrl || '/');
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      activityTracker.trackSignup();
      setMessage('נשלח אליך מייל אימות. אנא בדוק את תיבת הדואר שלך.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4" dir="rtl">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            {isSignUp ? 'הרשמה' : 'כניסה'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isSignUp ? 'צור חשבון חדש' : 'כנס לחשבון שלך'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {message}
          </div>
        )}

        <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-6">
          {isSignUp && (
            <div>
              <Label htmlFor="fullName">שם מלא</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="השם המלא שלך"
                required={isSignUp}
              />
            </div>
          )}

          <div>
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">סיסמה</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'טוען...' : isSignUp ? 'הרשמה' : 'כניסה'}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            className="text-sm text-blue-600 hover:underline"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setMessage('');
            }}
          >
            {isSignUp ? 'כבר יש לך חשבון? כנס כאן' : 'אין לך חשבון? הרשם כאן'}
          </button>
        </div>
      </div>
    </div>
  );
}
