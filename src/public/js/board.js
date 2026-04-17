// Global state
let currentUser = null;
let currentUserId = null;
let isAdmin = false;
let posts = [];

// Drag and drop state
let isDragging = false;
let draggedPost = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Initialize board on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Extract user info from template variable (set by backend)
    const userElement = document.querySelector('script[type="application/json"][id="user-data"]');
    if (userElement) {
        const userData = JSON.parse(userElement.textContent);
        currentUser = userData.username || null;
        currentUserId = userData.userId || null;
        isAdmin = userData.isAdmin || false;
    }

    // Load posts
    await loadPosts();

    // Initialize WebSocket for real-time updates (for all users)
    initWebSocket();

    // Attach event listeners
    attachBoardListeners();
    setupModals();

    // Recalculate post positions when window is resized
    window.addEventListener('resize', () => {
        constrainAllPostPositions();
    });
});

// Disconnect WebSocket on page unload
window.addEventListener('beforeunload', () => {
    if (wsClient) {
        wsClient.disconnect();
    }
});

// Fetch posts from /liste
async function loadPosts() {
    try {
        const response = await fetch('/liste');
        posts = await response.json();
        console.log('Posts loaded from /liste:', posts);
        renderBoard();
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

// ==============================
// WEBSOCKET INTEGRATION (Phase 8)
// ==============================

/**
 * Initialize WebSocket client for real-time updates
 */
function initWebSocket() {
    wsClient = new PostItWebSocketClient({
        onPostCreated: (postData) => {
            console.log('[Board] WebSocket: post created', postData);
            // Add to posts array if not already present
            if (!posts.find(p => p.id === postData.id)) {
                posts.push(postData);
                renderBoard();
            }
        },
        onPostUpdated: (postData) => {
            console.log('[Board] WebSocket: post updated', postData);
            // Find and update post in array
            const postIndex = posts.findIndex(p => p.id === postData.id);
            if (postIndex !== -1) {
                posts[postIndex].text = postData.text;
                posts[postIndex].updated_at = postData.updated_at;
                renderBoard();
            }
        },
        onPostDeleted: (data) => {
            console.log('[Board] WebSocket: post deleted', data);
            // Remove from array
            posts = posts.filter(p => p.id !== data.id);
            renderBoard();
        }
    });
}


// Render posts on board
function renderBoard() {
    const board = document.getElementById('board');

    // Remove old post-its
    document.querySelectorAll('.post-it').forEach(el => el.remove());

    // Get board dimensions for boundary checking
    const boardWidth = board.clientWidth;
    const boardHeight = board.clientHeight;

    // Sort posts by created_at (newest last, so they appear on top due to z-index)
    const sortedPosts = [...posts].sort((a, b) =>
        new Date(a.created_at) - new Date(b.created_at)
    );

    // Render each post-it
    sortedPosts.forEach((post, index) => {
        const postElement = createPostElement(post, index);

        // Add to DOM first to get actual dimensions
        board.appendChild(postElement);

        // Get actual post dimensions
        const postWidth = postElement.offsetWidth;
        const postHeight = postElement.offsetHeight;

        // Constrain post position to board boundaries
        let x = Math.max(0, Math.min(post.x, Math.max(0, boardWidth - postWidth)));
        let y = Math.max(0, Math.min(post.y, Math.max(0, boardHeight - postHeight)));

        postElement.style.left = x + 'px';
        postElement.style.top = y + 'px';

        attachPostDragListeners(postElement);
    });
}

// Create DOM element for post-it
function createPostElement(post, zIndex) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post-it';
    postDiv.dataset.postId = post.id;
    postDiv.dataset.authorId = post.author_id;
    postDiv.style.zIndex = zIndex; // Newer posts on top

    // Format date
    const dateObj = new Date(post.created_at);
    const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Build HTML
    let html = `
    <div class="post-it-text">${escapeHtml(post.text)}</div>
    <div class="post-it-footer">
      <div class="post-it-author">By ${escapeHtml(post.author)}</div>
      <div class="post-it-date">${dateStr}</div>
  `;

    // Add action buttons if user is the owner OR admin
    if (currentUserId && (currentUserId === post.author_id || isAdmin)) {
        html += `
      <div class="post-it-actions">
        <button class="post-it-btn post-it-btn-edit" data-action="edit" data-post-id="${post.id}">Edit</button>
        <button class="post-it-btn post-it-btn-delete" data-action="delete" data-post-id="${post.id}">Delete</button>
      </div>
    `;
    }

    html += `</div>`;
    postDiv.innerHTML = html;

    // Attach event listeners to buttons
    const editBtn = postDiv.querySelector('[data-action="edit"]');
    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const postId = parseInt(e.target.dataset.postId);
            const postText = post.text;
            openEditModal(postId, postText);
        });
    }

    const deleteBtn = postDiv.querySelector('[data-action="delete"]');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const postId = parseInt(e.target.dataset.postId);
            deletePostWithConfirm(postId);
        });
    }

    return postDiv;
}

