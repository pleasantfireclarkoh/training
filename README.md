# Pleasant Township Fire Department EMS Continuing Education

A GitHub Pages site for managing in-person Ohio EMS continuing education classes. Firebase Authentication handles administrator access. Cloud Firestore stores courses, attendance, evaluations, and certificate records.

## Preview locally

Run `npm start` from the project folder. Open [the demo](http://127.0.0.1:4173/?demo=1) using sample information. Demo records stay in the browser. To try the full demo in two tabs, create and open a class, open the class link, sign in, then refresh the roster tab and end the class. Open the private link to submit the evaluation and confirm completion in the roster. The certificate is marked as a sample.

## Connect Firebase and GitHub Pages

1. Register a web app in the Firebase project. Put its public web configuration in `docs/firebase-config.js`. The current file targets the `ptfd-ce-site` project.
2. Create the default Cloud Firestore database in production mode. Publish the contents of `firestore.rules` from its Rules tab, or use `firebase deploy --only firestore:rules --project ptfd-ce-site` from this folder with the Firebase CLI signed in.
3. Enable the Email/Password provider in Firebase Authentication. Create the administrator's user under Authentication → Users. In Firestore, create a document in the `admins` collection with the Firebase Auth UID as its ID and a Boolean field `active` set to `true`. Set it to `false` to revoke portal access. Use a dedicated administrator account with a unique password.
4. Commit the source to the GitHub repository. In Settings → Pages, select **Deploy from a branch**, choose the publishing branch, and select **/docs**. Visit the resulting HTTPS address. Add the Pages hostname under Firebase Authentication → Settings → Authorized domains. If testing the live backend locally, add `localhost` and use `http://localhost:4173/`.
5. Sign in to the portal and fill out **Certificate settings** using the approved issuing organization's name, its Ohio EMS approval or accreditation number, and the authorized program director's name and signature image. Run a sample class before distributing class links.

GitHub Pages publishes the `docs` directory. The original certificate references in `assets` contain personal information and should stay outside the GitHub repository. The site uses the department logo already copied to `docs/img`. Keep Firebase account credentials, attendee data, and roster exports outside the repository.

## Run a class

1. **Create training.** Enter the title, date, time (Ohio Eastern Time), location, EMS instructor of record, and credit hours for Pediatrics, Geriatric, Cardiac, Trauma, and Other. Hours can be split between categories. The site accepts 0.5 to 12 total hours for a single-day class.
2. **Open class sign-in.** Share the class link at the session. Attendees provide their first and last name, department, and one of EMR, EMT, AEMT, or Paramedic. Each attendee should save their private link. A program administrator can recover the link for an attendee through the roster.
3. **End the class.** This closes sign-in and makes the evaluation available through each private link. Confirm each participant's successful completion in the roster after checking the course's completion requirements.
4. **Issue a certificate.** The participant's private link shows the certificate when the roster records confirmation and the evaluation is complete. They can print it or use their browser's Save as PDF option. Training details and approved issuer data are fixed when sign-in opens. Use a new draft for a repeat offering.
5. **Keep records.** Review the evaluation summary and export the roster and individual ratings and comments as CSV. Treat those exports and private attendee links as confidential. The portal tracks course feedback and completion confirmation. Maintain the course materials, any physician and instructor documentation, and knowledge or skill testing records in the approved program's records.

See [Ohio Administrative Code 4765-7-16](https://codes.ohio.gov/ohio-administrative-code/rule-4765-7-16), [4765-7-09](https://codes.ohio.gov/ohio-administrative-code/rule-4765-7-09), and [4765-19-01](https://codes.ohio.gov/ohio-administrative-code/rule-4765-19-01).
