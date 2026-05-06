# Princess Ibtihaj
# CS492
# Prof. Madi
# release_phase.py
# Heroku release phase: create database tables if they do not exist.

from app import app
from models import db


def main():
    with app.app_context():
        db.create_all()


if __name__ == "__main__":
    main()
