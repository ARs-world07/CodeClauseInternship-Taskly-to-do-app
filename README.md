# Taskly — To-Do List Web App (Enhanced)

This enhanced version includes animations, an SVG hero illustration, due dates, and UI polish.

How to run:
1. Unzip the package.
2. Open `index.html` in a modern browser.

Notes:
- Tasks persist in Local Storage under the key `tasks_enhanced`.
- Files: index.html, todo.html, assets/css/styles.css, assets/js/script.js


## Cloud sync (optional via Firebase)

1. Create a Firebase project and enable **Email/Password** authentication and **Cloud Firestore**.
2. Add Firebase SDK scripts to `index.html` and `todo.html` before other scripts. Example (use latest SDK from Firebase docs):

```html
<!-- Firebase App (the core Firebase SDK) -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
<script>
  // Replace with your project's config
  window.firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "...",
    appId: "..."
  };
  // Initialize
  firebase.initializeApp(window.firebaseConfig);
</script>
```

3. After adding the SDK & config, the app will show Sign In / Sign Out buttons in the To-Do page and sync tasks to Firestore under `taskly_tasks`.

Notes: This is a simple demo integration. For production, secure rules, conflict resolution, and better merge strategies are required.
