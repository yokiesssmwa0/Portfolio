import './login.css'
import { mountStudio } from './studio.js'
import { createClient } from '@supabase/supabase-js'

const app = document.querySelector('#app')
const SUPABASE_SETTINGS_KEY = 'folio-foundry-supabase-settings-v1'

app.innerHTML = `
<main class="login-layout">
  <section class="brand-panel" aria-labelledby="brand-title">
    <header class="brand-header">
      <a class="wordmark" href="#" aria-label="Folio Foundry home"><span class="wordmark-icon">f.</span><span>folio<span class="wordmark-light">foundry</span></span></a>
      <span class="edition-tag">PORTFOLIO STUDIO <i></i></span>
    </header>

    <div class="brand-content">
      <div class="brand-copy">
        <span class="brand-kicker"><i></i> A LITTLE SPACE FOR YOUR BIG IDEAS</span>
        <h1 id="brand-title">Your work<br>deserves a<br><em>point of view.</em></h1>
        <p>Bring your experience, projects, and perspective together. Make a portfolio that feels like yours.</p>
      </div>

      <div class="portfolio-art" aria-label="A sample portfolio preview">
        <div class="art-back-sheet"><span>SELECTED WORK / 2025</span><div class="art-color-blocks"><i></i><i></i><i></i><i></i></div><strong>Made with<br>intention.</strong></div>
        <article class="art-front-sheet">
          <div class="art-profile"><span class="art-avatar">JL</span><span>JORDAN LEE<small>DESIGNER &amp; THINKER</small></span><i>↗</i></div>
          <div class="art-divider"></div>
          <span class="art-eyebrow">A LITTLE ABOUT ME</span>
          <h2>Ideas into<br><em>impact.</em></h2>
          <p>I make thoughtful digital experiences for a more human world.</p>
          <div class="art-footer"><span>01 / 03</span><span>PORTLAND, OR</span></div>
        </article>
        <span class="art-stamp">YOUR<br>STORY<br><b>✳</b></span>
        <span class="art-caption">A portfolio in progress</span>
      </div>
    </div>

    <footer class="brand-footer"><span>THREE TEMPLATES. ONE YOU.</span><span>BUILT FOR WHAT'S NEXT <i>↗</i></span></footer>
  </section>

  <section class="login-panel" aria-labelledby="login-title">
    <div class="mobile-wordmark"><a class="wordmark" href="#"><span class="wordmark-icon">f.</span><span>folio<span class="wordmark-light">foundry</span></span></a></div>
    <div class="login-form-wrap">
      <div class="form-intro"><span class="eyebrow">WELCOME BACK</span><h2 id="login-title">Sign in to your studio.</h2><p>Your next portfolio is just around the corner.</p></div>

      <form id="login-form" novalidate>
        <label class="form-field" for="email"><span>Email address</span><input id="email" name="email" type="email" pattern="[^0-9]*" title="Email addresses cannot contain numbers." autocomplete="username" placeholder="you@example.com" required></label>
        <label class="form-field" for="password"><span>Password</span><span class="password-wrap"><input id="password" name="password" type="password" autocomplete="current-password" placeholder="Enter your password" minlength="8" required><button class="password-toggle" id="password-toggle" type="button" aria-label="Show password" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg></button></span></label>

        <div class="form-options"><label class="remember-option"><input type="checkbox" name="remember"><span>Keep me signed in</span></label><button class="text-action" id="forgot-password" type="button">Forgot password?</button></div>
        <details class="database-setup" id="database-setup">
          <summary>Connect an online database</summary>
          <p>Use your Supabase project URL and publishable (anon) key. Your password is handled by Supabase and is never saved here.</p>
          <label class="form-field" for="project-url"><span>Supabase project URL</span><input id="project-url" type="url" placeholder="https://your-project.supabase.co" autocomplete="url"></label>
          <label class="form-field" for="project-key"><span>Publishable / anon key</span><input id="project-key" type="password" placeholder="sb_publishable_…" autocomplete="off"></label>
          <button class="save-database-button" id="save-database" type="button">Save database settings</button>
          <small>Run <code>supabase/schema.sql</code> in your project’s SQL editor first.</small>
        </details>
        <p class="demo-auth-note">No database connected? Continue to a private local demo. Demo data stays in this browser.</p>
        <button class="sign-in-button" type="submit">Sign in <span aria-hidden="true">→</span></button>
        <p class="form-status" id="form-status" role="status" aria-live="polite" hidden></p>
      </form>

      <div class="form-divider"><span>NEW TO FOLIO FOUNDRY?</span></div>
      <button class="create-account" id="create-account" type="button">Create an account <span aria-hidden="true">↗</span></button>
      <button class="demo-account" id="demo-account" type="button">Continue with a local demo</button>
      <p class="form-privacy"><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="8" width="12" height="9" rx="2"/><path d="M7 8V5a3 3 0 0 1 6 0v3"/></svg>Your portfolio drafts are private to your account.</p>
    </div>
    <footer class="login-footer"><span>© 2026 FOLIO FOUNDRY</span><a href="mailto:hello@foliofoundry.example">NEED A HAND?</a></footer>
  </section>
</main>
`

