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
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <h1 class="auth-title">
          {{ isSignUp ? 'Join FableHive' : 'Welcome Back' }}
        </h1>
        <p class="auth-subtitle">
          {{ isSignUp ? 'Create your world for free' : 'Sign in to continue' }}
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <label for="email" class="form-label">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="form-input"
            placeholder="you@example.com"
          />
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            minlength="6"
            class="form-input"
            placeholder="••••••••"
          />
        </div>

        <div v-if="message" class="alert error">
          {{ message }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="btn btn-primary btn-block"
        >
          {{ loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In') }}
        </button>
      </form>

      <div class="auth-footer">
        <button
          @click="isSignUp = !isSignUp"
          class="btn-link"
        >
          {{ isSignUp ? '← Already have an account? Sign in' : "Don't have an account? Create one" }}
        </button>
      </div>

      <div class="auth-note">
        FableHive is free forever. No paywalls. No ads. Just your world.
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9fafb;
  padding: 1.5rem;
}

.auth-card {
  width: 100%;
  max-width: 480px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 2.5rem;
  border: 1px solid #e5e7eb;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-title {
  font-size: 1.875rem; /* 30px */
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.auth-subtitle {
  font-size: 1rem;
  color: #6b7280;
}

.auth-form {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.form-input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

.alert {
  padding: 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  margin-bottom: 1.25rem;
}
.error {
  background-color: #fee;
  color: #c00;
  border: 1px solid #fcc;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  border: none;
  border-radius: 12px;
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
  width: 100%;
  padding: 0.875rem;
  font-size: 1rem;
}
.btn-primary:hover:not(:disabled) {
  background-color: #4338ca;
}

.btn-link {
  background: none;
  border: none;
  color: #4f46e5;
  font-size: 0.9375rem;
  font-weight: 500;
  padding: 0;
  text-align: center;
}
.btn-link:hover {
  color: #4338ca;
  text-decoration: underline;
}

.auth-footer {
  margin-bottom: 1.5rem;
}

.auth-note {
  text-align: center;
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 1.5rem;
}
</style>