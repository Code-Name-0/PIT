async function loadPosts() {
    try {
        const response = await fetch('/liste');
        const posts = await response.json();
        console.log('Posts loaded:', posts);
        // Implement in Phase 5
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
});
