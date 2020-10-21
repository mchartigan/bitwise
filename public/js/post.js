'use strict';

class Post extends React.Component {
    constructor(props) {
        super(props);
        this.state = { userRetrieved: false };

        this.authorUsername = "loading...";
        this.authorImageURL = "https://firebasestorage.googleapis.com/v0/b/bitwise-a3c2d.appspot.com/o/usercontent%2Fdefault%2Fprofile.jpg?alt=media&token=f35c1c16-d557-4b94-b5f0-a1782869b551";
        this.createdText = this.props.created;
        if (this.props.topic != "") {
            this.titleText = "["+this.props.topic+"] "+this.props.title;
        } else {
            this.titleText = this.props.title;
        }
        this.contentText = this.props.content;
        if (this.props.imageURL != null) {
            this.imageURL = this.props.imageURL;
        } else {
            this.imageURL = null;
        }

        db.collection("users").doc(this.props.authorUID).get().then((doc) => {
            this.authorUsername = doc.data().username,
            this.authorImageURL = doc.data().profileImageURL
            // Re-render post
            this.setState({userRetrieved: true});
        });
    }

    // Format post
    render() {
        return (
            <div className="comment">
                <a className="avatar">
                    <img src={this.authorImageURL}></img>
                </a>
                <div className="content">
                    <a className="author">{this.authorUsername}</a>
                    <div className="metadata">
                        <span className="date">{this.createdText}</span>
                    </div>
                    <div className="text">
                        <div className="ui medium header">{this.titleText}</div>
                        {this.contentText}
                    </div>
                    {this.imageURL != null && <img className="ui small image" src={this.imageURL}/>}
                    <div className="actions">
                        <a className="reply">Reply</a>
                    </div>
                </div>
            </div>
        );
    }
}
