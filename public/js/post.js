// **************************** TODO **************************** \\
// Save and unsave icon change (will be similar to like and unlike)
// Change account info to use update instead of set/merge
// Box shadow margin/padding change on threaded comments
// Save/display posts with newline characters
// Make anonymous profile viewing not show the username in the HTML
// If a username is taken AFTER accountInfo loads, unique wont work
// Add generic upload image function (return URL) for account/post
// Modify header profile URL to go to the right profile
// Add dimmer with confirm delete buttont to post
// Add loader to posts that havent loaded yet
// Ensure all HTML pages use fomantic ui instead of semantic ui
// Add custome onInteract callback to post to live update on profile
// --Refresh button does not refresh 'Overview' tab
// Prevent topics/usernames with spaces (or other weird characters)
// ************************************************************** \\

'use strict';

class Post extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            retrievedPost: false,
            retrievedReplies: false,
            collapsedReplies: true,
            deleted: false,
            liked: false,
            disliked: false,
            saved: false
        };

        this.postID = this.props.postID;
        this.type = this.props.type;
        this.divider = this.props.divider;

        this.repliesID = [];
        this.repliesHTML = [];

        db.collection('posts').doc(this.postID).get().then((postDoc) => {
            this.authorUID = postDoc.data().authorUID;
            this.createdText = jQuery.timeago(postDoc.data().created.toDate());
            this.topic = postDoc.data().topic;
            this.topicText = ((this.topic != "") ? "["+this.topic+"] ": "")
            this.titleText = postDoc.data().title ? postDoc.data().title : "";
            this.contentText = postDoc.data().content;
            this.imageURL = postDoc.data().image;

            this.repliesID = postDoc.data().children;

            this.numLikes = postDoc.data().likedUsers.length;
            this.numDislikes = postDoc.data().dislikedUsers.length;

            this.anonymous = postDoc.data().anon;
            
            this.profileClickable = !this.anonymous;

            let authorInfoPromise = new Promise(resolve => {
                db.collection("users").doc(this.authorUID).get().then(userDoc => {
                    if (this.anonymous) {
                        if (this.authorUID == UID) {
                            this.profileClickable = true;
    
                            this.authorText = "Anonymous ("+userDoc.data().username+")";
                            this.authorImageURL = "https://firebasestorage.googleapis.com/v0/b/bitwise-a3c2d.appspot.com/o/usercontent%2Fdefault%2Fprofile.jpg?alt=media&token=f35c1c16-d557-4b94-b5f0-a1782869b551";
                        } else {
                            this.authorText = "Anonymous";
                            this.authorImageURL = "https://firebasestorage.googleapis.com/v0/b/bitwise-a3c2d.appspot.com/o/usercontent%2Fdefault%2Fprofile.jpg?alt=media&token=f35c1c16-d557-4b94-b5f0-a1782869b551";
                        }
                    } else {
                        this.authorText = userDoc.data().username;
                        this.authorImageURL = userDoc.data().profileImageURL;
                    }
    
                    this.profileLinkName = userDoc.data().username;

                    resolve();
                });
            });

            let viewerStatePromise = new Promise(resolve => {
                if (UID) {
                    db.collection("users").doc(UID).get().then(userDoc => {
                        this.state.liked = userDoc.data().postsLiked.includes(this.postID);
                        this.state.disliked = userDoc.data().postsDisliked.includes(this.postID);
                        this.state.saved = userDoc.data().postsSaved.includes(this.postID);

                        resolve();
                    });
                }
            });

            Promise.all([authorInfoPromise,viewerStatePromise]).then(() => {
                // Re-render post
                this.setState({ retrievedPost: true });
            });
        });
    }

    saveClick = () => {
        if (UID) {
            if (this.state.saved) {
                console.log("Un-Save Post:", this.postID)

                // Un-save
                db.collection('posts').doc(this.postID).update({
                    savedUsers: firebase.firestore.FieldValue.arrayRemove(UID)
                }).then(() => {
                    db.collection('users').doc(UID).update({
                        postsSaved: firebase.firestore.FieldValue.arrayRemove(this.postID)
                    });
                });
    
                this.setState({ saved: false });
            } else {
                console.log("Save Post:", this.postID);

                // Save
                db.collection('posts').doc(this.postID).update({
                    savedUsers: firebase.firestore.FieldValue.arrayUnion(UID)
                }).then(() => {
                    db.collection('users').doc(UID).update({
                        postsSaved: firebase.firestore.FieldValue.arrayUnion(this.postID)
                    });
                });

                this.setState({ saved: true });
            }
        }
    }

    editClick = () => {
        if (this.authorUID == UID) {
            console.log("Edit Post:", this.postID)
        }
    }

    deleteClick = () => {
        if (this.authorUID == UID) {
            deletePost(this.postID);
        
            if (this.type == "comment") {
                this.props.onDelete(this.postID);
            }
            this.setState({ deleted: true });
        }
    }

    likeClick = (event) => {
        // Prevent highlighting on double click
        event.target.onselectstart = function() { return false; };

        if (UID) {
            if (this.state.liked) {
                console.log("Un-Like Post:", this.postID);

                // Un-like
                db.collection('posts').doc(this.postID).update({
                    likedUsers: firebase.firestore.FieldValue.arrayRemove(UID)
                }).then(() => {
                    db.collection('users').doc(UID).update({
                        postsLiked: firebase.firestore.FieldValue.arrayRemove(this.postID)
                    });
                });
    
                this.numLikes -= 1;
    
                this.setState({ liked: false });
            } else {
                console.log("Like Post:", this.postID);

                // Like
                db.collection('posts').doc(this.postID).update({
                    likedUsers: firebase.firestore.FieldValue.arrayUnion(UID),
                    dislikedUsers: firebase.firestore.FieldValue.arrayRemove(UID)
                }).then(() => {
                    db.collection('users').doc(UID).update({
                        postsLiked: firebase.firestore.FieldValue.arrayUnion(this.postID),
                        postsDisliked: firebase.firestore.FieldValue.arrayRemove(this.postID)
                    });
                });

                this.numLikes += 1;
                this.numDislikes -= this.state.disliked;

                this.setState({
                    liked: true,
                    disliked: false
                });
            }
        }
    }

    dislikeClick = (event) => {
        // Prevent highlighting on double click
        event.target.onselectstart = function() { return false; };

        if (UID) {
            if (this.state.disliked) {
                console.log("Un-Dislike Post:", this.postID);

                // Un-dislike
                db.collection('posts').doc(this.postID).update({
                    dislikedUsers: firebase.firestore.FieldValue.arrayRemove(UID)
                }).then(() => {
                    db.collection('users').doc(UID).update({
                        postsDisliked: firebase.firestore.FieldValue.arrayRemove(this.postID)
                    });
                });
    
                this.numDislikes -= 1;
    
                this.setState({ disliked: false });
            } else {
                console.log("Dislike Post:", this.postID);

                // Dislike
                db.collection('posts').doc(this.postID).update({
                    likedUsers: firebase.firestore.FieldValue.arrayRemove(UID),
                    dislikedUsers: firebase.firestore.FieldValue.arrayUnion(UID)
                }).then(() => {
                    db.collection('users').doc(UID).update({
                        postsLiked: firebase.firestore.FieldValue.arrayRemove(this.postID),
                        postsDisliked: firebase.firestore.FieldValue.arrayUnion(this.postID)
                    });
                });
    
                this.numLikes -= this.state.liked;
                this.numDislikes += 1;
    
                this.setState({
                    liked: false,
                    disliked: true
                });
            }
        }
    }

    replyClick = (event) => {
        // Prevent highlighting on double click
        event.target.onselectstart = function() { return false; };

        // Remove form error messages
        $('.ui.reply.form').form('reset');
        $('.ui.reply.form').form('remove errors');

        // Toggle reply form
        const replyForm = $('#reply-form-'+this.postID)[0];

        if (replyForm.style.display === "none") {
            $(".ui.reply.form").hide();
            $(".reply.text.area").val("");
            replyForm.style.display = "";
            replyForm.scrollIntoView({behavior: "smooth", block: "nearest", inline: "nearest"});
        } else {
            $(".ui.reply.form").hide();
            $(".reply.text.area").val("");
            replyForm.style.display = "none";
        }
    }

    addReply = (parentPostID, replyText, anonFlag) => {
        (async () => {
            // Add post to database
            const replyID = await addPost(anonFlag, parentPostID, UID, "", null, replyText, null);

            // Update the feed
            this.repliesID.push(replyID);
            this.updateReplies();
            this.setState({
                retrievedReplies: true,
                collapsedReplies: false
            });
        })();
    }

    updateReplies = () => {
        // Re-calculate HTML for replies
        this.repliesHTML = this.repliesID.map(replyID => (
            <Post postID={replyID} type="comment" divider={true} onDelete={this.deleteReply} key={replyID}/>
        ));
    }

    deleteReply = (replyID) => {
        let index = this.repliesID.indexOf(replyID);
        if (index >= 0) {
            this.repliesID.splice( index, 1 );
        }
        this.updateReplies();

        if (this.repliesID.length) {
            // Collapse if no replies
            this.setState({ collapsedReplies: false });
        } else {
            this.setState({ collapsedReplies: true });
        }
    }

    expandClick = (event) => {
        // Prevent highlighting on double click
        event.target.onselectstart = function() { return false; };

        if (!this.state.retrievedReplies) {
            this.updateReplies();
            this.setState({
                retrievedReplies: true,
                collapsedReplies: false
            });
        } else {
            this.setState({ collapsedReplies: false });
        }
    }

    collapseClick = (event) => {
        // Prevent highlighting on double click
        event.target.onselectstart = function() { return false; };

        this.setState({ collapsedReplies: true });
    }

    componentDidMount() {
        const post = this;

        // Form validation listener
        $('#post-'+post.postID).find('.ui.reply.form').form({
            fields: {
                title: {
                    identifier: 'reply-text-area',
                    rules: [{
                        type: 'empty',
                        prompt: 'Please enter a reply'
                    }]
                }
            },
            onFailure: function () {
                return false;
            },
            onSuccess: function () {
                // ********************** DEBUG ********************** \\
                // console.log("Reply to post: ",post.postID);
                // console.log("Text: ",replyText);
                // console.log("Anonymous: ",anonFlag)
                // *************************************************** \\

                const replyText = $('#reply-form-'+post.postID).find('#reply-text-area').val();
                const anonFlag = $('#reply-form-'+post.postID).find('#anonymous-reply-flag').checkbox('is checked');
                post.addReply(post.postID,replyText,anonFlag);

                $(".ui.reply.form").hide();
                $(".reply.text.area").val("");

                return false;
            }
        });
    }

    // Render post
    render() {
        return (
            <div className="comment" id={"post-"+this.postID} style={{ display: (this.state.deleted ? "none" : "") }}>
                <div>
                    {this.divider && <div className="ui divider"></div>}
                </div>

                <a className="avatar" href={"/user/"+this.profileLinkName} style={{ pointerEvents: (this.profileClickable ? "" : "none") }}>
                    <img src={this.authorImageURL}></img>
                </a>

                <div className="content">
                    <a className="author" href={"/user/"+this.profileLinkName} style={{ pointerEvents: (this.profileClickable ? "" : "none") }}>
                        {this.authorText}
                    </a>

                    <div className="metadata">
                        <span className="date">{this.createdText}</span>
                    </div>

                    <div className="ui simple dropdown" style={{ float: "right", display: (UID ? "" : "none") }}>
                        <i className="ellipsis vertical icon"></i>
                        <div className="left menu">
                            <div className="item" onClick={this.saveClick}>
                                {this.state.saved ? <i className="bookmark icon"></i> : <i className="bookmark outline icon"></i>}
                                Save
                            </div>

                            <div className="item" onClick={this.editClick} style={{ display: (this.authorUID == UID ? "" : "none") }}>
                                <i className="edit outline icon"></i>
                                Edit
                            </div>

                            <div className="item" onClick={this.deleteClick} style={{ display: (this.authorUID == UID ? "" : "none") }}>
                                <i className="trash alternate outline icon"></i>
                                Delete
                            </div>
                        </div>
                    </div>

                    <div className="text">
                        <a className="ui violet medium header" href={"/topic/"+this.topic}>{this.topicText}</a>
                        <span className="ui violet medium header">{this.titleText}</span>
                        <div>{this.contentText}</div>
                        {this.imageURL != null && <img className="ui small image" src={this.imageURL}/>}
                    </div>

                    <div className="actions">
                        <span>
                            <a className="like" onClick={this.likeClick} style={{ pointerEvents: (UID ? "" : "none") }}>
                                {this.numLikes}
                                &nbsp;&nbsp;
                                {this.state.liked ? <i className="green thumbs up icon"></i> : <i className="thumbs up outline icon"></i>}
                                Like
                            </a>
                        </span>

                        <span>
                            &nbsp;&nbsp;&middot;&nbsp;&nbsp;
                            <a className="dislike" onClick={this.dislikeClick} style={{ pointerEvents: (UID ? "" : "none") }}>
                                {this.numDislikes}
                                &nbsp;&nbsp;
                                {this.state.disliked ? <i className="red thumbs down icon"></i> : <i className="thumbs down outline icon"></i>}
                                Dislike
                            </a>
                        </span>

                        <span style={{ display: (UID ? "" : "none") }}>
                            &nbsp;&nbsp;&middot;&nbsp;&nbsp;
                            <a className="reply" onClick={this.replyClick}>
                                <i className="reply icon"></i>
                                Reply
                            </a>
                        </span>

                        <span style={{ display: (this.state.retrievedPost && this.repliesID.length ? "" : "none") }}>
                            &nbsp;&nbsp;&middot;&nbsp;&nbsp;
                            <a className="expand" onClick={this.expandClick} style={{ display: (this.state.collapsedReplies ? "" : "none") }}>
                                <i className="chevron down icon"></i>
                                Expand ({this.repliesID.length})
                            </a>

                            <a className="collapse" onClick={this.collapseClick} style={{ display: (this.state.collapsedReplies ? "none" : "") }}>
                                <i className="chevron up icon"></i>
                                Collapse ({this.repliesID.length})
                            </a>
                        </span>
                    </div>
                </div>

                <div className={(this.state.collapsedReplies ? "collapsed " : "") + "comments"}>
                    {this.repliesHTML}
                </div>
                
                <form className="ui reply form" id={"reply-form-"+this.postID} style={{ display: "none" }}>
                    <div className="field">
                        <textarea className="reply text area" id="reply-text-area"></textarea>
                    </div>
                    <div className="ui error message"></div>
                    <div className="field">
                        <div className="ui checkbox" id="anonymous-reply-flag">
                            <input type="checkbox"></input>
                            <label>Anonymous</label>
                        </div>
                    </div>
                    <div className="ui violet submit labeled icon button">
                        <i className="icon edit"></i> Add Reply
                    </div>
                </form>
            </div>
        );
    }
}

