const STORAGE_KEY = 'folio-foundry-portfolios-v1';
const SETTINGS_KEY = 'folio-foundry-settings-v1';
const form = document.querySelector('#portfolio-form');
const preview = document.querySelector('#preview');
const list = document.querySelector('#portfolio-list');
const saveState = document.querySelector('#save-state');
const dialog = document.querySelector('#settings-dialog');
const toast = document.querySelector('#toast');

const fieldNames = ['fullName', 'headline', 'email', 'phone', 'address', 'about', 'education', 'experience', 'skills', 'projects', 'links'];
const templateNames = { simple: 'Simple', modern: 'Modern', creative: 'Creative' };
let records = [];
let activeId = null;
let activeTemplate = 'simple';
let profilePicture = '';
let supabase = null;
let user = null;
let storageMode = 'local';
let toastTimer;

const emptyData = () => Object.fromEntries(fieldNames.map((name) => [name, '']));
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const lines = (value) => String(value || '').split('\n').map((line) => line.split('|').map((part) => part.trim())).filter((parts) => parts.some(Boolean));
const skills = (value) => String(value || '').split(/[,\n]/).map((skill) => skill.trim()).filter(Boolean);
const safeUrl = (value) => {
  try {
    const url = new URL(value);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
};
const initials = (name) => String(name || 'Y').trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase();
const avatar = (name, picture, className = 'preview-avatar') => picture
  ? `<img class="${className}" src="${escapeHtml(picture)}" alt="${escapeHtml(name || 'Profile picture')}">`
  : `<span class="${className} preview-avatar-fallback" aria-label="${escapeHtml(name || 'Profile')}">${escapeHtml(initials(name))}</span>`;
const entry = (parts, className) => {
  const [title, detail = '', meta = '', description = ''] = parts;
  if (!parts.some(Boolean)) return '';
  const metaUrl = safeUrl(meta);
  return `<div class="${className}"><strong>${escapeHtml(title || detail)}</strong>${title && detail ? `<small>${escapeHtml(detail)}</small>` : ''}${meta ? `<small>${metaUrl ? `<a href="${escapeHtml(metaUrl)}" target="_blank" rel="noopener noreferrer">View project ↗</a>` : escapeHtml(meta)}</small>` : ''}${description ? `<p>${escapeHtml(description)}</p>` : ''}</div>`;
};
const section = (title, content, className, wide = false) => content
  ? `<section class="${className}${wide ? ' wide' : ''}"><h3>${escapeHtml(title)}</h3>${content}</section>`
  : '';

function setForm(data = emptyData(), template = 'simple', picture = '') {
  for (const name of fieldNames) form.elements.namedItem(name).value = data[name] || '';
  profilePicture = picture || '';
  activeTemplate = templateNames[template] ? template : 'simple';
  updatePhoto();
  updateTemplateButtons();
  renderPreview();
}

function readForm() {
  return Object.fromEntries(fieldNames.map((name) => [name, form.elements.namedItem(name).value.trim()]));
}

function updatePhoto() {
  const image = document.querySelector('#photo-preview');
  const placeholder = document.querySelector('#photo-placeholder');
  image.hidden = !profilePicture;
  placeholder.hidden = Boolean(profilePicture);
  image.src = profilePicture || '';
}

function updateTemplateButtons() {
  document.querySelectorAll('.template-option').forEach((button) => {
    const selected = button.dataset.template === activeTemplate;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  preview.className = `portfolio-preview template-${activeTemplate}`;
}

function renderPreview() {
  const data = readForm();
  const name = data.fullName || 'Your Name';
  const title = data.headline || 'Your professional title';
  const education = lines(data.education);
  const experience = lines(data.experience);
  const projects = lines(data.projects);
  const linkItems = lines(data.links);
  const skillItems = skills(data.skills);
  const about = escapeHtml(data.about || 'A few words about your work, what inspires you, and the perspective you bring.');
  const links = linkItems.map(([label, url]) => {
    const href = safeUrl(url || '');
    return href ? `<a class="simple-link" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label || url)}</a>` : '';
  }).join('');

  if (activeTemplate === 'modern') {
    const modernProjects = projects.map((parts) => entry(parts, 'modern-entry')).join('');
    const modernEducation = education.map((parts) => entry(parts, 'modern-entry')).join('');
    const modernExperience = experience.map((parts) => entry(parts, 'modern-entry')).join('');
    const modernSkills = skillItems.map((skill) => `<span class="modern-skill">${escapeHtml(skill)}</span>`).join('');
    const modernLinks = linkItems.map(([label, url]) => {
      const href = safeUrl(url || '');
      return href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label || url)}</a>` : '';
    }).join('');
    preview.innerHTML = `<div class="modern-hero"><div class="modern-identity">${avatar(name, profilePicture)}<div><div class="modern-name">${escapeHtml(name)}</div><div class="modern-role">${escapeHtml(title)}</div></div></div><p class="modern-about">${about}</p></div><div class="modern-content">${section('Selected projects', modernProjects, 'modern-block', true)}${section('Experience', modernExperience, 'modern-block', true)}${section('Education', modernEducation, 'modern-block')}${section('Skills', `<div class="modern-skills">${modernSkills}</div>`, 'modern-block')}${section('About', `<p>${escapeHtml(data.address || '')}</p>`, 'modern-block')}</div><div class="modern-contact">${data.email ? `<span>${escapeHtml(data.email)}</span>` : ''}${data.phone ? `<span>${escapeHtml(data.phone)}</span>` : ''}${modernLinks}</div>`;
    return;
  }

  if (activeTemplate === 'creative') {
    preview.innerHTML = `<div class="creative-head"><span class="creative-mark">✳</span><div class="creative-identity">${avatar(name, profilePicture)}<div><div class="creative-name">${escapeHtml(name)}</div><div class="creative-role">${escapeHtml(title)}</div></div></div><p class="creative-about">${about}</p></div><div class="creative-content"><div class="creative-side">${section('The toolkit', skillItems.map((skill) => `<span class="creative-skill">${escapeHtml(skill)}</span>`).join(''), 'creative-block')}${section('Elsewhere', linkItems.map(([label, url]) => { const href = safeUrl(url || ''); return href ? `<a class="creative-link" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">↗ ${escapeHtml(label || url)}</a>` : ''; }).join(''), 'creative-block')}${section('Find me', `<p>${escapeHtml(data.email)}${data.phone ? `<br>${escapeHtml(data.phone)}` : ''}${data.address ? `<br>${escapeHtml(data.address)}` : ''}</p>`, 'creative-block')}</div><div class="creative-main">${section('Things I made', projects.map((parts) => entry(parts, 'creative-entry')).join(''), 'creative-block')}${section('Where I have been', experience.map((parts) => entry(parts, 'creative-entry')).join(''), 'creative-block')}${section('Learning', education.map((parts) => entry(parts, 'creative-entry')).join(''), 'creative-block')}</div></div>`;
    return;
  }

  preview.innerHTML = `<div class="simple-top">${avatar(name, profilePicture)}<div><div class="simple-name">${escapeHtml(name)}</div><div class="simple-role">${escapeHtml(title)}</div></div></div><div class="simple-hero"><span class="simple-kicker">A little about me</span><h2>${escapeHtml(name)}</h2><p>${about}</p></div>${section('Selected projects', projects.map((parts) => entry(parts, 'simple-entry')).join(''), 'simple-block')}${section('Experience', experience.map((parts) => entry(parts, 'simple-entry')).join(''), 'simple-block')}${section('Education', education.map((parts) => entry(parts, 'simple-entry')).join(''), 'simple-block')}${section('Skills', `<div class="simple-skills">${skillItems.map((skill) => `<span class="simple-skill">${escapeHtml(skill)}</span>`).join('')}</div>`, 'simple-block')}${section('Contact & links', `<p>${escapeHtml(data.email)}${data.phone ? ` · ${escapeHtml(data.phone)}` : ''}${data.address ? ` · ${escapeHtml(data.address)}` : ''}</p>${links}`, 'simple-block')}`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3000);
}

function setSavedState(message) {
  saveState.textContent = message;
}

function setTitle(name = '') {
  document.querySelector('#editor-title').textContent = name || 'New portfolio';
  document.querySelector('#delete-portfolio').hidden = !activeId;
}

function renderList() {
  if (!records.length) {
    list.innerHTML = '<p class="empty-library">Your saved portfolios will appear here. Start a new one whenever you are ready.</p>';
    return;
  }
  list.innerHTML = records.map((record) => {
    const data = record.data || record.portfolio_data || {};
    const active = record.id === activeId;
    return `<button class="portfolio-item${active ? ' is-active' : ''}" type="button" data-id="${escapeHtml(record.id)}"><span class="portfolio-thumb">${data.profilePicture ? `<img src="${escapeHtml(data.profilePicture)}" alt="">` : escapeHtml(initials(data.fullName || record.title))}</span><span class="portfolio-item-copy"><strong>${escapeHtml(data.fullName || record.title || 'Untitled portfolio')}</strong><small>${escapeHtml(templateNames[record.template] || 'Simple')} · ${formatDate(record.updated_at)}</small></span>${active ? '<span class="active-dot"></span>' : ''}</button>`;
  }).join('');
}

function formatDate(date) {
  if (!date) return 'Not saved';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(date));
}

function createNew() {
  activeId = null;
  setTitle();
  setForm();
  renderList();
  setSavedState('Unsaved changes');
  form.elements.fullName.focus();
}

function selectRecord(id) {
  const record = records.find((item) => item.id === id);
  if (!record) return;
  activeId = record.id;
  const data = record.data || record.portfolio_data || {};
  setTitle(data.fullName || record.title);
  setForm(data, record.template, data.profilePicture);
  renderList();
  setSavedState('All changes saved');
}

function setStorageLabel() {
  document.querySelector('#mode-label').textContent = storageMode === 'cloud' ? `Online${user?.email ? ` · ${user.email}` : ''}` : 'On this device';
  document.querySelector('#mode-indicator .status-dot').style.background = storageMode === 'cloud' ? '#5a9d79' : '#d7a84c';
}

function readLocalRecords() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

async function loadRecords() {
  if (storageMode === 'cloud') {
    const { data, error } = await supabase.from('portfolios').select('id,title,template,portfolio_data,updated_at,is_published').order('updated_at', { ascending: false });
    if (error) throw error;
    records = data || [];
  } else {
    records = readLocalRecords().sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }
  renderList();
  if (activeId && records.some((item) => item.id === activeId)) selectRecord(activeId);
  else if (records.length) selectRecord(records[0].id);
  else createNew();
}

async function savePortfolio() {
  if (!form.reportValidity()) return;
  const data = readForm();
  if (!data.fullName) return;
  const now = new Date().toISOString();
  const payload = { title: data.fullName, template: activeTemplate, portfolio_data: { ...data, profilePicture }, updated_at: now };
  setSavedState('Saving…');
  try {
    if (storageMode === 'cloud') {
      const result = activeId
        ? await supabase.from('portfolios').update(payload).eq('id', activeId).select().single()
        : await supabase.from('portfolios').insert(payload).select().single();
      if (result.error) throw result.error;
      activeId = result.data.id;
      records = [result.data, ...records.filter((record) => record.id !== activeId)];
    } else {
      const existing = readLocalRecords();
      const saved = { id: activeId || crypto.randomUUID(), title: data.fullName, template: activeTemplate, data: { ...data, profilePicture }, updated_at: now };
      activeId = saved.id;
      const updated = [saved, ...existing.filter((record) => record.id !== activeId)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      records = updated;
    }
    setTitle(data.fullName);
    renderList();
    setSavedState('All changes saved');
    showToast('Portfolio saved successfully.');
  } catch (error) {
    setSavedState('Save failed');
    showToast(`Could not save: ${error.message || 'check your connection and database setup'}`);
  }
}

async function deletePortfolio() {
  if (!activeId || !confirm('Delete this portfolio? This cannot be undone.')) return;
  try {
    if (storageMode === 'cloud') {
      const { error } = await supabase.from('portfolios').delete().eq('id', activeId);
      if (error) throw error;
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(readLocalRecords().filter((record) => record.id !== activeId)));
    }
    records = records.filter((record) => record.id !== activeId);
    activeId = null;
    if (records.length) selectRecord(records[0].id);
    else createNew();
    renderList();
    showToast('Portfolio deleted.');
  } catch (error) {
    showToast(`Could not delete: ${error.message || 'check your database setup'}`);
  }
}

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); }
  catch { return {}; }
}

function showSettings(tab = 'local') {
  const settings = loadSettings();
  document.querySelector('#supabase-url').value = settings.url || '';
  document.querySelector('#supabase-key').value = settings.key || '';
  document.querySelector('#local-tab').classList.toggle('is-active', tab === 'local');
  document.querySelector('#cloud-tab').classList.toggle('is-active', tab === 'cloud');
  document.querySelector('#local-settings').hidden = tab !== 'local';
  document.querySelector('#cloud-settings').hidden = tab !== 'cloud';
  dialog.showModal();
}

async function connectCloud(signUp) {
  const url = document.querySelector('#supabase-url').value.trim().replace(/\/$/, '');
  const key = document.querySelector('#supabase-key').value.trim();
  const email = document.querySelector('#auth-email').value.trim();
  const password = document.querySelector('#auth-password').value;
  if (!url || !key || !email || !password) {
    showToast('Enter your project URL, key, email, and password.');
    return;
  }
  try {
    new URL(url);
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    supabase = createClient(url, key);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ url, key }));
    const result = signUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) throw result.error;
    user = result.data.user;
    if (!result.data.session) {
      showToast('Check your email to confirm your account, then sign in.');
      return;
    }
    storageMode = 'cloud';
    setStorageLabel();
    await loadRecords();
    document.querySelector('#sign-out').hidden = false;
    dialog.close();
    showToast(signUp ? 'Account created. Your online workspace is ready.' : 'Connected to your online workspace.');
  } catch (error) {
    showToast(`Could not connect: ${error.message || 'check the project URL, key, and schema'}`);
  }
}

function useLocalStorage() {
  storageMode = 'local';
  supabase = null;
  user = null;
  document.querySelector('#sign-out').hidden = true;
  setStorageLabel();
  dialog.close();
  loadRecords();
  showToast('Using this device. Your online portfolios remain in your account.');
}

form.addEventListener('input', () => {
  renderPreview();
  setSavedState('Unsaved changes');
  const name = form.elements.fullName.value.trim();
  document.querySelector('#editor-title').textContent = name || 'New portfolio';
});
form.addEventListener('submit', (event) => event.preventDefault());
document.querySelector('#save-portfolio').addEventListener('click', savePortfolio);
document.querySelector('#delete-portfolio').addEventListener('click', deletePortfolio);
document.querySelector('#new-portfolio').addEventListener('click', createNew);
list.addEventListener('click', (event) => {
  const button = event.target.closest('[data-id]');
  if (button) selectRecord(button.dataset.id);
});
document.querySelectorAll('.template-option').forEach((button) => button.addEventListener('click', () => {
  activeTemplate = button.dataset.template;
  updateTemplateButtons();
  renderPreview();
  setSavedState('Unsaved changes');
}));
document.querySelector('#settings-open').addEventListener('click', () => showSettings(storageMode));
document.querySelector('#local-tab').addEventListener('click', () => showSettings('local'));
document.querySelector('#cloud-tab').addEventListener('click', () => showSettings('cloud'));
document.querySelector('#use-local').addEventListener('click', useLocalStorage);
document.querySelector('#sign-in').addEventListener('click', () => connectCloud(false));
document.querySelector('#sign-up').addEventListener('click', () => connectCloud(true));
document.querySelector('#sign-out').addEventListener('click', async () => {
  await supabase?.auth.signOut();
  useLocalStorage();
});
document.querySelector('#profile-picture').addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { showToast('Choose an image file.'); return; }
  const image = new Image();
  image.onload = () => {
    const scale = Math.min(1, 720 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    profilePicture = canvas.toDataURL('image/jpeg', .78);
    updatePhoto();
    renderPreview();
    setSavedState('Unsaved changes');
    URL.revokeObjectURL(image.src);
  };
  image.src = URL.createObjectURL(file);
});
document.querySelector('#preview-expand').addEventListener('click', () => {
  const contents = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(readForm().fullName || 'Portfolio')}</title><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="${new URL('styles.css', location.href).href}"><style>body{background:#fff}.portfolio-preview{max-width:900px;min-height:100vh;max-height:none;margin:auto;padding-top:50px;padding-bottom:50px}</style></head><body><main class="portfolio-preview template-${activeTemplate}">${preview.innerHTML}</main></body></html>`;
  const blobUrl = URL.createObjectURL(new Blob([contents], { type: 'text/html' }));
  window.open(blobUrl, '_blank', 'noopener');
});

setStorageLabel();
loadRecords();