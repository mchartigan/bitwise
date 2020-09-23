const UID = '9fvVztcaIGAn5mxGODAE';

const form = document.querySelector('#account-info-form');

db.collection("users").doc(UID).onSnapshot(function(doc) {
    form.username.value = doc.data().username;
    form.email.value = doc.data().email;
    form.bio.value = doc.data().bio;
    form.icon.value = doc.data().icon;
});

form.addEventListener('#save-button', (e) => {
    e.preventDefault();
    db.collection('users').doc(UID).set({
        username: form.username.value,
        email: form.email.value,
        bio: form.bio.value,
        icon: form.icon.value
    });
});
