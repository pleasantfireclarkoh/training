import { firebaseConfig } from './firebase-config.js'
import {
  attendanceValues, categories, classIdPattern, courseValues, displayHours, evaluationValues,
  randomId, ratings, receiptPattern, timestamp, totalUnits,
} from './model.js'
import {
  attendanceForm, certificateView, courseForm, dashboard, evaluationForm, h, loginView, message,
  privateLink, publicShell, settingsView, shell, trainingDetails,
} from './views.js'

const app = document.querySelector('#app')
const notice = document.querySelector('#notice')
const params = new URLSearchParams(location.search)
const route = params.get('page') || 'home'
const classId = params.get('class') || ''
const receipt = location.hash.slice(1)
const publicRoute = route === 'attend' || route === 'return'
const demo = params.get('demo') === '1' || (!firebaseConfig && !publicRoute)
let store
let course
let issuer
let attendees = []
let evaluations = {}
let emailJobs = {}
let pendingReceipt
let noticeTimer
let dialogAction
let rendering = false

function link(page, id, code) {
  const url = new URL(location.pathname, location.origin)
  if (demo) url.searchParams.set('demo', '1')
  if (page !== 'home') url.searchParams.set('page', page)
  if (id) url.searchParams.set('class', id)
  if (code) url.hash = code
  return url.href
}

function show(inner, admin = false) {
  const options = { demo, route, link, user: store?.user }
  app.innerHTML = admin ? shell(inner, options) : publicShell(inner, options)
}

function errorText(error) {
  if (['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password'].includes(error.code)) {
    return 'The email or password is incorrect.'
  }
  if (error.code === 'auth/too-many-requests') return 'Too many attempts. Wait a few minutes and try again.'
  if (['unavailable', 'auth/network-request-failed', 'failed-precondition', 'deadline-exceeded'].includes(error.code)) {
    return 'The service could not be reached. Check your connection and try again.'
  }
  if (error.code === 'permission-denied') return 'The request is unavailable or your access has changed. Refresh the page and try again.'
  if (error.code?.startsWith('auth/')) return 'Sign-in is unavailable. Contact the program administrator if this continues.'
  return error.message || 'Something went wrong. Please try again.'
}

function toast(text) {
  clearTimeout(noticeTimer)
  notice.textContent = text
  notice.hidden = false
  noticeTimer = setTimeout(() => { notice.hidden = true }, 4400)
}

function formError(form, error) {
  const output = form.querySelector('[data-error]')
  output.textContent = error ? errorText(error) : ''
  output.hidden = !error
}

function refreshButton(label = 'Refresh status') {
  return `<button class="button secondary" type="button" data-action="refresh">${label}</button>`
}

