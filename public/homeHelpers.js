/**
 * Shared helper functions for the home page.
 */

/**
 * Reset the page and clear all generated prompts
 */
function startAgain() {
    const userConfirmed = confirm("Have you saved any recipes you want to keep?");
    if (userConfirmed) {
        stage = 0;
        prompt_count = 0;
        updateHelp();
        document.getElementById("topic").value = "";
        document.getElementById("start-again-container").classList.add("hidden");
        document.getElementById("choice-container").classList.remove("hidden");
        document.getElementById(`generate-more-container`).classList.add('hidden');
        for (let i = 1; i <= MAX_PROMPTS_ON_DISPLAY; i++) {
            document.getElementById(`response-heading-text-${i}`).innerText = "";
            document.getElementById(`response-text-${i}`).innerText = "";
            document.getElementById(`original-prompt-text-${i}`).innerHTML = "";
            document.getElementById(`response-container-${i}`).classList.add('hidden');
            document.getElementById(`little-loader-${i}`).classList.add('hidden');
            document.getElementById(`original-header-${i}`).classList.add("hidden");
            document.getElementById(`original-prompt-container-${i}`).classList.add("hidden");
            document.getElementById(`like-button-${i}`).children[0].classList.remove('like-clicked');
            document.getElementById(`dislike-button-${i}`).children[0].classList.remove('dislike-clicked');
        }
        const toggle = document.getElementById("copy-toggle");
        document.getElementById("toggle-container-1").appendChild(toggle);
        checkOverflow();
        document.getElementById("goto-dashboard").removeEventListener("click", confirmNavigation);
        document.getElementById("goto-recipes").removeEventListener("click", confirmNavigation);
        loadRecipes();
    }
}

/**
 * Replace an element and attach an event listener
 */
function replaceAndListen(id, event, handler) {
    const element = document.getElementById(id);
    element.replaceWith(element.cloneNode(true));
    document.getElementById(id).addEventListener(event, handler);
}

/**
 * Clear like/dislike icons for a prompt block
 */
function resetRatings(i) {
    document.getElementById(`like-button-${i}`).children[0].classList.remove('like-clicked');
    document.getElementById(`dislike-button-${i}`).children[0].classList.remove('dislike-clicked');
}

/**
 * Toggle original prompt visibility for a response block
 */
function setupOriginalToggle(i) {
    replaceAndListen(`original-header-${i}`, 'click', () => {
        const icon = document.getElementById(`original-hide-icon-${i}`);
        const container = document.getElementById(`original-prompt-container-${i}`);
        if (icon.innerText == "unfold_more") {
            icon.innerText = "unfold_less";
            container.classList.remove("hidden");
        } else {
            icon.innerText = "unfold_more";
            container.classList.add("hidden");
        }
    });
    document.getElementById(`original-header-${i}`).classList.remove("hidden");
}

/**
 * Restore a response to the original text
 */
function setupRestoreOriginal(i) {
    replaceAndListen(`restore-original-${i}`, 'click', () => {
        document.getElementById(`response-text-${i}`).innerText = document.getElementById(`original-prompt-text-${i}`).innerHTML;
        document.getElementById(`original-header-${i}`).classList.add("hidden");
        document.getElementById(`original-prompt-container-${i}`).classList.add("hidden");
        document.getElementById(`spec-button-${i}`).classList.add("hidden");
        resetRatings(i);
    });
}

/**
 * Overwrite the prompt text and reset UI helpers
 */
function applyPromptUpdate(i, text) {
    document.getElementById(`response-text-${i}`).innerText = text;
    resetRatings(i);
    document.getElementById(`original-hide-icon-${i}`).innerText = "unfold_more";
    document.getElementById(`original-prompt-container-${i}`).classList.add("hidden");
    setupOriginalToggle(i);
    document.getElementById(`little-loader-${i}`).classList.add('hidden');
    setButtonState(i, true);
    setupRestoreOriginal(i);
}

/**
 * Ask before logging the user out
 */
function confirmLogout(event) {
    const userConfirmed = confirm("Are you sure you want to log out?");
    if (!userConfirmed) {
        event.preventDefault();
    }
}

