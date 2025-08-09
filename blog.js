// blog.js - Handles displaying blog posts

document.addEventListener('DOMContentLoaded', function() {
    renderBlogPosts();
});

function getBlogPosts() {
    try {
        return JSON.parse(localStorage.getItem('blogPosts') || '[]');
    } catch (e) {
        return [];
    }
}

function renderBlogPosts() {
    const posts = getBlogPosts();
    const blogPostsDiv = document.getElementById('blogPosts');
    if (!blogPostsDiv) return;
    blogPostsDiv.innerHTML = '';
    if (posts.length === 0) {
        blogPostsDiv.innerHTML = '<p>No blog posts yet.</p>';
        return;
    }
    posts.reverse().forEach(post => {
        const postDiv = document.createElement('div');
        postDiv.className = 'blog-post';
        postDiv.innerHTML = `
            <h2>${post.title}</h2>
            <p class="blog-date">${post.date || ''}</p>
            <div class="blog-content">${post.content}</div>
        `;
        blogPostsDiv.appendChild(postDiv);
    });
}

// Expose for admin panel
window.blogUtils = { getBlogPosts, renderBlogPosts };
