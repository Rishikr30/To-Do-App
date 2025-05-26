
class TodoApp {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.editingTaskId = null;
        this.taskIdCounter = 1;

        this.initializeElements();
        this.attachEventListeners();
        this.loadTasks();
        this.render();
    }

    initializeElements() {
        this.taskInput = document.getElementById('taskInput');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.addBtn = document.getElementById('addBtn');
        this.tasksList = document.getElementById('tasksList');
        this.emptyState = document.getElementById('emptyState');
        this.totalTasksEl = document.getElementById('totalTasks');
        this.completedTasksEl = document.getElementById('completedTasks');
        this.pendingTasksEl = document.getElementById('pendingTasks');
        this.filterBtns = document.querySelectorAll('.filter-btn');
    }

    attachEventListeners() {
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
    }

    addTask() {
        const text = this.taskInput.value.trim();
        const priority = this.prioritySelect.value;

        if (!text) {
            this.taskInput.focus();
            return;
        }

        const task = {
            id: this.taskIdCounter++,
            text: text,
            priority: priority,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.taskInput.value = '';
        this.prioritySelect.value = 'medium';
        this.saveTasks();
        this.render();
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.saveTasks();
            this.render();
        }
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
        }
    }

    editTask(taskId) {
        this.editingTaskId = taskId;
        this.render();
    }

    saveEdit(taskId, newText, newPriority) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task && newText.trim()) {
            task.text = newText.trim();
            task.priority = newPriority;
            this.editingTaskId = null;
            this.saveTasks();
            this.render();
        }
    }

    cancelEdit() {
        this.editingTaskId = null;
        this.render();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.render();
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'completed':
                return this.tasks.filter(task => task.completed);
            case 'pending':
                return this.tasks.filter(task => !task.completed);
            case 'high':
            case 'medium':
            case 'low':
                return this.tasks.filter(task => task.priority === this.currentFilter);
            default:
                return this.tasks;
        }
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const pending = total - completed;

        this.totalTasksEl.textContent = total;
        this.completedTasksEl.textContent = completed;
        this.pendingTasksEl.textContent = pending;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    render() {
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            this.tasksList.style.display = 'none';
            this.emptyState.style.display = 'block';
        } else {
            this.tasksList.style.display = 'block';
            this.emptyState.style.display = 'none';
        }

        this.tasksList.innerHTML = filteredTasks.map(task => {
            if (this.editingTaskId === task.id) {
                return this.renderEditForm(task);
            }
            return this.renderTask(task);
        }).join('');

        this.updateStats();
        this.attachTaskEventListeners();
    }

    renderTask(task) {
        return `
                    <div class="task-item ${task.completed ? 'completed' : ''}">
                        <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-task-id="${task.id}"></div>
                        <div class="task-content">
                            <div class="task-text">${this.escapeHtml(task.text)}</div>
                            <div class="task-meta">
                                <span class="priority-badge priority-${task.priority}">
                                    ${task.priority.toUpperCase()} PRIORITY
                                </span>
                                <span>Created: ${this.formatDate(task.createdAt)}</span>
                            </div>
                        </div>
                        <div class="task-actions">
                            <button class="action-btn edit-btn" data-task-id="${task.id}" data-action="edit">Edit</button>
                            <button class="action-btn delete-btn" data-task-id="${task.id}" data-action="delete">Delete</button>
                        </div>
                    </div>
                `;
    }

    renderEditForm(task) {
        return `
                    <div class="task-item edit-mode">
                        <div class="task-content" style="flex: 1;">
                            <input type="text" class="edit-input" value="${this.escapeHtml(task.text)}" data-task-id="${task.id}">
                            <div class="task-meta" style="margin-top: 10px;">
                                <select class="priority-select" data-task-id="${task.id}">
                                    <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low Priority</option>
                                    <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium Priority</option>
                                    <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High Priority</option>
                                </select>
                            </div>
                        </div>
                        <div class="task-actions">
                            <button class="action-btn save-btn" data-task-id="${task.id}" data-action="save">Save</button>
                            <button class="action-btn cancel-btn" data-action="cancel">Cancel</button>
                        </div>
                    </div>
                `;
    }

    attachTaskEventListeners() {
        this.tasksList.addEventListener('click', (e) => {
            const taskId = parseInt(e.target.dataset.taskId);
            const action = e.target.dataset.action;

            if (e.target.classList.contains('task-checkbox')) {
                this.toggleTask(taskId);
            } else if (action === 'delete') {
                this.deleteTask(taskId);
            } else if (action === 'edit') {
                this.editTask(taskId);
            } else if (action === 'save') {
                const input = this.tasksList.querySelector(`input[data-task-id="${taskId}"]`);
                const select = this.tasksList.querySelector(`select[data-task-id="${taskId}"]`);
                this.saveEdit(taskId, input.value, select.value);
            } else if (action === 'cancel') {
                this.cancelEdit();
            }
        });

        // Handle Enter key in edit input
        this.tasksList.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.classList.contains('edit-input')) {
                const taskId = parseInt(e.target.dataset.taskId);
                const select = this.tasksList.querySelector(`select[data-task-id="${taskId}"]`);
                this.saveEdit(taskId, e.target.value, select.value);
            }
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveTasks() {
        // In a real app, you'd save to localStorage or a server
        // For now, we just keep tasks in memory during the session
    }

    loadTasks() {
        // In a real app, you'd load from localStorage or a server
        // For demo purposes, we'll start with some sample tasks
        this.tasks = [
            {
                id: this.taskIdCounter++,
                text: "Welcome to your new To-Do App!",
                priority: "high",
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: this.taskIdCounter++,
                text: "Try adding a new task above",
                priority: "medium",
                completed: false,
                createdAt: new Date().toISOString()
            }
        ];
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});
