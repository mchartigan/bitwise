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
// # keeping these as a reference in case we  #
// #       need em again in the future        #
// ############################################

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
                .then(doc => {
                    if (doc.exists) {
                        res.status(200).sendFile('/public/common/post.html', { root: '../' });
                    } else {
                        res.status(404).sendFile('/public/404.html', { root: '../' });
                    }
                });
        }
    } else {
        res.status(404).sendFile('/public/404.html', { root: '../' });
    }
});