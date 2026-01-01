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
    body { font-family: 'Inter', sans-serif; background: #0a0a0c; color: #e2e8f0; margin: 0; padding: 0; }
    nav { display: flex; justify-content: space-between; align-items: center; padding: 15px 50px; background: #121214; border-bottom: 1px solid #2d2d30; }
    .logo { font-size: 1.5rem; font-weight: bold; color: #a855f7; }
    .logo span { color: white; }
    .twodiv { display: flex; min-height: 100vh; }
    .sidebar { width: 250px; background: #0d0d0f; border-right: 1px solid #2d2d30; padding: 20px; }
    .sidebar-link { display: flex; align-items: center; gap: 12px; padding: 15px; color: white; text-decoration: none; border-radius: 8px; transition: 0.3s; margin-bottom: 5px; }
    .sidebar-link:hover { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
    .main-content { flex: 1; padding: 30px; }
    .container { background: #121214; padding: 30px; border-radius: 15px; border: 1px solid #2d2d30; }
    .btn { padding: 8px 15px; border-radius: 6px; cursor: pointer; text-decoration: none; font-weight: 600; border: none; display: inline-flex; align-items: center; gap: 5px; }
    .btn-success { background: #10b981; color: white; }
    .btn-download { background: #a855f7; color: white; }
    .btn-danger { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; }
    .btn-logout { background: #ef4444; color: white; }
    .upload-box { border: 2px dashed #a855f7; padding: 30px; text-align: center; border-radius: 12px; cursor: pointer; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { text-align: left; color: #a855f7; padding: 12px; border-bottom: 1px solid #2d2d30; }
    td { padding: 12px; border-bottom: 1px solid #1a1a1c; font-size: 14px; }
    .preview { width: 40px; height: 40px; border-radius: 5px; object-fit: cover; }
    #fileInput { display: none; }
</style>`;

app.get('/', isAdmin, async (req, res) => {
    try {
        const result = await cloudinary.api.resources({ type: 'upload', prefix: 'my_cloud_uploads/', max_results: 100 });
        const files = result.resources.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Is line ko niche res.send me use kiya hai
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
                        <a href="${f.secure_url}" target="_blank" class="btn btn-success"><i class="fa-solid fa-eye"></i> View</a>
                        <a href="${downloadUrl}" class="btn btn-download"><i class="fa-solid fa-download"></i>Download</a>
                        <a href="/delete/${encodeURIComponent(f.public_id)}" class="btn btn-danger" onclick="return confirm('Delete?')"><i class="fa-solid fa-trash"></i>Delete</a>
                    </div>
                </td>
            </tr>`;
        }).join('');

        // Yahan maine ${fontAwesome} include kar diya hai
        res.send(`
        <!DOCTYPE html>
        <html>
        <head>
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
                    <a href="#" class="sidebar-link"><i class="fa-solid fa-folder-tree"></i> File Manager</a>
                    <a href="#" class="sidebar-link"><i class="fa-solid fa-users-gear"></i> User Manager</a>
                </aside>

                <main class="main-content">
                    <div class="container">
                        <h2>Admin Dashboard</h2>
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
                            <thead>
                                <tr><th>Icon</th><th>Name</th><th>Date</th><th>Actions</th></tr>
                            </thead>
                            <tbody id="fileTable">${rows}</tbody>
                        </table>
                    </div>
                </main>
            </div>

            <script>
                const dz = document.getElementById('dropZone');
                const fi = document.getElementById('fileInput');
                dz.onclick = () => fi.click();
                fi.onchange = () => {
                    document.getElementById('msg').innerText = "Selected: " + fi.files[0].name;
                    document.getElementById('submitBtn').style.display = "flex";
                };

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
