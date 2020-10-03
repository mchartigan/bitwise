// ------TO DO------
// ON ACCOUNT REGISTRATION, SET INITIAL USERNAME, INITAL BIO, EMAIL, PICFLAG (false)

var UID = null;
var storage = null;
var storageRef = null;
var docRef = null;

firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        UID = user.uid;
        console.log('Retrieved UID')
        storage = firebase.storage();
        storageRef = storage.ref();
        docRef = db.collection("users").doc(UID);

        docRef.get().then(function(doc) {
            displayAccountInfo(doc);
        });
    } else {
        console.error('NO LOGGED IN USER, CANNOT VIEW ACCOUNT INFORMATION');
    }
});

let usernameField = document.getElementById('username-field'),
    emailField = document.getElementById('email-field')
    bioTxtField = document.getElementById('bio-txt-field'),
    imageFileField = document.getElementById('image-file-field'),
    profileImage = document.getElementById('profile-image'),
    hasProfileImage = false,
    imageFile = {};

// Listen to user document from database for changes, refresh account info
if (UID) {
    docRef.onSnapshot(function(doc) {
        displayAccountInfo(doc);
    });
}

function displayAccountInfo(doc) {
    imageFileField.value = '';
    imageFile = {};

    usernameField.value = doc.data().username;
    emailField.value = doc.data().email;
    bioTxtField.value = doc.data().bioText;
    hasProfileImage = doc.data().picFlag;

    displayImage();
}

function resetAccountInfo() {
    docRef.get().then(function(doc) {
        displayAccountInfo(doc);
    });

    $('.ui.form').form('reset');
}

function displayImage() {
    var path = null;

    if (hasProfileImage) {
        if (imageFileField.files.length != 0) {
            // Display chosen image file
            var reader = new FileReader();
            reader.onload = function (e) {
                profileImage.src = e.target.result;
            };
            reader.readAsDataURL(imageFile);
        } else {
            // Display stored image file
            path = 'usercontent/' + UID + '/profile.jpg';
        }
    } else {
        // Display default image file
        path = 'usercontent/default/profile.jpg';
    }

    if (path != null) {
        storageRef.child(path).getDownloadURL().then(imgURL => {
            console.log('Successfully Downloaded: ',path); // DEBUG LOG
            profileImage.src = imgURL;
        }).catch(err => {
            console.log('Failed to Download: ',path); // DEBUG LOG
        });
    }
}

function removeImage() {
    // Stage remove image change
    if (hasProfileImage) {
        imageFileField.value = '';
        imageFile = {};
        hasProfileImage = false;
        displayImage();
    }
}

function chooseFile(e) {
    imageFile = e.target.files[0];
    hasProfileImage = true;

    // Stage chosen image file
    displayImage();
}

function submitForm() {
    console.log('Form Submitted'); // DEBUG LOG

    // Update firestore with new field values
    docRef.set({
        username: usernameField.value,
        bioText: bioTxtField.value
    },{merge: true})

    if (imageFileField.files.length != 0) {
        // Update storage with new image file
        var path = 'usercontent/' + UID + '/profile.jpg';
        storageRef.child(path).put(imageFile).then(function () {
            console.log('Successfully Uploaded: ',path); // DEBUG LOG

            docRef.set({
                picFlag: true
            },{merge: true})
        }).catch(err => {
            console.log('Failed to Upload: ',path); // DEBUG LOG
        });
    }
    
    // Save remove profile image change
    if (!hasProfileImage) {
        docRef.set({
            picFlag: false
        },{merge: true})
    }
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
            }]
        },
        bio: {
            identifier: 'bio-txt-field',
            rules: [{
                type   : 'maxLength[160]',
                prompt : 'Your bio must not be more that {ruleValue} characters'
            }]
        }
    },
    onFailure: function() {
        console.log('Validation Failed')
        return false;
    },
    onSuccess: function(event,fields) {
        console.log('Validation Succeeded')
        submitForm();
        return false;
    }
});

