<template>
  <div class="task-list-card">
    <div class="task-header">
      <h3 class="task-title">My Tasks</h3>
      <button class="add-task-btn" @click="showAddForm = !showAddForm">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>

    <!-- Add Task Form -->
    <div v-if="showAddForm" class="add-task-form">
      <input 
        v-model="newTask.title" 
        type="text" 
        placeholder="Task title" 
        class="task-input"
        @keyup.enter="addTask"
      />
      <div class="form-row">
        <select v-model="newTask.priority" class="task-select">
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>
        <input 
          v-model="newTask.dueDate" 
          type="date" 
          class="task-input"
        />
      </div>
      <input 
        v-model="newTask.category" 
        type="text" 
        placeholder="Category (optional)" 
        class="task-input"
      />
      <div class="form-actions">
        <button @click="addTask" class="btn-primary">Add Task</button>
        <button @click="cancelAdd" class="btn-secondary">Cancel</button>
      </div>
    </div>

    <!-- Filter Buttons -->
    <div class="filter-tabs">
      <button 
        :class="['filter-tab', { active: filter === 'all' }]"
        @click="filter = 'all'"
      >
        All ({{ tasks.length }})
      </button>
      <button 
        :class="['filter-tab', { active: filter === 'active' }]"
        @click="filter = 'active'"
      >
        Active ({{ activeTasks.length }})
      </button>
      <button 
        :class="['filter-tab', { active: filter === 'completed' }]"
        @click="filter = 'completed'"
      >
        Completed ({{ completedTasks.length }})
      </button>
    </div>

    <!-- Task List -->
    <div class="tasks-container">
      <div 
        v-for="task in filteredTasks" 
        :key="task.id"
        :class="['task-item', { completed: task.completed }, `priority-${task.priority}`]"
      >
        <div class="task-checkbox">
          <input 
            type="checkbox" 
            :id="`task-${task.id}`"
            v-model="task.completed"
            @change="saveToStorage"
          />
          <label :for="`task-${task.id}`"></label>
        </div>

        <div class="task-details">
          <h4 class="task-name">{{ task.title }}</h4>
          <div class="task-meta">
            <span v-if="task.category" class="task-category">{{ task.category }}</span>
            <span class="task-priority">{{ task.priority }}</span>
            <span v-if="task.dueDate" class="task-due-date">
              Due: {{ formatDate(task.dueDate) }}
            </span>
          </div>
        </div>

        <button class="delete-btn" @click="deleteTask(task.id)">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>

      <div v-if="filteredTasks.length === 0" class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 11l3 3L22 4"></path>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
        <p>{{ filter === 'completed' ? 'No completed tasks yet' : 'No tasks yet. Add one to get started!' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const tasks = ref([]);
const showAddForm = ref(false);
const filter = ref('all');

const newTask = ref({
  title: '',
  priority: 'medium',
  category: '',
  dueDate: ''
});

const activeTasks = computed(() => tasks.value.filter(t => !t.completed));
const completedTasks = computed(() => tasks.value.filter(t => t.completed));

const filteredTasks = computed(() => {
  if (filter.value === 'active') return activeTasks.value;
  if (filter.value === 'completed') return completedTasks.value;
  return tasks.value;
});

const addTask = () => {
  if (!newTask.value.title.trim()) return;
  
  tasks.value.unshift({
    id: Date.now(),
    title: newTask.value.title,
    priority: newTask.value.priority,
    category: newTask.value.category,
    dueDate: newTask.value.dueDate,
    completed: false
  });
  
  saveToStorage();
  cancelAdd();
};

const cancelAdd = () => {
  showAddForm.value = false;
  newTask.value = {
    title: '',
    priority: 'medium',
    category: '',
    dueDate: ''
  };
};

const deleteTask = (id) => {
  tasks.value = tasks.value.filter(t => t.id !== id);
  saveToStorage();
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const saveToStorage = () => {
  try {
    const data = JSON.stringify(tasks.value);
    localStorage.setItem('vue-tasks', data);
  } catch (e) {
    console.error('Failed to save tasks:', e);
  }
};

const loadFromStorage = () => {
  try {
    const data = localStorage.getItem('vue-tasks');
    if (data) {
      tasks.value = JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load tasks:', e);
  }
};

onMounted(() => {
  loadFromStorage();
});
</script>

<style scoped>
.task-list-card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  border: 1px solid var(--border-light);
}

.task-list-card:hover {
  box-shadow: var(--shadow-lg);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-5);
}

.task-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.add-task-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--primary);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast);
}

.add-task-btn:hover {
  background: var(--primary-dark);
}

/* Add Task Form */
.add-task-form {
  background: var(--surface-hover);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-5);
}

.task-input,
.task-select {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text-primary);
  font-size: var(--text-base);
  margin-bottom: var(--space-3);
  transition: border-color var(--transition-fast);
}

.task-input:focus,
.task-select:focus {
  outline: none;
  border-color: var(--primary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.form-actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-3);
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: none;
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-dark);
}

.btn-secondary {
  background: var(--surface);
  color: var(--text-secondary);
  border: 1px solid var(--border-light);
}

.btn-secondary:hover {
  background: var(--surface-hover);
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
  border-bottom: 1px solid var(--border-light);
}

.filter-tab {
  padding: var(--space-3) var(--space-4);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}

.filter-tab:hover {
  color: var(--text-primary);
}

.filter-tab.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

/* Tasks Container */
.tasks-container {
  max-height: 500px;
  overflow-y: auto;
}

.task-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-3);
  background: var(--surface-hover);
  border-left: 3px solid transparent;
  transition: background var(--transition-fast), transform var(--transition-fast);
}

.task-item:hover {
  background: var(--surface);
  transform: translateX(4px);
}

.task-item.priority-high {
  border-left-color: #ef4444;
}

.task-item.priority-medium {
  border-left-color: #f59e0b;
}

.task-item.priority-low {
  border-left-color: #10b981;
}

.task-item.completed {
  opacity: 0.6;
}

.task-item.completed .task-name {
  text-decoration: line-through;
  color: var(--text-secondary);
}

/* Custom Checkbox */
.task-checkbox {
  position: relative;
  flex-shrink: 0;
}

.task-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  opacity: 0;
  position: absolute;
  cursor: pointer;
}

.task-checkbox label {
  display: block;
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-sm);
  cursor: pointer;
  position: relative;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.task-checkbox input[type="checkbox"]:checked + label {
  background: var(--primary);
  border-color: var(--primary);
}

.task-checkbox input[type="checkbox"]:checked + label::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 5px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* Task Details */
.task-details {
  flex: 1;
  min-width: 0;
}

.task-name {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-2) 0;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  font-size: var(--text-sm);
}

.task-category,
.task-priority,
.task-due-date {
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text-secondary);
}

.task-priority {
  text-transform: capitalize;
}

/* Delete Button */
.delete-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.delete-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--text-secondary);
}

.empty-state svg {
  margin-bottom: var(--space-4);
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: var(--text-base);
}

/* Scrollbar Styling */
.tasks-container::-webkit-scrollbar {
  width: 6px;
}

.tasks-container::-webkit-scrollbar-track {
  background: transparent;
}

.tasks-container::-webkit-scrollbar-thumb {
  background: var(--border-light);
  border-radius: 3px;
}

.tasks-container::-webkit-scrollbar-thumb:hover {
  background: var(--text-disabled);
}
</style>