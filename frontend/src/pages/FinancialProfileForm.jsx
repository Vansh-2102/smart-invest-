import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { useFinancialProfile } from '../hooks/useFinancialProfile';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { Select } from '../components/ui/Input';
import ErrorAlert from '../components/ui/ErrorAlert';
import { INVESTMENT_GOALS, INVESTMENT_EXPERIENCES, RISK_TOLERANCE } from '../utils/constants';

const STEPS = ['Personal Info', 'Financial Data', 'Investment Preferences'];

function StepIndicator({ step, current }) {
  const done = step < current;
  const active = step === current;
  return (
    <div className="flex items-center">
      <div
        className={[
          'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all',
          done   ? 'bg-emerald-500 text-white'                   : '',
          active ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400' : '',
          !done && !active ? 'bg-gray-800 border border-gray-700 text-gray-500'     : '',
        ].join(' ')}
      >
        {done ? <Check className="w-4 h-4" /> : step + 1}
      </div>
    </div>
  );
}

export default function FinancialProfileForm() {
  const { profile, loading, error, updateProfile } = useFinancialProfile();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    age:                  profile?.age || '',
    annualIncome:         profile?.annualIncome || '',
    investmentExperience: profile?.investmentExperience || '',
    riskTolerance:        profile?.riskTolerance || '',
    investmentGoal:       profile?.investmentGoal || '',
    timeHorizonYears:     profile?.timeHorizonYears || '',
    debtToIncomeRatio:    profile?.debtToIncomeRatio || '',
  });

  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
    if (fieldErrors[key]) setFieldErrors({ ...fieldErrors, [key]: '' });
  };

  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!form.age)          e.age          = 'Age is required';
      else if (form.age < 18) e.age          = 'Must be at least 18';
      if (!form.annualIncome) e.annualIncome = 'Annual income is required';
    }
    if (step === 1) {
      if (!form.investmentExperience) e.investmentExperience = 'Experience level is required';
      if (!form.investmentGoal)       e.investmentGoal       = 'Investment goal is required';
    }
    if (step === 2) {
      if (!form.timeHorizonYears) e.timeHorizonYears = 'Time horizon is required';
    }
    return e;
  };

  const nextStep = () => {
    const errs = validateStep();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateStep();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setSubmitting(true);
    setSubmitError('');
    try {
      await updateProfile({
        age:                  parseInt(form.age),
        annualIncome:         parseFloat(form.annualIncome),
        investmentExperience: form.investmentExperience || null,
        riskTolerance:        form.riskTolerance || null,
        investmentGoal:       form.investmentGoal || null,
        timeHorizonYears:     form.timeHorizonYears ? parseInt(form.timeHorizonYears) : null,
        debtToIncomeRatio:    form.debtToIncomeRatio ? parseFloat(form.debtToIncomeRatio) : null,
      });
      navigate('/risk-assessment');
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toLabel = (s) => s.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Financial Profile</h2>
        <p className="text-gray-400 text-sm mt-1">Help us understand your financial situation to personalize recommendations</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              <StepIndicator step={i} current={step} />
              <span className={`text-sm hidden sm:block ${i === step ? 'text-gray-200 font-medium' : 'text-gray-500'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px ml-2 ${i < step ? 'bg-emerald-500' : 'bg-gray-800'}`} />
            )}
          </div>
        ))}
      </div>

      {error && <ErrorAlert message={error} />}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          {submitError && <ErrorAlert message={submitError} onDismiss={() => setSubmitError('')} />}

          {/* Step 0: Personal */}
          {step === 0 && (
            <div className="space-y-5 animate-slide-up">
              <h3 className="text-lg font-semibold text-white">Personal Information</h3>
              <div className="grid sm:grid-cols-2 gap-5">
                <Input
                  label="Age"
                  type="number"
                  placeholder="25"
                  min="18"
                  max="120"
                  value={form.age}
                  onChange={set('age')}
                  error={fieldErrors.age}
                />
                <Input
                  label="Annual Income (₹)"
                  type="number"
                  placeholder="1200000"
                  value={form.annualIncome}
                  onChange={set('annualIncome')}
                  error={fieldErrors.annualIncome}
                  suffix="₹"
                />
              </div>
              <Input
                label="Debt-to-Income Ratio (%)"
                type="number"
                placeholder="20"
                min="0"
                max="100"
                value={form.debtToIncomeRatio}
                onChange={set('debtToIncomeRatio')}
                error={fieldErrors.debtToIncomeRatio}
                suffix="%"
              />
            </div>
          )}

          {/* Step 1: Financial */}
          {step === 1 && (
            <div className="space-y-5 animate-slide-up">
              <h3 className="text-lg font-semibold text-white">Financial Preferences</h3>
              <Select
                label="Investment Experience"
                value={form.investmentExperience}
                onChange={set('investmentExperience')}
                error={fieldErrors.investmentExperience}
              >
                <option value="">Select experience level</option>
                {INVESTMENT_EXPERIENCES.map((e) => (
                  <option key={e} value={e}>{toLabel(e)}</option>
                ))}
              </Select>
              <Select
                label="Investment Goal"
                value={form.investmentGoal}
                onChange={set('investmentGoal')}
                error={fieldErrors.investmentGoal}
              >
                <option value="">Select your primary goal</option>
                {INVESTMENT_GOALS.map((g) => (
                  <option key={g} value={g}>{toLabel(g)}</option>
                ))}
              </Select>
              <Select
                label="Risk Tolerance"
                value={form.riskTolerance}
                onChange={set('riskTolerance')}
                error={fieldErrors.riskTolerance}
              >
                <option value="">Select risk tolerance</option>
                {RISK_TOLERANCE.map((r) => (
                  <option key={r} value={r}>{toLabel(r)}</option>
                ))}
              </Select>
            </div>
          )}

          {/* Step 2: Preferences */}
          {step === 2 && (
            <div className="space-y-5 animate-slide-up">
              <h3 className="text-lg font-semibold text-white">Investment Horizon</h3>

              <Input
                label="Investment Time Horizon (Years)"
                type="number"
                placeholder="10"
                min="1"
                max="40"
                value={form.timeHorizonYears}
                onChange={set('timeHorizonYears')}
                error={fieldErrors.timeHorizonYears}
                suffix="yrs"
              />

              {/* Horizon visual */}
              <div className="space-y-3">
                {[
                  { label: 'Short term',  range: '1-3 years',  desc: 'Capital preservation, low risk' },
                  { label: 'Medium term', range: '3-7 years',  desc: 'Balanced growth and stability' },
                  { label: 'Long term',   range: '7+ years',   desc: 'Maximum growth potential' },
                ].map((h) => {
                  const y = parseInt(form.timeHorizonYears);
                  const active =
                    (h.label === 'Short term'  && y >= 1 && y <= 3) ||
                    (h.label === 'Medium term' && y > 3 && y <= 7)   ||
                    (h.label === 'Long term'   && y > 7);
                  return (
                    <div
                      key={h.label}
                      className={`p-4 rounded-xl border transition-all ${
                        active ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-gray-800 bg-gray-800/20'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={`text-sm font-medium ${active ? 'text-emerald-400' : 'text-gray-400'}`}>{h.label}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{h.desc}</p>
                        </div>
                        <span className="text-xs text-gray-500">{h.range}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="bg-gray-800/40 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-gray-300 mb-3">Profile Summary</p>
                {[
                  { label: 'Age',        value: form.age },
                  { label: 'Income',     value: form.annualIncome ? `₹${parseInt(form.annualIncome).toLocaleString('en-IN')}` : '—' },
                  { label: 'Goal',       value: toLabel(form.investmentGoal || '—') },
                  { label: 'Experience', value: toLabel(form.investmentExperience || '—') },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{s.label}</span>
                    <span className="text-gray-300 capitalize">{s.value || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t border-gray-800">
            <Button
              type="button"
              variant="secondary"
              onClick={prevStep}
              disabled={step === 0}
              icon={<ChevronLeft className="w-4 h-4" />}
            >
              Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={nextStep}>
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button type="submit" loading={submitting}>
                Save & Assess Risk <Check className="w-4 h-4" />
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
