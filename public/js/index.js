// DOM elements
const loginButton = document.querySelector('#login-button');
const postList    = document.querySelector('#timeline');

// navigate to login page
function login() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      firebase.auth().signOut();
    }
    else {
      location.replace("common/login.html");
    }
  });
}

function createPost() {
  location.replace("common/new_post.html");
}

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

  li.appendChild(topic)
  li.appendChild(content);
  li.appendChild(author);
  li.appendChild(created);
  li.appendChild(cross);

  postList.append(li);

  // deleting data
  cross.addEventListener('click', (e) => {
      e.stopPropagation();
      let id = e.target.parentElement.getAttribute('data-id');
      db.collection('posts').doc(id).delete();
  });
}


//okay well i dont WANT a real time listener...i want infinite scroll and not auto-updating posts
var endless = {
  /* (A) FLAGS */
  hasMore: true, // have more contents to load?
  proceed: true, // is another page currently loading?
  first: true, // is this the first loading cycle?
  prevDoc: null,
 
  /* (B) LOAD CONTENTS */
  load: function () { 
    // (B1) BLOCK MORE LOADING UNTIL THIS PAGE IS DONE
    if (endless.proceed && endless.hasMore) {
      endless.proceed = false;
 
      // pull posts
      if (endless.first) {
        // load one post to start the query offset
        // if the user isnt following anything this will need to be fixed

        db.collection('posts').orderBy('created', 'desc').limit(6)
          .get().then(function (querySnapshot) {
            if (querySnapshot.empty) {
              endless.hasMore = false;
              endless.first = false;
              // do something
              // TODO: make this display "you arent following anyone" when this returns nothing
            } else {
              querySnapshot.forEach( doc => {
                endless.prevDoc = doc;
                renderPost(doc);
                endless.proceed = true;
                endless.first = false;
              });
            }
        });

      } 

      if (!endless.first && endless.hasMore) {
        db.collection('posts').orderBy('created', 'desc')
        .startAfter(endless.prevDoc).limit(2).get().then( querySnapshot => {
          if (querySnapshot.empty) {
            // theres none left.
            endless.hasMore = false;
            // idk display something
          } else {
            querySnapshot.forEach(function(doc) {
              endless.prevDoc = doc;
              renderPost(doc);
              endless.proceed = true;
              endless.hasMore = true;
            });
          }
        });
      } 
    }
  },
 
  /* (C) INIT */
  init: function(){
    // (C1) ATTACH SCROLL LISTENER
    // Credits: https://stackoverflow.com/questions/9439725/javascript-how-to-detect-if-browser-window-is-scrolled-to-bottom
    window.addEventListener("scroll", function(){
      if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight) {
        endless.load();
      }
    });

    // (C2) INITIAL LOAD CONTENTS
    endless.load();
  }
};


// setup materialize components
document.addEventListener('DOMContentLoaded', function() {
  // 
  endless.init();
});

// listener to see if user is logged in
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    loginButton.innerText = 'Logged in as ' + user.displayName + '. Sign out';
  } else {
    loginButton.innerText = 'Sign In';
  }
});