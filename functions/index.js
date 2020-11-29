/* eslint-disable promise/catch-or-return */
/* eslint-disable promise/always-return */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

// ############################################
// #                                          #
// # we arent freakin using functions anymore #
// #                                          #
// # look at github history to see them       #
// ############################################

