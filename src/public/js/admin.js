document.addEventListener('DOMContentLoaded', () => {
    // Grant role buttons
    document.querySelectorAll('.btn-grant').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const userId = btn.dataset.userId;
            const role = btn.dataset.role;

            try {
                const response = await fetch('/api/admin/grant-role', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({ user_id: userId, role })
                });

                const data = await response.json();

                if (data.success) {
                    showSuccess(`Role '${role}' granted`);
                    setTimeout(() => location.reload(), 1000);
                } else {
                    showError(data.error || 'Failed to grant role');
                }
            } catch (error) {
                console.error('Error:', error);
                showError('Network error');
            }
        });
    });

    // Revoke role buttons
    document.querySelectorAll('.btn-revoke').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const userId = btn.dataset.userId;
            const role = btn.dataset.role;

            if (!confirm(`Remove '${role}' role from this user?`)) return;

            try {
                const response = await fetch('/api/admin/revoke-role', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({ user_id: userId, role })
                });

                const data = await response.json();

                if (data.success) {
                    showSuccess(`Role '${role}' revoked`);
                    setTimeout(() => location.reload(), 1000);
                } else {
                    showError(data.error || 'Failed to revoke role');
                }
            } catch (error) {
                console.error('Error:', error);
                showError('Network error');
            }
        });
    });

    function showError(message) {
        const div = document.getElementById('admin-error');
        div.textContent = message;
        div.style.display = 'block';
        setTimeout(() => { div.style.display = 'none'; }, 5000);
    }

    function showSuccess(message) {
        const div = document.getElementById('admin-success');
        div.textContent = message;
        div.style.display = 'block';
    }
});
