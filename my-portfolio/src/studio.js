import loginStyles from './login.css?inline';

const STORAGE_KEY = 'folio-foundry-demo-portfolios-v1';
const fields = ['fullName', 'headline', 'email', 'phone', 'address', 'about', 'education', 'skills', 'projects', 'experience', 'links'];
const templateLabels = { simple: 'Simple', modern: 'Modern', creative: 'Creative' };

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const parseLines = (value) => String(value || '').split('\n').map((line) => line.split('|').map((part) => part.trim())).filter((parts) => parts.some(Boolean));
const parseSkills = (value) => String(value || '').split(/[,\n]/).map((skill) => skill.trim()).filter(Boolean);
const initials = (value) => String(value || 'Y').trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase();
const safeUrl = (value) => {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol) ? parsed.href : '';
  } catch { return ''; }
};

function readRecords() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

export async function mountStudio({ email, onSignOut, storageClient = null }) {
  const app = document.querySelector('#app');
  let records = storageClient ? [] : readRecords();
  let activeId = null;
  let activeTemplate = 'simple';
  let profilePicture = '';
  let noticeTimer;

  app.innerHTML = `
    <div class="studio-app">
      <header class="studio-topbar">
        <a class="wordmark studio-wordmark" href="#" aria-label="Folio Foundry workspace"><span class="wordmark-icon">f.</span><span>folio<span class="wordmark-light">foundry</span></span></a>
        <div class="studio-account"><span class="storage-mode-label">${storageClient ? 'ONLINE DATABASE' : 'LOCAL DEMO'}</span><span class="account-mark">${escapeHtml(initials(email))}</span><span class="account-email">${escapeHtml(email)}</span><button class="sign-out-button" id="sign-out" type="button">Sign out</button></div>
      </header>
      <main class="studio-main">
        <div class="studio-welcome"><div><span class="eyebrow">YOUR PORTFOLIO STUDIO</span><h1>Let’s make something <em>yours.</em></h1><p>${storageClient ? 'Your portfolios are stored privately in your online account.' : 'Demo drafts stay in this browser. Connect Supabase to save portfolios online.'} Pick a template, shape your story, and preview it as you go.</p></div><button class="studio-new-button" id="new-portfolio" type="button"><span aria-hidden="true">+</span> New portfolio</button></div>
        <nav class="studio-nav" aria-label="Portfolio steps">
          <button type="button" data-view="information" aria-controls="studio-page-information" aria-current="step" class="is-active"><span class="step-number">01</span> Information</button>
          <button type="button" data-view="templates" aria-controls="studio-page-templates"><span class="step-number">02</span> Templates</button>
          <button type="button" data-view="preview" aria-controls="studio-page-preview"><span class="step-number">03</span> Preview</button>
          <button type="button" data-view="manage" aria-controls="studio-page-manage"><span class="step-number">04</span> My portfolios</button>
        </nav>
        <p class="studio-notice" id="studio-notice" role="status" aria-live="polite" hidden></p>
          <a href="#information" data-view="information" aria-controls="studio-page-information" aria-current="step" class="is-active"><span class="step-number">01</span> Information</a>
          <a href="#templates" data-view="templates" aria-controls="studio-page-templates"><span class="step-number">02</span> Templates</a>
          <a href="#preview" data-view="preview" aria-controls="studio-page-preview"><span class="step-number">03</span> Preview</a>
          <a href="#manage" data-view="manage" aria-controls="studio-page-manage"><span class="step-number">04</span> My portfolios</a>
            <form class="portfolio-form" id="portfolio-form">
              <section class="builder-section"><div class="builder-section-heading"><span>01</span><div><h3>Personal information</h3><p>Introduce yourself to the people you want to reach.</p></div></div>
                <label class="profile-upload" for="profile-picture"><span class="profile-photo" id="profile-photo"><b id="profile-initials">+</b></span><span><strong>Profile picture</strong><small>Choose a picture · JPEG, PNG, or WebP</small></span><input id="profile-picture" type="file" accept="image/*"></label>
                <div class="studio-field-grid">
                  <label class="studio-field"><span>Full name <i>*</i></span><input name="fullName" maxlength="100" autocomplete="name" placeholder="Jordan Lee" required></label>
                  <label class="studio-field"><span>Professional title</span><input name="headline" maxlength="120" placeholder="Product designer"></label>
                  <label class="studio-field"><span>Email</span><input name="email" type="email" pattern="[^0-9]*" title="Email addresses cannot contain numbers." maxlength="160" placeholder="jordan@example.com"></label>
                  <label class="studio-field"><span>Contact number</span><input name="phone" type="tel" maxlength="50" placeholder="+1 555 010 2040"></label>
                  <label class="studio-field field-span"><span>Address / location</span><input name="address" maxlength="160" autocomplete="address-level2" placeholder="Portland, Oregon"></label>
                  <label class="studio-field field-span"><span>About me</span><textarea name="about" rows="4" maxlength="1600" placeholder="A short introduction, what you care about, and how you work."></textarea></label>
                </div>
              </section>
              <section class="builder-section"><div class="builder-section-heading"><span>02</span><div><h3>Education &amp; skills</h3><p>Share what you have learned and what you do best.</p></div></div>
                <div class="studio-field-grid">
                  <label class="studio-field field-span"><span>Educational background</span><textarea name="education" rows="3" placeholder="BFA, Visual Communication | State University | 2022"></textarea><small>Qualification | School | Year</small></label>
                  <label class="studio-field field-span"><span>Skills</span><input name="skills" maxlength="700" placeholder="Research, Figma, prototyping, writing"><small>Separate skills with commas.</small></label>
                </div>
              </section>
              <section class="builder-section"><div class="builder-section-heading"><span>03</span><div><h3>Work &amp; links</h3><p>Add projects, experience, and places to find you.</p></div></div>
                <div class="studio-field-grid">
                  <label class="studio-field field-span"><span>Projects</span><textarea name="projects" rows="4" placeholder="Open Atlas | A community mapping platform | https://example.com"></textarea><small>Project | Description | Link (one project per line)</small></label>
                  <label class="studio-field field-span"><span>Work experience</span><textarea name="experience" rows="4" placeholder="Product Designer | Fieldwork Studio | 2022–Present | Building useful things for real people."></textarea><small>Role | Organization | Dates | Description (one role per line)</small></label>
                  <label class="studio-field field-span"><span>Social media / website links</span><textarea name="links" rows="3" placeholder="Website | https://example.com&#10;LinkedIn | https://linkedin.com/in/yourname"></textarea><small>Link name | Full URL (one per line)</small></label>
                </div>
              </section>
              <div class="form-actions"><button class="quiet-button" id="reset-form" type="button">Clear form</button><button class="studio-primary-button" type="submit">Save portfolio <span aria-hidden="true">↗</span></button></div>
            </form>
          </div>
        </section>

        <section class="studio-view templates-view" id="studio-page-templates" data-page="templates" hidden>
          <div class="view-heading"><div><span class="eyebrow">02 / THREE DISTINCT DIRECTIONS</span><h2>Choose your template</h2><p>One story, three different ways to tell it. Your preview updates with every change.</p></div></div>
          <div class="template-cards">
            <button class="studio-template is-selected" data-template="simple" type="button" aria-pressed="true"><span class="template-art template-art-simple"><i></i><b></b><em></em><small></small></span><span class="template-card-copy"><strong>Simple</strong><small>Clean, calm, professional.</small></span><span class="template-selected-mark">✓</span></button>
            <button class="studio-template" data-template="modern" type="button" aria-pressed="false"><span class="template-art template-art-modern"><i></i><b></b><em></em><small></small></span><span class="template-card-copy"><strong>Modern</strong><small>Structured, bold, visual.</small></span><span class="template-selected-mark">✓</span></button>
            <button class="studio-template" data-template="creative" type="button" aria-pressed="false"><span class="template-art template-art-creative"><i></i><b></b><em></em><small></small></span><span class="template-card-copy"><strong>Creative</strong><small>Editorial, unexpected, expressive.</small></span><span class="template-selected-mark">✓</span></button>
          </div>
          <div class="template-preview-block"><div class="side-panel-heading"><div><span class="eyebrow">LIVE PREVIEW</span><h2 id="template-preview-name">Your portfolio</h2></div><button class="studio-primary-button" type="button" data-go="preview">Continue to preview <span aria-hidden="true">→</span></button></div><div class="studio-preview-frame large-preview"><div id="template-preview" class="studio-preview theme-simple"></div></div></div>
        </section>

        <section class="studio-view generated-view" id="studio-page-preview" data-page="preview" hidden>
          <div class="view-heading"><div><span class="eyebrow">03 / YOUR GENERATED PORTFOLIO</span><h2 id="generated-title">Preview your portfolio</h2><p>This private preview is visible only in your browser.</p></div><button class="studio-primary-button" id="open-generated" type="button">Open portfolio <span aria-hidden="true">↗</span></button></div>
          <div class="generated-frame"><div id="generated-preview" class="studio-preview theme-simple"></div></div>
          <div class="generated-actions"><button class="quiet-button" type="button" data-go="information">← Edit information</button><button class="quiet-button" type="button" data-go="templates">Change template</button><button class="studio-primary-button" type="button" data-go="manage">Manage portfolios</button></div>
        </section>

        <section class="studio-view manage-view" id="studio-page-manage" data-page="manage" hidden>
          <div class="view-heading"><div><span class="eyebrow">04 / YOUR WORKSPACE</span><h2>My portfolios</h2><p>View, update, or delete private portfolio drafts saved in this browser.</p></div><button class="studio-primary-button" type="button" id="manage-new">New portfolio <span aria-hidden="true">+</span></button></div>
          <div class="managed-portfolios" id="managed-portfolios"></div>
        </section>
      </main>
      <footer class="studio-footer"><span>FOLIO FOUNDRY · PRIVATE PORTFOLIO STUDIO</span><span>YOUR WORK, YOUR WAY.</span></footer>
    </div>`;

  const form = app.querySelector('#portfolio-form');
  const previewTargets = [app.querySelector('#template-preview'), app.querySelector('#generated-preview')];
  const notice = app.querySelector('#studio-notice');
  const managedPortfolios = app.querySelector('#managed-portfolios');

  function showNotice(message, kind = 'info') {
    notice.textContent = message;
    notice.dataset.kind = kind;
    notice.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { notice.hidden = true; }, 3500);
  }

  function getFormData() {
    return Object.fromEntries(fields.map((field) => [field, form.elements.namedItem(field).value.trim()]));
  }

  function makeAvatar(name, picture) {
    return picture
      ? `<img class="portfolio-avatar" src="${escapeHtml(picture)}" alt="${escapeHtml(name || 'Profile photo')}">`
      : `<span class="portfolio-avatar avatar-fallback">${escapeHtml(initials(name))}</span>`;
  }

  function renderEntry(parts, className = 'portfolio-entry') {
    const [title, detail = '', meta = '', description = ''] = parts;
    if (!parts.some(Boolean)) return '';
    const url = safeUrl(meta);
    return `<article class="${className}"><strong>${escapeHtml(title || detail)}</strong>${title && detail ? `<small>${escapeHtml(detail)}</small>` : ''}${meta ? `<small>${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Visit link ↗</a>` : escapeHtml(meta)}</small>` : ''}${description ? `<p>${escapeHtml(description)}</p>` : ''}</article>`;
  }

  function renderPortfolio(data = getFormData()) {
    const name = data.fullName || 'Your Name';
    const title = data.headline || 'Your professional title';
    const about = escapeHtml(data.about || 'A few words about your work, what inspires you, and the perspective you bring.');
    const projects = parseLines(data.projects);
    const experience = parseLines(data.experience);
    const education = parseLines(data.education);
    const skills = parseSkills(data.skills);
    const links = parseLines(data.links);
    const validLinks = links.map(([label, rawUrl]) => {
      const url = safeUrl(rawUrl || '');
      return url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label || rawUrl)} ↗</a>` : '';
    }).join('');
    let markup;

    if (activeTemplate === 'modern') {
      markup = `<header class="portfolio-modern-hero"><div>${makeAvatar(name, profilePicture)}<div><span class="portfolio-modern-name">${escapeHtml(name)}</span><small>${escapeHtml(title)}</small></div></div><p>${about}</p></header><div class="portfolio-modern-grid"><section class="modern-featured"><h3>SELECTED PROJECTS</h3>${projects.map((entry) => renderEntry(entry)).join('') || '<p>Projects will appear here.</p>'}</section><section><h3>EXPERIENCE</h3>${experience.map((entry) => renderEntry(entry)).join('') || '<p>Add your experience.</p>'}</section><section><h3>EDUCATION</h3>${education.map((entry) => renderEntry(entry)).join('') || '<p>Add your education.</p>'}</section><section><h3>SKILLS</h3><div class="portfolio-skill-list">${skills.map((skill) => `<span>${escapeHtml(skill)}</span>`).join('') || '<p>Add your skills.</p>'}</div></section></div><footer class="portfolio-contact"><span>${escapeHtml(data.email)}</span><span>${escapeHtml(data.phone)}</span><span>${escapeHtml(data.address)}</span>${validLinks}</footer>`;
    } else if (activeTemplate === 'creative') {
      markup = `<div class="portfolio-creative-top"><span>INDEPENDENT PRACTICE</span><span>PORTFOLIO / SELECTED WORK</span></div><header class="portfolio-creative-hero"><div>${makeAvatar(name, profilePicture)}</div><section><small>A COLLECTION OF GOOD IDEAS</small><h2>${escapeHtml(name)}</h2><p>${escapeHtml(title)}</p></section><span class="creative-spark">✳</span></header><section class="portfolio-creative-intro"><small>01 / THE PERSON</small><p>${about}</p><span>${escapeHtml(data.address || 'AVAILABLE FOR THE RIGHT THING')}</span></section><div class="portfolio-creative-body"><aside><section><h3>THE TOOLKIT</h3>${skills.map((skill) => `<span>${escapeHtml(skill)}</span>`).join('') || '<small>Add your skills.</small>'}</section><section><h3>ELSEWHERE</h3>${validLinks || '<small>Add your website and social links.</small>'}</section><section><h3>SAY HELLO</h3>${data.email ? `<a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a>` : ''}${data.phone ? `<span>${escapeHtml(data.phone)}</span>` : ''}</section></aside><div class="portfolio-creative-work"><section><h3>02 / SELECTED WORK</h3><div class="portfolio-project-grid">${projects.map((entry, index) => `<div class="creative-project-card"><small>0${index + 1}</small>${renderEntry(entry)}</div>`).join('') || '<p>Add your projects.</p>'}</div></section><section><h3>03 / EXPERIENCE</h3>${experience.map((entry) => renderEntry(entry)).join('') || '<p>Add your experience.</p>'}</section><section><h3>04 / EDUCATION</h3>${education.map((entry) => renderEntry(entry)).join('') || '<p>Add your education.</p>'}</section></div></div><footer class="portfolio-creative-footer"><span>${escapeHtml(name)}</span><span>MADE WITH INTENTION</span></footer>`;
    } else {
      markup = `<header class="portfolio-simple-header">${makeAvatar(name, profilePicture)}<div><strong>${escapeHtml(name)}</strong><small>${escapeHtml(title)}</small></div></header><section class="portfolio-simple-intro"><small>ABOUT</small><h2>${escapeHtml(name)}</h2><p>${about}</p></section><section class="portfolio-simple-section"><h3>PROJECTS</h3>${projects.map((entry) => renderEntry(entry)).join('') || '<p>Add your projects.</p>'}</section><section class="portfolio-simple-section"><h3>EXPERIENCE</h3>${experience.map((entry) => renderEntry(entry)).join('') || '<p>Add your experience.</p>'}</section><section class="portfolio-simple-section"><h3>EDUCATION</h3>${education.map((entry) => renderEntry(entry)).join('') || '<p>Add your education.</p>'}</section><section class="portfolio-simple-section"><h3>SKILLS</h3><div class="portfolio-skill-list">${skills.map((skill) => `<span>${escapeHtml(skill)}</span>`).join('') || '<p>Add your skills.</p>'}</div></section><section class="portfolio-simple-section"><h3>CONTACT &amp; LINKS</h3><p>${escapeHtml(data.email)}${data.phone ? ` · ${escapeHtml(data.phone)}` : ''}${data.address ? ` · ${escapeHtml(data.address)}` : ''}</p><div class="portfolio-simple-links">${validLinks}</div></section>`;
    }

    const portfolioMarkup = `<article class="portfolio-sheet theme-${activeTemplate}">${markup}</article>`;
    for (const target of previewTargets) target.innerHTML = portfolioMarkup;
    app.querySelector('#template-preview-name').textContent = name;
    app.querySelector('#generated-title').textContent = name === 'Your Name' ? 'Preview your portfolio' : `${name}'s portfolio`;
  }

  function setTemplate(template) {
    if (!templateLabels[template]) return;
    activeTemplate = template;
    app.querySelectorAll('.studio-template').forEach((button) => {
      const selected = button.dataset.template === template;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    previewTargets.forEach((target) => { target.className = `studio-preview theme-${template}`; });
    renderPortfolio();
  }

  function setForm(data = {}, template = 'simple', picture = '') {
    for (const field of fields) form.elements.namedItem(field).value = data[field] || '';
    profilePicture = picture || '';
    const photo = app.querySelector('#profile-photo');
    photo.innerHTML = profilePicture ? `<img src="${escapeHtml(profilePicture)}" alt="Profile picture">` : `<b id="profile-initials">${escapeHtml(initials(data.fullName))}</b>`;
    setTemplate(template);
  }

  function renderManageList() {
    if (!records.length) {
      managedPortfolios.innerHTML = `<div class="manage-empty"><span>✳</span><h3>Your first portfolio starts here.</h3><p>Save a draft to preview it and manage it here.</p><button class="studio-primary-button" type="button" data-action="new">Create a portfolio <span aria-hidden="true">+</span></button></div>`;
      return;
    }
    managedPortfolios.innerHTML = records.map((record) => `<article class="managed-item" data-id="${escapeHtml(record.id)}"><span class="managed-avatar">${record.data.profilePicture ? `<img src="${escapeHtml(record.data.profilePicture)}" alt="">` : escapeHtml(initials(record.data.fullName))}</span><span class="managed-copy"><strong>${escapeHtml(record.data.fullName || 'Untitled portfolio')}</strong><small>${escapeHtml(record.data.headline || 'Portfolio draft')} · ${escapeHtml(templateLabels[record.template])}</small><small>${storageClient ? 'Private online draft' : 'Private local draft'} · Updated ${escapeHtml(new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(record.updatedAt)))}</small></span><span class="managed-actions"><button class="quiet-button" type="button" data-action="view">View</button><button class="quiet-button" type="button" data-action="edit">Edit</button><button class="delete-button" type="button" data-action="delete">Delete</button></span></article>`).join('');
  }

  function renderRecords() {
    renderManageList();
  }

  function setView(view, updateHistory = true) {
    const validViews = ['information', 'templates', 'preview', 'manage'];
    const selected = validViews.includes(view) ? view : 'information';
    if (updateHistory && location.hash !== `#${selected}`) history.pushState({ view: selected }, '', `#${selected}`);
    app.querySelectorAll('.studio-view').forEach((section) => { section.hidden = section.dataset.page !== selected; });
    app.querySelectorAll('.studio-nav [data-view]').forEach((button) => {
      const active = button.dataset.view === selected;
      button.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    if (selected === 'manage') renderRecords();
    if (selected === 'preview') renderPortfolio();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function syncViewFromUrl() {
    const view = location.hash.slice(1);
    setView(view, false);
  }

  function newPortfolio() {
    activeId = null;
    form.reset();
    profilePicture = '';
    app.querySelector('#profile-photo').innerHTML = '<b id="profile-initials">+</b>';
    setTemplate('simple');
    showNotice('New private draft started.');
    setView('information');
  }

  function loadRecord(id) {
    const record = records.find((item) => item.id === id);
    if (!record) return;
    activeId = record.id;
    setForm(record.data, record.template, record.data.profilePicture);
  }

  async function savePortfolio(event) {
    event?.preventDefault();
    if (!form.reportValidity()) return;
    const data = { ...getFormData(), profilePicture };
    if (!data.fullName) return;
    try {
      const updatedAt = new Date().toISOString();
      let record;
      if (storageClient) {
        const payload = { title: data.fullName, template: activeTemplate, portfolio_data: data, updated_at: updatedAt };
        const result = activeId
          ? await storageClient.from('portfolios').update(payload).eq('id', activeId).select().single()
          : await storageClient.from('portfolios').insert(payload).select().single();
        if (result.error) throw result.error;
        record = { id: result.data.id, data: result.data.portfolio_data, template: result.data.template, updatedAt: result.data.updated_at };
      } else {
        record = { id: activeId || crypto.randomUUID(), data, template: activeTemplate, updatedAt };
        localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...records.filter((item) => item.id !== record.id)]));
      }
      records = [record, ...records.filter((item) => item.id !== record.id)];
      activeId = record.id;
      renderRecords();
      showNotice(storageClient ? 'Portfolio saved to your online account.' : 'Portfolio saved privately in this browser.');
    } catch (error) {
      showNotice(error.message || 'Could not save. Check your connection and database setup.', 'error');
    }
  }

  async function deletePortfolio(id = activeId) {
    if (!id) {
      showNotice('Save the portfolio before deleting it.', 'error');
      return;
    }
    if (!window.confirm('Delete this portfolio draft? This cannot be undone.')) return;
    try {
      if (storageClient) {
        const { error } = await storageClient.from('portfolios').delete().eq('id', id);
        if (error) throw error;
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records.filter((item) => item.id !== id)));
      }
      records = records.filter((item) => item.id !== id);
      if (activeId === id) {
        activeId = null;
        newPortfolio();
      }
      renderRecords();
      showNotice('Portfolio deleted.');
    } catch (error) {
      showNotice(error.message || 'Could not delete this portfolio.', 'error');
    }
  }

  function openGenerated() {
    renderPortfolio();
    const documentMarkup = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(getFormData().fullName || 'Portfolio')}</title><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet"><style>${loginStyles}body{min-width:0;background:#f6f4ed}.generated-portfolio{max-width:900px;min-height:100vh;margin:auto;padding:36px 18px}.generated-portfolio .portfolio-sheet{min-height:80vh}.generated-portfolio .portfolio-sheet.theme-simple{padding:50px 56px}.generated-portfolio .portfolio-sheet.theme-modern,.generated-portfolio .portfolio-sheet.theme-creative{padding-bottom:30px}</style></head><body><main class="generated-portfolio">${previewTargets[1].innerHTML}</main></body></html>`;
    const url = URL.createObjectURL(new Blob([documentMarkup], { type: 'text/html' }));
    window.open(url, '_blank', 'noopener');
  }

  form.addEventListener('input', () => renderPortfolio());
  form.addEventListener('submit', savePortfolio);
  app.querySelector('#new-portfolio').addEventListener('click', newPortfolio);
  app.querySelector('#manage-new').addEventListener('click', newPortfolio);
  app.querySelector('#reset-form').addEventListener('click', newPortfolio);
  app.querySelector('#sign-out').addEventListener('click', onSignOut);
  app.querySelector('#open-generated').addEventListener('click', openGenerated);
  app.querySelector('#profile-picture').addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, 640 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      profilePicture = canvas.toDataURL('image/jpeg', .76);
      app.querySelector('#profile-photo').innerHTML = `<img src="${profilePicture}" alt="Profile picture">`;
      renderPortfolio();
    };
    image.src = URL.createObjectURL(file);
  });
  const stepButtons = [...app.querySelectorAll('.studio-nav [data-view]')];
  stepButtons.forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
  app.querySelector('.studio-nav').addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    const currentIndex = stepButtons.indexOf(document.activeElement);
    if (currentIndex < 0) return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (currentIndex + direction + stepButtons.length) % stepButtons.length;
    stepButtons[nextIndex].focus();
    setView(stepButtons[nextIndex].dataset.view);
  });
  window.addEventListener('hashchange', syncViewFromUrl);
  window.addEventListener('popstate', syncViewFromUrl);
  app.querySelectorAll('[data-go]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.go)));
  app.querySelectorAll('[data-go]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.go)));
  app.querySelectorAll('.studio-template').forEach((button) => button.addEventListener('click', () => setTemplate(button.dataset.template)));
  managedPortfolios.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    if (action === 'new') return newPortfolio();
    const item = event.target.closest('[data-id]');
    if (!item) return;
    loadRecord(item.dataset.id);
    if (action === 'edit') setView('information');
    if (action === 'view') setView('preview');
    if (action === 'delete') deletePortfolio(item.dataset.id);
  });

  if (storageClient) {
    try {
      const { data, error } = await storageClient.from('portfolios').select('id,title,template,portfolio_data,updated_at').order('updated_at', { ascending: false });
      if (error) throw error;
      records = (data || []).map((record) => ({ id: record.id, data: record.portfolio_data || {}, template: record.template, updatedAt: record.updated_at }));
    } catch (error) {
      showNotice(error.message || 'Could not retrieve portfolios from the online database.', 'error');
    }
  } else {
    records = records.sort((first, second) => new Date(second.updatedAt) - new Date(first.updatedAt));
  }
  if (records.length) {
    activeId = records[0].id;
    setForm(records[0].data, records[0].template, records[0].data.profilePicture);
  } else setForm();
  renderRecords();
  setView('information');
}
