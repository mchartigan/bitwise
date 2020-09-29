$('form').form({
    on: 'blur',
    fields: {
        username: {
            identifier: 'username',
            rules: [{
                type: 'empty',
                prompt: 'Please enter a username'
            }]
        },
        file: {
            identifier: 'file',
            rules: [{
                type: 'empty',
                prompt: 'Please choose a file'
            }]
        }
    }
});

const UID = '9fvVztcaIGAn5mxGODAE';

//const form = document.querySelector('#account-info-form');
let username = document.getElementById('username'),
    email = document.getElementById('email')
    bio = document.getElementById('bio'),
    img = document.getElementById('img'),
    user_err = document.getElementById('username-error');

db.collection("users").doc(UID).onSnapshot(function(doc) {
    username.value = doc.data().username;
    email.value = doc.data().email;
    bio.value = doc.data().bio;

    firebase.storage().ref('usercontent/' + UID + '/profile.jpg').getDownloadURL().then(imgURL => {
        img.src = imgURL;
    })
});

let file = {}

function chooseFile(e) {
    file = e.target.files[0];
}

function saveButtonPressed() {
    db.collection('users').doc(UID).set({
        username: username.value,
        email: email.value,
        bio: bio.value,
    })

    if (file != null) {
        firebase.storage().ref('usercontent/' + UID + '/profile.jpg').put(file).then(function () {
            // console.log('Successfully Uploaded')
            firebase.storage().ref('usercontent/' + UID + '/profile.jpg').getDownloadURL().then(imgURL => {
                img.src = imgURL;
            })
        })
    }
}
