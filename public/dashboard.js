/**
 * Client-side logic for the admin dashboard.
 */

// Grab the current user's email from the meta tag injected by the template
const metaEmail = document.querySelector('meta[name="current-user-email"]');
const currentUserEmail = metaEmail ? metaEmail.getAttribute('content') : '';

/**
 * Delete a user via the admin API then reload the page
 */
async function deleteUser(email) {
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            const response = await fetch(`/admin/users/${email}/delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                window.location.reload();
            } else {
                showToast('Failed to delete user');
            }
        } catch (err) {
            showToast('Error deleting user');
        }
    }
}

/**
 * Setup dashboard button handlers once the DOM is ready
 */
async function loadUsers() {
    document.getElementById('users-loader').classList.remove('hidden');
    const res = await fetch('/admin/api/users');
    if (!res.ok) {
        if (typeof showToast === 'function') {
            showToast(`Failed to load users (${res.status})`);
        } else {
            console.error('Failed to load users:', res.status);
        }
        document.getElementById('users-loader').classList.add('hidden');
        return;
    }
    const data = await res.json();
    const tbody = document.getElementById('users-body');
    tbody.innerHTML = '';
    data.users.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${u.FirstName}</td>
            <td>${u.LastName}</td>
            <td style="font-size: small;">${u.Email}</td>
            <td>${u.Recipes > 0 ? `<a href="/admin/users/${u.Email}/recipes" class="btn btn-subtle btn-mini">${u.Recipes}</a>` : '<span style="color:lightgrey">None</span>'}</td>
            <td class="thin-column" style="font-size: small; text-align: center;">${(u.PageViews > 0 || u.ApiCalls) ? `<strong>${u.PageViews}</strong><br/>(${u.ApiCalls})` : `<span style="color:lightgrey"><strong>${u.PageViews}</strong><br/>(${u.ApiCalls})</span>`}</td>
            <td class="thin-column">${u.Admin ? '<span class="badge badge-yes">Yes</span>' : '<span class="badge badge-no">No</span>'}</td>
            <td class="thin-column no-right-border"><a href="/admin/users/${u.Email}/edit" class="btn btn-neutral btn-small"><span class="material-symbols-outlined">edit</span></a></td>
            <td class="thin-column no-right-border no-left-border"><a href="/admin/users/${u.Email}/reset" class="btn btn-primary btn-small"><span class="material-symbols-outlined">lock_reset</span></a></td>
            <td class="thin-column no-left-border">${u.Email !== currentUserEmail ? `<button class="btn btn-danger btn-small delete-user-button" id="${u.Email}"><span class="material-symbols-outlined">delete</span></button>` : ''}</td>
        `;
        tbody.appendChild(tr);
    });
    tbody.querySelectorAll('.delete-user-button').forEach(btn => {
        btn.addEventListener('click', () => deleteUser(btn.id));
    });
    document.getElementById('users-table-container').classList.remove('hidden');
    document.getElementById('users-loader').classList.add('hidden');
}

