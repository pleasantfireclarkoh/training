import { ohioDate } from './model.js'

const storageKey = 'ptfd-ce-demo-v1'
const liveId = '100000000000000000000001'
const exampleReceipt = 'd'.repeat(48)

function example(id, title, offset, phase, credits, instructor, location) {
  return {
    id, title, date: ohioDate(offset), phase, credits: { pediatrics: 0, geriatric: 0, cardiac: 0, trauma: 0, other: 0, ...credits },
    instructor, location, startTime: '18:00', endTime: '20:00', createdAt: Date.now(),
    closedAt: phase === 'ended' ? Date.now() : null,
  }
}

function seed() {
  const courses = [
    example(liveId, 'Pediatric Assessment & Airway', 0, 'open', { pediatrics: 4 }, 'Morgan Ellis', 'Station 1 · Training Room'),
    example('100000000000000000000002', 'Cardiac Emergencies & 12-Lead ECG', 7, 'draft', { cardiac: 4 }, 'Jamie Brooks', 'Station 1 · Training Room'),
    example('100000000000000000000003', 'Trauma Patient Management', -6, 'ended', { trauma: 6 }, 'Taylor Hayes', 'Station 1 · Apparatus Bay'),
    example('100000000000000000000004', 'Geriatric Falls & Assessment', -13, 'ended', { geriatric: 3 }, 'Morgan Ellis', 'Station 1 · Training Room'),
    example('100000000000000000000005', 'EMS Operations & Scene Safety', -20, 'ended', { other: 4 }, 'Casey Reed', 'Station 1 · Training Room'),
  ]
  const ended = courses[2].id
  const person = { firstName: 'Alex', lastName: 'Parker', department: 'Example EMS', level: 'EMT', signedInAt: Date.now(), confirmedAt: null }
  const issuer = { organization: 'Pleasant Township Fire Department', approvalNumber: 'DEMO ONLY', director: 'Sample Program Director', signature: '' }
  return {
    courses: Object.fromEntries(courses.map(course => [course.id, course])), issuer,
    courseIssuers: Object.fromEntries(courses.filter(course => course.phase !== 'draft').map(course => [course.id, issuer])),
    attendees: { [liveId]: { [exampleReceipt]: person }, [ended]: { [exampleReceipt]: { ...person, confirmedAt: Date.now() } } },
    evaluations: { [ended]: { [exampleReceipt]: { content: 5, instructor: 5, facility: 4, comments: 'The case exercises were helpful.', submittedAt: Date.now() } } },
    certificates: { [ended]: { [exampleReceipt]: { issuer, confirmedAt: Date.now() } } },
  }
}

export function openDemo() {
  function read() {
    return JSON.parse(localStorage.getItem(storageKey) || 'null') || seed()
  }

  function change(action) {
    const state = read()
    action(state)
    localStorage.setItem(storageKey, JSON.stringify(state))
  }

  if (!localStorage.getItem(storageKey)) change(() => {})
  const rows = bucket => Object.entries(bucket || {}).map(([id, data]) => ({ id, ...data }))
  return {
    user: { email: 'Demo administrator' },
    admin: async () => true,
    listCourses: async () => Object.values(read().courses),
    getCourse: async id => read().courses[id] || null,
    getIssuer: async () => read().issuer,
    saveIssuer: async values => change(state => { state.issuer = values }),
    saveCourse: async (id, values, existing) => change(state => {
      state.courses[id] = { ...(existing ? state.courses[id] : { id, phase: 'draft', createdAt: Date.now(), closedAt: null }), ...values }
    }),
    openCourse: async id => change(state => {
      if (state.courses[id].phase !== 'draft') throw new Error('This training has already been opened.')
      state.courseIssuers[id] = state.issuer
      state.courses[id].phase = 'open'
    }),
    endCourse: async id => change(state => {
      if (state.courses[id].phase !== 'open') throw new Error('Sign-in is already closed.')
      Object.assign(state.courses[id], { phase: 'ended', closedAt: Date.now() })
    }),
    listAttendees: async id => rows(read().attendees[id]),
    listEvaluations: async id => rows(read().evaluations[id]),
    getAttendee: async (id, code) => read().attendees[id]?.[code] || null,
    getEvaluation: async (id, code) => read().evaluations[id]?.[code] || null,
    getCertificate: async (id, code) => {
      const state = read()
      return state.evaluations[id]?.[code] ? state.certificates[id]?.[code] || null : null
    },
    signIn: async (id, code, values) => change(state => {
      if (state.courses[id].phase !== 'open') throw new Error('Sign-in is closed for this class.')
      state.attendees[id] ||= {}
      state.attendees[id][code] ||= { ...values, signedInAt: Date.now(), confirmedAt: null }
    }),
    submitEvaluation: async (id, code, values) => change(state => {
      if (state.courses[id].phase !== 'ended' || !state.attendees[id]?.[code]) throw new Error('This evaluation is unavailable.')
      state.evaluations[id] ||= {}
      state.evaluations[id][code] ||= { ...values, submittedAt: Date.now() }
    }),
    confirmAttendee: async (id, code) => change(state => {
      const attendee = state.attendees[id]?.[code]
      if (state.courses[id].phase !== 'ended' || !attendee) throw new Error('Completion cannot be confirmed yet.')
      const confirmedAt = attendee.confirmedAt || Date.now()
      attendee.confirmedAt = confirmedAt
      state.certificates[id] ||= {}
      state.certificates[id][code] ||= { issuer: state.courseIssuers[id], confirmedAt }
    }),
  }
}
