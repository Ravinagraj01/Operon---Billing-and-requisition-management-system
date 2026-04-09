import os
from database import engine, Base
from models import User, Requisition, Approval, Comment, Notification

def reset_database():
    # Delete the database file if it exists
    db_file = "procura.db"
    if os.path.exists(db_file):
        os.remove(db_file)
        print(f"Deleted {db_file}")
    
    # Recreate all tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created")
    
    # Import and run seed function
    from seed import seed_data
    seed_data()
    print("Database seeded successfully")

if __name__ == "__main__":
    reset_database()