async function loadSubjects() {
    document.getElementById('subjects-loader').classList.remove('hidden');
    const res = await fetch('/admin/api/subjects');
    if (!res.ok) {
        if (typeof showToast === 'function') {
            showToast(`Failed to load subjects (${res.status})`);
        } else {
            console.error('Failed to load subjects:', res.status);
        }
        document.getElementById('subjects-loader').classList.add('hidden');
        return;
    }
    const data = await res.json();
    const tbody = document.getElementById('subjects-body');
    tbody.innerHTML = '';
    data.subjects.forEach(subject => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="width: 10%;">${subject.SubjectId}</td>
            <td style="width: 10%;">${subject.Level}</td>
            <td style="width: 20%;">${subject.Subject}</td>
            <td style="width: 20%;">${subject.ExamBoard}</td>
            <td style="width: 20%;">${subject.Category}</td>
            <td class="thin-column no-right-border">
                <input type="file" class="spec-file-input" data-subject-id="${subject.SubjectId}" style="display:none" accept="application/pdf" />
                <button class="btn btn-primary btn-small upload-spec-btn" data-subject-id="${subject.SubjectId}">
                    <span class="material-symbols-outlined">upload_file</span>
                </button>
            </td>
            <td class="thin-column no-right-border no-left-border">
                <a id="spec-button-${subject.SubjectId}" href="/admin/spec/${subject.SubjectId}" class="btn btn-subtle btn-small ${subject.hasSpec ? '' : 'hidden'}" target="_blank">
                    <span class="material-symbols-outlined">open_in_new</span>
                </a>
            </td>
            <td class="thin-column no-right-border no-left-border">
                <a href="/admin/subjects/${subject.SubjectId}/edit" class="btn btn-neutral btn-small">
                    <span class="material-symbols-outlined">edit</span>
                </a>
            </td>
            <td class="thin-column no-left-border">
                <button class="btn btn-danger btn-small delete-subject-button" data-subject-id="${subject.SubjectId}">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.delete-subject-button').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this subject?')) {
                try {
                    const response = await fetch(`/admin/subjects/${btn.dataset.subjectId}/delete`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    if (response.ok) {
                        window.location.reload();
                    } else {
                        showToast('Failed to delete subject');
                    }
                } catch (err) {
                    showToast('Error deleting subject');
                }
            }
        });
    });

    tbody.querySelectorAll('.upload-spec-btn').forEach(button => {
        button.addEventListener('click', () => {
            const subjectId = button.dataset.subjectId;
            const input = document.querySelector(`input.spec-file-input[data-subject-id="${subjectId}"]`);
            input.click();
        });
    });

    tbody.querySelectorAll('input.spec-file-input').forEach(input => {
        input.addEventListener('change', async () => {
            const subjectId = input.dataset.subjectId;
            const file = input.files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('specFile', file);
            try {
                const response = await fetch(`/admin/subjects/${subjectId}/spec`, {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                const downloadButton = document.getElementById(`spec-button-${subjectId}`);
                if (data.success) {
                    downloadButton.classList.remove('hidden');
                } else {
                    showToast(`Error: ${data.message}`);
                }
            } catch (err) {
                showToast(`Error: ${err.message}`);
            }
        });
    });
    document.getElementById('subjects-table-container').classList.remove('hidden');
    document.getElementById('subjects-loader').classList.add('hidden');
}

async function loadLogs() {
    document.getElementById('logs-loader').classList.remove('hidden');
    const res = await fetch('/admin/api/logs');
    if (!res.ok) {
        if (typeof showToast === 'function') {
            showToast(`Failed to load logs (${res.status})`);
        } else {
            console.error('Failed to load logs:', res.status);
        }
        document.getElementById('logs-loader').classList.add('hidden');
        return;
    }
    const data = await res.json();
    const tbody = document.getElementById('logs-body');
    tbody.innerHTML = '';
    data.logs.forEach(log => {
        const timestampObj = new Date(log.Timestamp);
        const formattedDate = timestampObj.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        const tr = document.createElement('tr');
        if (log.Error === null) {
            tr.innerHTML = `
                <td style="width:25%;">${log.UserEmail}</td>
                <td style="width:25%;">${log.PathAccessed}</td>
                <td style="width:25%;">${formattedDate}</td>
                <td style="width:25%;">${log.Error}</td>`;
        } else {
            tr.innerHTML = `
                <td style="background-color: lightpink; color: darkred; width:25%;">${log.UserEmail}</td>
                <td style="background-color: lightpink; color: darkred; width:25%;">${log.PathAccessed}</td>
                <td style="background-color: lightpink; color: darkred; width:25%;">${formattedDate}</td>
                <td style="background-color: lightpink; color: darkred; width:25%;">${log.Error}</td>`;
        }
        tbody.appendChild(tr);
    });
    document.getElementById('logs-table-container').classList.remove('hidden');
    document.getElementById('logs-loader').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([loadUsers(), loadSubjects(), loadLogs()]);
    document.getElementById('downloadDatabase').addEventListener('click', async () => {
        window.location.href = '/admin/downloadDatabase';
    });
    document.getElementById('exportEvents').addEventListener('click', async () => {
        window.location.href = '/admin/export';
    });
});

