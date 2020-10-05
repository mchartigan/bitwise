const postForm = document.querySelector('#create-post-form');

postForm.addEventListener('submit', (e) =>{
    e.preventDefault();
    
    var uid = firebase.auth().currentUser.uid;
    // if user chose to post anonymously or isn't signed in, post anonymously
    if (postForm.anonymous.checked || !uid) {
        addPost(
            auth=null,
            uid=null,
            body=postForm.content.value,
            subject=postForm.topic.value
        );
    }
    // otherwise post with username attached
    else {
        db.collection('users').doc(uid).get().then(user => {
            addPost(
                auth=user.data().username,
                uid=uid,
                body=postForm.content.value,
                subject=postForm.topic.value
            );
        });
    }
});

// function to generate post s.t. posting with username agrees with promise
function addPost(auth, uid, body, subject) {
    db.collection('posts').add({
        author: auth,
        authoruid: uid,
        content: body,
        embed: null,
        created: new Date(),
        parent: null,
        children: [null],
        topic: subject,
        upvotes: [null],
        downvotes: [null]
    }).then(reference => {
        if(reference) {
            postForm.content.value = '';
            postForm.topic.value = '';

            location.replace("/index.html");
        }
    });
}