// ************************************************ \\
// ************ Similar to create_post ************ \\
// ************************************************ \\
function addPost(anonymous, parentID, UID, topic, title, body, imageURL) {
    // ******* NO IMAGE FUNCTIONALITY YET *******

    return new Promise(resolve => {
        db.collection('posts').add({
            anon: anonymous,
            parent: parentID,
            children: [],
            authorUID: UID,
            created: new Date(),
            topic: topic,
            title: title,
            content: body,
            image: imageURL,
            likedUsers: [],
            dislikedUsers: [],
            savedUsers: []
        }).then(postDocRef => {
            // CHECK IF PARENT EXISTS!! THIS IS CURRENTLY TAILORED TO REPLIES ONLY RN
            db.collection('posts').doc(parentID).update({
                children: firebase.firestore.FieldValue.arrayUnion(postDocRef.id)
            }).then(() => {
                // ********************** DEBUG ********************** \\
                // console.log("Added Post: ", postDocRef.id);
                // *************************************************** \\

                resolve(postDocRef.id);
            });
        });
    });
}

async function deletePost(postID) {
    // ********************** DEBUG ********************** \\
    // console.log("-> Delete Post:", postID);
    // *************************************************** \\

    let doc = await db.collection("posts").doc(postID).get();

    // Remove post from any users with it in their liked list
    doc.data().likedUsers.forEach(userID => {
        db.collection('users').doc(userID).update({
            postsLiked: firebase.firestore.FieldValue.arrayRemove(postID)
        });
    });

    // Remove post from any users with it in their disliked list
    doc.data().dislikedUsers.forEach(userID => {
        db.collection('users').doc(userID).update({
            postsDisliked: firebase.firestore.FieldValue.arrayRemove(postID)
        });
    });

    // Remove post from any users with it in their saved list
    doc.data().savedUsers.forEach(userID => {
        db.collection('users').doc(userID).update({
            postsSaved: firebase.firestore.FieldValue.arrayRemove(postID)
        });
    });

    return new Promise((resolve, reject) => {
        if (doc.data().parent) {
            // ********************** DEBUG ********************** \\
            // console.log("-- Removed ",postID," as child from parent: ",doc.data().parent);
            // *************************************************** \\

            db.collection('posts').doc(doc.data().parent).update({
                children: firebase.firestore.FieldValue.arrayRemove(postID)
            });
        }

        const promises = doc.data().children.map(childID => {
            return deletePost(childID);
        });
        resolve(Promise.all(promises));
    }).then(() => {
        // ********************** DEBUG ********************** \\
        // console.log("<- Deleted Post:", postID);
        // *************************************************** \\

        db.collection('posts').doc(postID).delete();
    });
}