<template>
  <div class="calendar-page">
    <div class="calendar-shell">
      <CanvasComponent>
        <div class="calendar-canvas-content embed-active" v-if="!!embeddedUrl">
          <div class="calendar-embed-layout">
            <!-- Calendar and Controls (left) -->
            <div class="calendar-embed-column" :class="{ 'with-form': showCreateForm }">
              <iframe
                :src="embeddedUrl"
                class="calendar-iframe fullscreen"
                :class="{ 'theme-dark': embedTheme === 'dark' }"
                frameborder="0"
                allowfullscreen
                title="Google Calendar"
              ></iframe>
              <div class="calendar-buttons-row">
                <button
                  class="calendar-settings-btn"
                  @click="settingsExpanded = true"
                  v-if="!settingsExpanded"
                >
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" style="margin-right: 8px">
                    <path stroke="var(--text-tertiary)" stroke-width="2" d="M12 2v2M12 20v2M22 12h-2M4 12H2M19.07 4.93l-1.41 1.41M6.34 17.66l-1.41 1.41M19.07 19.07l-1.41-1.41M6.34 6.34L4.93 4.93"/>
                  </svg>
                  Settings
                </button>
                <transition name="fade">
                  <div v-if="settingsExpanded" class="calendar-settings-actions">
                    <button class="calendar-action-btn" @click="toggleEmbedTheme">
                      <span class="icon" v-if="embedTheme === 'light'">🌞</span>
                      <span class="icon" v-else>🌙</span>
                      Toggle Theme
                    </button>
                    <button class="calendar-action-btn remove" @click="removeCalendar" style="margin-left: var(--space-3)">
                      Remove Calendar
                    </button>
                    <button class="calendar-action-btn" @click="settingsExpanded = false">
                      Cancel
                    </button>
                  </div>
                </transition>
                <!-- BUTTON ROW: Only ONE shows at a time, always in this row -->
                <button
                  v-if="!isGoogleConnected && studentId"
                  class="calendar-settings-btn"
                  @click="connectGoogle"
                >
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" style="margin-right: 8px">
                    <path stroke="var(--text-tertiary)" stroke-width="2" d="M12 2v2M12 20v2M22 12h-2M4 12H2"/>
                  </svg>
                  Connect to your Google account
                </button>
                <button
                  v-else
                  class="calendar-settings-btn create-event-btn"
                  @click="toggleCreateForm"
                >
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" style="margin-right: 8px">
                    <path stroke="var(--text-tertiary)" stroke-width="2" d="M12 4v16M4 12h16"/>
                  </svg>
                  {{ showCreateForm ? 'Close Form' : 'Create Event' }}
                </button>
              </div>
            </div>
            <!-- Event Form Panel (right, pushes calendar left) -->
            <transition name="slide-fade">
              <div v-if="showCreateForm" class="event-form-sidepanel formal">
                <form class="event-form" @submit.prevent="addEvent">
                  <h2 class="event-form-title">Create New Event</h2>
                  <label class="event-label" for="event-title">Title</label>
                  <input id="event-title" v-model="newEvent.title" placeholder="Event Title" required />
                  <label class="event-label" for="event-description">Description</label>
                  <textarea
                    id="event-description"
                    v-model="newEvent.description"
                    placeholder="Description"
                    rows="2"
                  ></textarea>
                  <label class="event-label" for="event-start">Start Date and Time</label>
                  <input
                    id="event-start"
                    type="datetime-local"
                    v-model="newEvent.start"
                    required
                  />
                  <label class="event-label" for="event-end">End Date and Time</label>
                  <input
                    id="event-end"
                    type="datetime-local"
                    v-model="newEvent.end"
                    required
                  />
                  <div class="form-actions">
                    <button type="submit" class="calendar-settings-btn fullwidth">Create</button>
                  </div>
                </form>
                <div v-if="events.length" class="event-list-scroll">
                  <div v-for="event in events" :key="event.id" class="event-card">
                    <div class="event-card-header">
                      <span class="event-title">{{ event.title }}</span>
                      <button class="delete-btn" @click="deleteEvent(event.id)">✖</button>
                    </div>
                    <div class="event-card-details">
                      <span>{{ event.description }}</span>
                      <span>{{ formatDate(event.start) }} &ndash; {{ formatDate(event.end) }}</span>
                    </div>
                  </div>
                </div>
                <button v-if="canSync" class="calendar-settings-btn" :disabled="isSyncing" @click="syncEvents" > Sync To Google</button>
              </div>
            </transition>
          </div>
        </div>
        <!-- Fallback: Not embedded yet -->
        <div class="calendar-non-embed-center" v-if="!embeddedUrl">
          <h1 class="calendar-title">Google Calendar Embed Area</h1>
          <p class="calendar-desc">Your calendar will appear here once integrated</p>
          <div v-if="!formActive" class="center-row">
            <button class="calendar-btn" @click="formActive = true">Connect Calendar</button>
          </div>
          <form v-else class="calendar-form" @submit.prevent="handleSubmit">
            <div class="guide-step">
              <span class="step-num">Step 1:</span>
              <span class="step-desc">Go to your Google Calendar settings.</span>
            </div>
            <div class="guide-step">
              <span class="step-num">Step 2:</span>
              <span class="step-desc">Find "Integrate calendar" & copy the Embed code link (URL).</span>
            </div>
            <div class="guide-step">
              <span class="step-num">Step 3:</span>
              <span class="step-desc">Paste the URL below:</span>
            </div>
            <input
              type="text"
              v-model="calendarUrl"
              class="calendar-url-input"
              :placeholder="'Paste your calendar embed link here...'"
              required
            />
            <button type="submit" class="calendar-btn" style="margin-top: var(--space-4)">
              Submit
            </button>
            <button type="button" class="calendar-btn secondary" style="margin-top: var(--space-2)" @click="formActive = false">
              Cancel
            </button>
            <span v-if="error" class="calendar-error">{{ error }}</span>
          </form>
        </div>
      </CanvasComponent>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import CanvasComponent from '@/components/CanvasComponent.vue'
