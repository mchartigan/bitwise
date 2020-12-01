var uids = [];
var usernames = [];

let usernameField = document.getElementById('username-field'),
    emailField = document.getElementById('email-field'),
    bioTxtField = document.getElementById('bio-txt-field'),
    imageFileField = document.getElementById('image-file-field'),
    imageFile = {},
    curProfileImageURL = "https://firebasestorage.googleapis.com/v0/b/bitwise-a3c2d.appspot.com/o/usercontent%2Fdefault%2Fprofile.jpg?alt=media&token=f35c1c16-d557-4b94-b5f0-a1782869b551";

firebase.auth().onAuthStateChanged(function (user) {
    $("#warning-text").hide();
    $("#accept-delete").hide();
    $("#deny-delete").hide();
    UID = user ? user.uid : null;

    if (UID) {
        getUserList();
        loadAccountInfo();
    } else {
        location.replace("/index.html");
    }
});

// Initialize dynamic tab groups
$('.menu .item').tab();

function getUserList() {
    db.collection('users').orderBy('username').get().then(function (querySnapshot) {
        if (!querySnapshot.empty) {
            var i = 0;
            querySnapshot.forEach(doc => {
                uids[i] = doc.id;
                usernames[i] = doc.data().username;
                i++;
            });
            i = 0;
        }
    });
}

function loadAccountInfo() {
    db.collection("users").doc(UID).get().then(function (doc) {
        // Fill out account info form with current info
        usernameField.value = doc.data().username;
        emailField.value = doc.data().email;
        bioTxtField.value = doc.data().bioText;
        curProfileImageURL = doc.data().profileImageURL;
        $('#profile-image').attr('src', curProfileImageURL);
    });

    imageFileField.value = '';
    imageFile = {};
}

function uploadImage(e) {
    imageFile = e.target.files[0];

    // Stage chosen image file
    var reader = new FileReader();
    reader.onload = function (e) {
        curProfileImageURL = e.target.result;
        $('#profile-image').attr('src', e.target.result);
    };
    reader.readAsDataURL(imageFile);
}

function removeImage() {
    // Stage remove image change
    curProfileImageURL = "https://firebasestorage.googleapis.com/v0/b/bitwise-a3c2d.appspot.com/o/usercontent%2Fdefault%2Fprofile.jpg?alt=media&token=f35c1c16-d557-4b94-b5f0-a1782869b551";
    $('#profile-image').attr('src', curProfileImageURL);

    imageFileField.value = '';
    imageFile = {};
}

function saveForm() {
    // First, remove spaces if there are any (regex won't detect them sometimes for some reason)
    usernameField.value = usernameField.value.replace(/ /g, '');
  
    // Update firestore with new field values
    db.collection("users").doc(UID).update({
        username: usernameField.value,
        bioText: bioTxtField.value,
        profileImageURL: curProfileImageURL
    }).then(() => {
        refreshHeader();
        loadAccountInfo();
    });

    if (imageFileField.files.length != 0) {
        // Update storage with new image file
        var path = 'usercontent/' + UID + '/profile.jpg';

        firebase.storage().ref().child(path).put(imageFile).then(() => {
            console.log('Successfully Uploaded: ', path); // DEBUG LOG
        }).catch(err => {
            console.log('Failed to Upload: ', path); // DEBUG LOG
        });
    }

    console.log('Account Information Saved'); // DEBUG LOG
}

function cancelForm() {
    // Reset form values
    loadAccountInfo();

    $('.ui.form').form('reset');
}

function countChars(obj) {
    var maxLength = 160;
    var strLength = obj.value.length;
    if (strLength > maxLength) {
        document.getElementById("charNum").innerHTML = '<span style = "color: red;">' + strLength + '/' + maxLength + ' characters</span>';
    } else {
        document.getElementById("charNum").innerHTML = strLength + '/' + maxLength + ' characters';
    }
}

function deleteWarning() {
  //Show hidden warning buttons and hide the original button
  $("#delete-button").hide();
  $("#warning-text").show();
  $("#accept-delete").show();
  $("#deny-delete").show();
}

