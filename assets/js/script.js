// Enhanced JS: same functionality + due dates + small animations
const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const dueDateInput = document.getElementById('duedate');
const listEl = document.getElementById('task-list');
const empty = document.getElementById('empty');
const filterChips = document.querySelectorAll('.chip');
const clearBtn = document.getElementById('clear-btn');
const prioritySelect = document.getElementById('priority-select');

let tasks = JSON.parse(localStorage.getItem('tasks_enhanced') || '[]');
let filter = 'all';

function save(){
  localStorage.setItem('tasks_enhanced', JSON.stringify(tasks));
}

function formatDate(d){
  if(!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return '';
  return dt.toLocaleDateString(undefined, {year:'numeric',month:'short',day:'numeric'});
}

function showEmpty(show){
  empty.style.display = show ? 'block' : 'none';
}

function render(){
  listEl.innerHTML = '';
  const filtered = tasks.filter(t => {
    if(filter === 'all') return true;
    if(filter === 'pending') return !t.completed;
    if(filter === 'completed') return t.completed;
  });

  showEmpty(filtered.length === 0);

  filtered.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.style.opacity = 0;
    setTimeout(()=> li.style.opacity = 1, 50);

    const left = document.createElement('div');
    left.className = 'task-left';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => {
      task.completed = checkbox.checked;
      save(); render();
    });

    const titleWrap = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'task-title' + (task.completed ? ' completed' : '');
    title.textContent = task.title;

    const meta = document.createElement('div');
    meta.className = 'muted small';
    meta.style.fontSize = '0.8rem';

    if(task.dueDate){
      const d = formatDate(task.dueDate);
      meta.textContent = 'Due ' + d + (task.priority ? ' · ' + task.priority : '');
    } else {
      meta.textContent = task.priority ? task.priority : '';
    }

    titleWrap.appendChild(title);
    titleWrap.appendChild(meta);

    const pr = document.createElement('span');
    pr.className = 'priority ' + (task.priority || 'normal');
    pr.textContent = (task.priority || 'normal');

    left.appendChild(checkbox);
    left.appendChild(titleWrap);
    left.appendChild(pr);

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.title = 'Edit';
    editBtn.innerHTML = '✏️';
    editBtn.addEventListener('click', () => {
      const newTitle = prompt('Edit task', task.title);
      if(newTitle !== null){
        task.title = newTitle.trim() || task.title;
        save(); render();
      }
    });

    const delBtn = document.createElement('button');
    delBtn.title = 'Delete';
    delBtn.innerHTML = '🗑️';
    delBtn.addEventListener('click', () => {
      if(confirm('Delete this task?')){
        tasks = tasks.filter(t => t.id !== task.id);
        save(); render();
      }
    });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(left);
    li.appendChild(actions);
    listEl.appendChild(li);
  });
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const title = input.value.trim();
  const dueDate = dueDateInput ? dueDateInput.value : '';
  if(!title) return;
  const newTask = { id: Date.now(), title, completed:false, priority: prioritySelect.value, dueDate };
  tasks.unshift(newTask);
  input.value = '';
  if(dueDateInput) dueDateInput.value = '';
  prioritySelect.value = 'normal';
  save(); render();
});

filterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    filterChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    filter = chip.dataset.filter;
    render();
  });
});

clearBtn.addEventListener('click', () => {
  tasks = tasks.filter(t => !t.completed);
  save(); render();
});

// initial render
render();


// --- Export / Import functionality ---
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');
const userEmailEl = document.getElementById('user-email');
const signinBtn = document.getElementById('signin-btn');
const signoutBtn = document.getElementById('signout-btn');

