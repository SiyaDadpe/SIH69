

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import Plasma from '../components/animations/plasma';

export default function Signup() {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [signupData, setSignupData] = useState({
    fullName: '',
    organization: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  const handleSignupChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSignupData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateSignup = () => {
    const newErrors = {};
    if (!signupData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!signupData.organization.trim()) newErrors.organization = 'Organization is required';
    if (!signupData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(signupData.email)) newErrors.email = 'Email is invalid';
    if (!signupData.password) newErrors.password = 'Password is required';
    else if (signupData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (signupData.password !== signupData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!signupData.acceptTerms) newErrors.acceptTerms = 'You must accept the terms';
    return newErrors;
  };

  const validateLogin = () => {
    const newErrors = {};
    if (!loginData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(loginData.email)) newErrors.email = 'Email is invalid';
    if (!loginData.password) newErrors.password = 'Password is required';
    return newErrors;
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateSignup();
    if (Object.keys(newErrors).length === 0) {
      console.log('Signup submitted:', signupData);
      navigate('/dashboard');
    } else {
      setErrors(newErrors);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateLogin();
    if (Object.keys(newErrors).length === 0) {
      console.log('Login submitted:', loginData);
      navigate('/dashboard');
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black overflow-hidden relative">
      {/* Custom Cursor */}
      <style>{`
        * {
          cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="%23BA7967" opacity="0.5"/><circle cx="10" cy="10" r="3" fill="%23BA7967"/></svg>') 10 10, auto;
        }
        a, button, input, select, textarea {
          cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="%23BA7967" opacity="0.7"/><circle cx="12" cy="12" r="4" fill="white"/></svg>') 12 12, pointer;
        }
      `}</style>

      {/* Background Split - Left Black with Plasma, Right Brown */}
      <div className="absolute inset-0 flex">
        {/* Left Half - Black background with Plasma (like landing page) */}
        <div className="w-1/2 h-full bg-black relative overflow-hidden">
          <Plasma 
            color="#BA7967"
            speed={1.5}
            direction="forward"
            scale={1.0}
            opacity={1}
            mouseInteractive={true}
          />
        </div>
        {/* Right Half - Brown (matching Sign Up button) */}
        <div className="w-1/2 h-full bg-[#BA7967]"></div>
      </div>

      {/* Main Container with sliding effect */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className={`relative w-full max-w-5xl h-[650px] bg-transparent rounded-[80px] overflow-hidden transition-all duration-700 ease-in-out shadow-[0_0_80px_rgba(186,121,103,0.3)] border border-white/10`}>
          
          {/* Sign Up Form - Left side initially, moves to right when active */}
          <div className={`absolute top-0 left-0 w-1/2 h-full flex flex-col items-center justify-center px-12 transition-all duration-700 ease-in-out ${
            isActive ? 'translate-x-full opacity-0 pointer-events-none z-10' : 'opacity-100 z-20'
          }`}>
            <div className="w-full max-w-md">
              <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
              <p className="text-white/80 text-sm mb-6">Join us to start your sustainability journey</p>
              
              <form onSubmit={handleSignupSubmit} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="fullName" className="text-white/90 text-sm font-medium">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={signupData.fullName}
                    onChange={handleSignupChange}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/40 focus:border-[#BA7967] focus:ring-[#BA7967]/50 h-10"
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && <p className="text-red-300 text-xs">{errors.fullName}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="organization" className="text-white/90 text-sm font-medium">Organization</Label>
                  <Input
                    id="organization"
                    name="organization"
                    type="text"
                    value={signupData.organization}
                    onChange={handleSignupChange}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/40 focus:border-[#BA7967] focus:ring-[#BA7967]/50 h-10"
                    placeholder="Your company or institution"
                  />
                  {errors.organization && <p className="text-red-300 text-xs">{errors.organization}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="signup-email" className="text-white/90 text-sm font-medium">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    value={signupData.email}
                    onChange={handleSignupChange}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/40 focus:border-[#BA7967] focus:ring-[#BA7967]/50 h-10"
                    placeholder="you@example.com"
                  />
                  {errors.email && <p className="text-red-300 text-xs">{errors.email}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="signup-password" className="text-white/90 text-sm font-medium">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    value={signupData.password}
                    onChange={handleSignupChange}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/40 focus:border-[#BA7967] focus:ring-[#BA7967]/50 h-10"
                    placeholder="Minimum 8 characters"
                  />
                  {errors.password && <p className="text-red-300 text-xs">{errors.password}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirmPassword" className="text-white/90 text-sm font-medium">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={signupData.confirmPassword}
                    onChange={handleSignupChange}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/40 focus:border-[#BA7967] focus:ring-[#BA7967]/50 h-10"
                    placeholder="Re-enter password"
                  />
                  {errors.confirmPassword && <p className="text-red-300 text-xs">{errors.confirmPassword}</p>}
                </div>

                <div className="flex items-start space-x-2 pt-2">
                  <input
                    id="acceptTerms"
                    name="acceptTerms"
                    type="checkbox"
                    checked={signupData.acceptTerms}
                    onChange={handleSignupChange}
                    className="mt-1 rounded border-white/30 bg-white/10 text-[#BA7967] focus:ring-[#BA7967]/50"
                  />
                  <label htmlFor="acceptTerms" className="text-xs text-white/80">
                    I agree to the Terms of Service and Privacy Policy
                  </label>
                </div>
                {errors.acceptTerms && <p className="text-red-300 text-xs">{errors.acceptTerms}</p>}

                <Button type="submit" className="w-full bg-[#BA7967] text-white hover:bg-[#A0685A] font-semibold h-11 mt-4 border-2 border-white/20 hover:border-white/40 transition-all duration-300 shadow-lg">
                  Sign Up
                </Button>
              </form>
            </div>
          </div>

          {/* Sign In Form - Right side initially, moves to left when active */}
          <div className={`absolute top-0 right-0 w-1/2 h-full flex flex-col items-center justify-center px-12 transition-all duration-700 ease-in-out ${
            isActive ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none z-10'
          }`}>
            <div className="w-full max-w-md">
              <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-white/80 text-sm mb-8">Sign in to continue your sustainability journey</p>
              
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-white/90 text-sm font-medium">Email Address</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/40 focus:border-[#BA7967] focus:ring-[#BA7967]/50 h-11"
                    placeholder="you@example.com"
                  />
                  {errors.email && <p className="text-red-300 text-xs">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-white/90 text-sm font-medium">Password</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/40 focus:border-[#BA7967] focus:ring-[#BA7967]/50 h-11"
                    placeholder="Enter your password"
                  />
                  {errors.password && <p className="text-red-300 text-xs">{errors.password}</p>}
                </div>

                <div className="flex justify-end">
                  <a href="#" className="text-sm text-white/80 hover:text-white">
                    Forgot your password?
                  </a>
                </div>

                <Button type="submit" className="w-full bg-[#BA7967] text-white hover:bg-[#A0685A] font-semibold h-11 mt-4 border-2 border-white/20 hover:border-white/40 transition-all duration-300 shadow-lg">
                  Sign In
                </Button>
              </form>
            </div>
          </div>

          {/* Sliding Panel - Starts on right, slides to left (always black) */}
          <div className={`absolute top-0 left-1/2 w-1/2 h-full flex items-center justify-center transition-all duration-700 ease-in-out z-30 bg-black ${
            isActive 
              ? '-translate-x-full rounded-tl-[100px] rounded-bl-[100px]' 
              : 'rounded-tr-[100px] rounded-br-[100px]'
          } shadow-2xl`}>
            <div className="text-center px-12 max-w-md">
              <h1 className="text-4xl font-bold mb-4 text-white">
                {isActive ? 'Welcome Back!' : 'Hello, Friend!'}
              </h1>
              <p className="mb-8 leading-relaxed text-base text-white/90">
                {isActive 
                  ? 'Enter your credentials to access your sustainability dashboard and continue tracking your impact'
                  : 'Register with your details to start your journey with our AI-powered LCA platform'}
              </p>
              <button
                onClick={() => setIsActive(!isActive)}
                className="px-8 py-3 rounded-full font-semibold transition-all duration-300 bg-transparent border-2 border-white text-white hover:bg-white hover:text-black"
              >
                {isActive ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Home button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 text-white/80 hover:text-white transition-colors z-50 flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
        Home
      </button>
    </div>
  );
}