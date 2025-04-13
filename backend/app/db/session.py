from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.ext.declarative import declarative_base

from app.core.config import settings

# 创建同步引擎
engine = create_engine(
    settings.get_database_url(),
    echo=True,
)

# 创建同步会话
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# 创建Base类
Base = declarative_base()


# 依赖函数，用于获取数据库会话
def get_db():
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
