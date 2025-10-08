<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const worlds = ref<any[]>([])
const newWorldName = ref('')
const newWorldDesc = ref('')
const loading = ref(false)
const creating = ref(false)
const error = ref<string | null>(null)

const router = useRouter()

async function loadWorlds() {
  loading.value = true
  error.value = null

  const { data, error: err } = await supabase
    .from('worlds')
    .select('*')
    .order('created_at', { ascending: false })

  if (err) {
    error.value = 'Failed to load worlds: ' + err.message
  } else {
    worlds.value = data || []
  }

  loading.value = false
}

async function createWorld() {
  if (!newWorldName.value.trim()) return

  creating.value = true
  error.value = null

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    error.value = 'You must be logged in to create a world.'
    creating.value = false
    return
  }

  const { error: dbError } = await supabase
    .from('worlds')
    .insert({
      user_id: user.id,
      name: newWorldName.value.trim(),
      description: newWorldDesc.value.trim(),
      is_public: false,
    })

  if (dbError) {
    error.value = 'Failed to create world: ' + dbError.message
  } else {
    newWorldName.value = ''
    newWorldDesc.value = ''
    await loadWorlds()
  }

  creating.value = false
}

function goToWorld(worldId: string) {
  router.push(`/world/${worldId}`)
}

onMounted(() => {
  loadWorlds()
})
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">Your Worlds</h1>

    <div class="mb-8 p-4 border border-gray-200 rounded-lg bg-white">
      <h2 class="text-lg font-semibold mb-3">Create a New World</h2>
      <div class="space-y-3">
        <input
          v-model="newWorldName"
          type="text"
          placeholder="World name (e.g. Eldoria)"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          :disabled="creating"
        />
        <textarea
          v-model="newWorldDesc"
          placeholder="Description (optional)"
          rows="2"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          :disabled="creating"
        ></textarea>
        <button
          @click="createWorld"
          :disabled="!newWorldName.trim() || creating"
          class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ creating ? 'Creating...' : 'Create World' }}
        </button>
        <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
      </div>
    </div>

    <div v-if="loading" class="text-center py-8">Loading your worlds...</div>

    <div v-else-if="worlds.length === 0" class="text-center py-8 text-gray-500">
      You don’t have any worlds yet. Create your first one above!
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="world in worlds"
        :key="world.id"
        class="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-sm cursor-pointer transition"
        @click="goToWorld(world.id)"
      >
        <h3 class="text-xl font-semibold">{{ world.name }}</h3>
        <p v-if="world.description" class="text-gray-600 mt-1">{{ world.description }}</p>
        <p class="text-xs text-gray-400 mt-2">
          Created {{ new Date(world.created_at).toLocaleDateString() }}
          <span v-if="world.is_public" class="ml-2 text-green-600">● Public</span>
        </p>
      </div>
    </div>
  </div>
</template>