async function renderPublic() {
  const returnLink = route === 'return'
  if (!classIdPattern.test(classId) || (returnLink && !receiptPattern.test(receipt))) {
    show(message('Class link unavailable', 'Ask your instructor for the class sign-in link or your private link.'))
    return
  }
  try {
    course = await store.getCourse(classId)
  } catch (error) {
    if (error.code !== 'permission-denied') throw error
    course = null
  }
  if (!course || course.phase === 'draft') {
    show(message('Class link unavailable', 'Check the class link or ask your instructor when sign-in will open.', refreshButton()))
    return
  }
  if (!returnLink) {
    if (course.phase === 'open') {
      pendingReceipt ||= randomId(24)
      show(attendanceForm(course))
    } else {
      show(message('Class sign-in has closed', 'Use the private link you received at sign-in to complete your evaluation. Your instructor can help you recover your link.'))
    }
    return
  }
  const attendee = await store.getAttendee(classId, receipt)
  if (!attendee) {
    show(message('Private link unavailable', 'Ask your instructor to confirm your attendance and send you the correct private link.'))
    return
  }
  if (course.phase === 'open') {
    const emailJob = attendee.email ? await store.getEmailJob(classId, receipt) : null
    show(privateLink(course, attendee, link('return', classId, receipt), emailJob))
    return
  }
  if (!await store.getEvaluation(classId, receipt)) {
    show(evaluationForm(course, attendee))
    return
  }
  if (!attendee.confirmedAt) {
    show(message('Evaluation submitted', 'Your certificate will appear at this private link after the instructor confirms your completion.', refreshButton('Check certificate availability'), 'circle'))
    return
  }
  const certificate = await store.getCertificate(classId, receipt)
  if (!certificate) {
    show(message('Certificate is unavailable', 'Contact your instructor for help with this certificate.', refreshButton()))
    return
  }
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${classId}:${receipt}`))
  const reference = Array.from(new Uint8Array(digest).slice(0, 6), byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase()
  show(certificateView(course, attendee, certificate, demo, reference))
}

async function renderAdmin() {
  if (!await store.admin()) {
    if (store.user) {
      show(message('Administrator access required', 'The signed-in account does not have access to this portal.', '<button type="button" data-action="logout" class="button primary">Sign out</button>', 'lock'))
    } else {
      show(loginView())
    }
    return
  }
  if (route === 'settings') {
    issuer = await store.getIssuer()
    show(settingsView(issuer), true)
    return
  }
  if (route === 'new') {
    show(courseForm(null, link), true)
    return
  }
  if (['training', 'edit'].includes(route) && classIdPattern.test(classId)) {
    course = await store.getCourse(classId)
    if (!course) {
      show(message('Training unavailable', 'Check the training link or return to the list.', `<a class="button secondary" href="${h(link('home'))}">All trainings</a>`), true)
    } else if (route === 'edit' && course.phase === 'draft') {
      show(courseForm(course, link), true)
    } else {
      const [people, scores, settings, jobs] = await Promise.all([
        store.listAttendees(classId),
        course.phase === 'ended' ? store.listEvaluations(classId) : [],
        course.phase === 'draft' ? store.getIssuer() : null,
        course.phase !== 'draft' ? store.listEmailJobs(classId) : [],
      ])
      attendees = people.sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName))
      evaluations = Object.fromEntries(scores.map(score => [score.id, score]))
      emailJobs = Object.fromEntries(jobs.map(job => [job.attendeeId, job]))
      show(trainingDetails(course, attendees, evaluations, link, !!settings, emailJobs), true)
    }
    return
  }
  const courses = await store.listCourses()
  const priority = { open: 0, draft: 1, ended: 2 }
  courses.sort((a, b) => priority[a.phase] - priority[b.phase] || b.date.localeCompare(a.date) || timestamp(b.createdAt) - timestamp(a.createdAt))
  show(dashboard(courses, link), true)
}

async function render() {
  if (rendering) return
  rendering = true
  try {
    await (publicRoute ? renderPublic() : renderAdmin())
  } catch (error) {
    show(message('EMS Continuing Education is unavailable', errorText(error), refreshButton('Try again')))
  } finally {
    rendering = false
  }
}

async function copy(text, fallback) {
  try {
    await navigator.clipboard.writeText(text)
    toast('Link copied.')
  } catch {
    if (fallback) {
      fallback.focus()
      fallback.select()
      toast('Select Copy in your browser or use your keyboard shortcut.')
    } else {
      showCopyDialog(text)
    }
  }
}

function showCopyDialog(text) {
  const dialog = document.createElement('dialog')
  dialog.setAttribute('aria-label', 'Copy private link')
  dialog.innerHTML = '<div class="dialog-inner"><h2>Copy private link</h2><p>Share this link directly with the attendee.</p><input aria-label="Private link" readonly><form method="dialog"><div class="action-row"><button class="button secondary">Close</button></div></form></div>'
  document.body.append(dialog)
  const input = dialog.querySelector('input')
  input.value = text
  dialog.addEventListener('close', () => dialog.remove(), { once: true })
  dialog.showModal()
  input.select()
}

function showConfirm(title, explanation, label, action) {
  const dialog = document.querySelector('#confirm-dialog')
  dialog.querySelector('#dialog-title').textContent = title
  dialog.querySelector('#dialog-description').textContent = explanation
  dialog.querySelector('#dialog-submit').textContent = label
  formError(dialog.querySelector('form'), null)
  dialogAction = action
  dialog.showModal()
}

function exportRoster() {
  const columns = ['First name', 'Last name', 'Email', 'Link email status', 'Department', 'Level', 'Signed in (UTC)', 'Confirmed (UTC)', 'Evaluation submitted (UTC)', ...ratings.map(([, label]) => `${label} rating`), 'Comments']
  const iso = value => value ? new Date(timestamp(value)).toISOString() : ''
  const rows = attendees.map(person => {
    const score = evaluations[person.id]
    return [person.firstName, person.lastName, person.email, emailJobs[person.id]?.status, person.department, person.level, iso(person.signedInAt),
      iso(person.confirmedAt), iso(score?.submittedAt), ...ratings.map(([key]) => score?.[key]), score?.comments]
  })
  const cell = value => {
    let text = String(value ?? '')
    if (/^[\s\uFEFF]*[=+\-@]|^[\t\r\n]/.test(text)) text = `'${text}`
    return `"${text.replaceAll('"', '""')}"`
  }
  const content = [columns, ...rows].map(row => row.map(cell).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `ptfd-ce-roster-${course.date}-${course.id.slice(0, 8)}.csv`
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function prepareSignature(file) {
  if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 8 * 1024 * 1024) {
    throw new Error('Choose a PNG or JPG signature image under 8 MB.')
  }
  const image = await createImageBitmap(file)
  try {
    const canvas = document.createElement('canvas')
    const ratio = Math.min(600 / image.width, 170 / image.height, 1)
    canvas.width = Math.max(1, Math.round(image.width * ratio))
    canvas.height = Math.max(1, Math.round(image.height * ratio))
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
    const png = canvas.toDataURL('image/png')
    if (png.length >= 90000) throw new Error('Use a cropped signature image with a plain background.')
    return png
  } finally {
    image.close()
  }
}

