var UID = null;
var storage = firebase.storage();
var storageRef = storage.ref();
var docRef = null;

let titleField = document.getElementById('title-field'),
    bodyField  = document.getElementById('body-field'),
    topicField = document.getElementById('topic-field'),
    anonBox    = document.getElementById('anon-checkbox'),
    imageField = document.getElementById('image-file-field'),
    hasImage   = false,
    imageFile  = {};

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
    var uid = firebase.auth().currentUser.uid;
    // if user chose to post anonymously or isn't signed in, post anonymously
    let anon = $("input[name='anonymous']:checked").val();
    if (anon || !uid) {
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
        db.collection('users').doc(uid).get().then(user => {
            addPost(
                auth=user.data().username,
                uid=uid,
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
        hasImage: false,
        embed: null,
        created: new Date(),
        parent: null,
        children: [null],
        topic: subject,
        upvotes: [null],
        downvotes: [null]
    }).then(reference => {

        if (imageField.files.length != 0) {
            // Update storage with new image file
            var path = 'posts/' + reference.id + '/1.jpg';
            storageRef.child(path).put(imageFile).then(function () {
                console.log('Successfully Uploaded: ', path); // DEBUG LOG
    
                reference.set({
                    hasImage: true
                },{merge: true})
            }).catch(err => {
                console.log('Failed to Upload: ', path); // DEBUG LOG
            });
        }
        if(reference) {
            titleField.value = '';
            bodyField.value  = '';
            topicField.value = '';
            removeImage();

            //location.replace("/index.html");
        }
    });
}

function cancelPost() {
    titleField.value = '';
    bodyField.value  = '';
    topicField.value = '';
}

function uploadImage(e) {
    imageFile = e.target.files[0];
    hasImage = true;

    // Stage chosen image file
    //previewImage();
}

function removeImage() {
    // Stage remove image change
    if (hasImage) {
        imageField.value = '';
        imageFile = {};
        hasImage = false;
        //previewImage();
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