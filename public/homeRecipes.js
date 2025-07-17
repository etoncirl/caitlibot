/**
 * Fetch and render shared recipes for browsing.
 */

/**
 * Fetch and render recipes shared by other users
 */
async function loadSharedRecipes() {

    let recipeResponse = null;

    const subjectSelector = document.getElementById("subject");
    const subjectId = Number(subjectSelector.value);

    try {

        const query = new URLSearchParams({ subjectId }).toString();
        recipeResponse = await fetch(`/recipes/shared?${query}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (err) {
        console.log("Couldn't get shared recipes: " + err)
    }

    if (recipeResponse == null) return;
    let recipes = await recipeResponse.json();

    if (recipes.error !== undefined) {
        console.log("Error returned getting shared recipes: " + recipes.error)
    } else {

        let recipeHTML = "";

        if (recipes.length > 0) {
            recipeHTML += `<div><div class="subtitle-green">Shared recipes:</div>`;
            let i = 0;
            for (let recipe of recipes) {

                const commentsHTML = await getComments(recipe.RecipeId);

                let headingText = recipe.Topic
                if (headingText.length > 70) headingText = headingText.substring(0, 70) + "...";

                recipeHTML += `<div class="shared-recipe-container">
                    <h4>${headingText}</h4>
                    <hr style="margin-bottom: 10px;">
                    <div class="row">
                        <div class="col-11 shared-recipe">
                            <div id="shared-prompt-${i}">${recipe.Prompt}</div>
                            <div style="font-style: italic; color:grey; text-align: right; padding-top: 10px;">Shared by ${recipe.Author} on ${shortDate(recipe.SharedDate)}</div>            
                        </div>
                        <div class="col-1">
                            <button id="shared-copy-button-${i}" class="btn btn-primary btn-mini shared-copy-button"><span class="material-symbols-outlined">content_copy</span></button>
                            <button id="shared-comment-button-${i}" class="btn btn-subtle btn-mini shared-comment-button"><span class="material-symbols-outlined">comment</span></button>
                        </div>                    
                    </div>     
                    ${commentsHTML}
                </div>`
                i++;
            }
            recipeHTML += "</div>";

            document.getElementById("toggle-container-1").classList.remove("hidden");

        }

        document.getElementById("shared-recipes").innerHTML = recipeHTML;

        const copyButtons = document.getElementsByClassName("shared-copy-button");
        for (let button of copyButtons) {
            button.addEventListener("click", () => {

                const promptId = button.id.replace("shared-copy-button-", "shared-prompt-");
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

        const commentButtons = document.getElementsByClassName("shared-comment-button");
        for (let button of commentButtons) {
            button.addEventListener("click", () => {
                const index = Number(button.id.replace("shared-comment-button-", ""));
                displayModal(`<strong>Commenting on:</strong><br />
                    ${recipes[index].Topic}<br /><hr />
                    <div style="font-style:italic; text-align:right">By ${recipes[index].Author}</div>`,
                    modalType = 4, "", 0, recipes[index].RecipeId);
            });
        }

    }
}

/**
 * Fetch and render the logged in user's private recipes
 */
async function loadMyRecipes() {

    let recipesResponse = null;

    const subjectSelector = document.getElementById("subject");
    const subjectId = Number(subjectSelector.value);

    try {

        recipesResponse = await fetch(`/recipes/mine`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (err) {
        console.log("Couldn't get my recipes: " + err)
    }

    if (recipesResponse == null) return;
    let recipes = await recipesResponse.json();

    if (recipes.error !== undefined) {
        console.log("Error returned getting my recipes: " + recipes.error)
    } else {

        let recipeHTML = "";

        recipes = recipes.filter(recipe => recipe.SharedDate == null && recipe.SubjectId == subjectId)

        if (recipes.length > 0) {
            recipeHTML += `<div><div class="subtitle-maroon">Private recipes:</div>`;
            let i = 0;
            for (let recipe of recipes) {

                const commentsHTML = await getComments(recipe.RecipeId);

                let headingText = recipe.Topic
                if (headingText.length > 70) headingText = headingText.substring(0, 70) + "...";

                recipeHTML += `<div class="private-recipe-container">
                <h4>${headingText}</h4>
                <hr style="margin-bottom: 10px;">
                <div class="row">
                    <div class="col-11 private-recipe">
                        <div id="private-prompt-${i}">${recipe.Prompt}</div>
                        <div style="font-style: italic; color:grey; text-align: right; padding-top: 10px;">Saved by you on ${shortDate(recipe.SavedDate)}</div>            
                    </div>
                    <div class="col-1">
                        <button id="private-copy-button-${i}" class="btn btn-primary btn-mini private-copy-button"><span class="material-symbols-outlined">content_copy</span></button>
                        <button id="private-comment-button-${i}" class="btn btn-subtle btn-mini private-comment-button"><span class="material-symbols-outlined">comment</span></button>
                    </div>
                </div>  
                ${commentsHTML}                         
                </div>`
                i++;
            }
            recipeHTML += "</div>";

            document.getElementById("toggle-container-1").classList.remove("hidden");

        }

        document.getElementById("private-recipes").innerHTML = recipeHTML;

        const copyButtons = document.getElementsByClassName("private-copy-button");
        for (let button of copyButtons) {
            button.addEventListener("click", () => {

                const promptId = button.id.replace("private-copy-button-", "private-prompt-");
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

        const commentButtons = document.getElementsByClassName("private-comment-button");
        for (let button of commentButtons) {
            button.addEventListener("click", () => {
                const index = Number(button.id.replace("private-comment-button-", ""));
                displayModal(`<strong>Commenting on:</strong><br />
                    ${recipes[index].Topic}<br /><hr />
                    <div style="font-style:italic; text-align:right">By you</div>`,
                    modalType = 4, "", 0, recipes[index].RecipeId);
            });
        }

    }

}

/**
 * Refresh the recipe lists for the currently selected subject
 */
async function loadRecipes() {

    const subject = document.getElementById('subject');
    if (subject.selectedIndex === -1) return;
    
    const category = subject.options[subject.selectedIndex].dataset.category;
    const checkboxes = document.getElementsByClassName('checkbox');
    for (let checkbox of checkboxes) {
        checkbox.checked = checkbox.value == "C" || checkbox.value == "R" ||
            (checkbox.value == "S" && category == "Sciences and Mathematics") ||
            (checkbox.value == "O" && category == "Social Sciences") ||
            (checkbox.value == "H" && category == "Humanities") ||
            (checkbox.value == "L" && category == "Languages") ||
            (checkbox.value == "A" && category == "Arts and Creative Studies");                      
    }

    document.getElementById("topic").value = "";
    saveSelections();
    document.getElementById("recipe-loader").classList.remove("hidden");
    document.getElementById("shared-recipes").innerHTML = "";
    document.getElementById("private-recipes").innerHTML = "";
    document.getElementById("toggle-container-1").classList.add("hidden");
    await loadMyRecipes();
    await loadSharedRecipes();
    document.getElementById("recipe-loader").classList.add("hidden");
    const commentDeleteButtons = document.getElementsByClassName("delete-comment-button");

    for (let commentDeleteButton of commentDeleteButtons) {
        const commentId = Number(commentDeleteButton.id.replace("delete-comment-", ""));
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


