/**
 * Admin interface helpers for managing users.
 */

/**
 * Allow admins to add users individually or in bulk
 */
document.addEventListener("DOMContentLoaded", () => {
  // Grab the existing single user form and the bulk add button inside its button-group
  const singleUserForm = document.querySelector(".form-container form");
  const bulkAddBtn = document.getElementById("bulkAddBtn");

  // Create a container for the bulk add UI elements
  const bulkContainer = document.createElement("div");
  bulkContainer.id = "bulk-container";
  bulkContainer.style.display = "none";
  bulkContainer.innerHTML = `
    <h2>Bulk Add / Update Users</h2>
    <textarea id="bulkInput" rows="10" placeholder="firstName [TAB] lastName [TAB] email [TAB] password"></textarea>
    <div style="text-align:center; color:silver;"><i>n.b. Any existing users will get names updated, but passwords will not be changed.<br/>This means it is safe to paste your whole user list in.</i></div>
    <div class="button-group" style="margin-top: 10px;">
      <button id="processBtn" class="btn btn-primary">Process</button>
      <button id="cancelBulkBtn" class="btn btn-neutral">Close</button>
    </div>
    <div id="bulkFeedback" style="margin-top: 10px;"></div>
  `;
  
  // Append the bulk container to the same parent as the single user form
  const formContainer = document.querySelector(".form-container");
  formContainer.appendChild(bulkContainer);

  // When the bulk add button is clicked, show bulk container, hide single user form, and hide the bulk add button
  bulkAddBtn.addEventListener("click", () => {
    singleUserForm.style.display = "none";
    bulkContainer.style.display = "block";
  });

  // Cancel button to revert back to single user mode and show the bulk add button again
  document.getElementById("cancelBulkBtn").addEventListener("click", () => {
    bulkContainer.style.display = "none";
    singleUserForm.style.display = "block";
    document.getElementById("bulkInput").value = "";
    document.getElementById("bulkFeedback").innerHTML = "";
  });

  // Process CSV button click event
  document.getElementById("processBtn").addEventListener("click", async () => {
    const bulkInput = document.getElementById("bulkInput").value;
  const bulkFeedback = document.getElementById("bulkFeedback");
  bulkFeedback.innerHTML = ""; // clear previous messages

  // Split the input by newlines and process each non-empty line
  const lines = bulkInput.trim().split("\n"); // split into rows

  // Process each CSV line sequentially
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // skip empty lines

    // Split by tab (assuming Excel paste)
    const fields = line.split("\t");
    if (fields.length < 4) {
      bulkFeedback.innerHTML += `<p style="color: red;">Line ${i + 1}: Invalid CSV format.</p>`;
      continue;
    }

    // Destructure and trim fields
    const [firstName, lastName, email, password] = fields.map(field => field.trim());

    try {
      // Send POST request with proper headers so that server returns JSON errors if any
      const response = await fetch("/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ firstName, lastName, email, password })
      });

      // Parse the response as JSON
      const data = await response.json();

      if (response.ok && data.success !== false) {
        bulkFeedback.innerHTML += `<p style="color: green;">${email}: ${data.message}</p>`;
      } else {
        // Use the error message from the JSON, if available
        bulkFeedback.innerHTML += `<p style="color: red;">Error creating user: ${data.error || 'Unknown error'}</p>`;
      }
    } catch (error) {
      bulkFeedback.innerHTML += `<p style="color: red;">Error creating user: ${error.message}</p>`;
    }
  }
});

});

