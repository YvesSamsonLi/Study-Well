<template>
  <div class="apex-chart-container">
    <apexchart
      type="bar"
      height="350"
      :options="chartOptions"
      :series="series"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

// Helper to dynamically access CSS variables
const getCSSVar = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim()

const series = ref([
  {
    name: 'Hours',
    data: [10, 20, 30, 40, 50, 60, 70],
  },
])

const chartOptions = ref({
  chart: {
    height: 350,
    type: 'bar',
    toolbar: { show: false },
    foreColor: getCSSVar('--text-primary'),
    background: 'transparent',
  },
  plotOptions: {
    bar: {
      borderRadius: 10,
      dataLabels: { position: 'top' },
      columnWidth: '50%',
    },
  },
  dataLabels: {
    enabled: true,
    formatter: (val) => val,
    offsetY: -20,
    style: {
      fontSize: '12px',
      colors: [getCSSVar('--text-secondary')],
    },
  },
  xaxis: {
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    position: 'top',
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: {
      style: {
        colors: getCSSVar('--text-secondary'),
        fontSize: '13px',
      },
    },
    crosshairs: {
      fill: {
        type: 'gradient',
        gradient: {
          colorFrom: getCSSVar('--primary-light'),
          colorTo: getCSSVar('--primary-lighter'),
          stops: [0, 100],
          opacityFrom: 0.4,
          opacityTo: 0.5,
        },
      },
    },
  },
  yaxis: {
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { show: false },
  },
  tooltip: {
    enabled: true,
    theme: 'dark',
    y: {
      formatter: (val) => `${val} hrs`,
    },
  },
  title: {
    text: 'Study / Protect Hours',
    floating: true,
    offsetY: 330,
    align: 'center',
    style: {
      color: getCSSVar('--text-primary'),
      fontWeight: 600,
    },
  },
  colors: [getCSSVar('--primary')],
})

// Recalculate chart styling when theme changes
onMounted(() => {
  const observer = new MutationObserver(() => {
    const primary = getCSSVar('--primary')
    const primaryLight = getCSSVar('--primary-light')
    const primaryLighter = getCSSVar('--primary-lighter')
    const textPrimary = getCSSVar('--text-primary')
    const textSecondary = getCSSVar('--text-secondary')

    chartOptions.value = {
      ...chartOptions.value,
      chart: {
        ...chartOptions.value.chart,
        foreColor: textPrimary,
      },
      dataLabels: {
        ...chartOptions.value.dataLabels,
        style: {
          ...chartOptions.value.dataLabels.style,
          colors: [textSecondary],
        },
      },
      xaxis: {
        ...chartOptions.value.xaxis,
        labels: {
          ...chartOptions.value.xaxis.labels,
          style: {
            ...chartOptions.value.xaxis.labels.style,
            colors: textSecondary,
          },
        },
        crosshairs: {
          fill: {
            type: 'gradient',
            gradient: {
              colorFrom: primaryLight,
              colorTo: primaryLighter,
              stops: [0, 100],
              opacityFrom: 0.4,
              opacityTo: 0.5,
            },
          },
        },
      },
      title: {
        ...chartOptions.value.title,
        style: {
          ...chartOptions.value.title.style,
          color: textPrimary,
        },
      },
      tooltip: {
        ...chartOptions.value.tooltip,
        theme: 'dark',
      },
      colors: [primary],
    }

    // Force chart to refresh for immediate update
    nextTick(() => {
      window.dispatchEvent(new Event('resize'))
    })
  })

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
})
</script>

<style scoped>
.apex-chart-container {
  width: 100%;
  padding: var(--space-6);
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: background var(--transition-normal), box-shadow var(--transition-normal);
}
</style>
