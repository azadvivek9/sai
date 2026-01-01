const express = require('express');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(session({
    secret: 'vivek-cloud-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

cloudinary.config({
    cloud_name: 'dpow8ge6t', 
    api_key: '134938482959328',
    api_secret: '9D58xS50w3mO0n9PKPRcSBCR-YY'
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'my_cloud_uploads',
        resource_type: 'auto',
        public_id: (req, file) => file.originalname.split('.')[0]
    },
});
const upload = multer({ storage: storage });

app.use(express.urlencoded({ extended: true }));

const isAdmin = (req, res, next) => {
    if (req.session.isAdmin) return next();
    res.redirect('/login-page');
};

app.get('/login-page', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.get('/auth-bridge', (req, res) => {
    if (req.query.role === 'admin') {
        req.session.isAdmin = true;
        res.redirect('/');
    } else { res.redirect('/login-page'); }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login-page');
});

const CSS = `<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
    body { font-family: 'Inter', sans-serif; background: #0a0a0c; color: #e2e8f0; margin: 0; padding: 0; overflow-x: hidden; }
    nav { display: flex; justify-content: space-between; align-items: center; padding: 15px 50px; background: #121214; border-bottom: 1px solid #2d2d30; position: sticky; top: 0; z-index: 100; }
    .logo { font-size: 1.5rem; font-weight: bold; color: #a855f7; cusrsor:pointer; }
    .logo span { color: white; }
    .twodiv { display: flex; min-height: 100vh; }
    .sidebar { width: 250px; background: #0d0d0f; border-right: 1px solid #2d2d30; padding: 20px; position: fixed; height: 100%; }
    .sidebar-link { display: flex; align-items: center; gap: 12px; padding: 15px; color: #94a3b8; text-decoration: none; border-radius: 8px; transition: 0.3s; margin-bottom: 5px; cursor: pointer; }
    .sidebar-link:hover { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
    .sidebar-link.active { background: rgba(168, 85, 247, 0.15); color: #a855f7; font-weight: 600; border-left: 4px solid #a855f7; }
    .main-content { flex: 1; padding: 30px; margin-left: 290px; }
    .container { background: #121214; padding: 30px; border-radius: 15px; border: 1px solid #2d2d30; margin-bottom: 30px; }
    .btn { padding: 8px 15px; border-radius: 6px; cursor: pointer; text-decoration: none; font-weight: 600; border: none; display: inline-flex; align-items: center; gap: 5px; font-size: 13px; }
    .btn-success { background: #10b981; color: white; }
    .btn-download { background: #a855f7; color: white; }
    .btn-danger { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; }
    .btn-logout { background: #ef4444; color: white; }
    .upload-box { border: 2px dashed #a855f7; padding: 30px; text-align: center; border-radius: 12px; cursor: pointer; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { text-align: left; color: #a855f7; padding: 12px; border-bottom: 1px solid #2d2d30; }
    td { padding: 12px; border-bottom: 1px solid #1a1a1c; font-size: 14px; }
    .preview { width: 40px; height: 40px; border-radius: 5px; object-fit: cover; }
    #fileInput { display: none; }
    .content-section { display: none; animation: fadeIn 0.3s ease; }
    .content-section.active { display: block; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    h3 { color: #a855f7; margin-top: 0; border-left: 3px solid #a855f7; padding-left: 10px; }
</style>`;

app.get('/', isAdmin, async (req, res) => {
    try {
        const result = await cloudinary.api.resources({ type: 'upload', prefix: 'my_cloud_uploads/', max_results: 100 });
        const files = result.resources.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        const fontAwesome = `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">`;

        let rows = files.map(f => {
            const downloadUrl = f.secure_url.replace('/upload/', '/upload/fl_attachment/');
            const preview = f.format === 'pdf' ? 'https://cdn-icons-png.flaticon.com/512/337/337946.png' : f.secure_url;
            return `<tr class="file-row">
                <td><img src="${preview}" class="preview"></td>
                <td class="file-name"><b>${f.public_id.split('/').pop()}.${f.format}</b></td>
                <td>${new Date(f.created_at).toLocaleDateString()}</td>
                <td>
                    <div style="display:flex; gap:8px;">
                        <a href="${f.secure_url}" target="_blank" class="btn btn-success"><i class="fa-solid fa-eye"></i></a>
                        <a href="${downloadUrl}" class="btn btn-download"><i class="fa-solid fa-download"></i></a>
                        <a href="/delete/${encodeURIComponent(f.public_id)}" class="btn btn-danger" onclick="return confirm('Delete?')"><i class="fa-solid fa-trash"></i></a>
                    </div>
                </td>
            </tr>`;
        }).join('');

        res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Admin Dashboard</title>
            ${fontAwesome}
            ${CSS}
        </head>
        <body>
            <nav>
                <div class="logo">WEB_ <span>SAI</span></div>
                <a href="/logout" class="btn btn-logout"><i class="fa-solid fa-right-from-bracket"></i> Logout</a>
            </nav>

            <div class="twodiv">
                <aside class="sidebar">
                    <div onclick="switchSection('file-manager', this)" class="sidebar-link active">
                        <i class="fa-solid fa-folder-tree"></i> File Manager
                    </div>
                    <div onclick="switchSection('user-manager', this)" class="sidebar-link">
                        <i class="fa-solid fa-users-gear"></i> User Manager
                    </div>
                </aside>

                <main class="main-content">
                    
                    <div id="file-manager" class="content-section active">
                        <div class="container">
                            <h2>File Manager</h2>
                            <form action="/upload" method="POST" enctype="multipart/form-data">
                                <div class="upload-box" id="dropZone">
                                    <i class="fa-solid fa-cloud-arrow-up" style="font-size: 2rem; color: #a855f7;"></i>
                                    <p id="msg">Click or Drag to Upload File</p>
                                    <input type="file" name="file" id="fileInput">
                                </div>
                                <button type="submit" id="submitBtn" class="btn btn-download" style="margin-bottom: 20px; display:none; width: 100%; height: 45px; justify-content: center;">Start Upload</button>
                            </form>
                            <input type="text" id="search" style="width:100%; padding:10px; background:#1a1a1c; border:1px solid #2d2d30; color:white; border-radius:8px; margin-bottom:15px;" placeholder="Search files..." onkeyup="filterFiles()">
                            <table>
                                <thead><tr><th>Icon</th><th>Name</th><th>Date</th><th>Actions</th></tr></thead>
                                <tbody id="fileTable">${rows}</tbody>
                            </table>
                        </div>
                    </div>

                    <div id="user-manager" class="content-section">
                        <div class="container">
                            <h2>User Management</h2>
                            
                            <h3>Pending Requests</h3>
                            <table>
                                <thead><tr><th>Name</th><th>Email</th><th>Action</th></tr></thead>
                                <tbody id="pendingList"></tbody>
                            </table>

                            <br><br>

                            <h3>Approved Users</h3>
                            <table>
                                <thead><tr><th>Name</th><th>Email</th><th>Action</th></tr></thead>
                                <tbody id="approvedList"></tbody>
                            </table>
                        </div>
                    </div>

                </main>
            </div>

            <script type="module">
                import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
                import { getFirestore, collection, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
                import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

                const firebaseConfig = { 
                    apiKey: "AIzaSyDrcb2lwXRtJ85KlsvY5-BavRc6tITyqTA", 
                    authDomain: "saii-13582.firebaseapp.com", 
                    projectId: "saii-13582", 
                    storageBucket: "saii-13582.firebasestorage.app", 
                    messagingSenderId: "831264433866", 
                    appId: "1:831264433866:web:5ed6230a0cbcc38102b633" 
                };
                
                const app = initializeApp(firebaseConfig);
                const db = getFirestore(app);
                const auth = getAuth(app);

                // Firebase Realtime Listener
                onSnapshot(collection(db, "users"), (snapshot) => {
                    const pList = document.getElementById('pendingList');
                    const aList = document.getElementById('approvedList');
                    pList.innerHTML = ""; aList.innerHTML = "";
                    
                    snapshot.forEach((uDoc) => {
                        const data = uDoc.data();
                        if (data.role === 'admin') return;
                        
                        const row = \`<tr>
                            <td>\${data.fullName}</td>
                            <td>\${data.email}</td>
                            <td>
                                \${!data.isApproved ? \`<button class="btn btn-success" onclick="approveUser('\${uDoc.id}')"><i class="fa-solid fa-check"></i> Approve</button>\` : ''}
                                <button class="btn btn-danger" onclick="deleteUser('\${uDoc.id}')"><i class="fa-solid fa-user-minus"></i> Remove</button>
                            </td>
                        </tr>\`;
                        
                        if (data.isApproved) aList.innerHTML += row; 
                        else pList.innerHTML += row;
                    });
                });

                // Global functions for buttons
                window.approveUser = async (id) => { 
                    await updateDoc(doc(db, "users", id), { isApproved: true }); 
                }
                window.deleteUser = async (id) => { 
                    if(confirm("Delete this user?")) await deleteDoc(doc(db, "users", id)); 
                }
            </script>

            <script>
                // Section Switcher
                function switchSection(sectionId, element) {
                    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
                    document.getElementById(sectionId).classList.add('active');
                    document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
                    element.classList.add('active');
                }

                // File Upload Logic
                const dz = document.getElementById('dropZone');
                const fi = document.getElementById('fileInput');
                if(dz) {
                    dz.onclick = () => fi.click();
                    fi.onchange = () => {
                        document.getElementById('msg').innerText = "Selected: " + fi.files[0].name;
                        document.getElementById('submitBtn').style.display = "flex";
                    };
                }

                // Search
                function filterFiles() {
                    let v = document.getElementById('search').value.toLowerCase();
                    document.querySelectorAll('.file-row').forEach(r => {
                        r.style.display = r.querySelector('.file-name').innerText.toLowerCase().includes(v) ? "" : "none";
                    });
                }
            </script>
        </body>
        </html>`);
    } catch (e) { res.send(e.message); }
});

app.post('/upload', isAdmin, upload.single('file'), (req, res) => res.redirect('/'));
app.get('/delete/:public_id', isAdmin, async (req, res) => {
    await cloudinary.uploader.destroy(req.params.public_id);
    res.redirect('/');
});

app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}/login-page`));
