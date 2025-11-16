<template>
  <div class="dashboard">
    <!-- Overview Header -->
    <div class="overview-header">
      <h3 class="overview-title">Overview</h3>
    </div>

    <!-- Info Cards Row -->
    <div class="info-cards-row">
      <div class="info-card">
        <div class="info-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div class="info-card-content">
          <h5 class="info-card-title">Upcoming Tests</h5>
          <div class="info-card-item">SC2024 Written Test in 3 days</div>
          <div class="info-card-item">SC2003 Coding Test in 5 days</div>
        </div>
      </div>

      <div class="info-card">
        <div class="info-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12" y2="8"></line>
          </svg>
        </div>
        <div class="info-card-content">
          <h5 class="info-card-title">Library Crowd Monitoring</h5>
          <!-- <div v-if="librarySummary.length === 0" class="info-card-item">Loading library data...</div> -->
          <div v-for="library in librarySummary" :key="library.libraryId" class="info-card-item">
            Crowd level of {{ library.name }} is {{ library.crowdLevel }}
          </div>
        </div>
      </div>

      <div class="info-card">
        <div class="info-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12" y2="8"></line>
          </svg>
        </div>
        <div class="info-card-content">
          <h5 class="info-card-title">Set Quiet Hours</h5>
          <div class="info-card-description">
            Let us help you to achieve better quality rest! We will turn off notifications during your Quiet hours.
            Set Quiet Hours by clicking Setting &gt; Edit Personal Details &gt; Quiet Hours.
          </div>
        </div>
      </div>
    </div>




    <!-- Main Row: Charts + TaskList -->
    <div class="main-row">
      <div class="col-main">
        <div class="card full-height-card">
          <div class="card-header">
            <h5 class="card-category">Protected Hours</h5>
          </div>
          <div class="chart-area full-chart">
            <BarChart :chart-data="barData" :extra-options="barChartOptions" />
          </div>
        </div>
      </div>

      <div class="col-main">
        <div class="card full-height-card">
          <div class="card-header">
            <h5 class="card-category">Completion</h5>
          </div>
          <div class="chart-area radial-chart-area full-chart">
            <NestedPieChart :chart-options="pieChartOptions" />
          </div>
        </div>
      </div>

      <div class="col-main">
        <div class="card full-height-card">
          <div class="card-header">
            <h5 class="card-category">Tasks</h5>
          </div>
          <div class="tasklist-area full-chart">
            <TaskList />
          </div>
        </div>
      </div>
    </div>




    <!-- Quotes Row -->
    <div class="quotes-container">
      <div class="quotes-grid">
        <CardDash
          class="compact-card"
          quote="Success is not final, failure is not fatal: it is the courage to continue that counts."
          author-name="Winston Churchill"
          author-title="Former Prime Minister of the United Kingdom"
        />
        <CardDash
          class="compact-card"
          quote="The only way to do great work is to love what you do."
          author-name="Steve Jobs"
          author-title="Co-founder of Apple Inc."
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getLibrarySummary } from '@endpoints/crowd_Monitoring.ts'
import BarChart from '@/components/BarChart.vue'
import NestedPieChart from '@/components/NestedPieChart.vue'
import CardDash from '@/components/CardDash.vue'

const barChartOptions = {
  maintainAspectRatio: false,
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'var(--surface-hover)',
      titleColor: 'var(--text-primary)',
      bodyColor: 'var(--text-secondary)',
      bodySpacing: 4,
      padding: 12,
      mode: 'nearest',
      intersect: false,
      position: 'nearest'
    }
  },
  scales: {
    y: {
      grid: { drawBorder: false, color: 'rgba(29,140,248,0.08)' },
      ticks: { suggestedMin: 0, suggestedMax: 100, padding: 20, color: 'var(--text-secondary)' }
    },
    x: {
      grid: { drawBorder: false, color: 'rgba(29,140,248,0.08)' },
      ticks: { padding: 20, color: 'var(--text-secondary)' }
    }
  }
}

const librarySummary = ref([])

onMounted(async () => {
  try {
    const summary = await getLibrarySummary('http://localhost:3000/v1')
    librarySummary.value = summary.libraries
  } catch (error) {
    console.error('Failed to fetch library summary:', error)
    librarySummary.value = [] // Clear or set to an error state
  }
})

const barData = ref({
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  datasets: [
    {
      label: 'Hours',
      borderColor: 'var(--primary)',
      borderWidth: 2,
      backgroundColor: 'var(--primary)',
      data: [40, 60, 75, 50, 90, 70]
    }
  ]
})



// --- Quotes (API Integration) ---
const quote1 = ref('')
const authorName1 = ref('')
const quote2 = ref('')
const authorName2 = ref('')
const authorTitle = ref('Motivational Quote')

import TaskList from '@/components/TaskList.vue'

