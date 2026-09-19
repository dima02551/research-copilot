from sqlmodel import SQLModel, create_engine, Session
import os

DB_PATH = os.getenv("DATABASE_PATH", "research.db")
engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