exportBtn && exportBtn.addEventListener('click', ()=>{
  const data = JSON.stringify(tasks, null, 2);
  const blob = new Blob([data], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'taskly-tasks-' + new Date().toISOString().slice(0,10) + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

importBtn && importBtn.addEventListener('click', ()=> importFile.click());
importFile && importFile.addEventListener('change', (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if(!Array.isArray(imported)) throw new Error('Invalid file format');
      // Merge: append imported tasks but avoid id collisions by reassigning ids
      const remapped = imported.map(t => ({ ...t, id: Date.now() + Math.floor(Math.random()*100000) }));
      tasks = remapped.concat(tasks);
      save(); render();
      alert('Imported ' + remapped.length + ' tasks.');
    } catch (err) {
      alert('Failed to import: ' + err.message);
    }
  };
  reader.readAsText(file);
  importFile.value = '';
});

// --- Optional Firebase integration (client-side only) ---
// This code assumes you will add Firebase SDK scripts in the HTML and provide a `window.firebaseConfig` object.
// It performs a simple email/password sign-in/up and syncs tasks to Firestore under collection `taskly_tasks`
// IMPORTANT: replace the placeholder config in README and HTML with your Firebase project's config.
async function initFirebaseIfAvailable(){
  try {
    if(!window.firebase || !window.firebase.firestore){
      // Firebase not loaded; skip gracefully.
      console.log('Firebase not detected. Skipping cloud sync.');
      return;
    }
    const auth = firebase.auth();
    const db = firebase.firestore();
    // UI handlers
    signinBtn && signinBtn.addEventListener('click', async ()=>{
      const email = prompt('Enter email for sign in / sign up:');
      if(!email) return;
      const pw = prompt('Enter password (min 6 chars):');
      if(!pw) return;
      try {
        // try sign in
        await auth.signInWithEmailAndPassword(email, pw);
      } catch (err) {
        // if sign in fails, try create user (simple flow)
        try {
          await auth.createUserWithEmailAndPassword(email, pw);
          alert('Account created and signed in.');
        } catch (e2) {
          alert('Auth failed: ' + e2.message);
          return;
        }
      }
    });
    signoutBtn && signoutBtn.addEventListener('click', ()=> auth.signOut());
    auth.onAuthStateChanged(async user => {
      if(user){
        userEmailEl.textContent = user.email || ('User:' + (user.uid||'anon'));
        signinBtn.style.display = 'none';
        signoutBtn.style.display = 'inline-flex';
        // Sync: upload local tasks to Firestore and subscribe to remote changes
        const col = db.collection('taskly_tasks').doc(user.uid);
        // Save snapshot to Firestore
        await col.set({ tasks }, { merge: true });
        // Listen for server updates
        col.onSnapshot(doc => {
          const data = doc.data();
          if(data && Array.isArray(data.tasks)){
            // merge remote tasks (simple strategy: replace local if remote newer)
            // Here we just set local tasks to remote tasks for clarity
            tasks = data.tasks;
            save();
            render();
            console.log('Tasks synced from cloud.');
          }
        });
      } else {
        userEmailEl.textContent = '';
        signinBtn.style.display = 'inline-flex';
        signoutBtn.style.display = 'none';
      }
    });
  } catch (err){
    console.error('Firebase init error', err);
  }
}

// Try to initialize Firebase (will be no-op if SDK not present)
initFirebaseIfAvailable();
 const taskInput = document.getElementById("taskInput");
taskInput.value = "";
saveTasks();
renderTasks();



taskList.addEventListener("click", (e) => {
if (e.target.classList.contains("delete")) {
const index = e.target.dataset.index;
tasks.splice(index, 1);
saveTasks();
renderTasks();
} else if (e.target.classList.contains("toggle")) {
const index = e.target.dataset.index;
tasks[index].completed = !tasks[index].completed;
saveTasks();
renderTasks();
}
});


// Export tasks
exportBtn.addEventListener("click", () => {
const blob = new Blob([JSON.stringify(tasks)], { type: "application/json" });
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = "tasks.json";
a.click();
URL.revokeObjectURL(url);
});


// Import tasks
importBtn.addEventListener("click", () => {
importFile.click();
});


importFile.addEventListener("change", (e) => {
const file = e.target.files[0];
if (!file) return;


const reader = new FileReader();
reader.onload = (event) => {
try {
const importedTasks = JSON.parse(event.target.result);
if (Array.isArray(importedTasks)) {
tasks = tasks.concat(importedTasks);
saveTasks();
renderTasks();
}
} catch (err) {
alert("Invalid file format");
}
};
reader.readAsText(file);
});


function renderTasks() {
taskList.innerHTML = "";
tasks.forEach((task, index) => {
const li = document.createElement("li");
li.innerHTML = `
<span class="${task.completed ? "completed" : ""}">${task.text}</span>
<button class="toggle" data-index="${index}">${task.completed ? "Undo" : "Done"}</button>
<button class="delete" data-index="${index}">Delete</button>
`;
taskList.appendChild(li);
});
}


function saveTasks() {
localStorage.setItem("tasks", JSON.stringify(tasks));
}


// Firebase placeholder (to be configured with your firebaseConfig)
// import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
// import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
// import { getFirestore } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";