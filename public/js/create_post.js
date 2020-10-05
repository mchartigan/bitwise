const postForm = document.querySelector('#create-post-form');

postForm.addEventListener('submit', (e) =>{
    e.preventDefault();
    //console.log(e);
    var author;
    var uid;
    if (postForm.anonymous.checked) {
        author = null;
        uid    = null;
    }
    else {
        uid = firebase.auth().currentUser.uid;
        
        if (uid) {
            db.collection('users').doc(uid).get().then(user => {
                author = user.username;
                console.log(user.username);
            });
        }
        else {
            author = null;
            uid    = null;
        }
    }
    console.log(author);
    console.log(uid);

    db.collection('posts').add({
        author: author,
        authoruid: uid,
        content: postForm.content.value,
        embed: null,
        created: new Date(),
        parent: null,
        children: [null],
        topic: postForm.topic.value,
        upvotes: [null],
        downvotes: [null]
    }).then(reference => {
        if(reference) {
            postForm.content.value = '';
            postForm.topic.value = '';
    
            location.replace("/index.html");
        }
    });
});
  
  