var UID = null;
var storage = firebase.storage();
var storageRef = storage.ref();

let usernameField = document.getElementById('username-field'),
    emailField = document.getElementById('email-field')
    bioTxtField = document.getElementById('bio-txt-field'),
    imageFileField = document.getElementById('image-file-field'),
    profileImage = document.getElementById('profile-image'),
    hasProfileImage = false,
    imageFile = {};

firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        UID = user.uid;
        console.log('Retrieved UID');

        loadDropdown();
        accountInfo();
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

function accountInfo() {
    db.collection("users").doc(UID).get().then(function(doc) {
        // Fill out account info form with current info
        usernameField.value = doc.data().username;
        emailField.value = doc.data().email;
        bioTxtField.value = doc.data().bioText;
        hasProfileImage = doc.data().picFlag;
    }).then(() => {
        previewImage();

        imageFileField.value = '';
        imageFile = {};
    });
}

function previewImage() {
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

function uploadImage(e) {
    imageFile = e.target.files[0];
    hasProfileImage = true;

    // Stage chosen image file
    previewImage();
}

function removeImage() {
    // Stage remove image change
    if (hasProfileImage) {
        imageFileField.value = '';
        imageFile = {};
        hasProfileImage = false;
        previewImage();
    }
}

function saveForm() {
    console.log('Account Information Saved'); // DEBUG LOG

    // Update firestore with new field values
    db.collection("users").doc(UID).set({
        username: usernameField.value,
        bioText: bioTxtField.value
    },{merge: true})

    if (imageFileField.files.length != 0) {
        // Update storage with new image file
        var path = 'usercontent/' + UID + '/profile.jpg';
        
        storageRef.child(path).put(imageFile).then(() => {
            console.log('Successfully Uploaded: ',path); // DEBUG LOG

            updateProfileImageURL(path,true);
        }).catch(err => {
            console.log('Failed to Upload: ',path); // DEBUG LOG
        });
    } else if (!hasProfileImage) {
        // Save remove profile image change
        path = 'usercontent/default/profile.jpg';

        updateProfileImageURL(path,false);
    }

    imageFileField.value = '';
    imageFile = {};
}

function updateProfileImageURL(path, flag) {
    storageRef.child(path).getDownloadURL().then(imgURL => {
        console.log('Successfully retrieved profile image download URL: ', imgURL); // DEBUG LOG

        db.collection("users").doc(UID).set({
            picFlag: flag, // -------------------REMOVE LATER ONCE URL FUNCTIONALITY IS IMPLEMENTED-----------------------------\\
            profileImageURL: imgURL
        },{merge: true}).then(() => {
            loadDropdown();
            accountInfo();
        });
    }).catch(err => {
        console.log('Failed to retrieve profile image download URL'); // DEBUG LOG
    });
}

function cancelForm() {
    // Reset form values
    accountInfo();

    $('.ui.form').form('reset');
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
        saveForm();
        return false;
    }
});

