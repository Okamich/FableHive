<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

// Состояние данных
const worlds = ref<any[]>([])
const loading = ref(false)
const errorMsg = ref<string | null>(null)

// Состояние модального окна
const showModal = ref(false)
const newWorldName = ref('')
const newWorldDesc = ref('')
const creating = ref(false)

const router = useRouter()

// Загрузка миров
async function loadWorlds() {
  loading.value = true
  errorMsg.value = null

  const { data, error } = await supabase
    .from('worlds')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    errorMsg.value = 'Failed to load worlds: ' + error.message
  } else {
    worlds.value = data || []
  }

  loading.value = false
}

// Создание мира
async function createWorld() {
  if (!newWorldName.value.trim()) return

  creating.value = true
  errorMsg.value = null

  const {  data, error: authError } = await supabase.auth.getUser()
  if (authError || !data?.user) {
    errorMsg.value = 'You must be logged in to create a world.'
    creating.value = false
    return
  }

  const { error: dbError } = await supabase
    .from('worlds')
    .insert({
      user_id: data.user.id,
      name: newWorldName.value.trim(),
      description: newWorldDesc.value.trim(),
      is_public: false,
    })

  if (dbError) {
    errorMsg.value = 'Failed to create world: ' + dbError.message
  } else {
    newWorldName.value = ''
    newWorldDesc.value = ''
    showModal.value = false
    await loadWorlds()
  }

  creating.value = false
}

// Переход в редактор
function goToWorld(worldId: string) {
  router.push(`/world/${worldId}`)
}

// Открыть/закрыть модалку
function openModal() {
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  newWorldName.value = ''
  newWorldDesc.value = ''
  errorMsg.value = null
}

onMounted(() => {
  loadWorlds()
})
</script>

<template>
  <div class="worlds-page">
    <div class="container">
      <h1 class="page-title">Your Worlds</h1>

      <div v-if="loading" class="loading">
        Loading your worlds...
      </div>

      <div v-else-if="worlds.length === 0" class="empty-state">
        <p>You don’t have any worlds yet.</p>
        <button class="btn btn-primary" @click="openModal">
          Create Your First World
        </button>
      </div>

      <div v-else class="worlds-grid">
        <div
          v-for="world in worlds"
          :key="world.id"
          class="world-card"
          @click="goToWorld(world.id)"
        >
          <h3 class="world-title">{{ world.name }}</h3>
          <p v-if="world.description" class="world-desc">
            {{ world.description }}
          </p>
          <p class="world-meta">
            Created {{ new Date(world.created_at).toLocaleDateString() }}
          </p>
        </div>
      </div>

      <!-- Плавающая кнопка -->
      <button class="floating-btn" @click="openModal" aria-label="Create new world">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      <!-- Модальное окно -->
      <div v-if="showModal" class="modal-overlay" @click="closeModal">
        <div class="modal" @click.stop>
          <button class="modal-close" @click="closeModal" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h2 class="modal-title">Create New World</h2>

          <div class="form-group">
            <label class="form-label">World Name</label>
            <input
              v-model="newWorldName"
              type="text"
              class="form-input"
              placeholder="Eldoria, Aetheria, etc."
            />
          </div>

          <div class="form-group">
            <label class="form-label">Description (optional)</label>
            <textarea
              v-model="newWorldDesc"
              rows="3"
              class="form-input"
              placeholder="A brief overview of your world..."
            ></textarea>
          </div>

          <div v-if="errorMsg" class="alert error">{{ errorMsg }}</div>

          <div class="modal-actions">
            <button class="btn btn-secondary" @click="closeModal">Cancel</button>
            <button
              class="btn btn-primary"
              @click="createWorld"
              :disabled="!newWorldName.trim() || creating"
            >
              {{ creating ? 'Creating...' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.worlds-page {
  padding: 1.5rem 1rem;
  min-height: 100vh;
  background-color: #f9fafb;
}

.container {
  max-width: 80rem;
  margin: 0 auto;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

.loading,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.empty-state .btn {
  margin-top: 1.5rem;
}

/* Сетка миров */
.worlds-grid {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: repeat(1, 1fr);
}
@media (min-width: 640px) {
  .worlds-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (min-width: 1024px) {
  .worlds-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (min-width: 1280px) {
  .worlds-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Карточка мира */
.world-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.world-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.world-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.world-desc {
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.world-meta {
  font-size: 0.75rem;
  color: #9ca3af;
}

/* Плавающая кнопка */
.floating-btn {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background-color: #4f46e5;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  z-index: 10;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s;
}
.floating-btn:hover {
  background-color: #4338ca;
}

/* Модальное окно */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 28rem;
  padding: 1.5rem;
  position: relative;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-close:hover {
  color: #4b5563;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.25rem;
  color: #1f2937;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}
.form-input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

textarea.form-input {
  resize: vertical;
  min-height: 6rem;
}

.alert {
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}
.error {
  background-color: #fee;
  color: #c00;
  border: 1px solid #fcc;
}

/* Кнопки */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  padding: 0.625rem 1rem;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #4f46e5;
  color: white;
}
.btn-primary:hover:not(:disabled) {
  background-color: #4338ca;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
}
.btn-secondary:hover:not(:disabled) {
  background-color: #e5e7eb;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}
</style>