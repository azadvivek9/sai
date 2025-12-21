const express = require('express');
const session = require('express-session');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

cloudinary.config({
    cloud_name: 'dpow8ge6t', 
    api_key: '134938482959328',
    api_secret: '9D58xS50w3mO0n9PKPRcSBCR-YY' 
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
    .container { max-width: 850px; margin: auto; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .btn { padding: 10px 20px; border-radius: 8px; cursor: pointer; text-decoration: none; border: none; font-weight: 600; transition: 0.2s; }
    .btn-primary { background: #4f46e5; color: white; }
    .btn-primary:hover { background: #4338ca; }
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
</style>`;

app.get('/', (req, res) => {
    res.send(`${CSS}<div style="max-width:350px; margin:100px auto; background:white; padding:30px; border-radius:15px; text-align:center; box-shadow:0 5px 15px rgba(0,0,0,0.1)">
        <h2 style="color:#4f46e5">Vivek Cloud</h2>
        <form action="/login" method="POST"><input type="text" name="userid" placeholder="User ID" style="width:100%; padding:12px; margin:10px 0; border:1px solid #ddd; border-radius:8px;" required><input type="password" name="password" placeholder="Password" style="width:100%; padding:12px; margin:10px 0; border:1px solid #ddd; border-radius:8px;" required><button type="submit" class="btn btn-primary" style="width:100%; margin-top:10px">Login</button></form></div>`);
});

app.post('/login', (req, res) => {
    if (req.body.userid === 'azadvivek9' && req.body.password === 'azadvivek99') {
        req.session.user = 'azadvivek9';
        res.redirect('/dashboard');
    } else { res.send("<script>alert('Wrong Credentials'); window.location='/';</script>"); }
});

app.get('/dashboard', async (req, res) => {
    if (!req.session.user) return res.redirect('/');
    try {
        const result = await cloudinary.api.resources({ type: 'upload', prefix: 'my_cloud_uploads/', max_results: 100 });
        const files = result.resources;

        let tableRows = files.map(f => `
            <tr>
                <td><img src="${f.secure_url}" class="preview" onerror="this.src='https://cdn-icons-png.flaticon.com/512/124/124837.png'"></td>
                <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis">${f.public_id.split('/').pop()}</td>
                <td>${new Date(f.created_at).toLocaleDateString('en-IN')}</td>
                <td>
                    <a href="${f.secure_url}" target="_blank" class="btn btn-primary" style="padding:5px 10px; font-size:12px">View</a>
                    <a href="/delete/${encodeURIComponent(f.public_id)}" class="btn btn-danger" style="padding:5px 10px; font-size:12px" onclick="return confirm('Delete?')">Delete</a>
                </td>
            </tr>`).join('');

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
                <button type="submit" id="upBtn" class="btn btn-primary" style="width:100%; display:none">Upload to Cloud Now</button>
            </form>

            <div class="table-wrapper">
                <table><thead><tr><th>Type</th><th>Name</th><th>Date</th><th>Action</th></tr></thead><tbody>${tableRows || '<tr><td colspan="4" style="text-align:center; padding:40px; color:#94a3b8">No files uploaded yet.</td></tr>'}</tbody></table>
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

app.post('/upload', upload.single('file'), (req, res) => res.redirect('/dashboard'));

app.get('/delete/:public_id', async (req, res) => {
    if (!req.session.user) return res.redirect('/');
    await cloudinary.uploader.destroy(req.params.public_id);
    res.redirect('/dashboard');
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

app.listen(PORT, () => console.log(`Online on port ${PORT}`));