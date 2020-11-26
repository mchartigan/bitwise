/* eslint-disable promise/catch-or-return */
/* eslint-disable promise/always-return */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

exports.user = functions.https.onRequest((req, res) => {
    // isolate the username we are looking for
    var urlstring = req.path.split('/');
    var username;

    if (urlstring.length === 3 && urlstring[1] === 'user') {
        username = urlstring[2];
        // search the database for that username
        if (username === "null") {
            res.status(200);
        } else {
            db.collection('users')
                .where('username', '==', username).get()
                .then(querySnapshot => {
                    if (querySnapshot.empty) {
                        // user not found
                        res.status(404).sendFile('/public/404.html', { root: '../' });
                    } else {
                        // querySnapshot.docs[0].id;
                        res.status(200).sendFile('/public/common/profile.html', { root: '../' });
                    }
                });
        }
    } else {
        res.status(404).sendFile('/public/404.html', { root: '../' });
    }
});

exports.topic = functions.https.onRequest((req, res) => {
    // isolate the username we are looking for
    var urlstring = req.path.split('/');
    var topicname;

    if (urlstring.length === 3 && urlstring[1] === 'topic') {
        topicname = urlstring[2];
        // search the database for that username
        if (topicname === "null") {
            res.status(200);
        } else {
            db.collection('topics')
                .where('name', '==', topicname).get()
                .then(querySnapshot => {
                    if (querySnapshot.empty) {
                        // user not found
                        res.status(404).sendFile('/public/404.html', { root: '../' });
                    } else {
                        // querySnapshot.docs[0].id;
                        res.status(200).sendFile('/public/common/topic.html', { root: '../' });
                    }
                });
        }
    } else {
        res.status(404).sendFile('/public/404.html', { root: '../' });
    }
});

exports.post = functions.https.onRequest((req, res) => {
    // isolate the username we are looking for
    var urlstring = req.path.split('/');
    var postID;

    if (urlstring.length === 3 && urlstring[1] === 'post') {
        postID = urlstring[2];
        // search the database for that username
        if (postID === "null") {
            res.status(200);
        } else {
            db.collection('posts')
                .doc(postID).get()
                .then(() => {
                    res.status(200).sendFile('/public/common/post.html', { root: '../' });
                }).catch(() => {
                    res.status(404).sendFile('/public/404.html', { root: '../' });
                });
        }
    } else {
        res.status(404).sendFile('/public/404.html', { root: '../' });
    }
});