var UID = null;
var storage = firebase.storage();
var storageRef = storage.ref();
var docRef = null;

var uids = [];
var usernames = [];

let usernameField = document.getElementById('username-field'),
    emailField = document.getElementById('email-field')
    bioTxtField = document.getElementById('bio-txt-field'),
    imageFileField = document.getElementById('image-file-field'),
    imageFile = {},
    curProfileImageURL = "https://firebasestorage.googleapis.com/v0/b/bitwise-a3c2d.appspot.com/o/usercontent%2Fdefault%2Fprofile.jpg?alt=media&token=f35c1c16-d557-4b94-b5f0-a1782869b551";

firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        UID = user.uid;
        docRef = db.collection("users").doc(UID);

        getUserList();
        loadDropdown();
        loadAccountInfo();
    } else {
        location.replace("/common/login.html");
    }
});

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

function loadDropdown() {
    docRef.get().then(function(doc) {
        $('#user-own-profile').attr('href', '/user/'+doc.data().username);
        $('#profile-icon').attr('src', doc.data().profileImageURL);
        document.getElementById('account-dropdown').innerHTML = '&nbsp; ' + doc.data().username;
    });
}

function loadAccountInfo() {
    docRef.get().then(function(doc) {
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
        $('#profile-image').attr('src',e.target.result);
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
    // Update firestore with new field values
    docRef.set({
        username: usernameField.value,
        bioText: bioTxtField.value,
        profileImageURL: curProfileImageURL
    },{merge: true}).then(() => {
        loadDropdown();
        loadAccountInfo();
    });

    if (imageFileField.files.length != 0) {
        // Update storage with new image file
        var path = 'usercontent/' + UID + '/profile.jpg';
        
        storageRef.child(path).put(imageFile).then(() => {
            console.log('Successfully Uploaded: ',path); // DEBUG LOG
        }).catch(err => {
            console.log('Failed to Upload: ',path); // DEBUG LOG
        });
    }

    console.log('Account Information Saved'); // DEBUG LOG
}

function cancelForm() {
    // Reset form values
    loadAccountInfo();

    $('.ui.form').form('reset');
}

$.fn.form.settings.rules.usernameExists = function(param) {
    return checkDuplicates(param);
}

// Form Validation
$('#account-info').form({
    on: 'blur',
    fields: {
        username: {
            identifier: 'username-field',
            rules: [{
                type: 'empty',
                prompt: 'Please enter a username'
            },
            {
                type: 'usernameExists',
                prompt: 'This username already exists. Please choose a unique username'
            }]
        },
        bio: {
            identifier: 'bio-txt-field',
            rules: [{
                type   : 'maxLength[160]',
                prompt : 'Your bio must not be more than {ruleValue} characters'
            }]
        }
    },
    onFailure: function() {
        console.log('Validation Failed')
        return false;
    },
    onSuccess: function(event,fields) {
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

