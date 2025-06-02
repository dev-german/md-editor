const commitMessageInput = document.getElementById('commit-message-input');
const commitBtn = document.getElementById('commit-btn');
const cancelBtn = document.getElementById('cancel-btn');

commitBtn.addEventListener('click', () => {
    const message = commitMessageInput.value.trim();
    window.commitDialogAPI.sendCommitMessage(message);
});

cancelBtn.addEventListener('click', () => {
    window.commitDialogAPI.sendCommitMessage(null); // Send null if cancelled
});

// Optional: Allow pressing Enter to commit
commitMessageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        commitBtn.click();
    }
});
