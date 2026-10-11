import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarket } from '../hooks/useMarket';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { PageLoader } from '../components/ui/Spinner';
import {
  Landmark, Calculator, Sparkles, Search, Info, CheckCircle2,
  Shield, ArrowUpRight, AlertCircle, Percent
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

function FDCalculator({ onAskAI }) {
  const [principal, setPrincipal] = useState('100000');
  const [rate, setRate]           = useState('7.5');
  const [years, setYears]         = useState('3');

  const p  = parseFloat(principal) || 0;
  const r  = parseFloat(rate) / 100;
  const n  = parseFloat(years) || 1;
  const maturity  = p * Math.pow(1 + r / 4, 4 * n);
  const interest  = maturity - p;
  const effectiveYield = p > 0 ? ((interest / p) * 100 / n).toFixed(2) : 0;

  return (
    <Card>
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-800">
        <CardHeader title="FD Calculator" subtitle="Compound interest maturity simulator" />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onAskAI({ principal: p, rate: parseFloat(rate), years: n, maturity, interest })}
          className="text-xs py-1 px-2.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
          icon={<Sparkles className="w-3 h-3 text-emerald-400" />}
        >
          Ask AI
        </Button>
      </div>

      <div className="space-y-4">
        <Input
          label="Principal Amount (₹)"
          type="number"
          value={principal}
          onChange={(e) => setPrincipal(e.target.value)}
          suffix="₹"
        />
        <div className="grid grid-cols-2 gap-3">
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
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total Investment</span>
            <span className="text-white font-medium">{formatCurrency(p)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Interest Earned</span>
            <span className="text-emerald-400 font-bold">+{formatCurrency(Math.round(interest))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Maturity Payout</span>
            <span className="text-white font-bold text-base">{formatCurrency(Math.round(maturity))}</span>
          </div>
          <div className="flex justify-between text-xs pt-1.5 border-t border-emerald-500/15">
            <span className="text-gray-400">Effective Annual Yield</span>
            <span className="text-yellow-400 font-semibold">{effectiveYield}% p.a.</span>
          </div>
        </div>

        <button
          onClick={() => onAskAI({ principal: p, rate: parseFloat(rate), years: n, maturity, interest })}
          className="w-full py-2 px-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" /> Analyze Tax & Returns with AI
        </button>
      </div>
    </Card>
  );
}

const POPULAR_BANKS = [
  'SBI',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Bank',
  'IDFC First',
  'Unity Small Finance',
  'Bank of Baroda',
  'Post Office',
];

export default function BankingModule() {
  const navigate = useNavigate();
  const { data, loading } = useMarket('banking');
  const [search, setSearch] = useState('');
  const [activeBankModal, setActiveBankModal] = useState(null);

  if (loading) return <PageLoader />;

  const allFdRates = data?.fdRates || [];
  const allSavingsRates = data?.savingsRates || [];

  // Filter based on search query
  const filteredFdRates = allFdRates.filter((row) =>
    !search.trim() ||
    row.bank.toLowerCase().includes(search.toLowerCase()) ||
    (row.type && row.type.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredSavingsRates = allSavingsRates.filter((b) =>
    !search.trim() ||
    b.bank.toLowerCase().includes(search.toLowerCase()) ||
    (b.type && b.type.toLowerCase().includes(search.toLowerCase()))
  );

  // Ask AI for overall banking strategy
  const handleAskAIBankingOverview = () => {
    const initialQuery = `Please provide an executive banking and fixed-income advisory for Indian investors:
1. Current Interest Rate Cycle: Are bank FD rates currently at their peak, and what does RBI monetary policy signal for the next 6-12 months?
2. FD vs Debt Alternatives: How do bank fixed deposits compare against Arbitrage Funds, Corporate FDs, and Treasury/G-Sec bills from a post-tax return perspective?
3. Safety & Diversification: Guidelines on utilizing the ₹5 Lakh DICGC insurance limit across multiple scheduled commercial and small finance banks (e.g. Unity SFB, IDFC First).
4. Senior Citizen Benefits: Recommended fixed deposit laddering strategy for senior citizens aiming to maximize monthly cash flow under Section 80TTB.`;

    navigate('/chatbot', { state: { initialQuery, clearChat: true } });
  };

  // Ask AI for specific Bank FD
  const handleAskAIBank = (bankRow) => {
    const bestRate = Math.max(bankRow['1y'] || 0, bankRow['2y'] || 0, bankRow['3y'] || 0, bankRow['5y'] || 0);
    const initialQuery = `Here is the bank fixed deposit I am evaluating on the Banking page:

[BANK FIXED DEPOSIT DATA]
• Bank Name: ${bankRow.bank}
• Bank Classification: ${bankRow.type || 'Scheduled Indian Bank'}
• Highest FD Rate: ${bestRate}% per annum
• 1-Year Tenure Rate: ${bankRow['1y']}%
• 2-Year Tenure Rate: ${bankRow['2y']}%
• 3-Year Tenure Rate: ${bankRow['3y']}%
• 5-Year Tenure Rate: ${bankRow['5y']}%
• Senior Citizen Extra Margin: +${bankRow.seniorBonus || 0.5}% p.a.
• Safety & Regulatory Status: ${bankRow.safety || 'RBI Scheduled Commercial Bank / DICGC Insured up to ₹5 Lakhs'}

Please provide:
1. Bank Safety & Credit Assessment: How safe is ${bankRow.bank} for deposits, and how does the DICGC insurance guarantee protect principal and interest?
2. Optimal Tenure Selection: Which tenure (1y, 2y, 3y, or 5y) offers the best compounding balance before anticipated RBI rate cuts?
3. Tax & TDS Rules: What are the tax implications (TDS thresholds, Form 15G/15H, and 80C benefits for 5-year tax-saver FDs)?
4. Actionable Verdict: Should an investor park emergency funds or long-term conservative capital in this bank?`;

    navigate('/chatbot', {
      state: {
        initialQuery,
        clearChat: true,
        marketContext: {
          bank: bankRow.bank,
          rate: bestRate,
        }
      }
    });
  };

  // Ask AI for calculator simulation
  const handleAskAICalculator = (calcData) => {
    const initialQuery = `I have simulated a Fixed Deposit investment using the FD Calculator with the following details:

[FD SIMULATION PARAMETERS]
• Principal Amount: ₹${calcData.principal?.toLocaleString('en-IN')}
• Interest Rate: ${calcData.rate}% per annum (Quarterly Compounding)
• Tenure: ${calcData.years} Year(s)
• Expected Interest Earned: ₹${Math.round(calcData.interest)?.toLocaleString('en-IN')}
• Total Maturity Payout: ₹${Math.round(calcData.maturity)?.toLocaleString('en-IN')}

Please provide:
1. Post-Tax Return Analysis: What will be the net in-hand return across 10%, 20%, and 30% income tax brackets?
2. Inflation Comparison: Does this FD beat India's average retail inflation (CPI ~5%)?
3. Better Alternatives: Would a Fixed Maturity Plan (FMP), Arbitrage Fund, or Small Finance Bank yield higher risk-adjusted net returns for this amount?
4. Reinvestment & Laddering Strategy: How should I stagger this ₹${calcData.principal?.toLocaleString('en-IN')} investment to ensure regular liquidity?`;

    navigate('/chatbot', { state: { initialQuery, clearChat: true } });
  };

  // Ask AI for a specific banking product
  const handleAskAIProduct = (product) => {
    const initialQuery = `I want to understand the ${product.title} investment option:
• Indicative Returns: ${product.return}
• Lock-in Period: ${product.lock}
• Risk Profile: ${product.risk}
• Tax Status: ${product.tax}

Please provide:
1. Deep-dive into what ${product.title} is and how it works in the Indian financial system.
2. Complete tax treatment and exemptions available under the Income Tax Act.
3. Comparative analysis vs other fixed income instruments.
4. Who should prioritize ${product.title} in their financial portfolio?`;

    navigate('/chatbot', { state: { initialQuery, clearChat: true } });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Banking Module</h2>
          <p className="text-gray-400 text-sm mt-1">Compare FD rates, high-yield savings accounts & fixed income instruments</p>
        </div>

        <Button
          size="sm"
          onClick={handleAskAIBankingOverview}
          className="self-start sm:self-auto py-2 px-4 shadow-lg shadow-emerald-500/10"
          icon={<Sparkles className="w-4 h-4 text-emerald-400" />}
        >
          Ask AI Banking Advisor
        </Button>
      </div>

      {/* Search Bar & Popular Pills */}
      <div className="space-y-2.5">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            className="form-input pl-10 pr-20 text-sm w-full"
            placeholder="Search any bank or institution (e.g. SBI, HDFC, ICICI, PNB, Unity SFB, Post Office)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick popular bank pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-gray-500 font-medium mr-1">Popular Banks:</span>
          {POPULAR_BANKS.map((bName) => (
            <button
              key={bName}
              onClick={() => setSearch(search === bName ? '' : bName)}
              className={`text-[11px] px-2.5 py-0.5 rounded-md border transition-all ${
                search.toLowerCase() === bName.toLowerCase()
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold'
                  : 'bg-gray-800/60 text-gray-400 border-gray-700/60 hover:text-white hover:border-gray-600'
              }`}
            >
              {bName}
            </button>
          ))}
        </div>
      </div>

      {/* High-yield savings accounts row */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5 text-emerald-400" /> High-Yield Savings Accounts
          </h3>
          <span className="text-[11px] text-gray-500">Interest credited monthly/quarterly</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {filteredSavingsRates.map((b) => (
            <div
              key={b.bank}
              className="glass-card p-3 text-center border border-gray-800 hover:border-emerald-500/30 transition-all group"
            >
              <p className="text-xs text-gray-400 mb-1 truncate font-medium group-hover:text-white transition-colors">{b.bank}</p>
              <p className="text-xl font-bold text-emerald-400">{b.rate}%</p>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 mt-1 inline-block border border-gray-700/60">
                {b.type || 'Savings'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* FD Rate table */}
        <Card padding={false}>
          <div className="p-5 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Fixed Deposit Rates</h3>
              <p className="text-xs text-gray-400 mt-0.5">Quarterly compounding · DICGC insured up to ₹5 Lakhs</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              {filteredFdRates.length} Banks Listed
            </span>
          </div>

          <div className="overflow-x-auto max-h-[460px]">
            <table className="data-table">
              <thead className="sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10">
                <tr>
                  <th>Bank</th>
                  <th>1 Year</th>
                  <th>2 Years</th>
                  <th>3 Years</th>
                  <th>5 Years</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredFdRates.length > 0 ? (
                  filteredFdRates.map((row) => {
                    const best = Math.max(row['1y'], row['2y'], row['3y'], row['5y']);
                    return (
                      <tr key={row.bank} className="hover:bg-gray-800/40 transition-colors">
                        <td>
                          <div
                            onClick={() => setActiveBankModal(row)}
                            className="font-medium text-gray-200 cursor-pointer hover:text-emerald-400 transition-colors"
                          >
                            {row.bank}
                          </div>
                          <span className="text-[10px] text-gray-500">{row.type}</span>
                        </td>
                        {['1y', '2y', '3y', '5y'].map((t) => (
                          <td key={t} className={row[t] === best ? 'text-emerald-400 font-bold' : 'text-gray-300'}>
                            {row[t]}%
                          </td>
                        ))}
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setActiveBankModal(row)}
                              className="text-gray-400 hover:text-emerald-400 p-1 transition-colors"
                              title="Bank Details & DICGC Insurance"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleAskAIBank(row)}
                              className="text-[11px] font-semibold py-1 px-2 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 flex items-center gap-1 transition-all"
                              title="Ask AI about this Bank FD"
                            >
                              <Sparkles className="w-3 h-3" /> Ask AI
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500 text-xs">
                      No bank found matching "{search}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-yellow-500/5 border-t border-yellow-500/10 flex items-start gap-2 text-xs text-yellow-400">
            <span className="text-sm">💡</span>
            <span>
              <strong>Pro Tip:</strong> Small Finance Banks (Unity SFB, Equitas, AU) offer up to <strong>9.00%</strong> with statutory RBI DICGC insurance coverage up to ₹5,00,000 per depositor.
            </span>
          </div>
        </Card>

        {/* FD Calculator with AI Action */}
        <FDCalculator onAskAI={handleAskAICalculator} />
      </div>

      {/* Banking Products Guide */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardHeader title="Banking Products Guide" subtitle="Taxation, liquidity, and risk analysis" />
          <Button
            size="sm"
            variant="secondary"
            onClick={handleAskAIBankingOverview}
            className="text-xs py-1 px-3 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            icon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Compare with AI
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title:   'Fixed Deposit (FD)',
              icon:    '🏦',
              return:  '6.5–9.0%',
              lock:    '7 days – 10 years',
              risk:    'None (DICGC insured up to ₹5L)',
              tax:     'Interest taxed as per slab; TDS > ₹40k',
            },
            {
              title:   'Recurring Deposit (RD)',
              icon:    '📅',
              return:  '5.5–7.5%',
              lock:    '6 months – 10 years',
              risk:    'None (DICGC insured up to ₹5L)',
              tax:     'Interest taxed as income slab',
            },
            {
              title:   'PPF (Public Provident Fund)',
              icon:    '🛡️',
              return:  '7.1% p.a.',
              lock:    '15 years (Partial after 5y)',
              risk:    '100% Sovereign Guarantee',
              tax:     'EEE (Exempt-Exempt-Exempt) Tax Free',
            },
            {
              title:   'NSC (National Savings Cert.)',
              icon:    '📜',
              return:  '7.7% p.a.',
              lock:    '5 years',
              risk:    '100% Sovereign Guarantee',
              tax:     'Eligible for Section 80C rebate',
            },
            {
              title:   'Senior Citizen Savings / FD',
              icon:    '👴',
              return:  '+0.50% extra (~8.2–9.5%)',
              lock:    'Varies (1y to 5y)',
              risk:    'DICGC Insured / Government Backed',
              tax:     'Up to ₹50,000 exempt under 80TTB',
            },
            {
              title:   'High-Yield Savings Account',
              icon:    '💳',
              return:  '3.0–7.25%',
              lock:    'Zero (Instant Liquidity)',
              risk:    'DICGC Insured up to ₹5L',
              tax:     '₹10,000 interest exempt under 80TTA',
            },
          ].map((p) => (
            <div key={p.title} className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30 hover:border-emerald-500/30 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{p.icon}</span>
                    <p className="font-semibold text-gray-200 text-sm">{p.title}</p>
                  </div>
                  <button
                    onClick={() => handleAskAIProduct(p)}
                    className="text-xs p-1 text-gray-400 hover:text-emerald-400 transition-colors"
                    title="Ask AI about this product"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Returns</span><span className="text-emerald-400 font-bold">{p.return}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Lock-in</span><span className="text-gray-300">{p.lock}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Risk</span><span className="text-gray-300">{p.risk}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Tax</span><span className="text-gray-400 text-right ml-2">{p.tax}</span></div>
                </div>
              </div>

              <button
                onClick={() => handleAskAIProduct(p)}
                className="mt-3 pt-2.5 border-t border-gray-800/80 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-1 transition-colors"
              >
                <Sparkles className="w-3 h-3" /> Ask AI about {p.title.split(' ')[0]}
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Interactive Bank Detail Modal */}
      {activeBankModal && (
        <Modal
          isOpen={Boolean(activeBankModal)}
          onClose={() => setActiveBankModal(null)}
          title={`${activeBankModal.bank} Fixed Deposit & Safety Analysis`}
          size="lg"
        >
          {(() => {
            const best = Math.max(activeBankModal['1y'] || 0, activeBankModal['2y'] || 0, activeBankModal['3y'] || 0, activeBankModal['5y'] || 0);

            return (
              <div className="space-y-5">
                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                    {activeBankModal.type || 'Commercial Bank'}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-gray-800 text-gray-300 border border-gray-700">
                    Highest FD Rate: {best}% p.a.
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                    Senior Citizen: +{activeBankModal.seniorBonus || 0.5}% Extra
                  </span>
                </div>

                {/* Tenure Comparison Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
                  {['1y', '2y', '3y', '5y'].map((t) => (
                    <div key={t} className="text-center p-2 rounded-lg bg-gray-800/40">
                      <p className="text-xs text-gray-400 uppercase tracking-wider">{t.toUpperCase()} Tenure</p>
                      <p className={`text-lg font-bold mt-1 ${activeBankModal[t] === best ? 'text-emerald-400 font-extrabold' : 'text-white'}`}>
                        {activeBankModal[t]}%
                      </p>
                      <p className="text-[10px] text-gray-500">Quarterly Compound</p>
                    </div>
                  ))}
                </div>

                {/* Explanatory Cards */}
                <div className="space-y-3.5 text-sm leading-relaxed">
                  <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/40">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1 flex items-center gap-1.5">
                      <Shield className="w-4 h-4" /> Safety & DICGC Insurance Guarantee
                    </h4>
                    <p className="text-gray-300">
                      {activeBankModal.safety || 'Protected under the Deposit Insurance and Credit Guarantee Corporation (DICGC), an RBI subsidiary, insuring deposits up to ₹5,00,000 per depositor.'}
                    </p>
                  </div>

                  <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/40">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Optimal Compounding Strategy
                    </h4>
                    <p className="text-gray-300">
                      {`Locking in the ${best}% peak rate for 2 to 3 years locks in returns before projected RBI repo rate cuts, securing predictable interest compounding.`}
                    </p>
                  </div>

                  <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/40">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-400 mb-1 flex items-center gap-1.5">
                      <Percent className="w-4 h-4" /> Taxation & TDS Norms
                    </h4>
                    <p className="text-gray-300">
                      TDS of 10% applies if annual interest from all branches exceeds ₹40,000 (₹50,000 for senior citizens). Submit Form 15G or 15H if total income is below the taxable threshold.
                    </p>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveBankModal(null)}
                  >
                    Close
                  </Button>

                  <Button
                    size="sm"
                    icon={<Sparkles className="w-4 h-4" />}
                    onClick={() => {
                      const target = activeBankModal;
                      setActiveBankModal(null);
                      handleAskAIBank(target);
                    }}
                  >
                    Discuss with AI Banking Advisor
                  </Button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
}
