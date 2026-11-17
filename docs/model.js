export const department = 'Pleasant Township Fire Department'
export const categories = [
  ['pediatrics', 'Pediatrics'], ['geriatric', 'Geriatric'], ['cardiac', 'Cardiac'],
  ['trauma', 'Trauma'], ['other', 'Other'],
]
export const levels = ['EMR', 'EMT', 'AEMT', 'Paramedic']
export const ratings = [
  ['content', 'Course content', 'The training content was relevant to my EMS practice.'],
  ['instructor', 'Instructor', 'The instructor presented the material clearly.'],
  ['facility', 'Training facility', 'The training space and equipment supported learning.'],
]
export const phases = { draft: 'Draft', open: 'Sign-in open', ended: 'Completed' }
export const classIdPattern = /^[a-f0-9]{24}$/
export const receiptPattern = /^[a-f0-9]{48}$/

export function randomId(bytes) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), byte => byte.toString(16).padStart(2, '0')).join('')
}

export function totalUnits(credits) {
  return categories.reduce((total, [key]) => total + credits[key], 0)
}

export function displayHours(units) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(units / 2)
}

export function displayDate(date, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  return new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))
}

export function ohioDate(offset = 0) {
  const format = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' })
  const parts = Object.fromEntries(format.formatToParts().map(({ type, value }) => [type, value]))
  const date = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day) + offset))
  return date.toISOString().slice(0, 10)
}

export function displayTime(value) {
  const [hour, minute] = value.split(':').map(Number)
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`
}

export function timestamp(value) {
  return value?.toMillis ? value.toMillis() : (value || 0)
}

export function courseValues(data) {
  const credits = Object.fromEntries(categories.map(([key]) => [key, Number(data.get(key)) * 2]))
  if (Object.values(credits).some(units => !Number.isInteger(units) || units < 0 || units > 24)) {
    throw new Error('Enter credit hours in half-hour increments.')
  }
  const units = totalUnits(credits)
  if (units < 1 || units > 24) throw new Error('Enter 0.5 to 12 total credit hours for this class.')

  const fields = ['title', 'date', 'startTime', 'endTime', 'location', 'instructor']
  const values = Object.fromEntries(fields.map(key => [key, String(data.get(key) || '').trim()]))
  if (fields.some(key => !values[key])) throw new Error('Complete each class details field.')
  if (values.endTime <= values.startTime) throw new Error('The end time must be after the start time on the class date.')
  return { ...values, credits }
}

export function attendanceValues(data) {
  const names = ['firstName', 'lastName', 'department', 'level']
  const values = Object.fromEntries(names.map(key => [key, String(data.get(key) || '').trim()]))
  if (names.some(key => !values[key]) || !levels.includes(values.level)) throw new Error('Complete each attendance field.')
  return values
}

export function evaluationValues(data) {
  const values = Object.fromEntries(ratings.map(([key]) => [key, Number(data.get(key))]))
  if (Object.values(values).some(value => !Number.isInteger(value) || value < 1 || value > 5)) {
    throw new Error('Select a rating for each question.')
  }
  return { ...values, comments: String(data.get('comments') || '').trim() }
}