async function saveSettings(data) {
  const fields = ['organization', 'approvalNumber', 'director']
  const values = Object.fromEntries(fields.map(key => [key, String(data.get(key) || '').trim()]))
  if (fields.some(key => !values[key])) throw new Error('Complete the issuing organization, approval number, and program director fields.')
  const file = data.get('signature')
  values.signature = file.size ? await prepareSignature(file) : issuer?.signature
  if (!values.signature) throw new Error('Upload the authorized program director’s signature.')
  await store.saveIssuer(values)
  await render()
  toast('Certificate settings saved.')
}

document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault()
  const main = document.querySelector('#main-content')
  main.tabIndex = -1
  main.focus()
})

app.addEventListener('click', async event => {
  const button = event.target.closest('[data-action]')
  if (!button || button.disabled) return
  const action = button.dataset.action
  const code = button.dataset.code
  try {
    if (action === 'logout') {
      await store.logout()
      location.assign(link('home'))
    } else if (action === 'refresh') {
      if (!store) location.reload()
      else await render()
    } else if (action === 'copy-class') {
      await copy(link('attend', classId), button.parentElement.querySelector('input'))
    } else if (action === 'copy-private') {
      await copy(link('return', classId, code))
    } else if (action === 'copy-current') {
      await copy(link('return', classId, receipt), button.parentElement.querySelector('input'))
    } else if (action === 'resend-email') {
      const person = attendees.find(attendee => attendee.id === code)
      showConfirm(`Email the personal link to ${person.firstName} ${person.lastName}?`, `Send to ${person.email}. If the previous email needs attention, check whether it arrived before sending another copy.`, 'Queue email', async () => {
        await store.resendEmail(classId, code)
        toast(demo ? 'Demo email simulated.' : 'Personal link email queued.')
      })
    } else if (action === 'open-course') {
      showConfirm('Open class sign-in?', 'Attendees will be able to sign in with the class link. Class details and certificate settings will be saved for this session.', 'Open sign-in', async () => {
        await store.openCourse(classId)
        toast('Class sign-in is open.')
      })
    } else if (action === 'end-course') {
      showConfirm('End this class?', 'This closes sign-in and opens the evaluation for everyone on the roster.', 'End class', async () => {
        await store.endCourse(classId)
        toast('Evaluations are now open.')
      })
    } else if (action === 'confirm') {
      const person = attendees.find(attendee => attendee.id === code)
      showConfirm(`Confirm completion for ${person.firstName} ${person.lastName}?`, 'Confirm that this attendee successfully completed the course. Their certificate becomes available once they submit the evaluation.', 'Confirm completion', async () => {
        await store.confirmAttendee(classId, code)
        toast('Completion confirmed.')
      })
    } else if (action === 'cancel-dialog') {
      button.closest('dialog').close()
    } else if (action === 'export') {
      exportRoster()
    } else if (action === 'print') {
      await document.fonts.ready
      await Promise.all(Array.from(document.querySelectorAll('.certificate img'), image => image.decode()))
      window.print()
    }
  } catch (error) {
    toast(errorText(error))
  }
})

