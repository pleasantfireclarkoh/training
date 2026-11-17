import {
  categories, department, displayDate, displayHours, displayTime, levels, ohioDate, phases, ratings, totalUnits,
} from './model.js'

const symbols = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  award: '<circle cx="12" cy="9" r="5"/><path d="m8 13-2 8 6-3 6 3-2-8"/>',
  settings: '<path d="M4 7h16M4 12h16M4 17h16"/><circle cx="8" cy="7" r="2" fill="currentColor"/><circle cx="15" cy="12" r="2" fill="currentColor"/><circle cx="10" cy="17" r="2" fill="currentColor"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="M7 17 17 7M7 7h10v10"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  back: '<path d="m12 19-7-7 7-7M5 12h14"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M16 5a3 3 0 0 1 0 6m5 9v-2a4 4 0 0 0-4-4"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  circle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  link: '<path d="m10 13 4-4m-6 6-1 1a3.5 3.5 0 0 1-5-5l4-4a3.5 3.5 0 0 1 5 0m2 2 1-1a3.5 3.5 0 0 1 5 5l-4 4a3.5 3.5 0 0 1-5 0" transform="translate(1 1)"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>',
  logout: '<path d="M10 4H5v16h5m4-12 4 4-4 4m-6-4h10"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/>',
  file: '<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6m-6 4h6"/>',
  print: '<path d="M7 7V3h10v4M7 17H4V8h16v9h-3M7 13h10v8H7zm9-3h1"/>',
}

export function icon(name, className = '') {
  return `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${symbols[name]}</svg>`
}

export function h(value = '') {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character])
}

const logo = '<img src="./img/ptfd-logo.png" alt="" width="56" height="56">'
const brand = `<span class="brand-logo">${logo}</span><span class="brand-copy"><strong>Pleasant Township</strong><span>Fire Department</span></span>`
export const errorLine = '<p class="form-error" data-error role="alert" hidden></p>'

export function shell(content, { demo, route, link, user }) {
  const settings = route === 'settings'
  const sidebarLink = (name, label, symbol, active) => `<a class="nav-link ${active ? 'active' : ''}" href="${h(link(name))}" ${active ? 'aria-current="page"' : ''}>${icon(symbol)}<span>${label}</span></a>`
  return `
    <div class="admin-shell">
      <aside class="sidebar" aria-label="Administration">
        <a class="brand" href="${h(link('home'))}">${brand}</a>
        <div class="workspace"><strong>EMS Continuing Education</strong><span>Ohio EMS Program</span></div>
        <nav class="side-nav" aria-label="Admin pages">
          ${sidebarLink('home', 'Trainings', 'grid', !settings)}
          ${sidebarLink('settings', 'Certificate settings', 'settings', settings)}
        </nav>
        <div class="sidebar-foot">
          <span class="avatar">CE</span>
          <div><strong>${demo ? 'Demo administrator' : 'Program administrator'}</strong><span>${demo ? 'Preview workspace' : h(user?.email)}</span></div>
          ${demo ? '' : `<button class="icon-button" type="button" data-action="logout" aria-label="Sign out" title="Sign out">${icon('logout')}</button>`}
        </div>
      </aside>
      <div class="admin-body">
        <header class="topbar"><div class="crumb"><span>Administration</span>${icon('chevron')}<strong>${settings ? 'Certificate settings' : 'Trainings'}</strong></div>
          ${demo ? '<span class="preview"><i></i> Demo mode</span>' : '<span class="top-department">Pleasant Township Fire Department</span>'}
        </header>
        <main id="main-content" class="content">${content}</main>
      </div>
    </div>`
}

export function publicShell(content, { demo, link }) {
  return `<div class="public-shell">
    <header class="public-header"><a class="brand" href="${h(link('home'))}">${brand}</a><a href="${h(link('home'))}" class="public-admin">${icon('lock')} Admin portal</a></header>
    <main id="main-content" class="public-main">
      ${demo ? '<p class="demo-message">Demo mode · Use sample information only. Changes stay in this browser.</p>' : ''}
      ${content}
    </main>
    <footer class="public-footer"><span>${department}</span><span>Ohio EMS Continuing Education</span></footer>
  </div>`
}

function pill(phase) {
  return `<span class="pill ${phase}"><i></i>${phases[phase]}</span>`
}

export function courseMeta(course) {
  const { date, startTime, endTime, location, credits } = course
  return `<div class="course-meta"><span>${icon('calendar')} ${displayDate(date)}</span><span>${icon('clock')} ${displayTime(startTime)}–${displayTime(endTime)} ET</span><span>${h(location)}</span><span>${displayHours(totalUnits(credits))} CE hours</span></div>`
}

