// Princess Ibtihaj
// CS492
// Prof. Madi
// todo.js
// Browser script: load prayers/tasks, add, edit, delete, and toggle completion via fetch.

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// toggle prayer row completion on the server and in the DOM
function toggleTaskStatus(taskId) {
  fetch(`/api/v1/tasks/${taskId}`, { method: 'PATCH' })
    .then((response) => {
      if (!response.ok) {
        return;
      }
      const row = document.querySelector(`li[data-task-id="${taskId}"]`);
      if (row) {
        row.classList.toggle('completed');
      }
    });
}
// add item to todo list
function addTaskToList(task) {
  const taskList = document.getElementById('task-list');
  const li = document.createElement('li');
  li.setAttribute('data-task-id', task.id);
  if (task.status === 'completed') {
    li.classList.add('completed');
  }

  const priority = task.priority || 'medium';
  li.innerHTML = `
    <span class="task-main" role="button" tabindex="0" onclick="toggleTaskStatus(${task.id})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleTaskStatus(${task.id});}">
      <span class="task-title">${escapeHtml(task.title)}</span>
      <span class="priority-badge priority-${priority}">${priority}</span>
    </span>
    <span class="task-actions">
      <button type="button" class="edit-btn" onclick="event.stopPropagation(); editTask(${task.id})">Edit</button>
      <a href="#" id="task-${task.id}" class="remove-btn" onclick="event.stopPropagation(); removeTask(${task.id}); return false;" aria-label="Remove">Remove</a>
    </span>
  `;
  taskList.appendChild(li);
}

const prayerSelect = document.getElementById('prayer-name');
const customPrayerInput = document.getElementById('custom-prayer');

prayerSelect.addEventListener('change', () => {
  if (prayerSelect.value === '__other__') {
    customPrayerInput.classList.add('visible');
    customPrayerInput.focus();
  } else {
    customPrayerInput.classList.remove('visible');
    customPrayerInput.value = '';
  }
});

function resolvePrayerTitle() {
  const v = prayerSelect.value;
  if (v === '__other__') {
    return customPrayerInput.value.trim();
  }
  return v;
}

const taskForm = document.getElementById('task-form');
taskForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const priorityInput = document.getElementById('task-priority');
  const taskTitle = resolvePrayerTitle();
  const taskPriority = priorityInput.value;

  if (!taskTitle) {
    return;
  }

  fetch('/api/v1/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title: taskTitle, priority: taskPriority })
  })
    .then((response) => response.json())
    .then((data) => {
      prayerSelect.selectedIndex = 0;
      customPrayerInput.value = '';
      customPrayerInput.classList.remove('visible');
      addTaskToList(data.task);
    });
});

function loadTasks() {
  fetch('/api/v1/tasks')
    .then((response) => response.json())
    .then((data) => {
      data.tasks.forEach((task) => {
        addTaskToList(task);
      });
    });
}

function removeTask(taskId) {
  fetch(`/api/v1/tasks/${taskId}`, { method: 'DELETE' }).then((response) => {
    if (!response.ok) {
      return;
    }
    const taskRow = document.querySelector(`li[data-task-id="${taskId}"]`);
    if (taskRow) {
      taskRow.remove();
    }
  });
}

function editTask(taskId) {
  const row = document.querySelector(`li[data-task-id="${taskId}"]`);
  if (!row) {
    return;
  }

  const titleEl = row.querySelector('.task-title');
  const currentTitle = titleEl ? titleEl.textContent.trim() : '';
  const newTitle = window.prompt('Edit task:', currentTitle);

  if (newTitle === null) {
    return;
  }

  const trimmedTitle = newTitle.trim();
  if (!trimmedTitle) {
    return;
  }

  fetch(`/api/v1/tasks/${taskId}/edit`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title: trimmedTitle })
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.task && titleEl) {
        titleEl.textContent = data.task.title;
      }
    });
}

loadTasks();