/**
 * Confirm before leaving the generation page
 */
function confirmNavigation(event) {
    const userConfirmed = confirm("Have you saved any recipes you want to keep?");
    if (!userConfirmed) {
        event.preventDefault();
    }
}

/**
 * Enable or disable the action buttons for a prompt
 */
function setButtonState(i, state) {
    const buttons = ['clarify-topic', 'explore-variations', 'think-deeper', 'get-preview', 'save-recipe', 'reduce-complexity'];
    buttons.forEach(btn => document.getElementById(`${btn}-${i}`).classList.toggle("disabled", !state));
}

/**
 * Close any visible explanation bubbles
 */
function hideBubbles() {
    document.querySelectorAll('.speech-bubble-visible').forEach(bubble => {
        bubble.classList.remove('speech-bubble-visible');
    });
}

/**
 * Toggle the scroll indicator if the page overflows
 */
function checkOverflow() {
    const scrollIndicator = document.getElementById('scroll-indicator');
    const hasVerticalOverflow = document.documentElement.scrollHeight > window.innerHeight;
    if (hasVerticalOverflow) {
        scrollIndicator.classList.add('visible');
    } else {
        scrollIndicator.classList.remove('visible');
    }
}

/**
 * Hide or show the scroll indicator depending on position
 */
function handleScroll() {
    const scrollIndicator = document.getElementById('scroll-indicator');
    const isAtBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 32;
    if (isAtBottom) {
        scrollIndicator.classList.add('hidden');
    } else {
        scrollIndicator.classList.remove('hidden');
    }
}

/**
 * Smoothly scroll to the bottom of the page
 */
function scrollToBottom() {
    window.scrollTo({
        top: document.documentElement.scrollHeight - window.innerHeight,
        behavior: 'smooth'
    });
}

/**
 * Hide the help panel and remember the choice
 */
function hideHelp() {
    document.getElementById('help-container').style.display = 'none';
    document.getElementById("show-help").style.display = "flex";
    checkOverflow();
}


/**
 * Persist the currently selected level/subject/template
 */
function saveSelections() {

    const levelSelect = document.getElementById("level");
    const subjectSelect = document.getElementById("subject");
    const templatesSelect = document.getElementById("templates");

    const selectedLevel = levelSelect.value;
    const selectedSubject = subjectSelect.value;
    const selectedTemplates = templatesSelect.value

    localStorage.setItem('selectedLevel', selectedLevel);
    localStorage.setItem('selectedSubject', selectedSubject);
    localStorage.setItem('selectedTemplates', selectedTemplates);
}

/**
 * Restore level, subject and template selections from storage
 */
async function loadSelections() {

    const levelSelect = document.getElementById("level");
    const subjectSelect = document.getElementById("subject");
    const templatesSelect = document.getElementById("templates");

    const savedTemplates = localStorage.getItem('selectedTemplates');
    if (savedTemplates) {
        templatesSelect.value = savedTemplates;
    }
    await displayTemplateSelectors();

    const savedLevel = localStorage.getItem('selectedLevel');
    if (savedLevel) {
        levelSelect.value = savedLevel;
    }
    await updateSubjectList();

    const savedSubject = localStorage.getItem('selectedSubject');
    if (savedSubject) {
        subjectSelect.value = savedSubject;        
    } else {
        subjectSelect.value = "auto";        
    }
    await loadRecipes();


}

/**
 * Refresh the subject dropdown based on the chosen level
 */
