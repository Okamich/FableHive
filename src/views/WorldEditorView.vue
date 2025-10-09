<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

const route = useRoute()
const router = useRouter()
const worldId = route.params.id as string

// Состояние данных
const articles = ref<any[]>([])
const selectedArticle = ref<any>(null)
const worldName = ref('')
const loading = ref(false)
const errorMsg = ref<string | null>(null)

// Состояние модального окна
const showModal = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const articleId = ref<string | null>(null)
const newArticleTitle = ref('')
const newArticleContent = ref('')
const creating = ref(false)

// Настройка Markdown-рендера
const md = new MarkdownIt({
  html: false,
  linkify: true,
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`
      } catch (e) {}
    }
    return `<pre class="hljs"><code>${escapeHtml(str)}</code></pre>`
  }
})

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '<',
    '>': '>',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (s) => map[s]!)
}

// Загрузка данных мира и статей
async function loadWorldData() {
  loading.value = true
  errorMsg.value = null

  const {  data, error: worldErr } = await supabase
    .from('worlds')
    .select('name')
    .eq('id', worldId)
    .single()

  if (worldErr) {
    errorMsg.value = 'World not found or access denied.'
    loading.value = false
    return
  }
  worldName.value = data.name

  const {  data: articlesData, error: artErr } = await supabase
    .from('articles')
    .select('*')
    .eq('world_id', worldId)
    .order('created_at', { ascending: false })

  if (artErr) {
    errorMsg.value = 'Failed to load articles: ' + artErr.message
  } else {
    articles.value = articlesData || []
    if (articlesData && articlesData.length > 0) {
      selectedArticle.value = articlesData[0]
    }
  }

  loading.value = false
}

// Открыть модальное окно создания
function openCreateModal() {
  modalMode.value = 'create'
  articleId.value = null
  newArticleTitle.value = ''
  newArticleContent.value = ''
  showModal.value = true
}

// Открыть модальное окно редактирования
function openEditModal(article: any) {
  modalMode.value = 'edit'
  articleId.value = article.id
  newArticleTitle.value = article.title
  newArticleContent.value = article.content
  showModal.value = true
}

// Сохранение статьи (создание или обновление)
async function saveArticle() {
  if (!newArticleTitle.value.trim()) return

  creating.value = true
  errorMsg.value = null

  const {  data, error: authError } = await supabase.auth.getUser()
  if (authError || !data?.user) {
    errorMsg.value = 'You must be logged in.'
    creating.value = false
    return
  }

  if (modalMode.value === 'create') {
    const { error: dbError } = await supabase
      .from('articles')
      .insert({
        world_id: worldId,
        title: newArticleTitle.value.trim(),
        content: newArticleContent.value.trim(),
      })
    if (dbError) {
      errorMsg.value = 'Failed to create article: ' + dbError.message
    }
  } else if (modalMode.value === 'edit' && articleId.value) {
    const { error: dbError } = await supabase
      .from('articles')
      .update({
        title: newArticleTitle.value.trim(),
        content: newArticleContent.value.trim(),
      })
      .eq('id', articleId.value)
    if (dbError) {
      errorMsg.value = 'Failed to update article: ' + dbError.message
    }
  }

  if (!errorMsg.value) {
    showModal.value = false
    await loadWorldData()
  }

  creating.value = false
}

// Удаление статьи
async function deleteArticle(articleId: string) {
  if (!confirm('Are you sure you want to delete this article?')) return

  const { error } = await supabase
    .from('articles')
    .delete()
    .eq('id', articleId)

  if (error) {
    errorMsg.value = 'Failed to delete article: ' + error.message
  } else {
    await loadWorldData()
    if (selectedArticle.value?.id === articleId) {
      selectedArticle.value = articles.value.length > 0 ? articles.value[0] : null
    }
  }
}

// Выбор статьи
function selectArticle(article: any) {
  selectedArticle.value = article
}

// Назад к списку миров
function goBack() {
  router.push('/worlds')
}

// Закрытие модального окна
function closeModal() {
  showModal.value = false
  errorMsg.value = null
}

onMounted(() => {
  loadWorldData()
})
</script>

<template>
  <div class="editor-page">
    <div class="container">
      <div class="page-header">
        <button class="btn-back" @click="goBack">← Back to Worlds</button>
        <h1 class="page-title">{{ worldName || 'Loading...' }}</h1>
      </div>

      <div v-if="loading" class="loading">Loading articles...</div>

      <div v-else-if="errorMsg" class="alert error">{{ errorMsg }}</div>

      <div v-else class="editor-layout">
        <!-- Панель статей слева -->
        <div class="articles-panel">
          <div class="panel-header">
            <h2>Articles</h2>
            <button class="btn-add" @click="openCreateModal">+</button>
          </div>
          <div class="articles-list">
            <div
              v-for="article in articles"
              :key="article.id"
              class="article-item"
              :class="{ active: selectedArticle?.id === article.id }"
              @click="selectArticle(article)"
            >
              <h3 class="article-title">{{ article.title }}</h3>
              <p class="article-preview">
                {{ article.content.substring(0, 80) }}{{ article.content.length > 80 ? '…' : '' }}
              </p>
              <p class="article-date">
                {{ new Date(article.created_at).toLocaleDateString() }}
              </p>

              <!-- Кнопки Edit/Delete только у активной статьи -->
              <div v-if="selectedArticle?.id === article.id" class="article-actions">
                <button class="btn-action btn-edit" @click.stop="openEditModal(article)">Edit</button>
                <button class="btn-action btn-delete" @click.stop="deleteArticle(article.id)">Delete</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Панель предпросмотра справа -->
        <div class="preview-panel">
          <div v-if="selectedArticle" class="preview-content">
            <h2 class="preview-title">{{ selectedArticle.title }}</h2>
            <div class="preview-body" v-html="md.render(selectedArticle.content)" />
          </div>
          <div v-else class="preview-empty">
            <p>Select an article to preview</p>
          </div>
        </div>
      </div>

      <!-- Плавающая кнопка создания -->
      <button class="floating-btn" @click="openCreateModal" aria-label="Create new article">
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

          <h2 class="modal-title">{{ modalMode === 'create' ? 'Create New Article' : 'Edit Article' }}</h2>

          <div class="form-group">
            <label class="form-label">Title</label>
            <input
              v-model="newArticleTitle"
              type="text"
              class="form-input"
              placeholder="Article title"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Content (Markdown)</label>
            <textarea
              v-model="newArticleContent"
              rows="10"
              class="form-input"
              placeholder="Write in Markdown..."
            ></textarea>
          </div>

          <div v-if="errorMsg" class="alert error">{{ errorMsg }}</div>

          <div class="modal-actions">
            <button class="btn btn-secondary" @click="closeModal">Cancel</button>
            <button
              class="btn btn-primary"
              @click="saveArticle"
              :disabled="!newArticleTitle.trim() || creating"
            >
              {{ creating ? 'Saving...' : (modalMode === 'create' ? 'Create' : 'Save') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-page {
  background-color: #f9fafb;
  min-height: 100vh;
  padding: 1.5rem 1rem;
}

.container {
  max-width: 80rem;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.5rem;
}

.btn-back {
  background: none;
  border: none;
  color: #4f46e5;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 1rem;
  font-size: 1rem;
}
.btn-back:hover {
  color: #4338ca;
  text-decoration: underline;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
}

.loading,
.alert {
  padding: 1rem;
  text-align: center;
}
.alert {
  border-radius: 8px;
  margin-bottom: 1.5rem;
}
.error {
  background-color: #fee;
  color: #c00;
  border: 1px solid #fcc;
}

/* Основной макет: статьи слева, предпросмотр справа */
.editor-layout {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.articles-panel {
  flex: 1;
  min-width: 300px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.panel-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.btn-add {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: #4f46e5;
  color: white;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-add:hover {
  background-color: #4338ca;
}

.articles-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.article-item {
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.article-item:hover {
  border-color: #c7d2fe;
}
.article-item.active {
  border-color: #4f46e5;
  background-color: #f0f5ff;
}

.article-title {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
  font-size: 1rem;
}

.article-preview {
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.article-date {
  font-size: 0.75rem;
  color: #9ca3af;
}

/* Кнопки действий под активной статьёй */
.article-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

.btn-action {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-edit {
  background-color: #dbeafe;
  color: #2563eb;
}
.btn-edit:hover:not(:disabled) {
  background-color: #bfdbfe;
}

.btn-delete {
  background-color: #fee2e2;
  color: #dc2626;
}
.btn-delete:hover:not(:disabled) {
  background-color: #fecaca;
}

/* Панель предпросмотра */
.preview-panel {
  flex: 2;
  min-width: 300px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  overflow-y: auto;
  max-height: 70vh;
}

.preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
  font-style: italic;
}

.preview-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.preview-body {
  line-height: 1.6;
  color: #374151;
}
.preview-body h1,
.preview-body h2,
.preview-body h3 {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
}
.preview-body p {
  margin-bottom: 1rem;
}
.preview-body pre {
  background: #f8f8f8;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
}
.preview-body code {
  font-family: ui-monospace, monospace;
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
  max-width: 32rem;
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
  min-height: 12rem;
  font-family: ui-monospace, monospace;
  font-size: 0.875rem;
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