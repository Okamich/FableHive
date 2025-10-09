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
  <div class="p-4 sm:p-6 max-w-7xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">Your Worlds</h1>

    <!-- Плитка миров -->
    <div v-if="loading" class="text-center py-12">Loading your worlds...</div>

    <div v-else-if="worlds.length === 0" class="text-center py-12 text-gray-500">
      <p class="mb-4">You don’t have any worlds yet.</p>
      <button
        @click="openModal"
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
      >
        Create Your First World
      </button>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      <div
        v-for="world in worlds"
        :key="world.id"
        class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition cursor-pointer w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.33%-1rem)] xl:w-[calc(25%-1rem)]"
        @click="goToWorld(world.id)"
      >
        <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ world.name }}</h3>
        <p v-if="world.description" class="text-gray-600 text-sm line-clamp-3 mb-3">
          {{ world.description }}
        </p>
        <p class="text-xs text-gray-400">
          Created {{ new Date(world.created_at).toLocaleDateString() }}
        </p>
      </div>
    </div>

    <!-- Плавающая кнопка -->
    <button
      @click="openModal"
      class="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg hover:bg-indigo-700 transition z-10"
      aria-label="Create new world"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    </button>

    <!-- Модальное окно -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl w-full max-w-md p-6 relative">
        <button
          @click="closeModal"
          class="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 class="text-xl font-bold mb-4">Create New World</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">World Name</label>
            <input
              v-model="newWorldName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Eldoria, Aetheria, etc."
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea
              v-model="newWorldDesc"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="A brief overview of your world..."
            ></textarea>
          </div>

          <p v-if="errorMsg" class="text-red-600 text-sm bg-red-50 p-2 rounded">{{ errorMsg }}</p>

          <div class="flex justify-end space-x-3 pt-2">
            <button
              @click="closeModal"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              @click="createWorld"
              :disabled="!newWorldName.trim() || creating"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
            >
              {{ creating ? 'Creating...' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>