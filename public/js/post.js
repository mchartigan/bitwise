// **************************** TODO **************************** \\
// Add delete post button if it is current user
// Save and unsave icon change
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
            this.authorUID = doc.data().authoruid,
            this.createdText = jQuery.timeago(doc.data().created.toDate());
            this.contentText = doc.data().content;

            if (this.type == "post") {
                this.titleText = ((doc.data().topic != "") ? "[" + doc.data().topic + "] ": "") + doc.data().title;
                this.imageURL = (doc.data().image != null) ? doc.data().image : null;
            } else if (this.type == "comment") {
                this.titleText = "";
                this.imageURL = null;
            } else {
                console.log("Error: unknown post type {",this.type,"} for post {",this.postID,"}");
            }

            this.repliesID = doc.data().children;

            db.collection("users").doc(this.authorUID).get().then((doc) => {
                this.authorUsername = doc.data().username,
                this.authorImageURL = doc.data().profileImageURL

                // Re-render post
                this.setState({ retrievedPost: true });
            });
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
        const replyForm = event.target.parentNode.parentNode.children[6];

        if (replyForm.style.display === "none") {
            $(".ui.reply.form").hide();
            $(".reply.text.area").val("");
            replyForm.style.display = "";
        } else {
            $(".ui.reply.form").hide();
            $(".reply.text.area").val("");
            replyForm.style.display = "none";
        }
    }

    saveClick = () => {
        console.log("Save Post:", this.postID)
    }

    editClick = () => {
        console.log("Edit Post:", this.postID)
    }

    deleteClick = () => {
        console.log("Delete Post:", this.postID);
        
        db.collection("posts").doc(this.postID).get().then((doc) => {
            console.log("Removed Child From: ", doc.data().parent);

            db.collection('posts').doc(doc.data().parent).update({
                children: firebase.firestore.FieldValue.arrayRemove(this.postID)
            }).then(() => {
                db.collection('posts').doc(this.postID).delete();
            });
        });

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
        newPost(parentPostID, UID, null, null, replyText, null);

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
                <div className="ui divider"></div>

                <a className="avatar">
                    <img src={this.authorImageURL}></img>
                </a>

                <div className="content">
                    <a className="author">{this.authorUsername}</a>
                    <div className="metadata">
                        <span className="date">{this.createdText}</span>
                    </div>

                    <div className="ui simple dropdown" style={{ float: "right" }}>
                        <i className="ellipsis vertical icon"></i>
                        <div className="left menu">
                            <div className="item" onClick={this.saveClick}><i className="save icon"></i> Save</div>
                            <div className="item" onClick={this.editClick}><i className="edit icon"></i> Edit</div>
                            <div className="item" onClick={this.deleteClick}><i className="delete icon"></i> Delete</div>
                        </div>
                    </div>

                    <div className="text">
                        <div className="ui medium header">{this.titleText}</div>
                        {this.contentText}
                        {this.imageURL != null && <img className="ui small image" src={this.imageURL}/>}
                    </div>

                    <div className="actions">
                        <a className="reply" onClick={this.replyClick}><i className="reply icon"></i>Reply</a>
                        <a className="expand" onClick={this.expandClick} style={{ display: (this.state.collapsedReplies ? "" : "none") }}>
                            <i className="chevron down icon"></i>
                            Expand
                        </a>
                        <a className="collapse" onClick={this.collapseClick} style={{ display: (this.state.collapsedReplies ? "none" : "") }}>
                            <i className="chevron up icon"></i>
                            Collapse
                        </a>
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
            </div>
        );
    }
}

// ************************************************ \\
// ************ Similar to create_post ************ \\
// ************************************************ \\
function newPost(parent, UID, topic, title, body, imageURL) {
    db.collection('posts').add({
        parent: parent,
        children: [],
        authoruid: UID,
        created: new Date(),
        topic: topic,
        title: title,
        content: body,
        image: imageURL,
        upvotes: [null],
        downvotes: [null]
    }).then(postDocRef => {
        db.collection('posts').doc(parent).update({
            children: firebase.firestore.FieldValue.arrayUnion(postDocRef.id)
        }).then(() => {
            console.log("Added Post: ", postDocRef.id);
        });
        return postDocRef.id;
    });
}