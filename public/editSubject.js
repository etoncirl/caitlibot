/**
 * Admin interface helpers for editing subjects.
 */

/**
 * Form handler for editing or bulk adding subjects
 */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.form-container form');
  if (!form) return;
  const feedback = document.getElementById('subjectFeedback');
  // 1. Handle single subject submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (feedback) { feedback.innerText = ''; feedback.style.color = ''; }
    const subject = form.subject.value;
    const level = form.level.value;
    const examBoard = form.examBoard.value;
    const category = form.category.value;
    try {
      const response = await fetch('/admin/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ subject, level, examBoard, category }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        window.location.href = '/admin';
      } else {
        if (feedback) {
          feedback.innerText = data.error || data.message || 'Error creating subject';
          feedback.style.color = 'red';
        }
      }
    } catch (err) {
      if (feedback) {
        feedback.innerText = err.message;
        feedback.style.color = 'red';
      }
    }
  });
  // 2. Bulk add subjects
  const bulkAddBtn = document.getElementById('bulkAddBtn');
  const singleSubjectForm = form;
  if (bulkAddBtn) {
    // Allowed values for validation
    const allowedCategories = [
      'Sciences and Mathematics',
      'Languages',
      'Humanities',
      'Arts and Creative Studies',
      'Social Sciences'
    ];
    const allowedLevels = ['GCSE', 'A level'];
    const bulkContainer = document.createElement('div');
    bulkContainer.id = 'bulk-container';
    bulkContainer.style.display = 'none';
    bulkContainer.innerHTML = `
      <h2>Bulk Add Subjects</h2>
      <textarea id="bulkInput" rows="10" placeholder="category [TAB] level [TAB] subject [TAB] examBoard"></textarea>
      <div class="button-group" style="margin-top: 10px;">
        <button id="processBtn" class="btn btn-primary">Process</button>
        <button id="cancelBulkBtn" class="btn btn-neutral">Close</button>
      </div>
      <div id="bulkFeedback" style="margin-top: 10px;"></div>
    `;
    const formContainer = document.querySelector('.form-container');
    formContainer.appendChild(bulkContainer);

    bulkAddBtn.addEventListener('click', () => {
      singleSubjectForm.style.display = 'none';
      bulkContainer.style.display = 'block';
    });

    document.getElementById('cancelBulkBtn').addEventListener('click', () => {
      bulkContainer.style.display = 'none';
      singleSubjectForm.style.display = 'block';
      document.getElementById('bulkInput').value = '';
      document.getElementById('bulkFeedback').innerHTML = '';
    });

    // Process bulk CSV lines one by one
    document.getElementById('processBtn').addEventListener('click', async () => {
      const bulkInput = document.getElementById('bulkInput').value;
      const bulkFeedback = document.getElementById('bulkFeedback');
      bulkFeedback.innerHTML = '';
      const lines = bulkInput.trim().split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const fields = line.split('\t');
        if (fields.length < 4) {
          bulkFeedback.innerHTML += `<p style="color: red;">Line ${i + 1}: Invalid format.</p>`;
          continue;
        }
        const [category, level, subjectName, examBoardValue] = fields.map(f => f.trim());
        // Client-side validation for category and level
        if (!allowedCategories.includes(category)) {
          bulkFeedback.innerHTML += `<p style="color: red;">Line ${i + 1}: Invalid category '${category}'.</p>`;
          continue;
        }
        if (!allowedLevels.includes(level)) {
          bulkFeedback.innerHTML += `<p style="color: red;">Line ${i + 1}: Invalid level '${level}'.</p>`;
          continue;
        }
        try {
          const response = await fetch('/admin/subjects', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ category, level, subject: subjectName, examBoard: examBoardValue }),
          });
          const data = await response.json();
          if (response.ok && data.success) {
            bulkFeedback.innerHTML += `<p style="color: green;">${subjectName}: ${data.message}</p>`;
          } else {
            bulkFeedback.innerHTML += `<p style="color: red;">Error creating subject: ${data.error || 'Unknown error'}</p>`;
          }
        } catch (error) {
          bulkFeedback.innerHTML += `<p style="color: red;">Error creating subject: ${error.message}</p>`;
        }
      }
    });
  }
});
