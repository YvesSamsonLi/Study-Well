<template>
  <div class="radial-bar-container">
    <apexchart
      type="radialBar"
      :series="series"
      :options="chartOptions"
      width="100%"
      height="400"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

// Helper to get CSS variable values dynamically
const getCSSVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

const series = ref([65, 50])

const chartOptions = ref({
  chart: {
    height: 400,
    type: 'radialBar',
    foreColor: getCSSVar('--text-primary'),
  },
  plotOptions: {
    radialBar: {
      hollow: {
        size: '50%',
      },
      track: {
        background: getCSSVar('--surface-hover'),
      },
      dataLabels: {
        name: {
          fontSize: '18px',
          fontWeight: 600,
          color: getCSSVar('--text-secondary'),
        },
        value: {
          fontSize: '16px',
          color: getCSSVar('--text-primary'),
        },
        total: {
          show: true,
          label: 'Average',
          color: getCSSVar('--text-primary'),
          formatter: function (w) {
            const avg =
              w.globals.series.reduce((a, b) => a + b, 0) / w.globals.series.length
            return Math.round(avg) + '%'
          },
        },
      },
    },
  },
  labels: ['Tutorials', 'Lectures'],
  colors: [
    getCSSVar('--primary'),
    getCSSVar('--primary-light'),
  ],
})

// Automatically update chart colors and text when theme changes
onMounted(() => {
  const observer = new MutationObserver(() => {
    const primary = getCSSVar('--primary')
    const primaryLight = getCSSVar('--primary-light')
    const textPrimary = getCSSVar('--text-primary')
    const textSecondary = getCSSVar('--text-secondary')
    const surfaceHover = getCSSVar('--surface-hover')

    chartOptions.value = {
      ...chartOptions.value,
      chart: {
        ...chartOptions.value.chart,
        foreColor: textPrimary,
      },
      plotOptions: {
        ...chartOptions.value.plotOptions,
        radialBar: {
          ...chartOptions.value.plotOptions.radialBar,
          track: { background: surfaceHover },
          dataLabels: {
            name: {
              ...chartOptions.value.plotOptions.radialBar.dataLabels.name,
              color: textSecondary,
            },
            value: {
              ...chartOptions.value.plotOptions.radialBar.dataLabels.value,
              color: textPrimary,
            },
            total: {
              ...chartOptions.value.plotOptions.radialBar.dataLabels.total,
              color: textPrimary,
            },
          },
        },
      },
      colors: [primary, primaryLight],
    }

    // Ensure the chart refreshes immediately
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
.radial-bar-container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: var(--space-6);
  background: var(--surface);
  border-radius: var(--radius-lg);
  /* box-shadow: var(--shadow-md); */
  transition: background var(--transition-normal), box-shadow var(--transition-normal);
}
</style>

