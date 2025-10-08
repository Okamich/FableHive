<script setup lang="ts">
import { ref, watch } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

// Функция экранирования HTML
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (s) => map[s]!)
}

// Настройка markdown-it
const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight: (str: string, lang?: string): string => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`
      } catch (e) {
        // fallback
      }
    }
    return `<pre class="hljs"><code>${escapeHtml(str)}</code></pre>`
  }
})

const props = defineProps<{
  modelValue: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const previewHtml = ref('')

watch(() => props.modelValue, (val) => {
  previewHtml.value = md.render(val || '')
}, { immediate: true })
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <div>
      <textarea
        :value="modelValue"
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        :disabled="disabled"
        class="w-full h-80 p-3 font-mono text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        placeholder="Write in Markdown...
## Example

- Use **bold** and *italic*
- Create lists
- Add code blocks:

```js
console.log('Hello, FableHive!')
```"
      ></textarea>
    </div>
    <div>
      <div
        class="w-full h-80 p-3 bg-white border border-gray-300 rounded-md overflow-y-auto prose prose-sm max-w-none"
        v-html="previewHtml"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.hljs {
  background: #f8f8f8;
  padding: 0.5em;
  border-radius: 0.3em;
}
</style>