// Escape HTML special characters (prevent XSS)
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Escape HTML in attributes
function escapeHtmlAttr(text) {
    return escapeHtml(text).replace(/"/g, '&quot;');
}

// Attach board event listeners
function attachBoardListeners() {
    const board = document.getElementById('board');

    // Double-click to create post
    board.addEventListener('dblclick', (e) => {
        // Ignore if clicking on existing post buttons
        if (e.target.closest('.post-it-btn')) return;

        if (!currentUserId) {
            alert('You must be logged in to create posts.');
            window.location.href = '/login';
            return;
        }

        const rect = board.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        openCreateModal(x, y);
    });

    // ==============================
    // ENHANCED MOBILE TOUCH HANDLING (Phase 7)
    // ==============================

    // Double-tap detection for mobile
    let lastTap = 0;
    let touchStartX = 0;
    let touchStartY = 0;

    board.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });

    board.addEventListener('touchend', (e) => {
        const now = Date.now();
        const timeSinceLastTap = now - lastTap;
        lastTap = now;

        // Calculate touch distance (to prevent accidental double-taps while dragging)
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const distance = Math.sqrt(
            Math.pow(touchEndX - touchStartX, 2) +
            Math.pow(touchEndY - touchStartY, 2)
        );

        // Double-tap: within 300ms and minimal movement (< 10px)
        if (timeSinceLastTap < 300 && timeSinceLastTap > 0 && distance < 10) {
            e.preventDefault();

            if (!currentUserId) {
                alert('You must be logged in to create posts.');
                return;
            }

            const touch = e.changedTouches[0];
            const rect = board.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            openCreateModal(x, y);
        }
    });

    // Prevent long-press context menu on post-its (optional but improves mobile UX)
    board.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });

    // Handle modal closing on mobile (swipe down gesture optional)
    document.addEventListener('touchmove', (e) => {
        // Allow scrolling in textareas
        if (!e.target.closest('textarea')) {
            // Prevent default scrolling on body (overflow: hidden already does this)
        }
    }, { passive: true });
}

// Setup modal event handlers
function setupModals() {
    // Create form submission handler
    const createForm = document.getElementById('create-form');
    if (createForm) {
        createForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = document.querySelector('#create-text').value;
            const xInput = createForm.querySelector('input[name="x"]');
            const yInput = createForm.querySelector('input[name="y"]');
            const x = parseFloat(xInput.value || 0);
            const y = parseFloat(yInput.value || 0);
            console.log('Form submission - text:', text, 'x:', x, 'y:', y);
            createPost(text, x, y);
        });
    }

    // Edit form submission handler
    const editForm = document.getElementById('edit-form');
    if (editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const postIdInput = editForm.querySelector('input[name="post_id"]');
            const postId = parseInt(postIdInput.value);
            const text = document.querySelector('#edit-text').value;
            console.log('Edit form submission - postId:', postId, 'text:', text);
            editPost(postId, text);
        });
    }

    // Use event delegation on modal-buttons divs
    document.addEventListener('click', (e) => {
        const btn = e.target;

        if (btn.dataset.action === 'cancel-create') {
            console.log('Cancel create clicked');
            e.preventDefault();
            e.stopPropagation();
            closeModal('create-modal');
        }

        if (btn.dataset.action === 'cancel-edit') {
            console.log('Cancel edit clicked');
            e.preventDefault();
            e.stopPropagation();
            closeModal('edit-modal');
        }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal('create-modal');
            closeModal('edit-modal');
        }
    });

    // Close on background click
    document.getElementById('create-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'create-modal') {
            closeModal('create-modal');
        }
    });

    document.getElementById('edit-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'edit-modal') {
            closeModal('edit-modal');
        }
    });
}

