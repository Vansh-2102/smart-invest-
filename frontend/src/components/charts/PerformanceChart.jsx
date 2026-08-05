import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { CHART_DEFAULTS } from '../../utils/constants';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function PerformanceChart({ labels = [], datasets = [], height = 220 }) {
  const chartDatasets = datasets.map((ds, i) => ({
    label:           ds.label || `Series ${i + 1}`,
    data:            ds.data || [],
    borderColor:     ds.color || '#10B981',
    backgroundColor: (ds.color || '#10B981') + '20',
    borderWidth:     2,
    pointRadius:     3,
    pointHoverRadius: 5,
    pointBackgroundColor: ds.color || '#10B981',
    tension:         0.4,
    fill:            ds.fill !== undefined ? ds.fill : true,
  }));

  const data = { labels, datasets: chartDatasets };

  const options = {
    ...CHART_DEFAULTS,
    scales: {
      x: {
        grid:     { color: '#1F2937', drawBorder: false },
        ticks:    { color: '#6B7280', font: { family: 'Inter', size: 11 } },
      },
      y: {
        grid:     { color: '#1F2937', drawBorder: false },
        ticks:    { color: '#6B7280', font: { family: 'Inter', size: 11 } },
        beginAtZero: false,
      },
    },
    plugins: {
      ...CHART_DEFAULTS.plugins,
      legend: {
        display:  chartDatasets.length > 1,
        position: 'top',
        labels:   { color: '#9CA3AF', font: { family: 'Inter', size: 12 }, padding: 16 },
      },
    },
    interaction: {
      mode:      'index',
      intersect: false,
    },
  };

  return (
    <div style={{ height }}>
      <Line data={data} options={options} />
    </div>
  );
}
