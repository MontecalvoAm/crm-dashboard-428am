'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const router = useRouter();

  // OWASP A07: Password Complexity Check
  const isPasswordComplex = (password: string) => {
    const minLength = 8;
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<> ]/.test(password);
    return password.length >= minLength && hasNumber && hasSpecial;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInvalidFields([]);

    const newInvalidFields: string[] = [];

    // 1. Check for Empty Fields
    Object.keys(formData).forEach((key) => {
      if (!formData[key as keyof typeof formData]) {
        newInvalidFields.push(key);
      }
    });

    if (newInvalidFields.length > 0) {
      setInvalidFields(newInvalidFields);
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    // 2. Validate Password Match
    if (formData.password !== formData.confirmPassword) {
      setInvalidFields(['password', 'confirmPassword']);
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    // 3. Validate Complexity (OWASP Requirement)
    if (!isPasswordComplex(formData.password)) {
      setInvalidFields(['password']);
      setError('Password must be 8+ characters with at least 1 number and 1 special character.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/?message=registered');
      } else {
        setError(data.error || 'Registration failed');
        if (data.error?.includes('Email')) newInvalidFields.push('email');
        setInvalidFields(newInvalidFields);
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function for dynamic border classes
  const getInputClass = (fieldName: string) => {
    const isInvalid = invalidFields.includes(fieldName);
    return `w-full px-4 py-3 bg-gray-50 border ${
      isInvalid ? 'border-red-500 ring-1 ring-red-500' : 'border-transparent'
    } rounded-xl focus:bg-white focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 transition-all outline-none text-sm cursor-text`;
  };

  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const EyeSlashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );

  return (
    <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
      
      <div className="w-full max-w-[450px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-400 text-white font-bold text-2xl shadow-lg shadow-yellow-100 mb-4 cursor-default">
            CRM
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Create Account</h1>
          <p className="text-gray-500 text-sm mt-2">Join us to manage your leads and roles efficiently</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">First Name</label>
                <input
                  type="text"
                  placeholder="John"
                  className={getInputClass('firstName')}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">Last Name</label>
                <input
                  type="text"
                  placeholder="Doe"
                  className={getInputClass('lastName')}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">Email Address</label>
              <input
                type="email"
                placeholder="name@company.com"
                className={getInputClass('email')}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="relative">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={getInputClass('password') + " pr-12"}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-500 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={getInputClass('confirmPassword')}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-white py-3.5 rounded-xl font-bold text-sm shadow-md shadow-yellow-200/50 transition-all active:scale-[0.98] disabled:opacity-70 mt-2 cursor-pointer"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Error Message Section - Positioned below the button */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-[11px] leading-relaxed font-medium animate-in fade-in slide-in-from-top-2 duration-300">
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                {error}
              </span>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link href="/" className="text-sm text-gray-400  transition-colors ">
              Already have an account? <strong className="hover:text-yellow-600 font-semibold cursor-pointer cursor-pointer text-decoration-line: underline">Sign In</strong>
            </Link>
          </div>
        </div>
        
      </div>
    </main>
  );
}