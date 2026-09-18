"""
FORGE3D AI Server Configuration
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Server
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "8000"))
    DEBUG = os.getenv("DEBUG", "true").lower() == "true"

    # Redis / Celery
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", REDIS_URL)
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", REDIS_URL)

    # Model Storage
    MODEL_CACHE_DIR = os.getenv("MODEL_CACHE_DIR", "./model_cache")
    OUTPUT_DIR = os.getenv("OUTPUT_DIR", "./outputs")

    # GPU Config
    DEVICE = os.getenv("DEVICE", "cuda")  # cuda or cpu
    HALF_PRECISION = os.getenv("HALF_PRECISION", "true").lower() == "true"

    # Backend API (for callbacks)
    BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:4000")
    BACKEND_API_KEY = os.getenv("BACKEND_API_KEY", "")

    # Model Selection
    TEXT_TO_3D_MODEL = os.getenv("TEXT_TO_3D_MODEL", "TRELLIS-image-large")
    IMAGE_TO_3D_MODEL = os.getenv("IMAGE_TO_3D_MODEL", "tencent/Hunyuan3D-2")
    TEXTURE_MODEL = os.getenv("TEXTURE_MODEL", "tencent/Hunyuan3D-2")
    RIGGING_MODEL = os.getenv("RIGGING_MODEL", "zhan-xu/UniRig")

    # Limits
    MAX_CONCURRENT_JOBS = int(os.getenv("MAX_CONCURRENT_JOBS", "2"))
    MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))


config = Config()