function metric(symbol, tone, value, label, detail) {
  return `<article class="metric"><div class="metric-top"><span class="metric-symbol ${tone}">${icon(symbol)}</span><span class="metric-label">${label}</span></div><div class="metric-bottom"><strong>${value}</strong><span>${detail}</span></div></article>`
}

export function dashboard(courses, link) {
  const open = courses.filter(course => course.phase === 'open').length
  const closed = courses.filter(course => course.phase === 'ended').length
  const launched = courses.length - closed
  const counts = Object.fromEntries(categories.map(([key]) => [key, courses.reduce((sum, course) => sum + course.credits[key], 0)]))
  const max = Math.max(...Object.values(counts), 1)
  return `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Pleasant Township Fire Department</p>
        <h1>EMS Continuing Education</h1>
        <p>Manage Ohio EMS trainings, class attendance, evaluations, and certificates.</p>
        <a class="button hero-button" href="${h(link('new'))}">${icon('plus')} Create training</a>
      </div>
      <div class="hero-brand" aria-hidden="true">${logo}</div>
    </section>
    <div class="metrics" aria-label="Training summary">
      ${metric('calendar', 'red', courses.length, 'Total trainings', `${launched} active or in draft`)}
      ${metric('people', 'green', open, 'Sign-in open', 'Accepting attendance')}
      ${metric('circle', 'gold', closed, 'Completed classes', 'Ready for evaluations')}
    </div>
    <div class="dashboard-grid">
      <section class="panel training-panel">
        <div class="panel-heading"><h2>Trainings</h2><p>Manage each class and its participant links.</p></div>
        <div class="filters">
          <label class="search-field">${icon('search')}<input type="search" id="training-search" placeholder="Search trainings" aria-label="Search trainings"></label>
          <select id="training-phase" aria-label="Filter by status"><option value="">All statuses</option>${Object.entries(phases).map(([phase, label]) => `<option value="${phase}">${label}</option>`).join('')}</select>
        </div>
        <div class="table-wrap"><table class="training-table">
          <thead><tr><th scope="col">Training</th><th scope="col">Class date</th><th scope="col">CE hours</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Open</span></th></tr></thead>
          <tbody>${courses.map(course => {
            const subjects = categories.filter(([key]) => course.credits[key]).map(([, label]) => label).join(' · ')
            return `<tr data-training data-title="${h(`${course.title} ${subjects} ${course.instructor}`.toLowerCase())}" data-phase="${course.phase}">
              <td><a href="${h(link('training', course.id))}">${h(course.title)}</a><span class="table-subtitle">${subjects}</span></td>
              <td>${displayDate(course.date)}</td><td class="hours-cell">${displayHours(totalUnits(course.credits))}</td><td>${pill(course.phase)}</td>
              <td><a class="row-arrow" href="${h(link('training', course.id))}" aria-label="Open ${h(course.title)}">${icon('chevron')}</a></td>
            </tr>`
          }).join('')}</tbody>
        </table></div>
        <p id="training-empty" class="empty-panel" ${courses.length ? 'hidden' : ''}>${courses.length ? 'No trainings match these filters.' : 'Create your first training to get started.'}</p>
      </section>
      <aside class="panel credit-panel" aria-labelledby="credit-heading">
        <div class="panel-heading"><span class="metric-symbol red">${icon('award')}</span><h2 id="credit-heading">Credits by category</h2><p>Hours across all trainings</p></div>
        <ul class="credit-list">${categories.map(([key, label]) => `<li><div><span class="category-dot ${key}"></span><strong>${label}</strong><span>${displayHours(counts[key])} hr</span></div><div class="meter" aria-hidden="true"><span class="${key}" style="width:${counts[key] / max * 100}%"></span></div></li>`).join('')}</ul>
      </aside>
    </div>`
}

function input(label, name, value, { type = 'text', max = 120, ...flags } = {}) {
  return `<label class="field">${label}<input type="${type}" name="${name}" value="${h(value)}" ${type === 'text' ? `maxlength="${max}"` : ''} ${Object.keys(flags).map(key => `${key}="${h(flags[key])}"`).join(' ')} required></label>`
}

export function message(title, text, actions = '', symbol = 'file') {
  return `<section class="panel public-card message"><span class="metric-symbol red">${icon(symbol)}</span><h1>${h(title)}</h1><p>${h(text)}</p>${actions && `<div class="action-row">${actions}</div>`}</section>`
}

