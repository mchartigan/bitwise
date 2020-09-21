// DOM elements
const loginForm = document.querySelector('#user-login');
const postForm = document.querySelector('#create-post-form');
const postList = document.querySelector('#timeline');

// create element & render cafe
function renderPost(doc){
  let li = document.createElement('li');
  let topic = document.createElement('span');
  let content = document.createElement('span');
  let author = document.createElement('span');
  let created = document.createElement('span');
  let cross = document.createElement('div');

  li.setAttribute('data-id', doc.id);
  topic.textContent = doc.data().topic;
  content.textContent = doc.data().content;
  author.textContent = doc.data().author;
  created.textContent = doc.data().created.toDate().toTimeString();
  cross.textContent = 'delete';

  postForm.topic.value = '';
  postForm.content.value = '';

  li.appendChild(topic)
  li.appendChild(content);
  li.appendChild(author);
  li.appendChild(created);
  li.appendChild(cross);

  postList.appendChild(li);

  // deleting data
  cross.addEventListener('click', (e) => {
      e.stopPropagation();
      let id = e.target.parentElement.getAttribute('data-id');
      db.collection('posts').doc(id).delete();
  });
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  console.log(e)
  /*
  db.collection('posts').add({
      content: form.username.value,
      username: form.password.value
  });
  */
  document.getElementById('login-status').innerHTML = "logged in as: " + loginForm.username.value;
  loginForm.username.value = '';
  loginForm.password.value = '';
});

postForm.addEventListener('submit', (e) =>{
  e.preventDefault();
  console.log(e);
  var author
  if (postForm.anonymous.value) {
    author = null;
  } else {
    author = null // replace with UID later
  }

  db.collection('posts').add({
    author: author,
    content: postForm.content.value,
    embed: null,
    created: new Date(),
    parent: null,
    children: [null],
    topic: postForm.topic.value,
    upvotes: [null],
    downvotes: [null]
  });
});

// real-time listener
db.collection('posts').orderBy('created').onSnapshot(snapshot => {
  let changes = snapshot.docChanges();
  changes.forEach(change => {
      console.log(change.doc.data());
      if(change.type == 'added'){
          renderPost(change.doc);
      } else if (change.type == 'removed'){
          let li = postList.querySelector('[data-id=' + change.doc.id + ']');
          postList.removeChild(li);
      }
  });
});

// setup materialize components
document.addEventListener('DOMContentLoaded', function() {



});