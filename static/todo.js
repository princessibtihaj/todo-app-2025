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

function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const displayDate = document.getElementById('display-date');
const taskDateInput = document.getElementById('task-date');

const todayIso = toIsoDate(new Date());
let selectedDate = todayIso;

function renderSelectedDate() {
  displayDate.textContent = formatDisplayDate(selectedDate);
  taskDateInput.value = selectedDate;
}

function updateEmptyState() {
  emptyState.style.display = taskList.children.length ? 'none' : 'block';
}

function toggleTaskStatus(taskId) {
  fetch(`/api/v1/tasks/${taskId}`, { method: 'PATCH' })
    .then((response) => response.json())
    .then((data) => {
      if (!data.task) {
        return;
      }
      const row = document.querySelector(`li[data-task-id="${taskId}"]`);
      if (row) {
        row.classList.toggle('completed');
      }
    });
}

function addTaskToList(task) {
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

function renderTasksForDate(tasks) {
  taskList.innerHTML = '';
  tasks
    .filter((task) => {
      const taskDate = task.task_date || todayIso;
      return taskDate === selectedDate;
    })
    .forEach((task) => {
      addTaskToList(task);
    });
  updateEmptyState();
}

function loadTasks() {
  fetch('/api/v1/tasks')
    .then((response) => response.json())
    .then((data) => {
      renderTasksForDate(data.tasks || []);
    });
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
  const selectedValue = prayerSelect.value;
  if (selectedValue === '__other__') {
    return customPrayerInput.value.trim();
  }
  return selectedValue;
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
    body: JSON.stringify({ title: taskTitle, priority: taskPriority, task_date: selectedDate })
  })
    .then((response) => response.json())
    .then(() => {
      prayerSelect.selectedIndex = 0;
      customPrayerInput.value = '';
      customPrayerInput.classList.remove('visible');
      loadTasks();
    });
});

function removeTask(taskId) {
  fetch(`/api/v1/tasks/${taskId}`, { method: 'DELETE' }).then((response) => {
    if (!response.ok) {
      return;
    }
    const taskRow = document.querySelector(`li[data-task-id="${taskId}"]`);
    if (taskRow) {
      taskRow.remove();
    }
    updateEmptyState();
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

function shiftSelectedDate(days) {
  const date = new Date(`${selectedDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  selectedDate = toIsoDate(date);
  renderSelectedDate();
  loadTasks();
}

document.getElementById('prev-day').addEventListener('click', () => shiftSelectedDate(-1));
document.getElementById('next-day').addEventListener('click', () => shiftSelectedDate(1));

taskDateInput.addEventListener('change', () => {
  if (taskDateInput.value) {
    selectedDate = taskDateInput.value;
    renderSelectedDate();
    loadTasks();
  }
});

renderSelectedDate();
loadTasks();
