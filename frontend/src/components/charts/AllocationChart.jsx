import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { ASSET_COLORS, CHART_DEFAULTS } from '../../utils/constants';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AllocationChart({ allocations = {}, height = 220 }) {
  const labels  = Object.keys(allocations).map((k) => k.replace(/([A-Z])/g, ' $1').trim());
  const values  = Object.values(allocations).map((v) => parseFloat(v) || 0);
  const colors  = Object.keys(allocations).map((k) => ASSET_COLORS[k] || '#6B7280');

  const data = {
    labels,
    datasets: [
      {
        data:            values,
        backgroundColor: colors.map((c) => c + 'CC'),
        borderColor:     colors,
        borderWidth:     2,
        hoverBorderWidth: 3,
        hoverOffset:     6,
      },
    ],
  };

  const options = {
    ...CHART_DEFAULTS,
    cutout: '68%',
    plugins: {
      ...CHART_DEFAULTS.plugins,
      legend: {
        position: 'right',
        labels: {
          color:     '#9CA3AF',
          font:      { family: 'Inter', size: 12 },
          padding:   12,
          boxWidth:  12,
          boxHeight: 12,
          borderRadius: 2,
        },
      },
      tooltip: {
        ...CHART_DEFAULTS.plugins.tooltip,
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.parsed.toFixed(1)}%`,
        },
      },
    },
  };

  if (values.every((v) => v === 0)) {
    return (
      <div className="flex items-center justify-center h-[220px] text-gray-500 text-sm">
        No allocation data available
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <Doughnut data={data} options={options} />
    </div>
  );
}