import { GoogleCalendarAPI } from "@endpoints/google.calendar"
import { useToast } from "vue-toastification"

const toast = useToast()

// --- State ---
const formActive = ref(false)
const calendarUrl = ref('')
const error = ref('')
const embeddedUrl = ref('')
const embedTheme = ref('light')
const settingsExpanded = ref(false)
const LOCAL_KEY = 'studywell_calendar_embed_url'
const THEME_KEY = 'studywell_calendar_embed_theme'

// --- Event Staging Area ---
const showCreateForm = ref(false)
const events = ref([]) // Staging list, before backend sync
const newEvent = ref({ title: '', description: '', start: '', end: '' })
const isSyncing = ref(false)
const syncAttempts = ref(0)

const studentId = ref(null)
const isGoogleConnected = ref(false)

// --- Auth + Google status fetchers ---
async function fetchStudentId() {
  try {
    console.log("[fetchStudentId] Requesting /v1/auth/me");
    const response = await fetch('http://localhost:3000/v1/auth/me', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('userToken') },
      credentials: 'include'
    })
    if (!response.ok) throw new Error("Login required: " + response.status)
    const data = await response.json()
    studentId.value = data.id
    console.log("[auth/me] Got studentId and user data:", data)
    toast.success("Authenticated as: " + data.email)
    await checkGoogleStatus(data.id)
  } catch (err) {
    console.error("[fetchStudentId] Failed to fetch student info:", err)
    toast.error("Unable to authenticate user. Please login again.")
  }
}

async function checkGoogleStatus(sid) {
  try {
    console.log(`[checkGoogleStatus] Checking /v1/google/status for studentId=${sid}`);
    const resp = await fetch(
      `http://localhost:3000/v1/google/status?studentId=${encodeURIComponent(sid)}`,
      {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('userToken') },
        credentials: 'include'
      }
    )
    const data = await resp.json()
    if (data.ok && data.linked) {
      isGoogleConnected.value = true
      toast.success("Your account is connected to Google Calendar!")
    } else {
      isGoogleConnected.value = false
      toast.info("You are NOT connected to Google Calendar.")
    }
    console.log("[google/status] Response:", data)
  } catch (err) {
    isGoogleConnected.value = false
    toast.warning("Could not check Google connection status.")
    console.error("Failed to check Google connection", err)
  }
}

onMounted(() => {
  const saved = window.localStorage.getItem(LOCAL_KEY)
  if (saved) embeddedUrl.value = saved
  const themeSaved = window.localStorage.getItem(THEME_KEY)
  embedTheme.value = themeSaved === 'dark' ? 'dark' : 'light'
  fetchStudentId()
  console.log("[mount] initial embeddedUrl", embeddedUrl.value)
})