// Open create post modal
function openCreateModal(x, y) {
    const modal = document.getElementById('create-modal');
    const textarea = modal.querySelector('textarea');
    const xInput = modal.querySelector('input[name="x"]');
    const yInput = modal.querySelector('input[name="y"]');
    const errorDiv = modal.querySelector('.modal-error');

    textarea.value = '';
    xInput.value = x;
    yInput.value = y;
    errorDiv.classList.remove('show');

    modal.classList.add('active');
    textarea.focus();
}

// Open edit post modal
function openEditModal(postId, currentText) {
    const modal = document.getElementById('edit-modal');
    const textarea = modal.querySelector('textarea');
    const postIdInput = modal.querySelector('input[name="post_id"]');
    const errorDiv = modal.querySelector('.modal-error');

    textarea.value = currentText;
    postIdInput.value = postId;
    errorDiv.classList.remove('show');

    modal.classList.add('active');
    textarea.focus();
    textarea.select();
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Show modal error
function showModalError(modalId, message) {
    const modal = document.getElementById(modalId);
    const errorDiv = modal.querySelector('.modal-error');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

// Create post AJAX
async function createPost(text, x, y) {
    const modal = document.getElementById('create-modal');

    // Validate text
    if (!text || text.trim().length === 0) {
        showModalError('create-modal', 'Text cannot be empty');
        return;
    }

    if (text.length > 500) {
        showModalError('create-modal', 'Text must not exceed 500 characters');
        return;
    }

    console.log('Creating post:', { text, x, y });

    try {
        const response = await fetch('/ajouter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ text, x, y })
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error response:', errorText);
            showModalError('create-modal', `Server error: ${response.status}`);
            return;
        }

        const data = await response.json();
        console.log('Response data:', data);

        if (!data.success) {
            showModalError('create-modal', data.error || 'Failed to create post');
            return;
        }

        // Don't manually add post - WebSocket broadcast will handle it
        console.log('[Board] Post created:', data.post);
        closeModal('create-modal');

    } catch (error) {
        console.error('Error creating post:', error);
        showModalError('create-modal', 'Network error: could not create post');
    }
}

// Edit post AJAX
async function editPost(postId, text) {
    const modal = document.getElementById('edit-modal');

    // Validate text
    if (!text || text.trim().length === 0) {
        showModalError('edit-modal', 'Text cannot be empty');
        return;
    }

    if (text.length > 500) {
        showModalError('edit-modal', 'Text must not exceed 500 characters');
        return;
    }

    console.log('Editing post:', { postId, text });

    try {
        const response = await fetch(`/modifier`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ post_id: postId, text })
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error response:', errorText);
            showModalError('edit-modal', `Server error: ${response.status}`);
            return;
        }

        const data = await response.json();
        console.log('Response data:', data);

        if (!data.success) {
            showModalError('edit-modal', data.error || 'Failed to edit post');
            return;
        }

        // Don't manually update post - WebSocket broadcast will handle it
        console.log('[Board] Post updated:', data.post);
        closeModal('edit-modal');

    } catch (error) {
        console.error('Error editing post:', error);
        showModalError('edit-modal', 'Network error: could not edit post');
    }
}

// Delete post with confirmation
function deletePostWithConfirm(postId) {
    if (!confirm('Delete this post? This action cannot be undone.')) {
        return;
    }

    deletePost(postId);
}

