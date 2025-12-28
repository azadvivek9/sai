const express = require('express');
const session = require('express-session');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'my_cloud_uploads',
        resource_type: 'auto' 
    },
});
const upload = multer({ storage: storage });

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'secure-vivek-key', resave: false, saveUninitialized: true }));

const CSS = `<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
    body { font-family: 'Inter', sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 900px; margin: auto; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .btn { padding: 8px 15px; border-radius: 8px; cursor: pointer; text-decoration: none; border: none; font-weight: 600; transition: 0.2s; display: inline-block; font-size: 12px; }
    .btn-primary { background: #4f46e5; color: white; }
    .btn-success { background: #10b981; color: white; }
    .btn-download { background: #6366f1; color: white; }
    .btn-danger { background: #fee2e2; color: #ef4444; }
    
    .upload-box { border: 2px dashed #cbd5e1; padding: 40px; text-align: center; border-radius: 12px; background: #f1f5f9; cursor: pointer; margin: 20px 0; }
    .upload-box.active { border-color: #4f46e5; background: #eef2ff; }
    #file-info { margin-top: 15px; font-weight: 600; color: #4f46e5; display: none; }

    .table-wrapper { max-height: 480px; overflow-y: auto; margin-top: 20px; border: 1px solid #e2e8f0; border-radius: 10px; }
    table { width: 100%; border-collapse: collapse; }
    th { position: sticky; top: 0; background: #f8fafc; padding: 15px; text-align: left; border-bottom: 2px solid #e2e8f0; }
    td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .preview { width: 45px; height: 45px; border-radius: 6px; object-fit: cover; background: #eee; }
    #fileInput { display: none; }
    .actions { display: flex; gap: 5px; }
</style>`;

// Login Page
app.get('/', (req, res) => {
    res.send(`${CSS}<div style="max-width:350px; margin:100px auto; background:white; padding:30px; border-radius:15px; text-align:center; box-shadow:0 5px 15px rgba(0,0,0,0.1)">
        <h2 style="color:#4f46e5">Vivek Cloud</h2>
        <form action="/login" method="POST"><input type="text" name="userid" placeholder="User ID" style="width:100%; padding:12px; margin:10px 0; border:1px solid #ddd; border-radius:8px;" required><input type="password" name="password" placeholder="Password" style="width:100%; padding:12px; margin:10px 0; border:1px solid #ddd; border-radius:8px;" required><button type="submit" class="btn btn-primary" style="width:100%; margin-top:10px; font-size:16px">Login</button></form></div>`);
});

app.post('/login', (req, res) => {
    if (req.body.userid === 'azadvivek9' && req.body.password === 'azadvivek99') {
        req.session.user = 'azadvivek9';
        res.redirect('/dashboard');
    } else { res.send("<script>alert('Wrong Credentials'); window.location='/';</script>"); }
});

// Dashboard
app.get('/dashboard', async (req, res) => {
    if (!req.session.user) return res.redirect('/');
    try {
        const result = await cloudinary.api.resources({ type: 'upload', prefix: 'my_cloud_uploads/', max_results: 100 });
        const files = result.resources;

        let tableRows = files.map(f => {
            // Cloudinary URL me 'fl_attachment' add karne se download trigger hota hai
            const downloadUrl = f.secure_url.replace('/upload/', '/upload/fl_attachment/');
            
            return `
            <tr>
                <td><img src="${f.secure_url}" class="preview" onerror="this.src='https://cdn-icons-png.flaticon.com/512/124/124837.png'"></td>
                <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis">${f.public_id.split('/').pop()}</td>
                <td>${new Date(f.created_at).toLocaleDateString('en-IN')}</td>
                <td class="actions">
                    <a href="${f.secure_url}" target="_blank" class="btn btn-success">View</a>
                    <a href="${downloadUrl}" class="btn btn-download">Download</a>
                    <a href="/delete/${encodeURIComponent(f.public_id)}" class="btn btn-danger" onclick="return confirm('Delete this file?')">Delete</a>
                </td>
            </tr>`;
        }).join('');

        res.send(`${CSS}<div class="container">
            <div style="display:flex; justify-content:space-between; align-items:center">
                <h2>Cloud Manager</h2>
                <a href="/logout" class="btn btn-danger">Logout</a>
            </div>

            <form action="/upload" method="POST" enctype="multipart/form-data">
                <div class="upload-box" id="dropZone">
                    <p id="msg">Drag & Drop file or <b>Click to Select</b></p>
                    <div id="file-info">Selected: <span id="file-name"></span></div>
                    <input type="file" name="file" id="fileInput" required>
                </div>
                <button type="submit" id="upBtn" class="btn btn-primary" style="width:100%; display:none; font-size:16px">Upload to Cloud Now</button>
            </form>

            <div class="table-wrapper">
                <table><thead><tr><th>Type</th><th>Name</th><th>Date</th><th>Actions</th></tr></thead><tbody>${tableRows || '<tr><td colspan="4" style="text-align:center; padding:40px; color:#94a3b8">No files uploaded yet.</td></tr>'}</tbody></table>
            </div>
        </div>
        <script>
            const dropZone = document.getElementById('dropZone');
            const fileInput = document.getElementById('fileInput');
            const fileInfo = document.getElementById('file-info');
            const fileName = document.getElementById('file-name');
            const upBtn = document.getElementById('upBtn');
            const msg = document.getElementById('msg');

            dropZone.onclick = () => fileInput.click();
            
            fileInput.onchange = () => {
                if(fileInput.files.length > 0) {
                    fileName.innerText = fileInput.files[0].name;
                    fileInfo.style.display = 'block';
                    upBtn.style.display = 'block';
                    msg.style.display = 'none';
                    dropZone.classList.add('active');
                }
            };

            dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('active'); };
            dropZone.ondragleave = () => dropZone.classList.remove('active');
            dropZone.ondrop = (e) => {
                e.preventDefault();
                fileInput.files = e.dataTransfer.files;
                fileInput.onchange();
            };
        </script>`);
    } catch (e) { res.send("Cloudinary Error: " + e.message); }
});

// Upload Logic
app.post('/upload', upload.single('file'), (req, res) => res.redirect('/dashboard'));

// Delete Logic
app.get('/delete/:public_id', async (req, res) => {
    if (!req.session.user) return res.redirect('/');
    try {
        await cloudinary.uploader.destroy(req.params.public_id);
        res.redirect('/dashboard');
    } catch (e) { res.send("Delete Error: " + e.message); }
});

// Logout
app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

app.listen(PORT, () => console.log(`Online on port ${PORT}`));