const fetchQuotes = async () => {
  try {
    const fetchSingle = async () => {
      const res = await fetch(
        'https://api.allorigins.win/raw?url=https://api.api-ninjas.com/v2/quoteoftheday',
        { headers: { 'X-Api-Key': '7zY37jR/oFUV8+YT+Z2aag==ubWVduVshjDpRsT6' } }
      )
      const data = await res.json()
      return data.quote ? { content: data.quote, author: data.author || 'Unknown' } : { content: 'No quote found.', author: '' }
    }

    const q1 = await fetchSingle()
    const q2 = await fetchSingle()
    quote1.value = q1.content
    authorName1.value = q1.author
    quote2.value = q2.content
    authorName2.value = q2.author
  } catch (error) {
    console.error(error)
    quote1.value = 'Keep pushing forward.'
    authorName1.value = 'Anonymous'
    quote2.value = 'Never give up.'
    authorName2.value = 'Anonymous'
  }
}

onMounted(() => fetchQuotes())

</script>

<style scoped>
.dashboard {
  padding: var(--space-6);
  background-color: var(--gray-50);
  min-height: 100vh;
  transition: background var(--transition-normal);
}

/* Overview Header */
.overview-header {
  margin-bottom: var(--space-5);
}

.overview-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

/* Info Cards */
.info-cards-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-5);
  margin-bottom: var(--space-8);
}

.info-card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-5);
  display: flex;
  gap: var(--space-4);
  transition: background var(--transition-normal), box-shadow var(--transition-normal);
}

.info-card:hover {
  box-shadow: var(--shadow-md);
}

.info-card-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--surface-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.info-card-content {
  flex: 1;
}

.info-card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 10px 0;
}

.info-card-item,
.info-card-description {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* Charts Row */
.row {
  display: flex;
  flex-wrap: nowrap;
  gap: var(--space-8);
  margin: 0 0 var(--space-8) 0;
}

.col-lg-6 {
  flex: 1;
  min-width: 0;
}

.card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: background var(--transition-normal), box-shadow var(--transition-normal);
}

.card:hover {
  box-shadow: var(--shadow-md);
}

.chart-card {
  height: 450px;
}

.card-header {
  padding: var(--space-5);
  border-bottom: none;
  flex-shrink: 0;
}

.card-category {
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 600;
  margin: 0;
}

.chart-area {
  flex: 1;
  padding: var(--space-5);
  position: relative;
  min-height: 0;
}

.radial-chart-area {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Quotes grid */
.quotes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-5);
  margin-top: var(--space-8);
}

.compact-card {
  margin: 0;
  box-shadow: var(--shadow-sm);
  border-radius: var(--radius-md);
  background: var(--surface);
  transition: background var(--transition-normal), box-shadow var(--transition-normal);
}

.compact-card:hover {
  box-shadow: var(--shadow-md);
}

/* Responsive */
@media (max-width: 991px) {
  .info-cards-row {
    grid-template-columns: 1fr;
  }
  .row {
    flex-wrap: wrap;
    gap: var(--space-5);
  }
  .col-lg-6 {
    flex: 0 0 100%;
    max-width: 100%;
  }
}

@media (max-width: 767px) {
  .quotes-grid {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }
}




.dashboard {
  padding: var(--space-6);
  background-color: var(--gray-50);
  min-height: 100vh;
}

/* Overview Header */
.overview-header { margin-bottom: var(--space-5); }
.overview-title { font-size: 24px; font-weight: 600; color: var(--text-primary); margin: 0; }

/* Info Cards Row */
.info-cards-row { display: flex; gap: var(--space-5); margin-bottom: var(--space-8); }
.info-card { flex: 1; display: flex; gap: var(--space-4); background: var(--surface); border-radius: var(--radius-lg); padding: var(--space-5); box-shadow: var(--shadow-sm); }
.info-card:hover { box-shadow: var(--shadow-md); }
.info-card-icon { flex-shrink: 0; width: 40px; height: 40px; border-radius: var(--radius-md); background: var(--surface-hover); display: flex; align-items: center; justify-content: center; color: var(--text-secondary); }
.info-card-content { flex: 1; }
.info-card-title { font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 10px; }
.info-card-item { font-size: 14px; color: var(--text-secondary); line-height: 1.5; }

/* Main Row */
.main-row { display: flex; gap: var(--space-6); align-items: stretch; margin-bottom: var(--space-8); }
.col-main { flex: 1; display: flex; flex-direction: column; }
.full-height-card { flex: 1; display: flex; flex-direction: column; }
.full-chart { flex: 1; display: flex; flex-direction: column; }

/* Card + Chart styling */
.card { background: var(--surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); overflow: hidden; display: flex; flex-direction: column; }
.card:hover { box-shadow: var(--shadow-md); }
.card-header { padding: var(--space-5); }
.card-category { font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 0; }
.chart-area, .radial-chart-area, .tasklist-area { flex: 1; padding: 0; }
.radial-chart-area { display: flex; justify-content: center; align-items: center; }

/* Quotes Grid */
.quotes-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-5); margin-top: var(--space-8); }
.compact-card { margin: 0; box-shadow: var(--shadow-sm); border-radius: var(--radius-md); background: var(--surface); }
.compact-card:hover { box-shadow: var(--shadow-md); }

/* Big quote styling */
.big-quote { font-size: 18px; padding: 32px; min-height: 180px; }

/* Responsive */
@media (max-width: 1200px) { .main-row { flex-wrap: wrap; gap: var(--space-5); } }
@media (max-width: 767px) { .quotes-grid { grid-template-columns: 1fr; gap: var(--space-4); } }

</style>
