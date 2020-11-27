// ------TO DO------
// Give live preview of post card

var UID = null;

let titleField = document.getElementById('title-field'),
    bodyField = document.getElementById('body-field'),
    topicField = document.getElementById('topic-field'),
    anonBox = document.getElementById('anon-checkbox'),
    imageField = document.getElementById('image-file-field'),
    postImage = document.getElementById('post-image'),
    imageFile = {};

firebase.auth().onAuthStateChanged(function (user) {
    UID = user ? user.uid : null;

    if (UID) {
        // User logged in
    } else {
        location.replace("/index.html");
    }
});

$('.ui.toggle').checkbox();

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
        },
        topic: {
            identifier: 'topic-field',
            rules: [{
                // Regex checks for empty string or any string of 3 or more characters
                type: 'regExp[/^$|^[A-Za-z0-9_-]{3,}$/]',
                prompt: 'Topics must be at least three characters long and not contain spaces or special characters.'
            }]
        }
    },
    onFailure: function () {
        console.log('Validation Failed')
        return false;
    },
    onSuccess: function (event, fields) {
        console.log('Validation Succeeded')
        submitPost();
        return false;
    }
});

function submitPost() {
    // check topic -- can be performed asynchronously
    var topic = topicField.value;
    if (topic != '') {
        console.log('check topics');
        // Remove spaces if there are any (regex won't detect them sometimes for some reason)
        topic = topic.replace(/ /g, '');
        // create topic if nonexistent in database
        db.collection('topics').where('name', '==', topic).get().then(function (query) {

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
            true,
            uid = UID,
            title = titleField.value,
            body = bodyField.value,
            subject = topic
        );
    }
    // otherwise post with username attached
    else {
        db.collection('users').doc(UID).get().then(user => {
            addPost(
                false,
                uid = UID,
                title = titleField.value,
                body = bodyField.value,
                subject = topic
            );
        });
    }
}

// function to generate post s.t. posting with username agrees with promise
function addPost(anonymous, uid, title, body, subject) {
    db.collection('posts').add({
        anon: anonymous,
        authorUID: uid,
        title: title,
        content: body,
        image: null,
        created: new Date(),
        parent: null,
        children: [],
        topic: subject,
        likedUsers: [],
        dislikedUsers: [],
        savedUsers: []
    }).then(reference => {
        if (reference) {
            if (imageField.files.length != 0) {
                // Update storage with new image file
                var path = `posts/${reference.id}/1.jpg`;
                firebase.storage().ref().child(path).put(imageFile).then(function (upload) {

                    // get download URL for image and attach to post
                    return upload.ref.getDownloadURL();
                }).then(function (downloadURL) {

                    reference.set({
                        image: downloadURL
                    }, { merge: true });

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
    bodyField.value = '';
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