var UID = null;
var storage = firebase.storage();
var storageRef = storage.ref();
var docRef = null;

firebase.auth().onAuthStateChanged(function (user) {
  loadAllPosts();

  if (user) {
    UID = user.uid;
    docRef = db.collection("users").doc(UID);

    $("#login-button").hide();
    $("#user-dropdown").show();

    loadDropdown();

    $('#create-post-button').show();
    $("#timeline-tab").show();

    loadMyTimeline(UID);
  } else {
    docRef = null;

    $("#login-button").show();
    $("#user-dropdown").hide();

    $('#create-post-button').hide();
    $("#timeline-tab").hide();
  }
});

// Initialize dynamic tab groups
$('.menu .item').tab();

function loadDropdown() {
  docRef.get().then(function (doc) {
    $('#user-own-profile').attr('href', '/user/' + doc.data().username);
    $('#profile-icon').attr('src', doc.data().profileImageURL);
    document.getElementById('account-dropdown').innerHTML = '&nbsp; ' + doc.data().username;
  });
}

function loadAllPosts() {
  db.collection('posts')
    .orderBy('created', 'desc').get().then(querySnapshot => {
      if (querySnapshot.empty) {
        // Display error message
        ReactDOM.render(<div className="ui red message">No Posts Available!</div>, document.querySelector('#all-posts-container'));
      } else {
        var posts = [];
        var first = true;

        // Loop through each post to add formatted JSX element to list
        querySnapshot.forEach(doc => {
          // Only display parent posts (no comments)
          if (doc.data().parent == null) {
              var postProps = {
                postID: doc.id,
                type: "post",
                divider: !first
              };

              posts.push(<Post {...postProps} key={doc.id} />);

              first = false;
          }
        });

        // Threaded post container
        ReactDOM.render(<div className="ui threaded comments">
          {posts}
        </div>,
          document.querySelector('#all-posts-container'));
      }
    })
}

function loadMyTimeline(myUID) {
  db.collection('users').doc(myUID).get().then(userDoc => {

    let followingUsers = userDoc.data().followingUsers,
        followingTopics = userDoc.data().followingTopics;
    followingUsers.push(myUID);
    
    db.collection('posts')
      .orderBy('created', 'desc').get().then(querySnapshot => {
        if (querySnapshot.empty) {
          // Display error message
          ReactDOM.render(<div className="ui red message">No Posts Available!</div>, document.querySelector('#timeline-container'));
        } else {
          var posts = [];
          var first = true;

          // Loop through each post to add formatted JSX element to list
          querySnapshot.forEach(doc => {
            // Display only followed users or topics
            if (followingUsers.includes(doc.data().authorUID) || followingTopics.includes(doc.data().topic)) {
              // Only display parent posts (no comments)
              if (doc.data().parent == null) {
                var postProps = {
                  postID: doc.id,
                  type: "post",
                  divider: !first
                };

                posts.push(<Post {...postProps} key={doc.id} />);

                first = false;
              }
            }
          });

          // Threaded post container
          ReactDOM.render(<div className="ui threaded comments">
            {posts}
          </div>,
            document.querySelector('#timeline-container'));
        }
      });
  });
}