// Delete post AJAX
async function deletePost(postId) {
    try {
        const response = await fetch('/effacer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ post_id: postId })
        });

        const data = await response.json();

        if (!data.success) {
            alert('Error: ' + (data.error || 'Could not delete post'));
            return;
        }

        // Don't manually remove post - WebSocket broadcast will handle it
        console.log('[Board] Post deleted:', postId);

    } catch (error) {
        console.error('Error deleting post:', error);
        alert('Network error: could not delete post');
    }
}

// ==============================
// DRAG AND DROP FUNCTIONALITY
// ==============================

// Constrain all post positions to current board boundaries (for responsive design)
function constrainAllPostPositions() {
    const board = document.getElementById('board');
    const boardWidth = board.clientWidth;
    const boardHeight = board.clientHeight;

    document.querySelectorAll('.post-it').forEach(postElement => {
        const postWidth = postElement.offsetWidth;
        const postHeight = postElement.offsetHeight;

        let x = parseFloat(postElement.style.left) || 0;
        let y = parseFloat(postElement.style.top) || 0;

        // Constrain to board boundaries
        x = Math.max(0, Math.min(x, Math.max(0, boardWidth - postWidth)));
        y = Math.max(0, Math.min(y, Math.max(0, boardHeight - postHeight)));

        postElement.style.left = x + 'px';
        postElement.style.top = y + 'px';
    });
}

// Attach drag and drop listeners to a post-it element
function attachPostDragListeners(postElement) {
    // Mouse drag events
    postElement.addEventListener('mousedown', (e) => {
        // Ignore if clicking on buttons
        if (e.target.closest('.post-it-btn')) return;

        startDrag(e, postElement);
    });

    // Touch drag events
    postElement.addEventListener('touchstart', (e) => {
        // Ignore if clicking on buttons
        if (e.target.closest('.post-it-btn')) return;

        startDragTouch(e, postElement);
    });
}

// Start dragging on mouse down
function startDrag(e, postElement) {
    isDragging = true;
    draggedPost = postElement;

    const postId = parseInt(postElement.dataset.postId);
    const post = posts.find(p => p.id === postId);

    if (!post) return;

    // Calculate offset between mouse position and post position
    const board = document.getElementById('board');
    const boardRect = board.getBoundingClientRect();
    const postRect = postElement.getBoundingClientRect();

    dragOffsetX = e.clientX - postRect.left;
    dragOffsetY = e.clientY - postRect.top;

    // Add dragging class for visual feedback
    postElement.style.cursor = 'grabbing';
    postElement.style.opacity = '0.9';

    // Add document-level mouse move and mouse up listeners
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    e.preventDefault();
}

// Handle mouse move while dragging
function onMouseMove(e) {
    if (!isDragging || !draggedPost) return;

    const board = document.getElementById('board');
    const boardRect = board.getBoundingClientRect();

    // Calculate new position relative to board
    let newX = e.clientX - boardRect.left - dragOffsetX;
    let newY = e.clientY - boardRect.top - dragOffsetY;

    // Get post dimensions
    const postWidth = draggedPost.offsetWidth;
    const postHeight = draggedPost.offsetHeight;

    // Constrain to board boundaries with padding
    newX = Math.max(0, Math.min(newX, Math.max(0, boardRect.width - postWidth)));
    newY = Math.max(0, Math.min(newY, Math.max(0, boardRect.height - postHeight)));

    // Update visual position
    draggedPost.style.left = newX + 'px';
    draggedPost.style.top = newY + 'px';
}

