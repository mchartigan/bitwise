// **************************** TODO **************************** \\
// Save and unsave icon change (will be similar to like and unlike)
// Change account info to use update instead of set/merge
// Box shadow margin/padding change on threaded comments
// Save/display posts with newline characters
// Don't allow clicking on anonymous profiles
// ************************************************************** \\

'use strict';

class Post extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            retrievedPost: false,
            retrievedReplies: false,
            collapsedReplies: true,
            deleted: false
        };

        this.postID = this.props.postID;
        this.type = this.props.type;

        this.repliesID = [];
        this.repliesHTML = [];

        db.collection('posts').doc(this.postID).get().then((doc) => {
            this.authorUID = doc.data().authorUID;
            this.createdText = jQuery.timeago(doc.data().created.toDate());
            this.contentText = doc.data().content;
            this.topic = doc.data().topic;

            if (this.type == "post") {
                this.topicText = ((this.topic != "") ? "[" + this.topic + "] ": "")
                this.titleText = doc.data().title;
                this.imageURL = (doc.data().image != null) ? doc.data().image : null;
            } else if (this.type == "comment") {
                this.topicText = "";
                this.titleText = "";
                this.imageURL = null;
            } else {
                console.log("Error: unknown post type {",this.type,"} for post {",this.postID,"}");
            }

            this.repliesID = doc.data().children;

            if (doc.data().anon) {
                this.authorUsername = "Anonymous";
                this.authorImageURL = "https://firebasestorage.googleapis.com/v0/b/bitwise-a3c2d.appspot.com/o/usercontent%2Fdefault%2Fprofile.jpg?alt=media&token=f35c1c16-d557-4b94-b5f0-a1782869b551";

                // Re-render post
                this.setState({ retrievedPost: true });
            } else {
                db.collection("users").doc(this.authorUID).get().then((doc) => {
                    this.authorUsername = doc.data().username;
                    this.authorImageURL = doc.data().profileImageURL;
    
                    // Re-render post
                    this.setState({ retrievedPost: true });
                });
            }
        });
    }

    replyClick = (event) => {
        // Prevent highlighting on double click
        event.target.onselectstart = function() { return false; };

        // Remove form error messages
        $('.ui.reply.form').form('reset');
        $('.ui.reply.form').form('remove errors');

        // Toggle reply form
        const replyForm = event.target.parentNode.parentNode.parentNode.parentNode.children[4];

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

    saveClick = () => {
        if (UID) {
            console.log("Save Post:", this.postID)
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

    updateReplies = () => {
        this.repliesHTML = this.repliesID.map(replyID => (
            <Post postID={replyID} type="comment" onDelete={this.deleteReply} key={replyID}/>
        ));
    }

    addReply = (parentPostID, replyText, anonFlag) => {
        (async () => {
            // Add post to database
            const replyID = await addPost(anonFlag, parentPostID, UID, null, null, replyText, null);

            // Update the feed
            this.repliesID.push(replyID);
            this.updateReplies();
            this.setState({
                retrievedReplies: true,
                collapsedReplies: false
            });
        })();
    }

    deleteReply = (replyID) => {
        let index = this.repliesID.indexOf(replyID);
        if (index >= 0) {
            this.repliesID.splice( index, 1 );
        }
        this.updateReplies();

        if (this.repliesID.length) {
            // Collapse if no replies
            this.setState({
                collapsedReplies: false
            });
        } else {
            this.setState({
                collapsedReplies: true
            });
        }
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
                const replyText = $('#reply-form-'+post.postID).find('#reply-text-area').val();
                const anonFlag = $('#reply-form-'+post.postID).find('#anonymous-reply-flag').checkbox('is checked');
                post.addReply(post.postID,replyText,anonFlag);

                console.log("Reply to post: ",post.postID);
                console.log("Text: ",replyText);
                console.log("Anonymous: ",anonFlag)

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
                    {this.type == "post" && <div className="ui divider"></div>}
                </div>

                <a className="avatar" href={"/user/"+this.authorUsername}>
                    <img src={this.authorImageURL}></img>
                </a>

                <div className="content">
                    <a className="author" href={"/user/"+this.authorUsername}>{this.authorUsername}</a>

                    <div className="metadata">
                        <span className="date">{this.createdText}</span>
                    </div>

                    <div className="ui simple dropdown" style={{ float: "right", display: (UID ? "" : "none") }}>
                        <i className="ellipsis vertical icon"></i>
                        <div className="left menu">
                            <div className="item" onClick={this.saveClick}>
                                <i className="save icon"></i>
                                Save
                            </div>

                            <div className="item" onClick={this.editClick} style={{ display: (this.authorUID == UID ? "" : "none") }}>
                                <i className="edit icon"></i>
                                Edit
                            </div>

                            <div className="item" onClick={this.deleteClick} style={{ display: (this.authorUID == UID ? "" : "none") }}>
                                <i className="delete icon"></i>
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
                            <a className="like" onClick={this.likeClick}>
                                0
                                &nbsp;&nbsp;
                                <i className="thumbs up outline icon"></i>
                                Like
                            </a>
                        </span>

                        <span>
                            &nbsp;&nbsp;&middot;&nbsp;&nbsp;
                            <a className="dislike" onClick={this.likeClick}>
                                0
                                &nbsp;&nbsp;
                                <i className="thumbs down outline icon"></i>
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
                                Expand
                            </a>

                            <a className="collapse" onClick={this.collapseClick} style={{ display: (this.state.collapsedReplies ? "none" : "") }}>
                                <i className="chevron up icon"></i>
                                Collapse
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
            authoruid: UID,
            created: new Date(),
            topic: topic,
            title: title,
            content: body,
            image: imageURL,
            likes: [],
            dislikes: []
        }).then(postDocRef => {
            db.collection('posts').doc(parentID).update({
                children: firebase.firestore.FieldValue.arrayUnion(postDocRef.id)
            }).then(() => {
                console.log("Added Post: ", postDocRef.id);
                resolve(postDocRef.id);
            });
        });
    });
}

async function deletePost(postID) {
    console.log("-> Delete Post:", postID);

    let doc = await db.collection("posts").doc(postID).get();

    return new Promise((resolve, reject) => {
        if (doc.data().parent) {
            console.log("-- Removed ",postID," as child from parent: ",doc.data().parent);
            db.collection('posts').doc(doc.data().parent).update({
                children: firebase.firestore.FieldValue.arrayRemove(postID)
            });
        }

        const promises = doc.data().children.map(childID => {
            return deletePost(childID);
        });
        resolve(Promise.all(promises));
    }).then(() => {
        console.log("<- Deleted Post:", postID);
        db.collection('posts').doc(postID).delete();
    });
}