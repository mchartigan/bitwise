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
        $("#create-post-button").show();

        loadPosts();
    } else {
        $("#login-button").show();
        $("#user-dropdown").hide();
        $("#create-post-button").hide();
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
        .where('authoruid', 'in', [UID])
        .orderBy('created', 'desc')
        .get().then(function (querySnapshot) {
            if (querySnapshot.empty) {
                // Display error message
                ReactDOM.render(<div className="ui red message">No Posts Available!</div>, document.querySelector('#feed'));
            } else {
                // Threaded post container
                ReactDOM.render(<div className="ui threaded comments">
                                    <div id="posts"></div>
                                </div>,
                                document.querySelector('#feed'));

                const posts = [];

                // Loop through each post to add formatted JSX element to list
                querySnapshot.forEach(doc => {
                    const postProps = {
                        authorUID: doc.data().authoruid,
                        created: jQuery.timeago(doc.data().created.toDate()),
                        topic: doc.data().topic,
                        title: doc.data().title,
                        content: doc.data().content,
                        imageURL: doc.data().image
                    };

                    posts.push(<Post {...postProps} key={doc.id}/>);
                });

                ReactDOM.render(posts, document.querySelector('#posts'));
            }
        });
}