export function loginView() {
  return `<section class="panel public-card">
    <span class="metric-symbol red">${icon('lock')}</span><h1>Admin portal</h1><p>Sign in to manage Pleasant Township Fire Department EMS training.</p>
    <form data-form="login" class="stack">
      ${input('Email address', 'email', '', { type: 'email', autocomplete: 'username' })}
      ${input('Password', 'password', '', { type: 'password', autocomplete: 'current-password' })}
      ${errorLine}<button class="button primary" type="submit">Sign in ${icon('chevron')}</button>
    </form>
  </section>`
}

export function courseForm(course, link) {
  const editing = !!course
  const back = editing ? link('training', course.id) : link('home')
  return `
    <a class="back" href="${h(back)}">${icon('back')} ${editing ? 'Training details' : 'All trainings'}</a>
    <div class="page-heading"><div><h1>${editing ? 'Edit training' : 'Create training'}</h1><p>Enter class details and assign CE credit hours by category.</p></div></div>
    <form data-form="course" class="form-layout">
      <section class="panel form-panel">
        <h2>Class details</h2>
        ${input('Training name', 'title', course?.title, { placeholder: 'e.g. Pediatric Assessment & Airway' })}
        ${input('Class date', 'date', course?.date || ohioDate(), { type: 'date', min: '1900-01-01', max: '9999-12-31' })}
        <div class="form-grid">${input('Start time (ET)', 'startTime', course?.startTime, { type: 'time' })}${input('End time (ET)', 'endTime', course?.endTime, { type: 'time' })}</div>
        ${input('Location', 'location', course?.location, { placeholder: 'e.g. Station 1 · Training Room' })}
        ${input('EMS instructor of record', 'instructor', course?.instructor, { max: 100 })}
      </section>
      <section class="panel form-panel">
        <h2>CE credit hours</h2>
        <p class="subtle">Enter hours in 0.5-hour increments.</p>
        <div class="allocation">${categories.map(([key, label]) => `<label><span><i class="category-dot ${key}"></i>${label}</span><input name="${key}" type="number" min="0" max="12" step="0.5" value="${(course?.credits[key] || 0) / 2}" inputmode="decimal" required></label>`).join('')}</div>
        <div class="allocation-total"><strong>Total credit hours</strong><output id="hours-total">${editing ? displayHours(totalUnits(course.credits)) : '0'}</output></div>
      </section>
      <div class="form-actions">${errorLine}<a class="button secondary" href="${h(back)}">Cancel</a><button type="submit" class="button primary">${icon(editing ? 'check' : 'plus')} ${editing ? 'Save changes' : 'Create draft training'}</button></div>
    </form>`
}

