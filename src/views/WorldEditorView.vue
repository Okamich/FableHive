<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import MarkdownEditor from '@/components/MarkdownEditor.vue'

const route = useRoute()
const router = useRouter()
const worldId = route.params.id as string

const articles = ref<any[]>([])
const newArticleTitle = ref('')
const newArticleContent = ref('')
const loading = ref(false)
const creating = ref(false)
const error = ref<string | null>(null)
const worldName = ref('')

async function loadWorldData() {
  loading.value = true
  error.value = null

  const {  worldData, error: worldErr } = await supabase
    .from('worlds')
    .select('name')
    .eq('id', worldId)
    .single()

  if (worldErr) {
    error.value = 'World not found or access denied.'
    loading.value = false
    return
  }
  worldName.value = worldData.name

  const { data, error: artErr } = await supabase
    .from('articles')
    .select('*')
    .eq('world_id', worldId)
    .order('created_at', { ascending: false })

  if (artErr) {
    error.value = 'Failed to load articles: ' + artErr.message
  } else {
    articles.value = data || []
  }

  loading.value = false
}

async function createArticle() {
  if (!newArticleTitle.value.trim()) return

  creating.value = true
  error.value = null

  const {  { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    error.value = 'You must be logged in.'
    creating.value = false
    return
  }

  const { error: dbError } = await supabase
    .from('articles')
    .insert({
      world_id: worldId,
      title: newArticleTitle.value.trim(),
      content: newArticleContent.value.trim(),
    })

  if (dbError) {
    error.value = 'Failed to create article: ' + dbError.message
  } else {
    newArticleTitle.value = ''
    newArticleContent.value = ''
    await loadWorldData()
  }

  creating.value = false
}

function goBack() {
  router.push('/worlds')
}

onMounted(() => {
  loadWorldData()
})
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <button
      @click="goBack"
      class="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center"
    >
      ← Back to Worlds
    </button>

    <h1 class="text-2xl font-bold mb-2">{{ worldName || 'Loading...' }}</h1>
    <p class="text-gray-600 mb-6">Manage your world’s articles</p>

    <div class="mb-8 p-4 border border-gray-200 rounded-lg bg-white">
      <h2 class="text-lg font-semibold mb-3">Create New Article</h2>
      <div class="space-y-3">
        <input
          v-model="newArticleTitle"
          type="text"
          placeholder="Article title"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          :disabled="creating"
        />
        <MarkdownEditor v-model="newArticleContent" :disabled="creating" />
        <button
          @click="createArticle"
          :disabled="!newArticleTitle.trim() || creating"
          class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {{ creating ? 'Saving...' : 'Save Article' }}
        </button>
        <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
      </div>
    </div>

    <div v-if="loading" class="text-center py-8">Loading articles...</div>

    <div v-else-if="articles.length === 0" class="text-center py-8 text-gray-500">
      No articles yet. Create your first one!
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="article in articles"
        :key="article.id"
        class="p-4 border border-gray-200 rounded-lg bg-white"
      >
        <h3 class="text-xl font-semibold">{{ article.title }}</h3>
        <div
          class="text-gray-700 mt-2 prose prose-sm max-w-none"
          v-html="$options.filters?.markdownToHtml(article.content) || article.content"
        ></div>
        <p class="text-xs text-gray-400 mt-2">
          Created {{ new Date(article.created_at).toLocaleDateString() }}
        </p>
      </div>
    </div>
  </div>
</template>