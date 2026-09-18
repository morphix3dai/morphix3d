# ==========================================
# FORGE3D AI Server — GPU Dockerfile
# Deploy to RunPod, Vast.ai, or any NVIDIA GPU server
# ==========================================
FROM nvidia/cuda:12.4.1-devel-ubuntu22.04

# System deps
RUN apt-get update && apt-get install -y \
    python3.11 python3.11-pip python3.11-venv \
    git wget curl \
    libgl1-mesa-glx libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

RUN ln -s /usr/bin/python3.11 /usr/bin/python

WORKDIR /app

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install PyTorch with CUDA
RUN pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124

# Copy application
COPY . .

# Create output directories
RUN mkdir -p /app/model_cache /app/outputs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s \
    CMD curl -f http://localhost:8000/health || exit 1

# Run
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
