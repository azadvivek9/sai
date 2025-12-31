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

// Admin Auth Middleware
const isAdmin = (req, res, next) => {
    if (req.session.isAdmin) return next();
    res.redirect('/login-page');
};

// Serve HTML Files
app.get('/login-page', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/normal.html', (req, res) => res.sendFile(path.join(__dirname, 'normal.html')));

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
    body { font-family: 'Inter', sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
    .container { max-width: 1000px; margin: auto; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .nav-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .btn { padding: 8px 14px; border-radius: 6px; cursor: pointer; text-decoration: none; font-weight: 600; font-size: 12px; border:none; display: inline-flex; align-items: center; justify-content: center; transition: 0.2s; }
    .btn-success { background: #10b981; color: white; }
    .btn-download { background: #6366f1; color: white; }
    .btn-danger { background: #fee2e2; color: #ef4444; }
    .btn-logout { background: #334155; color: white; }
    .btn-primary { background: #4f46e5; color: white; width: 100%; margin-top: 10px; height: 45px; font-size: 15px; }
    .upload-box { border: 2px dashed #4f46e5; padding: 40px; text-align: center; border-radius: 12px; background: #f8faff; cursor: pointer; margin-bottom: 20px; transition: 0.3s; }
    .upload-box.dragover { background: #e0e7ff; border-color: #10b981; }
    .search-box { width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; outline: none; box-sizing: border-box; }
    .table-wrapper { max-height: 500px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 10px; }
    table { width: 100%; border-collapse: collapse; }
    th { position: sticky; top: 0; background: #f1f5f9; padding: 15px; text-align: left; }
    td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .preview { width: 45px; height: 45px; border-radius: 8px; object-fit: cover; }
    #fileInput { display: none; }
</style>`;

app.get('/', isAdmin, async (req, res) => {
    try {
        const result = await cloudinary.api.resources({ type: 'upload', prefix: 'my_cloud_uploads/', max_results: 100 });
        const files = result.resources.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        let rows = files.map(f => {
            const downloadUrl = f.secure_url.replace('/upload/', '/upload/fl_attachment/');
            const preview = f.format === 'pdf' ? 'https://cdn-icons-png.flaticon.com/512/337/337946.png' : f.secure_url;
            return `<tr class="file-row">
                <td><img src="${preview}" class="preview" onerror="this.src='https://cdn-icons-png.flaticon.com/512/124/124837.png'"></td>
                <td class="file-name"><b>${f.public_id.split('/').pop()}.${f.format}</b></td>
                <td>${new Date(f.created_at).toLocaleDateString()}</td>
                <td>
                    <div style="display:flex; gap:8px;">
                        <a href="${f.secure_url}" target="_blank" class="btn btn-success">View</a>
                        <a href="${downloadUrl}" class="btn btn-download">Download</a>
                        <a href="/delete/${encodeURIComponent(f.public_id)}" class="btn btn-danger" onclick="return confirm('Delete?')">Delete</a>
                    </div>
                </td>
            </tr>`;
        }).join('');

        res.send(`${CSS}
        <div class="container">
            <div class="nav-header"><h2>Admin Dashboard</h2><a href="/logout" class="btn btn-logout">Logout</a></div>
            <form action="/upload" method="POST" enctype="multipart/form-data">
                <div class="upload-box" id="dropZone"><p id="msg">Drag & Drop or Click to Upload</p><input type="file" name="file" id="fileInput"></div>
                <button type="submit" id="submitBtn" class="btn btn-primary" style="display:none;">Upload Start</button>
            </form>
            <input type="text" id="search" class="search-box" placeholder="Search files..." onkeyup="filterFiles()">
            <div class="table-wrapper"><table><thead><tr><th>Type</th><th>Name</th><th>Date</th><th>Actions</th></tr></thead><tbody id="fileTable">${rows}</tbody></table></div>
        </div>
        <script>
            const dz = document.getElementById('dropZone');
            const fi = document.getElementById('fileInput');
            dz.onclick = () => fi.click();
            dz.ondragover = (e) => { e.preventDefault(); dz.classList.add('dragover'); };
            dz.ondragleave = () => dz.classList.remove('dragover');
            dz.ondrop = (e) => { e.preventDefault(); fi.files = e.dataTransfer.files; update(fi.files[0].name); };
            fi.onchange = () => update(fi.files[0].name);
            function update(n) { document.getElementById('msg').innerText = "Selected: " + n; document.getElementById('submitBtn').style.display = "block"; }
            function filterFiles() {
                let v = document.getElementById('search').value.toLowerCase();
                document.querySelectorAll('.file-row').forEach(r => {
                    r.style.display = r.querySelector('.file-name').innerText.toLowerCase().includes(v) ? "" : "none";
                });
            }
        </script>`);
    } catch (e) { res.send(e.message); }
});

app.post('/upload', isAdmin, upload.single('file'), (req, res) => res.redirect('/'));
app.get('/delete/:public_id', isAdmin, async (req, res) => {
    await cloudinary.uploader.destroy(req.params.public_id);
    res.redirect('/');
});

app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}/login-page`));