async function updateSubjectList() {

    const levelSelector = document.getElementById("level");
    const subjectSelector = document.getElementById("subject");

    document.getElementById("topic").innerHTML = "";

    document.getElementById("shared-recipes").innerHTML = "";
    document.getElementById("private-recipes").innerHTML = "";

    let response = null;
    try {
        response = await fetch(`/recipes/subjects`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (err) {
        console.log("Couldn't get subjects: " + err)
    }

    if (response == null) return;
    const data = await response.json();

    if (data.length == 0) {        
        console.log("No subjects found in database.")
    } else if (data.error !== undefined) {
        console.log("Error returned subjects recipes: " + data.error)
    } else {
        let subjectChoices = "";
        for (let subject of data) {
            if (subject.Level == levelSelector.value) {
                subjectChoices += `<option value=${subject.SubjectId} data-category="${subject.Category}">${subject.Subject}</option>`
            }
        }
        subjectSelector.innerHTML = subjectChoices;
    }

}

/**
 * Update the template checkbox UI and fetch template names
 */
async function displayTemplateSelectors() {

    loadRecipes();

    console.log("Display template selectors")

    const templateSelect = document.getElementById("templates");
    
    const selectedTemplate = templateSelect.value;


    localStorage.setItem('selectedTemplates', selectedTemplate);

    document.getElementById("templates").style.background = "white";

    if (selectedTemplate == "categories") {
        document.getElementById("categories").classList.remove("hidden");
        document.getElementById("templates").style.background = "#f8f8ff";
    } else {
        document.getElementById("categories").classList.add("hidden");
    }

    if (selectedTemplate == "individual") {
        document.getElementById("template-picker").classList.remove("hidden");
        document.getElementById("templates").style.background = "#f8f8ff";

        let templateList = `<div class="template-recipe-container">`;

        let response = null;
        try {
            response = await fetch(`/recipes/templates`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

        } catch (err) {
            console.log("Couldn't get template: " + err)
        }

        if (response == null) return;
        const data = await response.json();

        for (let i = 0; i < data.length; i++) {        
            templateList += `<div class="checkbox-container template-recipe" title="${data[i].heading}"><input type="checkbox" class="checkbox individual-checkbox" id="template${i}" value="${i}"><label class="checkbox-label individual-label" for="template${i}">${data[i].heading}</label></div>`;
        }

        templateList += "</div>";

        document.getElementById("template-list").innerHTML = templateList;

        let buttonText = document.getElementById('generate-button').innerHTML;
        document.getElementById('generate-button').innerHTML = buttonText.replace("recipe ideas", "recipes")

    } else {
        document.getElementById("template-picker").classList.add("hidden"); 
        let buttonText = document.getElementById('generate-button').innerHTML;
        document.getElementById('generate-button').innerHTML = buttonText.replace("recipes", "recipe ideas")
    }

}

/**
 * Show a modal window containing extra information or forms
 */
function displayModal(modalContent, modalType = 1, originalPrompt = "", index = 0, recipeId = -1) {
    const modal = document.getElementById("modal");
    const continueButton = document.getElementById('continue-button');

    modal.style.display = "block";
    document.getElementById('modal-prompt').value = "";

    if (modalType === 1) {

        document.getElementById("modal-output").innerHTML = modalContent;
        document.getElementById('modal-prompt').style.display = "none";
        continueButton.style.display = "none";

    } else if (modalType === 2) {

        document.getElementById("modal-output").innerHTML = modalContent;
        document.getElementById('modal-prompt').style.display = "block";
        continueButton.style.display = "block";

        const continueConversation = async () => {

            const history = originalPrompt + "\n\n" + document.getElementById("modal-output").innerHTML.replaceAll("<br />", "\n")
            const prompt = document.getElementById('modal-prompt').value.trim();
            document.getElementById('modal-prompt').value = "";

            if (prompt.length == 0) return;

            document.getElementById("modal-output").innerHTML += "<br /><br /><strong>" + prompt + "</strong>";

            document.getElementById(`modal-loader`).classList.remove('hidden');
            document.getElementById('modal-prompt').style.display = "none";

            const response = await fetchApi("/api/continuePreview", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    history, prompt
                })
            });

            if (response == null) return;
            const data = await response.json();
            if (data.error !== undefined) {
                showToast(data.error)
            } else {
                let output = data.text;
                output = output.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replaceAll("\n", "<br />")

                document.getElementById("modal-output").innerHTML += "<br /><br />" + output;
                MathJax.typeset();

                document.getElementById(`modal-loader`).classList.add('hidden');
                document.getElementById('modal-prompt').style.display = "block";
            }

        };

        document.getElementById('modal-prompt').replaceWith(document.getElementById('modal-prompt').cloneNode(true));
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
                    continueConversation();
                }
            }
        });

        document.getElementById('modal-prompt').focus();

        continueButton.replaceWith(continueButton.cloneNode(true));
        document.getElementById('continue-button').addEventListener("click", continueConversation);

    } else if (modalType === 3) {

        let output = "";

        let variationCounter = 0;
        for (let promptVariation of modalContent) {
            variationCounter++;
            output += `<div class='variation-container'>
                            <div>${promptVariation.prompt}</div>
                            <div class="variation-details-container">
                                <div class="variation-reason">${promptVariation.what_makes_it_different}</div>
                                <div class="variation-accept-container"><button id="variation-accept-${variationCounter}" class="btn btn-primary btn-low"><span class="material-symbols-outlined">recommend</span></button></div>
                            </div>
                        </div>`;
        }

        document.getElementById('modal-prompt').style.display = "none";
        continueButton.style.display = "none";

        document.getElementById("modal-output").innerHTML = output;

        for (let v = 0; v < variationCounter; v++) {
            const variationButton = document.getElementById(`variation-accept-${v + 1}`);
            variationButton.addEventListener("click", () => {
                applyPromptUpdate(index, modalContent[v].prompt + originalPrompt);

                modal.style.display = "none";

                setupRestoreOriginal(index);

            });
        }

    } else if (modalType === 4) {

        document.getElementById("modal-output").innerHTML = modalContent;
        document.getElementById('modal-prompt').style.display = "block";
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
                await loadRecipes();
                window.scrollTo(0, scrollPosition);
            }

            modal.style.display = "none";

        };

        document.getElementById('modal-prompt').replaceWith(document.getElementById('modal-prompt').cloneNode(true));
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

}

