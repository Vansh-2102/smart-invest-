import { useState } from 'react';
import { Star, Zap, Clock, ChevronRight } from 'lucide-react';
import { useRecommendations } from '../hooks/useRecommendations';
import { useFinancialProfile } from '../hooks/useFinancialProfile';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { Select } from '../components/ui/Input';
import { PageLoader } from '../components/ui/Spinner';
import ErrorAlert from '../components/ui/ErrorAlert';
import AllocationChart from '../components/charts/AllocationChart';
import { RiskBadge } from '../components/ui/Badge';
import { formatCurrency, formatDate, formatPercent } from '../utils/formatters';
import { RISK_LEVELS } from '../utils/constants';

export default function Recommendations() {
  const { profile } = useFinancialProfile();
  const { recommendations, current, loading, generating, error, generate } = useRecommendations();

  const [form, setForm] = useState({
    riskLevel:        profile?.predictedRiskLevel || '',
    investmentAmount: '',
  });
  const [formError, setFormError] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.investmentAmount || parseFloat(form.investmentAmount) <= 0) {
      setFormError('Please enter a valid investment amount');
      return;
    }
    setFormError('');
    try {
      await generate(form.riskLevel || undefined, parseFloat(form.investmentAmount));
    } catch (err) {
      setFormError(err.message);
    }
  };

  if (loading) return <PageLoader />;

  const allocations = current?.assetAllocations || current?.asset_class_allocations || {};
  const assetRecs = current?.assetRecommendations || current?.recommendations || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Recommendations</h2>
        <p className="text-gray-400 text-sm mt-1">AI-powered investment plan tailored to your risk profile</p>
      </div>

      {error && <ErrorAlert message={error} />}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Generate form */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader title="Generate Plan" subtitle="Get AI-driven recommendations" />
            <form onSubmit={handleGenerate} className="space-y-4">
              {formError && <ErrorAlert message={formError} onDismiss={() => setFormError('')} />}

              <Select
                label="Risk Level"
                value={form.riskLevel}
                onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}
              >
                <option value="">Auto (from profile)</option>
                {RISK_LEVELS.map((r) => (
                  <option key={r} value={r}>{r.replace('_', ' ')}</option>
                ))}
              </Select>

              <Input
                label="Investment Amount (₹)"
                type="number"
                placeholder="100000"
                min="1000"
                value={form.investmentAmount}
                onChange={(e) => setForm({ ...form, investmentAmount: e.target.value })}
                suffix="₹"
              />

              <Button type="submit" fullWidth loading={generating} icon={<Zap className="w-4 h-4" />}>
                {generating ? 'Generating...' : 'Generate Plan'}
              </Button>
            </form>
          </Card>

          {/* History */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader title="History" subtitle={`${recommendations.length} plans`} />
              <div className="space-y-2">
                {recommendations.slice(0, 5).map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => {}}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      current?.id === rec.id
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : 'hover:bg-gray-800/50 border border-transparent'
                    }`}
                  >
                    <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Star className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate capitalize">
                        {rec.riskLevel?.replace('_', ' ') || 'Auto'}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(rec.createdAt)}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatCurrency(rec.totalInvestmentAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Current recommendation */}
        <div className="lg:col-span-2 space-y-6">
          {current ? (
            <>
              {/* Summary */}
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-white">Investment Plan</h3>
                      <RiskBadge level={current.riskLevel} />
                    </div>
                    <p className="text-sm text-gray-400">
                      Total: <span className="text-white font-semibold">{formatCurrency(current.totalInvestmentAmount)}</span>
                      {' · '}
                      Generated: {formatDate(current.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Allocation Chart */}
                <AllocationChart allocations={allocations} height={260} />
              </Card>

              {/* Asset cards */}
              {assetRecs.length > 0 && (
                <Card>
                  <CardHeader
                    title="Recommended Investments"
                    subtitle={`${assetRecs.length} assets recommended`}
                  />
                  <div className="space-y-3">
                    {assetRecs.map((rec, i) => {
                      const risk = rec.risk?.toUpperCase?.();
                      const allocation = rec.allocation ?? rec.allocation_percent;
                      const expectedReturn = rec.expectedReturn ?? rec.expectedReturns ?? rec['1y_return_percent'];
                      const amount = rec.amount ?? rec.allocation_amount;

                      return (
                      <div
                        key={rec.ticker || rec.name || i}
                        className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gray-800/30 rounded-xl border border-gray-700/30 hover:border-gray-600/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-white">{rec.name || rec.assetType || rec.ticker}</p>
                            {rec.risk && (
                              <span className={`badge text-xs ${
                                risk === 'LOW'  ? 'risk-low border'  :
                                risk === 'HIGH' ? 'risk-high border' :
                                'risk-medium border'
                              }`}>{rec.risk}</span>
                            )}
                          </div>
                          {(rec.description || rec.ticker || rec.type) && (
                            <p className="text-xs text-gray-500">
                              {rec.description || `${rec.ticker || 'Asset'}${rec.type ? ` · ${rec.type.toUpperCase()}` : ''}`}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-6 text-sm">
                          {allocation !== undefined && (
                            <div className="text-center">
                              <p className="text-gray-400 text-xs">Allocation</p>
                              <p className="text-white font-bold">{allocation}%</p>
                            </div>
                          )}
                          {expectedReturn !== undefined && (
                            <div className="text-center">
                              <p className="text-gray-400 text-xs">Expected Return</p>
                              <p className="text-emerald-400 font-bold">
                                {formatPercent(expectedReturn)}
                              </p>
                            </div>
                          )}
                          {amount !== undefined && (
                            <div className="text-center">
                              <p className="text-gray-400 text-xs">Amount</p>
                              <p className="text-white font-bold">{formatCurrency(amount)}</p>
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0 hidden sm:block" />
                      </div>
                    )})}
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center">
                  <Star className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-300">No Recommendations Yet</h3>
                <p className="text-gray-500 text-sm text-center max-w-sm">
                  Enter your investment amount and click "Generate Plan" to get personalized AI recommendations.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