const loginMarkup = app.innerHTML

function showLogin() {
  app.innerHTML = loginMarkup
  const form = document.querySelector('#login-form')
  const emailInput = document.querySelector('#email')
  const passwordInput = document.querySelector('#password')
  const status = document.querySelector('#form-status')
  const setup = document.querySelector('#database-setup')
  const savedSettings = getSupabaseSettings()
  document.querySelector('#project-url').value = savedSettings.url || ''
  document.querySelector('#project-key').value = savedSettings.key || ''
  setup.open = !savedSettings.url || !savedSettings.key

  function getClient() {
    const settings = getSupabaseSettings()
    if (!settings.url || !settings.key) return null
    try { return createClient(settings.url, settings.key) }
    catch { return null }
  }

  function showStatus(message, kind = 'info') {
    status.textContent = message
    status.dataset.kind = kind
    status.hidden = false
  }

  document.querySelector('#password-toggle').addEventListener('click', (event) => {
    const button = event.currentTarget
    const isVisible = passwordInput.type === 'text'
    passwordInput.type = isVisible ? 'password' : 'text'
    button.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password')
    button.setAttribute('aria-pressed', String(!isVisible))
  })

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    status.hidden = true
    if (!form.reportValidity()) return

    const client = getClient()
    if (!client) {
      showStatus('Connect a Supabase project first, or choose the local demo below.', 'error')
      setup.open = true
      return
    }
    client.auth.signInWithPassword({ email: emailInput.value.trim(), password: passwordInput.value })
      .then(({ data, error }) => {
        if (error) throw error
        mountStudio({ email: data.user.email, storageClient: client, onSignOut: async () => { await client.auth.signOut(); showLogin() } })
      })
      .catch((error) => showStatus(error.message || 'Unable to sign in. Check your details and try again.', 'error'))
  })

  document.querySelector('#save-database').addEventListener('click', () => {
    const url = document.querySelector('#project-url').value.trim().replace(/\/$/, '')
    const key = document.querySelector('#project-key').value.trim()
    try {
      const parsedUrl = new URL(url)
      if (!['https:', 'http:'].includes(parsedUrl.protocol) || !key) throw new Error('Enter a valid Supabase project URL and publishable key.')
      localStorage.setItem(SUPABASE_SETTINGS_KEY, JSON.stringify({ url, key }))
      showStatus('Database settings saved in this browser. You can now sign in or create an account.', 'info')
      setup.open = false
    } catch (error) {
      showStatus(error.message || 'Enter a valid Supabase project URL and publishable key.', 'error')
    }
  })

  document.querySelector('#forgot-password').addEventListener('click', async () => {
    const email = emailInput.value.trim()
    if (!email || !emailInput.reportValidity()) {
      showStatus('Enter a valid email address first.', 'error')
      emailInput.focus()
      return
    }
    const client = getClient()
    if (!client) {
      showStatus('Connect your Supabase project before requesting password recovery.', 'error')
      setup.open = true
      return
    }
    const { error } = await client.auth.resetPasswordForEmail(email)
    showStatus(error ? error.message : 'If this account exists, Supabase will send a password recovery email.', error ? 'error' : 'info')
  })

  document.querySelector('#create-account').addEventListener('click', async () => {
    if (!form.reportValidity()) return
    const client = getClient()
    if (!client) {
      showStatus('Connect a Supabase project before creating an online account.', 'error')
      setup.open = true
      return
    }
    const { data, error } = await client.auth.signUp({ email: emailInput.value.trim(), password: passwordInput.value })
    if (error) {
      showStatus(error.message, 'error')
      return
    }
    if (data.session) mountStudio({ email: data.user.email, storageClient: client, onSignOut: async () => { await client.auth.signOut(); showLogin() } })
    else showStatus('Account created. Check your email to confirm it, then sign in.', 'info')
  })

  document.querySelector('#demo-account').addEventListener('click', () => {
    if (!form.reportValidity()) return
    mountStudio({ email: emailInput.value.trim(), onSignOut: showLogin })
  })
}

showLogin()

function getSupabaseSettings() {
  try { return JSON.parse(localStorage.getItem(SUPABASE_SETTINGS_KEY) || '{}') }
  catch { return {} }
}

const initialClient = (() => {
  const settings = getSupabaseSettings()
  if (!settings.url || !settings.key) return null
  try { return createClient(settings.url, settings.key) }
  catch { return null }
})()

initialClient?.auth.getSession().then(({ data }) => {
  if (data.session) mountStudio({ email: data.session.user.email, storageClient: initialClient, onSignOut: async () => { await initialClient.auth.signOut(); showLogin() } })
})
