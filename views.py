# Princess Ibtihaj
# CS492
# Prof. Madi
# views.py
# Flask routes for the tracker page plus REST endpoints for CRUD/task actions.

from flask import Blueprint, render_template, redirect, url_for
from flask import request
from flask_login import login_required, current_user
from models import db, Task, User
from datetime import datetime

# Create a blueprint
main_blueprint = Blueprint('main', __name__)


@main_blueprint.route('/', methods=['GET', 'POST'])
@login_required
def todo():
    # if request.method == 'POST':
    #     task = request.form['task-text']
    #     print(task)
    #     new_task = Task(title=task, user_id=current_user.id)
    #     db.session.add(new_task)
    #     db.session.commit()

    #tasks = Task.query.filter_by(user_id=current_user.id).all()
    #return render_template('todo.html', tasks=tasks)
    return render_template('todo.html')

@main_blueprint.route('/api/v1/tasks', methods=['GET'])
@login_required
def api_get_tasks():
    tasks = Task.query.filter_by(user_id=current_user.id).all()
    return {
        "tasks": [task.to_dict() for task in tasks]
    }

@main_blueprint.route('/api/v1/tasks', methods=['POST'])
@login_required
def api_create_task():
    data = request.get_json()
    priority = data.get('priority', 'medium')
    task_date = data.get('task_date')
    if priority not in ('low', 'medium', 'high'):
        priority = 'medium'
    if task_date:
        try:
            datetime.strptime(task_date, '%Y-%m-%d')
        except ValueError:
            task_date = None
    create_kwargs = {
        "title": data['title'],
        "priority": priority,
        "user_id": current_user.id
    }
    if task_date:
        create_kwargs["task_date"] = task_date
    new_task = Task(**create_kwargs)
    db.session.add(new_task)
    db.session.commit()
    return {
        "task": new_task.to_dict()
    }, 201

@main_blueprint.route('/api/v1/tasks/<int:task_id>', methods=['PATCH'])
@login_required
def api_toggle_task(task_id):
    task = Task.query.get(task_id)

    if task is None:
        return {"error": "Task not found"}, 404

    if task.user_id != current_user.id:
        return {"error": "Forbidden"}, 403

    task.toggle()
    db.session.commit()

    return {"task": task.to_dict()}, 200

@main_blueprint.route('/api/v1/tasks/<int:task_id>/edit', methods=['PATCH'])
@login_required
def api_edit_task(task_id):
    task = Task.query.get(task_id)

    if task is None:
        return {"error": "Task not found"}, 404

    if task.user_id != current_user.id:
        return {"error": "Forbidden"}, 403

    data = request.get_json() or {}
    title = (data.get('title') or '').strip()
    priority = data.get('priority')
    task_date = data.get('task_date')

    if title:
        task.title = title

    if priority in ('low', 'medium', 'high'):
        task.priority = priority
    if task_date:
        try:
            datetime.strptime(task_date, '%Y-%m-%d')
            task.task_date = task_date
        except ValueError:
            pass

    db.session.commit()
    return {"task": task.to_dict()}, 200

@main_blueprint.route('/api/v1/tasks/<int:task_id>', methods=['DELETE'])
@login_required
def api_delete_task(task_id):
    task = Task.query.get(task_id)

    if task is None:
        return {"error": "Task not found"}, 404

    if task.user_id != current_user.id:
        return {"error": "Forbidden"}, 403

    db.session.delete(task)
    db.session.commit()
    return {"success": True}, 200

@main_blueprint.route('/remove/<int:task_id>')
@login_required
def remove(task_id):
    task = Task.query.get(task_id)

    if task is None:
        return redirect(url_for('main.todo'))

    db.session.delete(task)
    db.session.commit()

    return redirect(url_for('main.todo'))