// --- Persist settings ---
watch(embeddedUrl, (val) => {
  if (val) {
    window.localStorage.setItem(LOCAL_KEY, val)
  } else {
    window.localStorage.removeItem(LOCAL_KEY)
  }
  console.log("[watch] embeddedUrl changed:", val)
})
watch(embedTheme, (val) => {
  window.localStorage.setItem(THEME_KEY, val)
  console.log("[watch] theme changed:", val)
})

// --- UI helper functions ---
function validate(url) {
  return url.startsWith('https://') && url.includes('calendar.google.com')
}
function handleSubmit() {
  console.log("[handleSubmit] Calendar link submitted:", calendarUrl.value)
  if (!validate(calendarUrl.value)) {
    error.value = 'Please enter a valid Google Calendar embed link'
    return
  }
  embeddedUrl.value =
    calendarUrl.value + (calendarUrl.value.includes('?') ? '&mode=WEEK' : '?mode=WEEK')
  error.value = ''
  formActive.value = false
  console.log("[handleSubmit] Embedded calendar set", embeddedUrl.value)
}
function removeCalendar() {
  embeddedUrl.value = ''
  calendarUrl.value = ''
  error.value = ''
  formActive.value = false
  settingsExpanded.value = false
  console.log("[removeCalendar] Calendar removed")
}
function toggleEmbedTheme() {
  embedTheme.value = embedTheme.value === 'light' ? 'dark' : 'light'
  console.log("[toggleEmbedTheme] Theme toggled to", embedTheme.value)
}

// Only allow if both authenticated AND google connected
function toggleCreateForm() {
  console.log('[toggleCreateForm] Trying to open form; user:', studentId.value, 'googleConnected:', isGoogleConnected.value)
  if (!studentId.value) {
    toast.error("You must be authenticated to create events!")
    console.error("Attempted to open event form without authentication.")
    return
  }
  if (!isGoogleConnected.value) {
    toast.error("You must connect your Google Calendar to add events!")
    console.error("Attempted to open event form without Google connection.")
    return
  }
  showCreateForm.value = !showCreateForm.value
  console.log("[toggleCreateForm] State is now:", showCreateForm.value)
}

function addEvent() {
  const event = {
    ...newEvent.value,
    id: Date.now()
  }
  console.log("[addEvent] New event payload:", event)
  events.value.unshift(event)
  newEvent.value = { title: '', description: '', start: '', end: '' }
}
function deleteEvent(id) {
  events.value = events.value.filter(ev => ev.id !== id)
  console.log("[deleteEvent] After delete, remaining events:", events.value)
}
function formatDate(dt) {
  if (!dt) return ''
  try {
    const d = new Date(dt)
    return d.toLocaleString()
  } catch {
    return dt
  }
}

const canSync = computed(() => events.value.length > 0 && !!studentId.value && isGoogleConnected.value)