export function trainingDetails(course, attendees, evaluations, link, configured) {
  const { id, phase } = course
  const ended = phase === 'ended'
  const confirmed = attendees.filter(person => person.confirmedAt).length
  const shared = link('attend', id)
  const scores = Object.values(evaluations)
  return `
    <a class="back" href="${h(link('home'))}">${icon('back')} All trainings</a>
    <div class="page-heading"><div><div class="heading-with-pill"><h1>${h(course.title)}</h1>${pill(phase)}</div>${courseMeta(course)}</div>
      <div class="action-row">
        ${phase === 'draft' ? `<a class="button secondary" href="${h(link('edit', id))}">Edit training</a><button type="button" class="button primary" data-action="open-course">Open class sign-in</button>` : ''}
        ${phase === 'open' ? '<button type="button" class="button primary" data-action="end-course">End class &amp; open evaluations</button>' : ''}
      </div>
    </div>
    <div class="details-grid">
      <section class="panel details-panel"><h2>Class link</h2>
        ${phase === 'draft' ? '<p>Open sign-in when attendees are ready to sign in for this class.</p>' : ended ? '<p>Attendees use the private link they received at sign-in. You can copy a link for an attendee from the roster.</p>' :
          `<p>Share this link with attendees at the start of class.</p><div class="copy-row"><input aria-label="Class sign-in link" readonly value="${h(shared)}"><button class="button secondary" type="button" data-action="copy-class">${icon('copy')} Copy link</button><a class="button secondary" href="${h(shared)}" target="_blank" rel="noopener">Open ${icon('arrow')}</a></div>`}
        ${phase === 'draft' && !configured ? `<a class="text-link" href="${h(link('settings'))}">Add certificate settings ${icon('chevron')}</a>` : ''}
      </section>
      <section class="panel details-panel"><h2>Course instructor &amp; credits</h2><p>${h(course.instructor)}</p>
        <div class="credit-tags">${categories.filter(([key]) => course.credits[key]).map(([key, label]) => `<span><i class="category-dot ${key}"></i>${label} · ${displayHours(course.credits[key])} hr</span>`).join('')}</div>
      </section>
    </div>
    <section class="panel roster-panel">
      <div class="panel-heading spread"><div><h2>Attendance roster</h2><p>${attendees.length} signed in · ${confirmed} confirmed · ${scores.length} evaluated</p></div>
        <div class="action-row">${phase !== 'draft' ? '<button type="button" class="button secondary" data-action="refresh">Refresh roster</button>' : ''}
        ${attendees.length ? `<button type="button" class="button secondary" data-action="export">${icon('download')} Export roster CSV</button>` : ''}</div></div>
      ${ended && attendees.length ? '<p class="roster-help">Confirm completion after verifying each attendee met the course requirements. The certificate becomes available after confirmation and the evaluation.</p>' : ''}
      ${attendees.length ? `<div class="table-wrap"><table class="roster-table"><thead><tr><th scope="col">Attendee</th><th scope="col">Department</th><th scope="col">Level</th><th scope="col">Evaluation</th><th scope="col">Completion</th><th scope="col"><span class="sr-only">Private link</span></th></tr></thead>
      <tbody>${attendees.map(person => `<tr><td><strong>${h(person.firstName)} ${h(person.lastName)}</strong></td><td>${h(person.department)}</td><td>${h(person.level)}</td>
        <td>${evaluations[person.id] ? '<span class="text-status good">Submitted</span>' : '<span class="text-status">Pending</span>'}</td>
        <td>${person.confirmedAt ? '<span class="text-status good">Confirmed</span>' : ended ? `<button class="button small secondary" type="button" data-action="confirm" data-code="${person.id}" aria-label="Confirm completion for ${h(person.firstName)} ${h(person.lastName)}">Confirm completion</button>` : '<span class="text-status">Class in progress</span>'}</td>
        <td><button class="icon-button" type="button" data-action="copy-private" data-code="${person.id}" aria-label="Copy private link for ${h(person.firstName)} ${h(person.lastName)}" title="Copy private link">${icon('link')}</button></td></tr>`).join('')}</tbody></table></div>` :
        '<p class="empty-panel">The roster will appear here after attendees sign in.</p>'}
    </section>
    ${scores.length ? `<section class="panel details-panel evaluation-summary"><h2>Evaluation summary</h2><dl>${ratings.map(([key, label]) => `<div><dt>${label}</dt><dd>${(scores.reduce((sum, score) => sum + score[key], 0) / scores.length).toFixed(1)} / 5</dd></div>`).join('')}</dl></section>` : ''}
    <dialog id="confirm-dialog"><div class="dialog-inner"><h2 id="dialog-title"></h2><p id="dialog-description"></p><form><p class="form-error" data-error role="alert" hidden></p><div class="action-row"><button class="button secondary" data-action="cancel-dialog" type="button">Cancel</button><button class="button primary" type="submit" id="dialog-submit"></button></div></form></div></dialog>`
}

export function settingsView(issuer) {
  return `<div class="page-heading"><div><h1>Certificate settings</h1><p>Enter the approved issuing organization's details. Each class uses the settings saved when sign-in opens.</p></div></div>
    <form data-form="settings" class="panel form-panel issuer-form">
      <h2>Issuing organization</h2>
      ${input('Approved or accredited organization', 'organization', issuer?.organization || department)}
      ${input('Ohio EMS approval or accreditation number', 'approvalNumber', issuer?.approvalNumber, { max: 60 })}
      ${input('Program director name', 'director', issuer?.director, { max: 100 })}
      <label class="field">Program director signature image<input type="file" name="signature" accept="image/png,image/jpeg" ${issuer?.signature ? '' : 'required'}></label>
      <p class="subtle">${issuer?.signature ? 'A signature is saved. Choose a new image to replace it.' : 'Upload an authorized PNG or JPG of the program director’s signature.'}</p>
      ${issuer?.signature ? `<img class="stored-signature" src="${h(signatureUrl(issuer.signature))}" alt="Saved program director signature">` : ''}
      ${errorLine}<div class="action-row"><button class="button primary" type="submit">${icon('check')} Save certificate settings</button></div>
    </form>`
}

function publicCourse(course, label, symbol, content) {
  return `<section class="panel public-card public-course">
    <span class="metric-symbol red">${icon(symbol)}</span><p class="public-label">${label}</p>
    <h1>${h(course.title)}</h1>${courseMeta(course)}${content}
  </section>`
}

