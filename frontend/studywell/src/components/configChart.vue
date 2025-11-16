<script setup>
export const basicOptions = {
  maintainAspectRatio: false,
  responsive: true,
  plugins: {
    legend: { display: false },
  },
}

export const blueChartOptions = {
  ...basicOptions,
  plugins: {
    ...basicOptions.plugins,
    tooltip: {
      backgroundColor: '#f5f5f5',
      titleColor: '#333',
      bodyColor: '#666',
      bodySpacing: 4,
      padding: 12,
      mode: 'nearest',
      intersect: false,
      position: 'nearest',
    },
  },
  scales: {
    y: {
      grid: { drawBorder: false, color: 'rgba(29,140,248,0.0)' },
      ticks: { suggestedMin: 60, suggestedMax: 125, padding: 20, color: '#2380f7' },
    },
    x: {
      grid: { drawBorder: false, color: 'rgba(29,140,248,0.1)' },
      ticks: { padding: 20, color: '#2380f7' },
    },
  },
}

export const barChartOptions = {
  ...basicOptions,
  plugins: {
    ...basicOptions.plugins,
    tooltip: {
      backgroundColor: '#f5f5f5',
      titleColor: '#333',
      bodyColor: '#666',
      bodySpacing: 4,
      padding: 12,
      mode: 'nearest',
      intersect: false,
      position: 'nearest',
    },
  },
  scales: {
    y: {
      grid: { drawBorder: false, color: 'rgba(29,140,248,0.1)' },
      ticks: { suggestedMin: 60, suggestedMax: 120, padding: 20, color: '#9e9e9e' },
    },
    x: {
      grid: { drawBorder: false, color: 'rgba(29,140,248,0.1)' },
      ticks: { padding: 20, color: '#9e9e9e' },
    },
  },
}
</script>