function deleteAccount() {
    //Iterate through all posts and call an async function for each.
    db.collection('posts')
        .where('authorUID', '==', UID).get().then(querySnapshot => {
            //Check to see if there were any posts made by the user
            if (!querySnapshot.empty) {
                //Count the amount of posts made by the user
                var totalPost = 0;
                querySnapshot.forEach(post => {
                    totalPost++;
                });
                var i = 0;
                //Iterate through each post and call asynchronous function to delete the post
                querySnapshot.forEach(post => {
                    i++;
                    callAsyncDeletePost(post.id, i, totalPost);
                });
            }
            else {
                //Delete the user document and the user themselves
                var user = firebase.auth().currentUser;
                //Delete the user document from the database
                db.collection('users').doc(UID).delete();
        
                //Officially delete user from database and redirect to index
                user.delete().then(function() {
                    // Something
                }).catch(function(error) {
                    // An error happened.
                });
            }
    });
}

async function callAsyncDeletePost(postId, numPost, totalPost) {
    var x = await deletePost(postId);
    if (numPost == totalPost) {
        //All posts have been deleted. Now, delete the user document and the user themselves
        var user = firebase.auth().currentUser;
        //Delete the user document from the database
        db.collection('users').doc(UID).delete();

        //Officially delete user from database and redirect to index
        user.delete().then(function() {
            // Something
        }).catch(function(error) {
            // An error happened.
        });
    }
}

async function deletePost(postID) {
    try {
        // ********************** DEBUG ********************** \\
        // console.log("-> Delete Post:", postID);
        // *************************************************** \\

        let doc = await db.collection("posts").doc(postID).get();

        // Remove post from any users with it in their liked list
        doc.data().likedUsers.forEach(userID => {
            db.collection('users').doc(userID).update({
                postsLiked: firebase.firestore.FieldValue.arrayRemove(postID)
            });
        });

        // Remove post from any users with it in their disliked list
        doc.data().dislikedUsers.forEach(userID => {
            db.collection('users').doc(userID).update({
                postsDisliked: firebase.firestore.FieldValue.arrayRemove(postID)
            });
        });

        // Remove post from any users with it in their saved list
        doc.data().savedUsers.forEach(userID => {
            db.collection('users').doc(userID).update({
                postsSaved: firebase.firestore.FieldValue.arrayRemove(postID)
            });
        });

        // Remove post from topic doc
        db.collection('topics').where('name', '==', doc.data().topic).get().then(qS => {
            if (!qS.empty) {
                qS.forEach(topicDoc => {
                    db.collection('topics').doc(topicDoc.id).update({
                        posts: firebase.firestore.FieldValue.arrayRemove(postID)
                    });
                });
            }
        });

        return new Promise((resolve, reject) => {
            if (doc.data().parent) {
                // ********************** DEBUG ********************** \\
                // console.log("-- Removed ",postID," as child from parent: ",doc.data().parent);
                // *************************************************** \\

                db.collection('posts').doc(doc.data().parent).update({
                    children: firebase.firestore.FieldValue.arrayRemove(postID)
                });
            }

            const promises = doc.data().children.map(childID => {
                return deletePost(childID);
            });
            resolve(Promise.all(promises));
        }).then(() => {
            // ********************** DEBUG ********************** \\
            // console.log("<- Deleted Post:", postID);
            // *************************************************** \\

            db.collection('posts').doc(postID).delete();
        });
    } catch(err) {
        return;
    }
}

function deleteBackout() {
    $("#delete-button").show();
    $("#warning-text").hide();
    $("#accept-delete").hide();
    $("#deny-delete").hide();
}

$.fn.form.settings.rules.usernameExists = function (param) {
    return checkDuplicates(param);
}

// Form Validation
$('#account-info').form({
    on: 'blur',
    fields: {
        username: {
            identifier: 'username-field',
            rules: [{
                //Regex checks for any alphanumeric (including underscore and hyphen) string of three or more characters
                type: 'regExp[/^[A-Za-z0-9_-]{3,}$/]',
                prompt: 'Username must be at least three characters long and not contain spaces or special characters.'
            },
            {
                type: 'usernameExists',
                prompt: 'This username already exists. Please choose a unique username'
            }]
        },
        bio: {
            identifier: 'bio-txt-field',
            rules: [{
                type: 'maxLength[160]',
                prompt: 'Your bio must not be more than {ruleValue} characters'
            }]
        }
    },
    onFailure: function () {
        console.log('Validation Failed')
        return false;
    },
    onSuccess: function (event, fields) {
        console.log('Validation Succeeded')
        saveForm();
        return false;
    }
});

function checkDuplicates(param) {
    var i;
    for (i = 0; i < usernames.length; i++) {
        if ((usernames[i] == param) && (uids[i] != UID)) {
            return false;
        }
    }
    return true;
}

