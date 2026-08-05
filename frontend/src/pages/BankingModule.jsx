import { useState } from 'react';
import { useMarket } from '../hooks/useMarket';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { PageLoader } from '../components/ui/Spinner';
import { Landmark, Calculator } from 'lucide-react';

function FDCalculator() {
  const [principal, setPrincipal] = useState('100000');
  const [rate, setRate]           = useState('7.5');
  const [years, setYears]         = useState('1');

  const p  = parseFloat(principal) || 0;
  const r  = parseFloat(rate) / 100;
  const n  = parseFloat(years) || 1;
  const maturity  = p * Math.pow(1 + r / 4, 4 * n);
  const interest  = maturity - p;

  return (
    <Card>
      <CardHeader title="FD Calculator" subtitle="Fixed Deposit Maturity" />
      <div className="space-y-4">
        <Input
          label="Principal Amount (₹)"
          type="number"
          value={principal}
          onChange={(e) => setPrincipal(e.target.value)}
          suffix="₹"
        />
        <Input
          label="Annual Rate (%)"
          type="number"
          step="0.1"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          suffix="%"
        />
        <Input
          label="Tenure (Years)"
          type="number"
          value={years}
          onChange={(e) => setYears(e.target.value)}
          suffix="yrs"
        />

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Maturity Amount</span>
            <span className="text-white font-bold">₹{Math.round(maturity).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Interest Earned</span>
            <span className="text-emerald-400 font-bold">₹{Math.round(interest).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Effective Yield</span>
            <span className="text-yellow-400 font-bold">{((interest / p) * 100).toFixed(2)}%</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function BankingModule() {
  const { data, loading } = useMarket('banking');

  if (loading) return <PageLoader />;

  const fdRates     = data?.fdRates     || [];
  const savingsRates = data?.savingsRates || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Banking Module</h2>
        <p className="text-gray-400 text-sm mt-1">Compare FD rates, savings accounts, and banking products</p>
      </div>

      {/* Top rates */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {savingsRates.map((b) => (
          <div key={b.bank} className="glass-card p-4 text-center border border-gray-800">
            <p className="text-xs text-gray-500 mb-1">{b.bank}</p>
            <p className="text-xl font-bold text-emerald-400">{b.rate}%</p>
            <p className="text-[10px] text-gray-600 mt-0.5">Savings</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* FD Rate table */}
        <Card padding={false}>
          <div className="p-5 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white">Fixed Deposit Rates</h3>
            <p className="text-sm text-gray-400">Per annum (compound quarterly)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bank</th>
                  <th>1 Year</th>
                  <th>2 Years</th>
                  <th>3 Years</th>
                  <th>5 Years</th>
                </tr>
              </thead>
              <tbody>
                {fdRates.map((row) => {
                  const best = Math.max(row['1y'], row['2y'], row['3y'], row['5y']);
                  return (
                    <tr key={row.bank}>
                      <td className="font-medium text-gray-200">{row.bank}</td>
                      {['1y', '2y', '3y', '5y'].map((t) => (
                        <td key={t} className={row[t] === best ? 'text-emerald-400 font-bold' : 'text-gray-300'}>
                          {row[t]}%
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-yellow-500/5 border-t border-yellow-500/10">
            <p className="text-xs text-yellow-400">
              💡 Tip: Small Finance Banks like IDFC First and Unity SFB offer higher rates with DICGC insurance up to ₹5 Lakhs.
            </p>
          </div>
        </Card>

        {/* FD Calculator */}
        <FDCalculator />
      </div>

      {/* Products guide */}
      <Card>
        <CardHeader title="Banking Products Guide" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title:   'Fixed Deposit (FD)',
              icon:    '🏦',
              return:  '6.5–9%',
              lock:    '7 days – 10 years',
              risk:    'None (DICGC insured)',
              tax:     'Interest taxed as income',
            },
            {
              title:   'Recurring Deposit (RD)',
              icon:    '📅',
              return:  '5.5–7.5%',
              lock:    '6 months – 10 years',
              risk:    'None (DICGC insured)',
              tax:     'Interest taxed as income',
            },
            {
              title:   'PPF',
              icon:    '🛡️',
              return:  '7.1% p.a.',
              lock:    '15 years',
              risk:    'Government backed',
              tax:     'EEE – Fully tax-free',
            },
            {
              title:   'NSC',
              icon:    '📜',
              return:  '7.7% p.a.',
              lock:    '5 years',
              risk:    'Government backed',
              tax:     'Section 80C deduction',
            },
            {
              title:   'Senior Citizen FD',
              icon:    '👴',
              return:  '+0.25–0.5% extra',
              lock:    'Varies',
              risk:    'DICGC insured',
              tax:     'Up to ₹50K exempt (80TTB)',
            },
            {
              title:   'Savings Account',
              icon:    '💳',
              return:  '3–7.25%',
              lock:    'None',
              risk:    'DICGC insured',
              tax:     '₹10K interest exempt (80TTA)',
            },
          ].map((p) => (
            <div key={p.title} className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{p.icon}</span>
                <p className="font-semibold text-gray-200">{p.title}</p>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">Returns</span><span className="text-emerald-400 font-medium">{p.return}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Lock-in</span><span className="text-gray-300">{p.lock}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Risk</span><span className="text-gray-300">{p.risk}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tax</span><span className="text-gray-400 text-right ml-2">{p.tax}</span></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
