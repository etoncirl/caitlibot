/**
 * Client-side logic for the main recipe generation page.
 */
const MAX_PROMPTS_ON_DISPLAY = 15;

let stage = 0;
let prompt_count = 0;

/**
 * Main entry: attach all home page event handlers
 */
document.addEventListener('DOMContentLoaded', (event) => {

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

    // Set up copy buttons for each response block
    for (let i = 1; i <= MAX_PROMPTS_ON_DISPLAY; i++) {

        const copyButton = document.getElementById(`copy-button-${i}`);

        const copyPrompt = () => {
            const promptText = document.getElementById(`response-text-${i}`);
            
            const chatGPT = document.getElementById("copyToggleCheckbox").checked;
            let textToCopy = promptText.innerText;
            if (chatGPT) {
                textToCopy = `https://chatgpt.com/?q=${encodeURIComponent(textToCopy)}`
            }

            navigator.clipboard.writeText(textToCopy).then(function () {
                copyButton.innerHTML = '<span class="material-symbols-outlined">check</span>';
                setTimeout(() => {
                    copyButton.innerHTML = '<span class="material-symbols-outlined">content_copy</span>';
                }, 3000);
            }, function (err) {
                showToast('Could not copy text');
            });
        }
        copyButton.addEventListener("click", copyPrompt);

    }

    document.getElementById("show-help").style.display = "flex";
    document.getElementById("show-help").addEventListener("click", showHelp);
    document.getElementById("hide-help").addEventListener('click', hideHelp);

    window.addEventListener('resize', checkOverflow);
    checkOverflow();
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    document.getElementById('scroll-indicator').addEventListener('click', scrollToBottom);

    loadSelections();

    document.addEventListener('click', hideBubbles);

    document.getElementById('generate-button').addEventListener("click", generatePrompts);
    document.getElementById('generate-more-button').addEventListener("click", generateMorePrompts);

    document.getElementById("level").addEventListener("change", updateSubjectList);
    document.getElementById("subject").addEventListener("change", loadRecipes);
    document.getElementById("templates").addEventListener("change", displayTemplateSelectors);

    const textarea = document.getElementById('topic');
    textarea.addEventListener('keydown', (event) => {
        if (event.key === "Enter") {
            if (event.shiftKey) {
                const cursorPosition = textarea.selectionStart;
                textarea.value = textarea.value.slice(0, cursorPosition) + '\n' + textarea.value.slice(cursorPosition);
                textarea.selectionStart = textarea.selectionEnd = cursorPosition + 1;
                event.preventDefault();
            } else {
                event.preventDefault();
                generatePrompts();
            }
        }
    });

    document.getElementById("start-again").addEventListener("click", startAgain);
    document.getElementById("logout").addEventListener("click", confirmLogout);

    const copyToggleCheckbox = document.getElementById("copyToggleCheckbox");
    const copyToggleChecked = localStorage.getItem('copyToggleCheckbox');

    copyToggleCheckbox.checked = copyToggleChecked === "true";
    copyToggleCheckbox.addEventListener("change", () => {        
        localStorage.setItem('copyToggleCheckbox', copyToggleCheckbox.checked ? "true" : "false");
    });

    const voteButtons = document.getElementsByClassName("vote-button");
    for (let button of voteButtons) {
        button.addEventListener("click", () => {
            const isLike = button.classList.contains("like-button");
            const type   = isLike ? "like" : "dislike";
            const other  = isLike ? "dislike" : "like";

            const child = button.children[0];
            
            const promptText = document.getElementById(
                button.id.replace(`${type}-button-`, "response-text-")
            );

            let voteId = Number(promptText.dataset.voteid);
            if (isNaN(voteId)) voteId = -1;
            
            const recipeText = promptText.textContent.trim();
            const subjectSelector = document.getElementById('subject');
            const subjectId       = Number(subjectSelector.value);          
            const topic           = document.getElementById('topic')?.value;

            const alreadyClicked = child.classList.contains(`${type}-clicked`);
            const voteValue      = alreadyClicked ? 0 : (isLike ? 1 : -1);

            fetch('/vote', {
                method : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body   : JSON.stringify({
                    voteId,
                    recipe  : recipeText,
                    value   : voteValue,
                    topic,
                    subjectId
                })
            })
            .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
            .then(data => {                
                promptText.dataset.voteid = data.voteId;

                child.classList.toggle(`${type}-clicked`);

                const siblingBtn = document.getElementById(
                    button.id.replace(type, other)
                );
                const siblingIcon = siblingBtn.children[0];
                if (siblingIcon.classList.contains(`${other}-clicked`)) {
                    siblingIcon.classList.toggle(`${other}-clicked`, false);
                }   

            })
            .catch(err => {                
                console.error('Voting failed:', err);
                child.classList.toggle(`${type}-clicked`, alreadyClicked);
                showToast('Sorry, something went wrong while recording your vote.');
            });

        });
    }

});