async function syncEvents() {
if (!canSync.value) {
console.log("[syncEvents] Cannot sync: canSync is false");
return;
}
isSyncing.value = true;
try {
syncAttempts.value += 1;

// Build payload
const eventPayloads = events.value
.map((e) => {
const startsAt = new Date(e.start);
const endsAt = new Date(e.end);
if (!e?.title || Number.isNaN(startsAt.valueOf()) || Number.isNaN(endsAt.valueOf())) {
console.warn("[syncEvents][Filter] Invalid event data (missing title or bad dates):", e);
return null;
}
if (endsAt <= startsAt) {
console.warn("[syncEvents][Filter] Event end date is before or same as start:", e);
return null;
}

return {
title: e.title,
startsAt: startsAt.toISOString(),
endsAt: endsAt.toISOString(),
location: e.location || undefined,
category: e.category || undefined,
notes: e.notes ?? e.description ?? undefined,
// DO NOT send recurrence unless backend schema allows it
};
})
.filter(Boolean);

if (!eventPayloads.length) {
console.error("[syncEvents] No valid events to sync");
throw new Error("No valid events to sync");
}

const token = localStorage.getItem("userToken"); // <-- same key as login
if (!token) {
console.error("[syncEvents] Not authenticated: missing JWT token");
throw new Error("Not authenticated: missing JWT token");
}

// POST each event to backend
for (const ev of eventPayloads) {
console.log("[syncEvents] Sending event to backend:", ev);

const dbRes = await fetch("http://localhost:3000/v1/calendar/events", {
method: "POST",
headers: {
"Content-Type": "application/json",
Authorization: `Bearer ${token}`,
},
body: JSON.stringify(ev),
});

// Try to parse JSON if possible
let dbData = null;
const text = await dbRes.text();
try {
dbData = text ? JSON.parse(text) : null;
} catch {
console.warn("[syncEvents] Non-JSON response from backend:", text);
dbData = { error: text || "Non-JSON response" };
}

if (!dbRes.ok || (dbData && dbData.error)) {
console.error("[syncEvents] DB Error:", dbRes.status, dbData);
throw new Error(dbData?.error || `DB save failed for: ${ev.title}`);
}
}

const payload = { studentId: studentId.value, events: eventPayloads };
console.log("[syncEvents] Sending Google sync payload:", payload);

const res = await GoogleCalendarAPI.sync(payload);
const data = typeof res.json === "function" ? await res.json() : res;

if (data?.ok) {
if (typeof data.created === "number" && data.created > 0) {
console.log(`[syncEvents] Google Calendar created ${data.created} events`);
toast.success(`Events synced to Google Calendar! Google created: ${data.created}`);
events.value = [];
syncAttempts.value = 0;
} else {
console.info("[syncEvents] No events created in Google Calendar. Staged events remain.");
toast.success("Events synced to Google Calendar!");
}
} else {
console.error("[syncEvents] Google API returned not ok:", data);
throw new Error("Backend responded not ok");
}
} catch (err) {
console.error("[syncEvents] Sync failed:", err);
if (syncAttempts.value >= 3) {
console.error("[syncEvents] Sync failed >= 3 times, backend error.");
toast.error("Sync failed several times. Backend error — please contact support.");
} else {
console.warn("[syncEvents] Sync failed, will allow retry. Details:", err?.message || err);
toast.warning(`Sync failed. Please try again. Details: ${err?.message || err}`);
}
} finally {
console.log("[syncEvents] Sync flow completed, resetting isSyncing");
isSyncing.value = false;
}
}




function connectGoogle() {
  if (!studentId.value) {
    toast.error("You must be authenticated before connecting Google!");
    return;
  }
  const url = `http://localhost:3000/v1/google/auth?studentId=${encodeURIComponent(studentId.value)}`;
  console.log("[connectGoogle] Redirecting to:", url);
  window.location.href = url;
}

</script>




