/**
 * Helpers for viewing and copying shared recipes.
 */

/**
 * Hide the help panel and remember the choice
 */
function hideHelp() {
    document.getElementById('help-container').style.display = 'none';
    document.getElementById("show-help").style.display = "flex";
}

/**
 * Update the help sidebar with usage tips
 */
function updateHelp() {

    document.getElementById('help-text').innerHTML = `<p style="font-weight: bold;">Below are your saved recipes.</p>
                        <p>You can copy any of these recipes to your clipboard by clicking this: <span class="btn-primary help-icon material-symbols-outlined">content_copy</span></p>
                        <p style="font-size:small;">These can then be pasted into a Teams or Google Classroom assignment, an email, or another resource.</p>
                        <p>You can add a comment (e.g. 'worked well with my group on Friday afternoon') by clicking the this: <span class="btn-subtle help-icon material-symbols-outlined">comment</span></p>
                        <p style="margin-bottom: 10px; font-size:small;">Comments on public recipes are visible to all users, those on private recipes are just for you.</p>
                        <hr />
                        <p style="margin-top: 10px;">You can tell if a recipe is shared or not via the <span class="badge badge-yes">Shared</span> or <span class="badge badge-no">Not Shared</span> indicators.</p>
                        <p style="margin-top: 10px;">To share a recipe, click this: <span class="btn-primary help-icon material-symbols-outlined">share</span>, 
                        to stop sharing a recipe, click this: <span class="btn-danger help-icon material-symbols-outlined">share_off</span>
                        <p style="margin-top: 10px;">Finally, if you need to delete a recipe, click this: <span class="btn-danger help-icon material-symbols-outlined">delete</span></p>
                        <p style="margin-bottom: 10px; font-size:small;">n.b. The large delete icon is for the whole recipe, the small delete icons (if present) are for comments.</p>
                        <hr />
                        <p style="margin-top: 10px;">To return back to recipe generation page, click this: <span class="btn-neutral help-icon material-symbols-outlined">arrow_back</span></p>
                        `;
}

/**
 * Display the help panel
 */
function showHelp() {
    updateHelp();
    document.getElementById('help-container').style.display = 'flex';
    document.getElementById("show-help").style.display = "none";
    
}
/**
 * Mark a recipe as shared via API call
 */
async function shareRecipe(id) {
                
    const response = await fetch("/recipes/share", {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId: Number(id) })
    });

    if (response == null) return;
    const data = await response.json();
    if (data.error !== undefined) {
        showToast(data.error)
    } else {
        console.log("Recipe shared successfully");
        document.getElementById("share-button-" + id).style.display = "none";
        document.getElementById("unshare-button-" + id).style.display = "";
        document.getElementById("share-badge-" + id).innerText = "Shared";
        document.getElementById("share-badge-" + id).classList.remove("badge-no");
        document.getElementById("share-badge-" + id).classList.add("badge-yes");
    }

}

/**
 * Remove the shared flag from a recipe
 */
async function unshareRecipe(id) {
                
    const response = await fetch("/recipes/unshare", {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId: Number(id) })
    });

    if (response == null) return;
    const data = await response.json();
    if (data.error !== undefined) {
        showToast(data.error)
    } else {
        console.log("Recipe unshared successfully");
        document.getElementById("share-button-" + id).style.display = "";
        document.getElementById("unshare-button-" + id).style.display = "none";
        document.getElementById("share-badge-" + id).innerText = "Not shared";
        document.getElementById("share-badge-" + id).classList.remove("badge-yes");
        document.getElementById("share-badge-" + id).classList.add("badge-no");

    }

}

/**
 * Permanently remove a recipe after confirmation
 */
async function deleteRecipe(id) {
                
    if (confirm('Are you sure you want to delete this recipe?')) {

        const response = await fetch("/recipes/delete", {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipeId: Number(id) })
        });

        if (response == null) return;
        const data = await response.json();
        if (data.error !== undefined) {
            showToast(data.error)
        } else {
            console.log("Recipe deleted successfully");
            location.reload();
        }

    }

}

/**
 * Show a modal allowing the user to leave a comment
 */
function displayCommentModal(modalContent, recipeId) {

    const modal = document.getElementById("modal");
    const modalOutput = document.getElementById("modal-output");
    const modalInput = document.getElementById('modal-prompt');
    const continueButton = document.getElementById('continue-button');
    
    modalInput.value = "";
    modal.style.display = "block";
    modalOutput.innerHTML = modalContent;
    modalInput.style.display = "block";
    continueButton.style.display = "block";

    const postComment = async () => {

        const comment = document.getElementById('modal-prompt').value.trim();

        const response = await fetch("/comments/new", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipeId, comment })
        });

        if (response == null) return;
        const data = await response.json();
        if (data.error !== undefined) {
            showToast(data.error);
        } else {
            console.log("Comment posted successfully");   
            let scrollPosition = window.scrollY;
            await loadComments(recipeId, data.commentId);             
            window.scrollTo(0, scrollPosition);
        }

        modal.style.display = "none";
        
    };

    modalInput.replaceWith(modalInput.cloneNode(true));
    document.getElementById('modal-prompt').addEventListener('keydown', (event) => {
        if (event.key === "Enter") {
            if (event.shiftKey) {
                const modalInput = document.getElementById('modal-prompt');
                const cursorPosition = modalInput.selectionStart;
                modalInput.value = modalInput.value.slice(0, cursorPosition) + '\n' + modalInput.value.slice(cursorPosition);
                modalInput.selectionStart = modalInput.selectionEnd = cursorPosition + 1;
                event.preventDefault();
            } else {
                event.preventDefault();
                postComment();
            }
        }
    });
    document.getElementById('modal-prompt').focus();

    continueButton.replaceWith(continueButton.cloneNode(true));
    document.getElementById('continue-button').addEventListener("click", postComment);

}

