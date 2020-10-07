// ------TO DO------
// Give live preview of post card

var UID = null;
var storage = firebase.storage();
var storageRef = storage.ref();
var docRef = null;

let titleField = document.getElementById('title-field'),
    bodyField  = document.getElementById('body-field'),
    topicField = document.getElementById('topic-field'),
    anonBox    = document.getElementById('anon-checkbox'),
    imageField = document.getElementById('image-file-field'),
    postImage  = document.getElementById('post-image'),
    imageFile  = {};

// initially hide this button
$('#signin-button').hide();

// load Bitwise logo in menu bar
storageRef.child('assets/logo.png').getDownloadURL().then(imgURL => {
    $('#logo-icon').attr('src', imgURL);
    console.log('Successfully Downloaded Logo Icon'); // DEBUG LOG
}).catch(err => {
    console.log('Failed to Download Icon'); // DEBUG LOG
});

firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        UID = user.uid;
    
        loadDropdown();
    
        $("#login-button").hide();
        $("#user-dropdown").show();
    } else {
        location.replace("/common/login.html");
    }
});
  
function loadDropdown() {
    db.collection("users").doc(UID).get().then(function(doc) {
        loadProfileIcon(doc);
        document.getElementById('account-dropdown').innerHTML = '&nbsp; ' + doc.data().username;
    });
}
  
function loadProfileIcon(doc) {
    if (doc.data().picFlag) {
        path = 'usercontent/' + UID + '/profile.jpg';
    } else {
        path = 'usercontent/default/profile.jpg';
    }
  
    storageRef.child(path).getDownloadURL().then(imgURL => {
        $('#profile-icon').attr('src', imgURL);
        console.log('Successfully Downloaded Profile Icon'); // DEBUG LOG
    }).catch(err => {
        console.log('Failed to Download Profile Icon'); // DEBUG LOG
    });
}

function submitPost() {
    // check topic -- can be performed asynchronously
    var topic = topicField.value;
    if (topic != '') {
        console.log('check topics');
        // create topic if nonexistent in database
        db.collection('topics').where('name', '==', topic).get().then(function(query) {

            if (!query.size) {
                db.collection('topics').add({
                    name: topic
                });
            }
        });
    }

    // check username / UID
    UID = firebase.auth().currentUser.uid;
    // if user chose to post anonymously or isn't signed in, post anonymously
    let anon = $("input[name='anonymous']:checked").val();
    if (anon || !UID) {
        addPost(
            auth=null,
            uid=null,
            title=titleField.value,
            body=bodyField.value,
            subject=topic
        );
    }
    // otherwise post with username attached
    else {
        db.collection('users').doc(UID).get().then(user => {
            addPost(
                auth=user.data().username,
                uid=UID,
                title=titleField.value,
                body=bodyField.value,
                subject=topic
            );
        });
    }
}

// function to generate post s.t. posting with username agrees with promise
function addPost(auth, uid, title, body, subject) {
    db.collection('posts').add({
        author: auth,
        authoruid: uid,
        title: title,
        content: body,
        image: null,
        embed: null,
        created: new Date(),
        parent: null,
        children: [null],
        topic: subject,
        upvotes: [null],
        downvotes: [null]
    }).then(reference => {
        if(reference) {
            if (imageField.files.length != 0) {
                // Update storage with new image file
                var path = `posts/${reference.id}/1.jpg`;
                storageRef.child(path).put(imageFile).then(function (upload) {
                    
                    // get download URL for image and attach to post
                    return upload.ref.getDownloadURL();
                }).then(function(downloadURL) {

                    reference.set({
                        image: downloadURL
                    },{merge: true});

                    cancelPost(); // ----------------what is the point of calling cancel post here if it redirects to index.html anyway

                    console.log('Successfully Uploaded: ', path); // DEBUG LOG
                    location.replace("/index.html");
                }).catch(err => {
                    console.log('Failed to Upload: ', path); // DEBUG LOG
                });
            }
            else {
                cancelPost();     // ----------------same as above...
                location.replace("/index.html");
            }
        }
    });
}

function cancelPost() {
    titleField.value = '';
    bodyField.value  = '';
    topicField.value = '';
    removeImage();
}

function previewImage() {
 
    if (imageField.files.length != 0) {
        // Display chosen image file
        var reader = new FileReader();
        reader.onload = function (e) {
            postImage.src = e.target.result;
        };
        reader.readAsDataURL(imageFile);

        $('#post-image').show();
    }
    else {
        $('#post-image').hide();
        postImage.src = '//:0';
    }
}

function uploadImage(e) {
    imageFile = e.target.files[0];

    // Stage chosen image file
    previewImage();
}

function removeImage() {
    // Stage remove image change
    if (imageField.files.length != 0) {
        imageField.value = '';
        imageFile = {};

        previewImage();
    }
}

// anonymous toggle box
$(document).ready(function(){
    $('.ui.toggle').checkbox();
});

// Form Validation
$('#create-post').form({
    on: 'blur',
    fields: {
        title: {
            identifier: 'title-field',
            rules: [{
                type: 'empty',
                prompt: 'Please enter a post title'
            }]
        }
    },
    onFailure: function() {
        console.log('Validation Failed')
        return false;
    },
    onSuccess: function(event,fields) {
        console.log('Validation Succeeded')
        submitPost();
        return false;
    }
});