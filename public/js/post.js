// **************************** TODO **************************** \\
// Save and unsave icon change (will be similar to like and unlike)
// Anonymous replies??
// Check for errors when replying or deleting deleted posts
// Delete grandchildren on delete
// Change account info to use update instead of set/merge
// Box shadow margin/padding change on threaded comments
// ************************************************************** \\

'use strict';

class Post extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            retrievedPost: false,
            retrievedReplies: false,
            collapsedReplies: true
        };

        this.postID = this.props.postID;
        this.type = this.props.type;

        db.collection('posts').doc(this.postID).get().then((doc) => {
            this.authorUID = doc.data().authoruid;
            this.createdText = jQuery.timeago(doc.data().created.toDate());
            this.contentText = doc.data().content;

            if (this.type == "post") {
                this.topicText = ((doc.data().topic != "") ? "[" + doc.data().topic + "] ": "")
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

        this.repliesHTML = null;
    }

    replyClick = (event) => {
        // Prevent highlighting on double click
        event.target.onselectstart = function() { return false; };

        // Remove form error messages
        $('.ui.reply.form').form('reset');
        $('.ui.reply.form').form('remove errors');

        // Toggle reply form
        const replyForm = event.target.parentNode.parentNode.parentNode.parentNode.children[4];

        // **************************************************************** \\
        // *************** ONLY HIDE ITEMS IF OF PROPER TYPE ************** \\
        // **** OCCASIONAL BUG WHERE QUICK CLICKS HIDE THE WRONG THING **** \\ 
        // **************************************************************** \\

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
        // DO NOT LET A USER EDIT IF NOT LOGGED IN!!

        console.log("Save Post:", this.postID)
    }

    editClick = () => {
        // DO NOT LET A USER EDIT IF NOT THE AUTHOR OR NOT LOGGED IN!!
        console.log("Edit Post:", this.postID)
    }

    deleteClick = () => {
        // DO NOT LET A USER DELETE IF NOT THE AUTHOR OR NOT LOGGED IN!!

        console.log("Delete Post:", this.postID);
        deletePost(this.postID);

        // *********** ADD IMEDIATE UPDATE TO FEED ***********
    }

    expandClick = (event) => {
        // Prevent highlighting on double click
        event.target.onselectstart = function() { return false; };

        if (!this.state.retrievedReplies) {
            // Load replies
            this.repliesHTML = this.repliesID.map(replyID => (
                <Post postID={replyID} type="comment" key={replyID}/>
            ));
            
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

    addReply = (parentPostID, replyText) => {
        addPost(false, parentPostID, UID, null, null, replyText, null);

        // *********** ADD IMEDIATE UPDATE TO FEED ***********
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
            onSuccess: function (event, fields) {
                const replyText = $('#reply-form-'+post.postID).find('#reply-text-area').val();
                console.log("Reply to post: ",post.postID);
                console.log("Text: ",replyText)
                post.addReply(post.postID,replyText);

                // ****** MAYBE CHANGE LATER ****** \\
                $(".ui.reply.form").hide();
                $(".reply.text.area").val("");
                //location.reload();
                // ******************************** \\

                return false;
            }
        });
    }

    // Render post
    render() {
        return (
            <div className="comment" id={"post-"+this.postID}>
                <div>
                    {this.type == "post" && <div className="ui divider"></div>}
                </div>

                <a className="avatar" href="/common/profile.html">
                    <img src={this.authorImageURL}></img>
                </a>

                <div className="content">
                    <a className="author" href="/common/profile.html">{this.authorUsername}</a>
                    <div className="metadata">
                        <span className="date">{this.createdText}</span>
                    </div>

                    <div className="ui simple dropdown" style={{ float: "right", display: (UID ? "" : "none") }}>
                        <i className="ellipsis vertical icon"></i>
                        <div className="left menu">
                            <div className="item" onClick={this.saveClick}><i className="save icon"></i> Save</div>
                            <div className="item" onClick={this.editClick} style={{ display: (this.authorUID == UID ? "" : "none") }}><i className="edit icon"></i> Edit</div>
                            <div className="item" onClick={this.deleteClick} style={{ display: (this.authorUID == UID ? "" : "none") }}><i className="delete icon"></i> Delete</div>
                        </div>
                    </div>

                    <div className="text">
                        <a className="ui violet medium header" href="/common/profile.html">{this.topicText}</a>
                        <span className="ui violet medium header">{this.titleText}</span>
                        <div>{this.contentText}</div>
                        {this.imageURL != null && <img className="ui small image" src={this.imageURL}/>}
                    </div>

                    <div className="actions">
                        <span style={{ display: (UID ? "" : "none") }}>
                            <a className="reply" onClick={this.replyClick}><i className="reply icon"></i>Reply</a>
                            &nbsp;&nbsp;&nbsp;
                        </span>
                        <span style={{ display: (this.state.retrievedPost && this.repliesID.length ? "" : "none") }}>
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
        upvotes: [],
        downvotes: []
    }).then(postDocRef => {
        db.collection('posts').doc(parentID).update({
            children: firebase.firestore.FieldValue.arrayUnion(postDocRef.id)
        }).then(() => {
            console.log("Added Post: ", postDocRef.id);
        });
        return postDocRef.id;
    });
}

function deletePost(postID) {
    console.log("Delete Post:", postID);

    db.collection("posts").doc(postID).get().then((doc) => {
        if (doc.data().parent) {
            db.collection('posts').doc(doc.data().parent).update({
                children: firebase.firestore.FieldValue.arrayRemove(postID)
            }).then(() => {
                console.log("Removed ",postID," as child from parent: ",doc.data().parent);
                console.log("Children of ",postID," : ",doc.data().children);
                
                doc.data().children.forEach(childID => {
                    deletePost(childID)
                });
                db.collection('posts').doc(postID).delete();
            });
        } else {
            doc.data().children.forEach(childID => {
                deletePost(childID)
            });
            db.collection('posts').doc(postID).delete();
        }
    });
}