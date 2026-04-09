import hashlib

def simple_hash(password: str) -> str:
    """Simple SHA256 hash for testing purposes"""
    return hashlib.sha256(password.encode()).hexdigest()

def simple_verify(plain: str, hashed: str) -> bool:
    """Simple SHA256 verification for testing purposes"""
    return hashlib.sha256(plain.encode()).hexdigest() == hashed
