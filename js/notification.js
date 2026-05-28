function showNotif() {
    const overlay = document.getElementById('notif-popup');
    if (overlay) overlay.style.display = 'flex';
}

function dismissNotif() {
    const overlay = document.getElementById('notif-popup');
    if (overlay) overlay.style.display = 'none';
}
