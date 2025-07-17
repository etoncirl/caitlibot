/**
 * Simple toast/notification helper for the UI.
 */
function showToast(message) {
    let toast = document.getElementById('toast-container');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-container';
        toast.innerHTML = `<span class="material-symbols-outlined">warning</span><span id="toast-message" style="margin-left:8px; flex:1;"></span><span id="toast-close" class="material-symbols-outlined" style="cursor:pointer">close</span>`;
        document.body.appendChild(toast);
        document.getElementById('toast-close').addEventListener('click', () => {
            toast.classList.remove('toast-visible');
            toast.classList.add('toast-hidden');
        });
    }
    document.getElementById('toast-message').innerText = message;
    toast.classList.remove('toast-hidden');
    toast.classList.add('toast-visible');
}
