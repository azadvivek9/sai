const express = require('express');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const app = express();
const PORT = 3000;

// 1. Cloudinary Configuration
cloudinary.config({
    cloud_name: 'dpow8ge6t', 
    api_key: '134938482959328',
    api_secret: '9D58xS50w3mO0n9PKPRcSBCR-YY'
});

// 2. Storage Setup
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const cleanName = file.originalname.split('.')[0];
        return {
            folder: 'my_cloud_uploads',
            public_id: cleanName, 
            resource_type: 'auto'
        };
    },
});
const upload = multer({ storage: storage });

app.use(express.urlencoded({ extended: true }));

const CSS = `<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
    body { font-family: 'Inter', sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 900px; margin: auto; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .btn { padding: 10px 20px; border-radius: 8px; cursor: pointer; text-decoration: none; border: none; font-weight: 600; font-size: 13px; transition: 0.3s; }
    .btn-primary { background: #4f46e5; color: white; width: 100%; margin-top: 10px; height: 45px; }
    .btn-success { background: #10b981; color: white; }
    .btn-download { background: #6366f1; color: white; }
    .btn-danger { background: #fee2e2; color: #ef4444; }
    
    /* Drag and Drop Box Styling */
    .upload-box { border: 2px dashed #4f46e5; padding: 50px; text-align: center; border-radius: 12px; background: #f8faff; cursor: pointer; transition: 0.2s; position: relative; }
    .upload-box.dragover { background: #e0e7ff; border-color: #10b981; border-style: solid; }
    
    .search-box { width: 100%; padding: 14px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; box-sizing: border-box; font-size: 14px; outline: none; }
    .table-wrapper { max-height: 550px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 10px; }
    table { width: 100%; border-collapse: collapse; }
    th { position: sticky; top: 0; background: #f1f5f9; padding: 15px; text-align: left; border-bottom: 2px solid #e2e8f0; z-index: 5; }
    td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .preview { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; }
    #fileInput { display: none; }
</style>`;

// 3. Dashboard Route
app.get('/', async (req, res) => {
    try {
        const result = await cloudinary.api.resources({ 
            type: 'upload', 
            prefix: 'my_cloud_uploads/', 
            max_results: 100
        });
        
        const files = result.resources.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        let tableRows = files.map(f => {
            const downloadUrl = f.secure_url.replace('/upload/', '/upload/fl_attachment/');
            const displayName = f.public_id.replace('my_cloud_uploads/', '');
            const isPDF = f.format === 'pdf';
            const displayUrl = isPDF ? 'https://cdn-icons-png.flaticon.com/512/337/337946.png' : f.secure_url;
            
            return `
            <tr class="file-row">
                <td><img src="${displayUrl}" class="preview" onerror="this.src='https://cdn-icons-png.flaticon.com/512/124/124837.png'"></td>
                <td class="file-name"><b>${displayName}.${f.format}</b></td>
                <td>${new Date(f.created_at).toLocaleDateString('en-IN')}</td>
                <td>
                    <div style="display:flex; gap:5px;">
                        <a href="${f.secure_url}" target="_blank" class="btn btn-success">View</a>
                        <a href="${downloadUrl}" class="btn btn-download">Download</a>
                        <a href="/delete/${encodeURIComponent(f.public_id)}?type=${f.resource_type}" class="btn btn-danger" onclick="return confirm('Delete?')">Delete</a>
                    </div>
                </td>
            </tr>`;
        }).join('');

        res.send(`${CSS}
        <div class="container">
            <h2 style="margin-top:0">Vivek Cloud Manager</h2>
            
            <form action="/upload" method="POST" enctype="multipart/form-data" id="uploadForm">
                <div class="upload-box" id="dropZone">
                    <p id="msg" style="margin:0; color:#4f46e5; font-weight:600;">Drag & Drop File Here or Click to Select</p>
                    <input type="file" name="file" id="fileInput" onchange="showFiles(this.files)" required>
                </div>
                <button type="submit" id="upBtn" class="btn btn-primary" style="display:none;">Upload Now</button>
            </form>

            <input type="text" id="searchInput" class="search-box" placeholder="Search by name..." onkeyup="searchFiles()">

            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr><th>Type</th><th>Original Name</th><th>Date</th><th>Actions</th></tr>
                    </thead>
                    <tbody id="fileTable">${tableRows || '<tr><td colspan="4" style="text-align:center;">No files found.</td></tr>'}</tbody>
                </table>
            </div>
        </div>

        <script>
            const dropZone = document.getElementById('dropZone');
            const fileInput = document.getElementById('fileInput');
            const upBtn = document.getElementById('upBtn');
            const msg = document.getElementById('msg');

            // Click to select
            dropZone.onclick = () => fileInput.click();

            // Drag and Drop Events
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
                msg.innerText = "Release to Drop File";
            });

            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('dragover');
                msg.innerText = "Drag & Drop File Here or Click to Select";
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    fileInput.files = files; // Input mein file set karna
                    showFiles(files);
                }
            });

            function showFiles(files) {
                if(files && files[0]) {
                    upBtn.style.display = 'block';
                    msg.innerText = "Selected: " + files[0].name;
                    msg.style.color = "#10b981";
                }
            }

            function searchFiles() {
                let input = document.getElementById('searchInput').value.toLowerCase();
                document.querySelectorAll('.file-row').forEach(row => {
                    let name = row.querySelector('.file-name').innerText.toLowerCase();
                    row.style.display = name.includes(input) ? "" : "none";
                });
            }
        </script>`);
    } catch (e) { res.status(500).send("Error: " + e.message); }
});

app.post('/upload', upload.single('file'), (req, res) => res.redirect('/'));

app.get('/delete/:public_id', async (req, res) => {
    try {
        await cloudinary.uploader.destroy(req.params.public_id, { resource_type: req.query.type || 'image' });
        res.redirect('/');
    } catch (e) { res.send("Error: " + e.message); }
});

app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
