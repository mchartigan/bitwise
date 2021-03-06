
// isolate the post we are looking for
var urlstring = window.location.href.split('/');
var postID = null;

firebase.auth().onAuthStateChanged(function (user) {
    UID = user ? user.uid : null;

    loadTheme().then(() => {
        bg = new Background();
        refreshHeader();
        ReactDOM.render(<Page />, document.getElementById("page"), pageMounted);
    });
});

// Recursively loads a post
function loadPost(postID, childPost) {
    return new Promise(resolve => {
        db.collection('posts').doc(postID).get().then(postDoc => {
            var parentID = postDoc.data().parent;

            var postProps = {
                postID: postID,
                instance: Math.floor(Math.random() * Math.pow(10, 8)),
                type: "post",
                topDivider: false,
                botDivider: false,
                static: childPost ? true : false
            };

            var post;

            // Prepare returned post with child posts for coming back down tree
            if (childPost) {
                post = (
                    <div className="comment">
                        <Post {...postProps} key={postID} />
                        <div className="comments">
                            {childPost}
                        </div>
                    </div>
                );
            } else {
                post = <Post {...postProps} key={postID} />;
            }

            // Recursively go up tree to get parent posts
            if (parentID) {
                loadPost(parentID, post).then(parentPost => resolve(parentPost));
            } else {
                resolve(post);
            }
        });
    });
}

function Page() {
    return (
        <div>
            <div className="ui main text container">
                <div className={"ui" + dark + "segment"} id="post-container"></div>
                <br />
            </div>
            <a className={"huge circular" + accent + "ui icon button"} style={{ display: "none" }} id="create-post-button" href="/common/create_post.html">
                <i className="plus icon"></i>
            </a>
        </div>
    )
}

function pageMounted() {
    if (urlstring.length === 5 && urlstring[3] === 'post') {
        postID = urlstring[4];
        // search the database for that post
        if (postID === "null" || postID == "") {
            window.location.replace('/404.html');
        } else {
            db.collection('posts')
                .doc(postID).get()
                .then(doc => {
                    if (doc.exists) {
                        if (UID) {
                            $('#create-post-button').show();
                        } else {
                            $('#create-post-button').hide();
                        }

                        // continue loading that post
                        loadPost(postID, null).then(posts => {
                            // Threaded post container
                            ReactDOM.render(
                                <div className={"ui" + dark + "threaded comments"}>
                                    {posts}
                                </div>,
                                document.querySelector('#post-container'));
                        });
                    } else {
                        window.location.replace('/404.html');
                    }
                });
        }
    } else {
        window.location.replace('/404.html');
    }
}