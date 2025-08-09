// admin-blog.js - Blog management for admin panel

document.addEventListener('DOMContentLoaded', function() {
    // Add Blog section to admin panel navigation
    addBlogAdminSection();
});

function addBlogAdminSection() {
    const adminNav = document.querySelector('.admin-nav');
    if (!adminNav && document.getElementById('adminPanel')) return;
    // Add Blog button
    const blogBtn = document.createElement('button');
    blogBtn.className = 'admin-nav-btn';
    blogBtn.setAttribute('data-section', 'blog');
    blogBtn.innerHTML = '<i class="fas fa-blog"></i> Blog';
    adminNav.appendChild(blogBtn);

    // Add Blog section
    const container = document.querySelector('#adminPanel .container');
    const blogSection = document.createElement('div');
    blogSection.className = 'admin-section';
    blogSection.id = 'blog-section';
    blogSection.innerHTML = `
        <div class="section-header">
            <h2>Blog Management</h2>
            <button class="btn-primary" id="addBlogPostBtn">
                <i class="fas fa-plus"></i> Add Blog Post
            </button>
        </div>
        <div class="blog-form" id="blogForm" style="display:none;">
            <h3 id="blogFormTitle">Add New Blog Post</h3>
            <form id="blogFormElement">
                <input type="hidden" id="blogId">
                <div class="form-group">
                    <label for="blogTitle">Title</label>
                    <input type="text" id="blogTitle" required>
                </div>
                <div class="form-group">
                    <label for="blogContent">Content</label>
                    <textarea id="blogContent" rows="6" required></textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary"><i class="fas fa-save"></i> Save Post</button>
                    <button type="button" class="btn-secondary" id="cancelBlogBtn"><i class="fas fa-times"></i> Cancel</button>
                </div>
            </form>
        </div>
        <div class="blog-list" id="adminBlogList"></div>
    `;
    container.appendChild(blogSection);

    // Navigation logic
    blogBtn.addEventListener('click', function() {
        document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
        blogSection.classList.add('active');
        document.querySelectorAll('.admin-nav-btn').forEach(btn => btn.classList.remove('active'));
        blogBtn.classList.add('active');
        renderAdminBlogList();
    });

    // Add post button
    blogSection.querySelector('#addBlogPostBtn').addEventListener('click', function() {
        showBlogForm();
    });

    // Cancel button
    blogSection.querySelector('#cancelBlogBtn').addEventListener('click', function() {
        hideBlogForm();
    });

    // Blog form submit
    blogSection.querySelector('#blogFormElement').addEventListener('submit', function(e) {
        e.preventDefault();
        saveBlogPost();
    });
}

function getBlogPosts() {
    try {
        return JSON.parse(localStorage.getItem('blogPosts') || '[]');
    } catch (e) {
        return [];
    }
}

function saveBlogPosts(posts) {
    localStorage.setItem('blogPosts', JSON.stringify(posts));
}

function renderAdminBlogList() {
    const posts = getBlogPosts();
    const listDiv = document.getElementById('adminBlogList');
    if (!listDiv) return;
    listDiv.innerHTML = '';
    if (posts.length === 0) {
        listDiv.innerHTML = '<p>No blog posts yet.</p>';
        return;
    }
    posts.reverse().forEach((post, idx) => {
        const postDiv = document.createElement('div');
        postDiv.className = 'admin-blog-post';
        postDiv.innerHTML = `
            <h3>${post.title}</h3>
            <div class="blog-content">${post.content}</div>
            <div class="blog-date">${post.date || ''}</div>
            <button class="btn-secondary" onclick="editBlogPost(${posts.length-1-idx})"><i class='fas fa-edit'></i> Edit</button>
            <button class="btn-danger" onclick="deleteBlogPost(${posts.length-1-idx})"><i class='fas fa-trash'></i> Delete</button>
        `;
        listDiv.appendChild(postDiv);
    });
}

function showBlogForm(editIdx) {
    const form = document.getElementById('blogForm');
    form.style.display = 'block';
    if (typeof editIdx === 'number') {
        const posts = getBlogPosts();
        const post = posts[editIdx];
        document.getElementById('blogId').value = editIdx;
        document.getElementById('blogTitle').value = post.title;
        document.getElementById('blogContent').value = post.content;
        document.getElementById('blogFormTitle').textContent = 'Edit Blog Post';
    } else {
        document.getElementById('blogId').value = '';
        document.getElementById('blogTitle').value = '';
        document.getElementById('blogContent').value = '';
        document.getElementById('blogFormTitle').textContent = 'Add New Blog Post';
    }
}

function hideBlogForm() {
    document.getElementById('blogForm').style.display = 'none';
}

function saveBlogPost() {
    const id = document.getElementById('blogId').value;
    const title = document.getElementById('blogTitle').value;
    const content = document.getElementById('blogContent').value;
    const date = new Date().toLocaleDateString();
    let posts = getBlogPosts();
    if (id === '') {
        posts.push({ title, content, date });
    } else {
        posts[parseInt(id)] = { title, content, date };
    }
    saveBlogPosts(posts);
    hideBlogForm();
    renderAdminBlogList();
    if (window.blogUtils) window.blogUtils.renderBlogPosts();
}

function editBlogPost(idx) {
    showBlogForm(idx);
}

function deleteBlogPost(idx) {
    let posts = getBlogPosts();
    posts.splice(idx, 1);
    saveBlogPosts(posts);
    renderAdminBlogList();
    if (window.blogUtils) window.blogUtils.renderBlogPosts();
}

// Expose for inline onclick
window.editBlogPost = editBlogPost;
window.deleteBlogPost = deleteBlogPost;
