const postID = window.location.href.split('/')[4];

loadPost(postID, null).then(posts => {
    // Threaded post container
    ReactDOM.render(
        <div className="ui threaded comments">
            {posts}
        </div>,
        document.querySelector('#post-container'));
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