/**
 * Populate the help sidebar based on the current stage
 */
function updateHelp() {
    if (stage === 0) {
        document.getElementById('help-text').innerHTML = `<p style='width:93%'>Welcome! The purpose of this platform is to generate recipes for AI powered educational activities. These recipes can be sent to your students for them to use in class or as homework.</p>
                        <p style="margin-top: 10px; margin-bottom: 10px;">Pick a <b>level</b> and <b>subject</b>, then describe the <b>topic</b> for which you'd like recipe ideas.</p>
                        <p>If you wish to customise which <b>recipe templates</b> are used, please change the dropdown from 'automatic' to 'categories' or 'individual'. The 'classic', 'rapid' and 'novel' categories should work for all subjects, the rest are tuned more for subject disciplines.</p>
                        <p style="margin-bottom: 10px;">When ready, click the 'Generate recipe ideas' button with this icon: <span class="btn-primary help-icon material-symbols-outlined">edit_note</span></p>
                        <hr/>
                        <p style="margin-top: 10px;">If you have already saved some recipes to your recipe book for a particular subject/level combination, you'll see them below under <span class="subtitle-maroon">'Private recipes'<span>.</p>
                        <p style="margin-top: 10px;">If you, or other users, have chosen to share any of these recipes, you'll see them below under <span class="subtitle-green">'Shared recipes'<span>.</p>
                        <p>You can copy these recipes to your clipboard by clicking this: <span class="btn-primary help-icon material-symbols-outlined">content_copy</span></p>
                        <p style="margin-top: 10px; margin-bottom: 10px; font-size:small;"> Depending on the toggle, the recipe will either be plain text or a ready-to-use ChatGPT link.</p>
                        <p>You can add a comment (e.g. 'worked well with my group on Friday afternoon') by clicking the this: <span class="btn-subtle help-icon material-symbols-outlined">comment</span></p>
                        <p style="margin-top: 10px; margin-bottom: 10px; font-size:small;">Comments on public recipes are visible to all users, those on private recipes are just for you.</p>
                        <hr/>
                        <p style="margin-top: 10px;">To view all of your saved recipes for all levels/subjects, click this icon at the top right: <span class="btn-neutral help-icon material-symbols-outlined">menu_book</span></p>
                        <p style="margin-top: 10px;">Finally, you can log out if required with this icon: <span class="btn-danger help-icon material-symbols-outlined">logout</span></p>`;
    } else if (stage === 1) {
        document.getElementById('help-text').innerHTML = `<p style="font-weight: bold;">Below are some recipe ideas, generated based on your choice of topic.</p>
                        <p>You can copy any of these recipes to your clipboard by clicking this: <span class="btn-primary help-icon material-symbols-outlined">content_copy</span></p>
                        <p style="font-size:small;">These can then be pasted into a Teams or Google Classroom assignment, an email, or another resource.</p>
                        <p style="margin-bottom: 10px;">To see the reason the AI suggested a recipe, click this: <span class="btn-subtle help-icon material-symbols-outlined">psychology_alt</span></p>
                        <hr/>
                        <p style="margin-top: 10px; font-weight: bold;">There are several ways you can refine the recipes:</p>
                        <p style="margin-bottom: 10px;">To generate three 'variations' with alternative activity styles / interpretations, click this: <span class="response-option-help-icon help-icon material-symbols-outlined">style</span></p>
                        <p style="margin-bottom: 10px;">To reduce the complexity of the language used in the prompt, click this: <span class="response-option-help-icon help-icon material-symbols-outlined">signpost</span></p>
                        <p style="margin-bottom: 10px;">To enhance the recipe so as to encourage deeper levels of thought, click this: <span class="response-option-help-icon help-icon material-symbols-outlined">psychology</span></p>
                        <p>To clarify the topic by adding extra context the recipe based on the exam board spec, click this: <span class="response-option-help-icon help-icon material-symbols-outlined">stylus_note</span></p>
                        <p style="margin-bottom: 10px;"><span style="font-size:small">After you've done this, you can see the specification points that the AI has used by clicking this:</span> <span class="btn-subtle help-icon material-symbols-outlined">list_alt</span></p>
                        <p style="margin-bottom: 10px;">For the four options above, you can view the original recipe by clicking
                        <span class="original-header-help">Original <span class="help-icon material-symbols-outlined">unfold_more</span></span></p>
                        <p style="margin-bottom: 10px;"><span style="font-size:small">If you subsequently want to revert back to that original recipe, click this:</span> <span class="response-option-help-icon help-icon material-symbols-outlined">history</span></p>
                        <hr/>
                        <p style="margin-top: 10px; margin-bottom: 10px;">To test out the activity without needing to visit ChatGPT, click this: <span class="response-option-help-icon help-icon material-symbols-outlined">forum</span></p>
                        <p style="font-size:small;">Important notes:</p>
                        <ul style="font-size:small;">
                            <li style="margin-left: 20px;">Everytime you preview a conversation it will be different. ChatGPT behaves in the same way.</li>
                            <li style="margin-left: 20px;">These conversation previews use the same model as the free version of ChatGPT, and therefore represent a 'minimum expectation'.</li>
                            <li style="margin-left: 20px;">ChatGPT will be more efficient for longer conversations, so treat these as 'test runs'.</li>
                        </ul>
                        <p style="margin-bottom: 10px;">Finally, to save a recipe into you recipe book, click this: <span class="response-option-help-icon help-icon material-symbols-outlined">book_ribbon</span></p>
                        <p style="font-size:small;">Any recipes you don't save (or copy & paste elsewhere) are discarded when you leave.</p>
                        <p style="margin-top: 10px;">To view all of your saved recipes for all levels/subjects, click this icon at the top right: <span class="btn-neutral help-icon material-symbols-outlined">menu_book</span></p>`;
    }
}

/**
 * Display the help sidebar and reset the stored flag
 */
function showHelp() {
    updateHelp();
    document.getElementById('help-container').style.display = 'flex';
    document.getElementById("show-help").style.display = "none";
    checkOverflow();
}

/**
 * Wrapper for fetch that displays a toast on failure
 */
async function fetchApi(url, options) {
    try {
        const response = await fetch(url, options);

        if (response.redirected) {
            showToast('Authentication required. Please log in again.');
            return null;
        }

        if (!response.ok) {
            let message = `Server responded with ${response.status}`;
            try {
                const data = await response.json();
                if (data.error !== undefined) message = data.error;
            } catch (err) {
                // ignore JSON parse errors
            }
            showToast(message);
            return null;
        }

        return response;
    } catch (err) {
        showToast(`Request error: ${err}`);
        return null;
    }
}