/**
 * Reload comment sections for recipes, optionally focusing on one
 */
async function loadComments(specificRecipe = -1, specficComment = -1) {
    
    const commentsDivs = document.getElementsByClassName("comments-div");

    for (let commentsDiv of commentsDivs) {
        const recipeId = Number(commentsDiv.id.replace("comments-", ""));
        if (specificRecipe !== -1 && specificRecipe !== recipeId) continue;
        const commentsHTML = await getComments(recipeId, false);        
        commentsDiv.innerHTML = commentsHTML;                
    }
    
    const commentDeleteButtons = document.getElementsByClassName("delete-comment-button");

    for (let commentDeleteButton of commentDeleteButtons) {
        const commentId = Number(commentDeleteButton.id.replace("delete-comment-", ""));
        if (specficComment !== -1 && specficComment !== commentId) continue;
        commentDeleteButton.addEventListener("click", async () => {
            const userConfirmed = confirm("Are you sure you want to delete this comment?");
            if (userConfirmed) {
                console.log(`Delete comment ${commentId}`);
                const response = await fetch("/comments/delete", {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ commentId })
                });
        
                if (response == null) return;
                const data = await response.json();
                if (data.error !== undefined) {
                    showToast(data.error)
                } else {
                    console.log("Recipe deleted successfully");
                    document.getElementById(`comment-li-${commentId}`).innerHTML = `<span style="color:red; font-weight:bold; font-size: 10pt; font-style: italic;">Comment Deleted</span>`;
                }
            }
        });
    }

}

/**
 * Initialise event handlers on the saved recipes page
 */
document.addEventListener('DOMContentLoaded', (event) => {

    document.getElementById("show-help").style.display = "flex";
    document.getElementById("show-help").addEventListener("click", showHelp);
    document.getElementById("hide-help").addEventListener('click', hideHelp);

    const modal = document.getElementById("modal");
    
    const modalClose = document.getElementById("modal-close");    
    modalClose.addEventListener("click", function () {
        modal.style.display = "none";
    });

    window.addEventListener("click", function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    });

    const shareButtons = document.getElementsByClassName("share-button");
    for (let button of shareButtons) {
        button.addEventListener("click", () => {
            shareRecipe(button.id.replace("share-button-", ""));            
        });
    }

    const unshareButtons = document.getElementsByClassName("unshare-button");
    for (let button of unshareButtons) {
        button.addEventListener("click", () => {
            unshareRecipe(button.id.replace("unshare-button-", ""));        
        });
    }

    const deleteButtons = document.getElementsByClassName("delete-button");
    for (let button of deleteButtons) {
        button.addEventListener("click", () => {
            deleteRecipe(button.id.replace("delete-button-", ""));
        });
    }

    const copyButtons = document.getElementsByClassName("copy-button");
    for (let button of copyButtons) {
        button.addEventListener("click", () => {

            const promptId = button.id.replace("copy-button-", "prompt-");
            const chatGPT = document.getElementById("copyToggleCheckbox").checked;
            let textToCopy = document.getElementById(promptId).innerText;
            if (chatGPT) {
                textToCopy = `https://chatgpt.com/?q=${encodeURIComponent(textToCopy)}`
            }
            navigator.clipboard.writeText(textToCopy).then(function () {
                button.innerHTML = '<span class="material-symbols-outlined">check</span>';
                setTimeout(() => {
                    button.innerHTML = '<span class="material-symbols-outlined">content_copy</span>';
                }, 3000);
            }, function (err) {
                showToast('Could not copy text');
            });
        });
    }

    const copyToggleCheckbox = document.getElementById("copyToggleCheckbox");
    const copyToggleChecked = localStorage.getItem('copyToggleCheckbox');
    copyToggleCheckbox.checked = copyToggleChecked === 'true';
    copyToggleCheckbox.addEventListener("change", () => {        
        localStorage.setItem('copyToggleCheckbox', copyToggleCheckbox.checked ? "true" : "false");
    });

    const commentButtons = document.getElementsByClassName("comment-button");
    for (let button of commentButtons) {
        button.addEventListener("click", () => {            
            const promptId = Number(button.id.replace("comment-button-", ""));                
            displayCommentModal(`<strong>Commenting on:</strong><br />
                ${document.getElementById("topic-" + promptId).innerText}<br /><hr />
                <div style="font-style:italic; text-align:right">By you</div>`, promptId);
        });
    }

    loadComments();

});

