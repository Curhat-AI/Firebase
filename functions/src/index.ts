/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import * as functions from "firebase-functions/v1";
import {
  beforeUserCreated,
} from "firebase-functions/v2/identity";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

admin.initializeApp();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info('Hello logs!', { structuredData: true });
//   response.send('Hello from Firebase!');
// });

export const userWillCreated = beforeUserCreated(async (event) => {
  const user = event.data;
  const roles = {
    patient: false,
    counselor: false,
  };
    // add to firestore
  const userDoc = admin.firestore().collection("users").doc(user.uid);
  await Promise.all([
    userDoc.create(
      {
        email: user.email,
        displayName: user.displayName || user.email?.split("@")[0],
        photoURL: user.photoURL || "",
        roles,
        details: {
          dob: null,
          gender: null,
          photoUrl: null,
          phone: null,
        },
      }
    ),
  ]);

  return logger.info(`User ${user.uid} created with custom claims`);
});

export const changeUserRole = functions
  .region("asia-southeast2")
  .firestore.document("users/{userId}")
  .onUpdate(async (change, context) => {
    const {before, after} = change;
    const {userId} = context.params;

    // check if role changed
    if (before.data().roles !== after.data().roles) {
      // set custom claims
      await admin.auth().setCustomUserClaims(userId, after.data().roles);
    }
  });
