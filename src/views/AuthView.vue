<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const email = ref('')
const password = ref('')
const loading = ref(false)
const message = ref('')
const isSignUp = ref(false)

const router = useRouter()

async function handleSubmit() {
  if (!email.value || !password.value) {
    message.value = 'Email and password are required.'
    return
  }

  loading.value = true
  message.value = ''

  try {
    let result
    if (isSignUp.value) {
      result = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
      })
    } else {
      result = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })
    }

    if (result.error) throw result.error

    await router.push('/worlds')
  } catch (err: any) {
    message.value = err.message || 'An error occurred.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
      <h1 class="text-2xl font-bold text-center mb-6">
        {{ isSignUp ? 'Create Account' : 'Sign In' }}
      </h1>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            minlength="6"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <p v-if="message" class="text-sm text-red-600">{{ message }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {{ loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In') }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <button
          @click="isSignUp = !isSignUp"
          class="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
        >
          {{ isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up" }}
        </button>
      </div>

      <div class="mt-6 text-center text-xs text-gray-500">
        FableHive is free forever. No paywalls. Ever.
      </div>
    </div>
  </div>
</template>