// Handle mouse up (finish dragging)
function onMouseUp(e) {
    if (!isDragging || !draggedPost) return;

    const postId = parseInt(draggedPost.dataset.postId);
    let finalX = parseFloat(draggedPost.style.left) || 0;
    let finalY = parseFloat(draggedPost.style.top) || 0;

    // Clamp final position to board boundaries
    const board = document.getElementById('board');
    const boardRect = board.getBoundingClientRect();
    const postWidth = draggedPost.offsetWidth;
    const postHeight = draggedPost.offsetHeight;

    finalX = Math.max(0, Math.min(finalX, Math.max(0, boardRect.width - postWidth)));
    finalY = Math.max(0, Math.min(finalY, Math.max(0, boardRect.height - postHeight)));

    draggedPost.style.left = finalX + 'px';
    draggedPost.style.top = finalY + 'px';

    // Reset visual state
    draggedPost.style.cursor = 'grab';
    draggedPost.style.opacity = '1';

    isDragging = false;
    draggedPost = null;

    // Remove document-level listeners
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    // Save position to backend
    savePostPosition(postId, finalX, finalY);
}

// Start dragging on touch
function startDragTouch(e, postElement) {
    isDragging = true;
    draggedPost = postElement;

    const postId = parseInt(postElement.dataset.postId);
    const post = posts.find(p => p.id === postId);

    if (!post || !e.touches.length) return;

    // Calculate offset between touch position and post position
    const board = document.getElementById('board');
    const boardRect = board.getBoundingClientRect();
    const postRect = postElement.getBoundingClientRect();
    const touch = e.touches[0];

    dragOffsetX = touch.clientX - postRect.left;
    dragOffsetY = touch.clientY - postRect.top;

    // Add dragging class for visual feedback
    postElement.style.opacity = '0.9';

    // Add document-level touch move and touch end listeners
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);

    e.preventDefault();
}

// Handle touch move while dragging
function onTouchMove(e) {
    if (!isDragging || !draggedPost || !e.touches.length) return;

    e.preventDefault();

    const board = document.getElementById('board');
    const boardRect = board.getBoundingClientRect();
    const touch = e.touches[0];

    // Calculate new position relative to board
    let newX = touch.clientX - boardRect.left - dragOffsetX;
    let newY = touch.clientY - boardRect.top - dragOffsetY;

    // Get post dimensions
    const postWidth = draggedPost.offsetWidth;
    const postHeight = draggedPost.offsetHeight;

    // Constrain to board boundaries with padding
    newX = Math.max(0, Math.min(newX, Math.max(0, boardRect.width - postWidth)));
    newY = Math.max(0, Math.min(newY, Math.max(0, boardRect.height - postHeight)));

    // Update visual position
    draggedPost.style.left = newX + 'px';
    draggedPost.style.top = newY + 'px';
}

// Handle touch end (finish dragging)
function onTouchEnd(e) {
    if (!isDragging || !draggedPost) return;

    const postId = parseInt(draggedPost.dataset.postId);
    let finalX = parseFloat(draggedPost.style.left) || 0;
    let finalY = parseFloat(draggedPost.style.top) || 0;

    // Clamp final position to board boundaries
    const board = document.getElementById('board');
    const boardRect = board.getBoundingClientRect();
    const postWidth = draggedPost.offsetWidth;
    const postHeight = draggedPost.offsetHeight;

    finalX = Math.max(0, Math.min(finalX, Math.max(0, boardRect.width - postWidth)));
    finalY = Math.max(0, Math.min(finalY, Math.max(0, boardRect.height - postHeight)));

    draggedPost.style.left = finalX + 'px';
    draggedPost.style.top = finalY + 'px';

    // Reset visual state
    draggedPost.style.opacity = '1';

    isDragging = false;
    draggedPost = null;

    // Remove document-level listeners
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);

    // Save position to backend
    savePostPosition(postId, finalX, finalY);
}

// Save post position to backend
async function savePostPosition(postId, x, y) {
    try {
        // Update local post data immediately (optimistic update)
        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
            posts[postIndex].x = x;
            posts[postIndex].y = y;
        }

        const response = await fetch('/position', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ post_id: postId, x, y })
        });

        if (!response.ok) {
            console.error('Failed to save post position:', response.status);
            return;
        }

        const data = await response.json();

        if (!data.success) {
            console.error('Error saving position:', data.error);
            return;
        }

        console.log('Post position saved successfully');

    } catch (error) {
        console.error('Error saving post position:', error);
    }
}
