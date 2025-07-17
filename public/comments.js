/**
 * Front-end helpers for displaying and managing comments.
 */

//Convert an ISO date string to a short "1st January" format
function shortDate(dateString) {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const date = new Date(dateString);
    const day = date.getDate();
    const month = months[date.getMonth()];

    function getOrdinalSuffix(day) {
        if (day > 3 && day < 21) return "th";
        switch (day % 10) {
            case 1: return "st";
            case 2: return "nd";
            case 3: return "rd";
            default: return "th";
        }
    }

    return `${day}${getOrdinalSuffix(day)} ${month}`;
}

/**
 * Fetch comments for a recipe and build HTML for display
 *
 * @param {number} recipeId - ID of the recipe to fetch comments for
 * @param {boolean} [colWrap=true] - wrap the output in columns
 */
async function getComments(recipeId, colWrap = true) {
    // 1. Request comments from the server
    let commentsResponse = null;
        
    try {
        
        const query = new URLSearchParams({ recipeId }).toString();
        commentsResponse = await fetch(`/comments/?${query}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (err) {
        console.log("Couldn't get comments for recipe: " + err)
    }

    // 2. Parse the JSON response
    if (commentsResponse == null) return;
    let comments = await commentsResponse.json();

    // 3. Handle potential errors
    if (comments.error !== undefined) {
        console.log("Error returned getting comments for recipe: " + comments.error)
    } 
    
    // 4. Build an HTML list if comments exist
    if (comments.length > 0) {

        let commentsHTML = `<ul class="comments-list">`;        
        for (let comment of comments) {
            let author = comment.Author;
            let actions = "";
            if (author.toLowerCase() == "you") {
                author = "You";
                actions = `<button id="delete-comment-${comment.CommentId}" class="btn btn-xs btn-danger delete-comment-button"><span class="material-symbols-outlined">delete</span></button>`;
            }
            commentsHTML += `
                <li id="comment-li-${comment.CommentId}">
                    <span class="comment-text">${comment.Comment}</span>
                    <span class="comment-author">${author}</span>
                    <span class="comment-date">${shortDate(comment.SavedDate)}</span>  
                    <span class="comment-actions">${actions}</span>
                </li>`;
        }
        commentsHTML += "</ul>";

        // 5. Optionally add columns
        if (colWrap) {

            return `<div class="row">     
                <div class="col-1"></div>      
                <div class="col-10">${commentsHTML}</div>                                
                <div class="col-1"></div>
            </div>`;

        } else {

            return commentsHTML;

        }

    } else {
        // No comments to display
        return "";
    }
    
}