export function attendanceForm(course) {
  return publicCourse(course, 'Class sign-in', 'people', `
    <form class="stack separated" data-form="attendance">
      <div class="form-grid">
        ${input('First name', 'firstName', '', { max: 60, autocomplete: 'given-name' })}
        ${input('Last name', 'lastName', '', { max: 60, autocomplete: 'family-name' })}
      </div>
      ${input('Department', 'department', '', { autocomplete: 'organization' })}
      <label class="field">Certification level<select name="level" required><option value="">Select certification level</option>${levels.map(level => `<option>${level}</option>`).join('')}</select></label>
      <p class="subtle">After signing in, save your private link for the evaluation and certificate.</p>
      ${errorLine}<button class="button primary" type="submit">Sign in for class ${icon('chevron')}</button>
    </form>`)
}

export function privateLink(course, attendee, url) {
  return publicCourse(course, 'Attendance recorded', 'circle', `
    <div class="separated stack">
      <h2>Save your private link</h2>
      <p>Your attendance is recorded as <strong>${h(attendee.firstName)} ${h(attendee.lastName)}</strong>. Return to this link after the instructor ends class to complete your evaluation and access your certificate.</p>
      <div class="copy-row"><input aria-label="Private evaluation and certificate link" readonly value="${h(url)}"><button class="button secondary" type="button" data-action="copy-current">${icon('copy')} Copy link</button></div>
      <button class="button primary" type="button" data-action="refresh">Check evaluation availability</button>
    </div>`)
}

export function evaluationForm(course, attendee) {
  return publicCourse(course, 'Course evaluation', 'file', `
    <form class="stack separated" data-form="evaluation">
      <p>Welcome, <strong>${h(attendee.firstName)}</strong>. Rate each statement to complete your evaluation.</p>
      ${ratings.map(([key, label, prompt]) => `<fieldset class="rating"><legend>${prompt}</legend><div class="rating-options">${[1, 2, 3, 4, 5].map(value => `<label><input type="radio" name="${key}" value="${value}" aria-label="${label}, ${value} of 5" required><span>${value}</span></label>`).join('')}</div><div class="rating-labels"><span>Strongly disagree</span><span>Strongly agree</span></div></fieldset>`).join('')}
      <label class="field">Comments <span class="optional">(optional)</span><textarea name="comments" maxlength="1500" rows="4" placeholder="What worked well? What could we improve?"></textarea></label>
      ${errorLine}<button class="button primary" type="submit">Submit evaluation ${icon('chevron')}</button>
    </form>`)
}

function signatureUrl(value) {
  return /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(value) ? value : ''
}

export function certificateView(course, attendee, certificate, demo, reference) {
  const { issuer } = certificate
  return `<div class="certificate-area">
    <div class="certificate-actions"><div><h1>Your certificate</h1><p>Save a PDF copy or print for your records.</p></div><button class="button primary" type="button" data-action="print">${icon('print')} Print / Save PDF</button></div>
    <article class="certificate" aria-label="EMS continuing education certificate">
      <div class="certificate-inner">
        <div class="certificate-brand">${logo}<div><strong>${department}</strong><span>Ohio EMS Continuing Education</span></div></div>
        ${demo ? '<p class="certificate-demo">SAMPLE · NO CE CREDIT</p>' : ''}
        <h2>Certificate of Completion</h2>
        <p class="certificate-intro">Presented to</p>
        <p class="certificate-name">${h(attendee.firstName)} ${h(attendee.lastName)}</p>
        <p class="certificate-intro">for successfully completing</p>
        <h3>${h(course.title)}</h3>
        <p class="certificate-date">${displayDate(course.date, { month: 'long', day: 'numeric', year: 'numeric' })} &nbsp;·&nbsp; <strong>${displayHours(totalUnits(course.credits))} total CE hours</strong></p>
        <ul class="certificate-credits" aria-label="Hours by subject area">${categories.map(([key, label]) => `<li><strong>${displayHours(course.credits[key])}</strong><span>${label}</span></li>`).join('')}</ul>
        <div class="certificate-bottom"><div class="certificate-sign">
          ${signatureUrl(issuer.signature) ? `<img src="${h(signatureUrl(issuer.signature))}" alt="Program director signature">` : '<span class="demo-signature">Sample signature</span>'}
          <strong>${h(issuer.director)}</strong><span>Program director</span>
        </div><div class="certificate-issuer"><strong>${h(issuer.organization)}</strong><span>Ohio EMS approval / accreditation no. ${h(issuer.approvalNumber)}</span><span>Record ${h(reference)}</span></div></div>
      </div>
    </article>
  </div>`
}
