import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js'
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut,
  setPersistence, browserSessionPersistence,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js'
import {
  getFirestore, collection, doc, getDocFromServer, getDocsFromServer, setDoc, updateDoc,
  writeBatch, runTransaction, serverTimestamp, query, where,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js'

export async function openFirebase(config) {
  const app = initializeApp(config)
  const auth = getAuth(app)
  const db = getFirestore(app)
  const settlement = await new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, current => { unsubscribe(); resolve(current) }, reject)
  })
  let user = settlement

  const courseRef = id => doc(db, 'classes', id)
  const memberRef = (id, receipt) => doc(db, 'classes', id, 'attendees', receipt)
  const evaluationRef = (id, receipt) => doc(db, 'classes', id, 'evaluations', receipt)
  const certificateRef = (id, receipt) => doc(db, 'classes', id, 'certificates', receipt)
  const emailRef = (id, receipt) => doc(db, 'linkEmails', `${id}_${receipt}`)
  const courseIssuer = id => doc(db, 'classes', id, 'private', 'issuer')
  const defaultIssuer = doc(db, 'settings', 'issuer')
  const read = async reference => (await getDocFromServer(reference)).data() ?? null
  const list = async reference => (await getDocsFromServer(reference)).docs.map(item => ({ id: item.id, ...item.data() }))

  return {
    get user() { return user },
    async admin() {
      return !!user && (await read(doc(db, 'admins', user.uid)))?.active === true
    },
    async login(email, password) {
      await setPersistence(auth, browserSessionPersistence)
      user = (await signInWithEmailAndPassword(auth, email, password)).user
    },
    async logout() {
      await signOut(auth)
      user = null
    },
    listCourses: () => list(collection(db, 'classes')),
    async getCourse(id) {
      const data = await read(courseRef(id))
      return data && { id, ...data }
    },
    getIssuer: () => read(defaultIssuer),
    saveIssuer: values => setDoc(defaultIssuer, values),
    async saveCourse(id, values, existing) {
      if (existing) return updateDoc(courseRef(id), values)
      return setDoc(courseRef(id), { ...values, phase: 'draft', createdAt: serverTimestamp(), closedAt: null })
    },
    async openCourse(id) {
      await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(defaultIssuer)
        if (!snapshot.exists()) throw new Error('Save certificate settings before opening sign-in.')
        transaction.set(courseIssuer(id), snapshot.data())
        transaction.update(courseRef(id), { phase: 'open' })
      })
    },
    endCourse: id => updateDoc(courseRef(id), { phase: 'ended', closedAt: serverTimestamp() }),
    listAttendees: id => list(collection(db, 'classes', id, 'attendees')),
    listEvaluations: id => list(collection(db, 'classes', id, 'evaluations')),
    getAttendee: (id, receipt) => read(memberRef(id, receipt)),
    getEvaluation: (id, receipt) => read(evaluationRef(id, receipt)),
    getCertificate: (id, receipt) => read(certificateRef(id, receipt)),
    getEmailJob: (id, receipt) => read(emailRef(id, receipt)),
    listEmailJobs: id => list(query(collection(db, 'linkEmails'), where('classId', '==', id))),
    async resendEmail(id, receipt) {
      const reference = emailRef(id, receipt)
      await runTransaction(db, async transaction => {
        const existing = (await transaction.get(reference)).data()
        if (existing && !['sent', 'needsReview'].includes(existing.status)) {
          throw new Error('This email is already queued or sending. Refresh its status shortly.')
        }
        if (existing) {
          transaction.update(reference, { status: 'pending', queuedAt: serverTimestamp() })
        } else {
          transaction.set(reference, { classId: id, attendeeId: receipt, status: 'pending', queuedAt: serverTimestamp() })
        }
      })
    },
    async signIn(id, receipt, values) {
      const ref = memberRef(id, receipt)
      await runTransaction(db, async transaction => {
        const existing = (await transaction.get(ref)).data()
        if (!existing) {
          transaction.set(ref, { ...values, signedInAt: serverTimestamp(), confirmedAt: null })
          transaction.set(emailRef(id, receipt), {
            classId: id, attendeeId: receipt, status: 'pending', queuedAt: serverTimestamp(),
          })
        } else if (Object.keys(values).some(key => values[key] !== existing[key])) {
          throw new Error('This browser already submitted a sign-in from this form. Reopen the shared class link to sign in someone else.')
        }
      })
    },
    async submitEvaluation(id, receipt, values) {
      const ref = evaluationRef(id, receipt)
      await runTransaction(db, async transaction => {
        if (!(await transaction.get(ref)).exists()) {
          transaction.set(ref, { ...values, submittedAt: serverTimestamp() })
        }
      })
    },
    async confirmAttendee(id, receipt) {
      const issuer = await read(courseIssuer(id))
      if (!issuer) throw new Error('This class is missing its certificate issuer information.')
      const batch = writeBatch(db)
      batch.update(memberRef(id, receipt), { confirmedAt: serverTimestamp() })
      batch.set(certificateRef(id, receipt), { issuer, confirmedAt: serverTimestamp() })
      await batch.commit()
    },
  }
}
