import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ErrorAlert from '../../components/ui/ErrorAlert';

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPwd, setShowPwd]  = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim())           e.name    = 'Name is required';
    if (!form.email)                  e.email   = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format';
    if (!form.password)               e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setApiError('');
    try {
      await register(form.name.trim(), form.email, form.password);
      navigate('/financial-profile');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const field = (key) => ({
    value: form[key],
    onChange: (e) => {
      setForm({ ...form, [key]: e.target.value });
      if (errors[key]) setErrors({ ...errors, [key]: '' });
    },
    error: errors[key],
  });

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Left branding */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 bg-gradient-to-br from-gray-950 via-navy-900/20 to-gray-950 overflow-hidden">
        <div className="absolute top-10 right-10 w-72 h-72 bg-emerald-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-gold-500/8 rounded-full blur-3xl" />

        <div className="relative text-center space-y-8 max-w-md">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/30">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </div>

          <div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Start your<br />
              <span className="gradient-text">investment journey</span>
            </h2>
            <p className="text-gray-400">
              Create your account and get personalized AI-driven investment recommendations in minutes.
            </p>
          </div>

          {/* Steps */}
          <div className="text-left space-y-4">
            {[
              { step: '01', title: 'Create account', desc: 'Register with your basic info' },
              { step: '02', title: 'Build your profile', desc: 'Share your financial details' },
              { step: '03', title: 'Get recommendations', desc: 'AI-powered investment plan' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4">
                <div className="w-8 h-8 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0">
                  {s.step}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{s.title}</p>
                  <p className="text-gray-500 text-xs">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">InvestIQ</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create account</h1>
            <p className="text-gray-400">Join thousands of smart investors</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {apiError && (
              <ErrorAlert message={apiError} onDismiss={() => setApiError('')} />
            )}

            <Input
              label="Full name"
              type="text"
              id="name"
              placeholder="John Doe"
              icon={<User className="w-4 h-4" />}
              autoComplete="name"
              {...field('name')}
            />

            <Input
              label="Email address"
              type="email"
              id="reg-email"
              placeholder="you@example.com"
              icon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              {...field('email')}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPwd ? 'text' : 'password'}
                id="reg-password"
                placeholder="At least 6 characters"
                icon={<Lock className="w-4 h-4" />}
                autoComplete="new-password"
                {...field('password')}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-300"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Input
              label="Confirm password"
              type={showPwd ? 'text' : 'password'}
              id="confirm-password"
              placeholder="Re-enter your password"
              icon={<Lock className="w-4 h-4" />}
              {...field('confirm')}
            />

            <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
