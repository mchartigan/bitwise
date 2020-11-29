var uids = [];
var usernames = [];

let usernameField = document.getElementById('username-field'),
    emailField = document.getElementById('email-field'),
    bioTxtField = document.getElementById('bio-txt-field'),
    imageFileField = document.getElementById('image-file-field'),
    imageFile = {},
    curProfileImageURL = "https://firebasestorage.googleapis.com/v0/b/bitwise-a3c2d.appspot.com/o/usercontent%2Fdefault%2Fprofile.jpg?alt=media&token=f35c1c16-d557-4b94-b5f0-a1782869b551";

firebase.auth().onAuthStateChanged(function (user) {
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