app.addEventListener('submit', async event => {
  const form = event.target
  const kind = form.dataset.form
  const dialog = form.closest('#confirm-dialog')
  if (!kind && !dialog) return
  event.preventDefault()
  const button = form.querySelector('button[type="submit"]')
  if (button.disabled) return
  formError(form, null)
  button.disabled = true
  try {
    const data = new FormData(form)
    if (dialog) {
      await dialogAction()
      dialog.close()
      await render()
    } else if (kind === 'login') {
      await store.login(String(data.get('email')).trim(), data.get('password'))
      await render()
    } else if (kind === 'course') {
      const existing = route === 'edit'
      const id = existing ? classId : randomId(12)
      await store.saveCourse(id, courseValues(data), existing)
      location.assign(link('training', id))
    } else if (kind === 'settings') {
      await saveSettings(data)
    } else if (kind === 'attendance') {
      await store.signIn(classId, pendingReceipt, attendanceValues(data))
      location.replace(link('return', classId, pendingReceipt))
    } else if (kind === 'evaluation') {
      await store.submitEvaluation(classId, receipt, evaluationValues(data))
      await render()
    }
  } catch (error) {
    formError(form, error)
  } finally {
    button.disabled = false
  }
})

function updateFields(event) {
  if (event.target.matches('#training-search, #training-phase')) {
    const term = document.querySelector('#training-search').value.toLowerCase().trim()
    const phase = document.querySelector('#training-phase').value
    const rows = Array.from(document.querySelectorAll('[data-training]'))
    rows.forEach(row => { row.hidden = !row.dataset.title.includes(term) || (phase !== '' && phase !== row.dataset.phase) })
    document.querySelector('#training-empty').hidden = rows.some(row => !row.hidden)
  }
  const form = event.target.closest('[data-form="course"]')
  if (form && categories.some(([key]) => key === event.target.name)) {
    const credits = Object.fromEntries(categories.map(([key]) => [key, (form.elements[key].valueAsNumber || 0) * 2]))
    document.querySelector('#hours-total').value = displayHours(totalUnits(credits))
  }
}

app.addEventListener('input', updateFields)
app.addEventListener('change', updateFields)

if (demo) {
  try {
    const { openDemo } = await import('./demo-store.js')
    store = openDemo()
    await render()
  } catch (error) {
    show(message('Demo is unavailable', errorText(error), refreshButton('Try again')))
  }
} else if (!firebaseConfig) {
  show(message('The CE system is being configured', 'Ask your instructor when the live class links will be available.'))
} else {
  try {
    const { openFirebase } = await import('./firebase-store.js')
    store = await openFirebase(firebaseConfig)
    await render()
  } catch (error) {
    show(message('EMS Continuing Education is unavailable', errorText(error), refreshButton('Try again')))
  }
}