<style scoped>
.calendar-page {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--surface-hover);
  box-sizing: border-box;
}
.calendar-shell {
  width: 100vw;
  height: 90vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
.calendar-shell :deep(.canvas) {
  width: 95%;
  height: 95%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
.calendar-non-embed-center {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
}
.calendar-canvas-content {
  width: 100%;
  height: 100%;
  background: var(--surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  border: 1.5px solid var(--border-light);
  flex: 1 1 0;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  box-sizing: border-box;
  position: relative;
  padding: var(--space-6);
  overflow: hidden;
}
.calendar-canvas-content.embed-active {
  padding: 0;
  gap: 0;
  display: flex;
  flex-direction: column;
}
.center-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.calendar-title {
  font-size: 2.25rem;
  color: var(--text-primary);
  font-weight: var(--font-bold);
  margin-bottom: var(--space-2);
}
.calendar-desc {
  color: var(--text-tertiary);
  margin-bottom: var(--space-8);
  font-size: var(--text-base);
}
.calendar-form {
  width: 100%;
  max-width: 600px;
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--surface-hover);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}
.guide-step {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-base);
  margin-bottom: var(--space-1);
}
.step-num {
  font-weight: var(--font-bold);
  color: var(--primary);
}
.step-desc {
  color: var(--text-secondary);
}
.calendar-url-input {
  width: 100%;
  padding: var(--space-3);
  border: 1.5px solid var(--border-input);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  background: var(--surface);
  color: var(--text-primary);
  margin-top: var(--space-1);
  margin-bottom: var(--space-2);
  transition: all var(--transition-normal);
}
.calendar-url-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-lighter);
  outline: none;
}
.calendar-btn {
  padding: var(--space-3) var(--space-8);
  font-size: var(--text-base);
  background: var(--primary);
  color: var(--text-on-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: var(--font-semibold);
  transition: background var(--transition-normal);
  min-width: 140px;
}
.calendar-btn.secondary {
  background: var(--surface-hover);
  color: var(--text-primary);
  border: 1.5px solid var(--border-light);
}
.calendar-btn:hover {
  background: var(--primary-hover);
}
.calendar-error {
  color: var(--danger, #dc2626);
  font-size: var(--text-sm);
  margin-top: var(--space-2);
  text-align: left;
}

.calendar-embed-layout {
  display: flex;
  width: 100%;
  height: 100%;
  position: relative;
  box-sizing: border-box;
}

.calendar-embed-column {
  flex: 1 1 0;
  min-width: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: width 0.3s;
}
.calendar-embed-column.with-form {
  width: calc(100% - 390px);
}
.calendar-iframe.fullscreen {
  width: 100%;
  height: 100%;
  background: var(--surface);
  border-radius: var(--radius-xl);
  border: none;
  z-index: 0;
  position: relative;
  transition: filter 0.3s;
}
.calendar-iframe.fullscreen.theme-dark {
  filter: invert(1) brightness(1) contrast(1.1) hue-rotate(180deg);
}
.calendar-buttons-row {
  position: absolute;
  bottom: 12px;
  right: 12px;
  z-index: 10;
  width: auto;
  height: auto;
  display: flex;
  flex-direction: row;
  gap: 16px;
  background: transparent;
  pointer-events: auto;
}
.calendar-settings-btn {
  background: var(--surface-hover);
  color: var(--text-tertiary);
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  padding: 8px 18px;
  cursor: pointer;
  min-width: 160px;
  transition:
    background var(--transition-fast),
    color var(--transition-fast),
    border-color var(--transition-fast);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}
.create-event-btn {
  min-width: 160px;
}
.calendar-settings-btn.fullwidth,
.calendar-btn.fullwidth {
  width: 100%;
  justify-content: center;
}
.calendar-settings-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--space-3);
}
.calendar-action-btn {
  background: var(--surface-hover);
  color: var(--text-primary);
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  padding: 8px 18px;
  cursor: pointer;
  min-width: 140px;
  transition:
    background var(--transition-fast),
    color var(--transition-fast),
    border-color var(--transition-fast);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}
.calendar-action-btn:hover {
  background: var(--primary-light);
  color: var(--primary);
  border-color: var(--primary);
}
.calendar-action-btn.remove {
  background: #dc2626;
  color: #fff;
  border: none;
}
.calendar-action-btn.remove:hover {
  background: #be1b1b;
}
.event-form-sidepanel {
  width: 390px;
  height: 100%;
  background: var(--surface-hover);
  box-shadow: var(--shadow-lg);
  border-radius: var(--radius-xl) 0 0 var(--radius-xl);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  padding: 40px 24px 20px 24px;
  overflow-y: auto;
}
.event-form {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  width: 100%;
  gap: 0.5rem;
}
.event-form-title {
  font-size: 1.2rem;
  font-weight: var(--font-bold);
  margin-bottom: 0.8rem;
  text-align: left;
}
.event-label {
  font-size: 1rem;
  color: var(--text-primary);
  margin-bottom: 0.1rem;
  font-weight: 500;
}
.event-form input,
.event-form textarea {
  width: 100%;
  font-size: var(--text-base);
  padding: 10px 12px;
  margin-bottom: 14px;
  border: 1.5px solid var(--border-input);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text-primary);
  box-sizing: border-box;
}
.event-form textarea {
  resize: vertical;
  min-height: 36px;
  max-height: 96px;
}
.event-form input[type="datetime-local"] {
  font-family: inherit;
}
.form-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.event-list-scroll {
  margin-top: 32px;
  max-height: 255px;
  overflow-y: auto;
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 10px 10px 6px 10px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.event-card {
  background: var(--surface-hover);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: 13px 13px 5px 15px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
}
.event-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.event-title {
  font-weight: var(--font-bold);
  font-size: var(--text-base);
}
.delete-btn {
  background: #dc2626;
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 26px;
  height: 26px;
  font-size: 18px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.18s;
}
.delete-btn:hover {
  background: #be1b1b;
}
.event-card-details {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: 2px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(.51,.74,.31,1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(60px);
  opacity: 0;
}
</style>
