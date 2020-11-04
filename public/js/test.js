var UID = null;
var storage = firebase.storage();
var storageRef = storage.ref();
var docRef = null;

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        UID = user.uid;
        docRef = db.collection("users").doc(UID);

        loadDropdown();

        $("#login-button").hide();
        $("#user-dropdown").show();

        loadPosts();
    } else {
        docRef = null;

        $("#login-button").show();
        $("#user-dropdown").hide();

        loadPosts();
    }
});

function loadDropdown() {
    docRef.get().then(function (doc) {
        $('#profile-icon').attr('src', doc.data().profileImageURL);
        document.getElementById('account-dropdown').innerHTML = '&nbsp; ' + doc.data().username;
    });
}

// Loads all of the logged in users posts
function loadPosts() {
    db.collection('posts')
        .orderBy('created', 'desc')
        .get().then(function (querySnapshot) {
            if (querySnapshot.empty) {
                // Display error message
                ReactDOM.render(<div className="ui red message">No Posts Available!</div>, document.querySelector('#feed'));
            } else {
                var posts = [];
                var first = true;

                // Loop through each post to add formatted JSX element to list
                querySnapshot.forEach(doc => {
                    // Only display parent posts (no comments)
                    if (doc.data().parent == null) {
                        const postProps = {
                            postID: doc.id,
                            type: "post",
                            divider: !first
                        };
    
                        posts.push(<Post {...postProps} key={doc.id}/>);

                        first = false;
                    }
                });

                // Threaded post container
                ReactDOM.render(<div className="ui threaded comments">
                                    {posts}
                                </div>,
                                document.querySelector('#feed'));
            }
        });
}

function test() {
    console.log("Running: test()");
    console.log("--loop through all users--");

    db.collection('users').get().then(function (querySnapshot) {
        if (querySnapshot.empty) {
            console.log('No snapshots in query!')
        } else {
            querySnapshot.forEach(doc => {
                // doc.data().postsSaved.forEach(postID => {
                //     db.collection('posts').doc(postID).update({
                //         savedUsers: firebase.firestore.FieldValue.arrayUnion(doc.id)
                //     });
                // });

                // db.collection('posts').doc(doc.id).update({
                //     likes: firebase.firestore.FieldValue.delete(),
                //     dislikes: firebase.firestore.FieldValue.delete()
                // });

                // db.collection('posts').doc(doc.id).set({
                //     savedUsers: []
                // },{merge: true});
            });
        }
    });
}