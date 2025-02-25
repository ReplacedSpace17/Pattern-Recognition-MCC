import torch

# Verifica si CUDA está disponible
cuda_available = torch.cuda.is_available()
cuda_version = torch.version.cuda  # Obtiene la versión de CUDA compatible con PyTorch
torch_version = torch.__version__

print(f"PyTorch version: {torch_version}")
if cuda_available:
    print(f"CUDA is available! Version: {cuda_version}")
    print(f"Number of GPUs: {torch.cuda.device_count()}")
    print(f"GPU Name: {torch.cuda.get_device_name(0)}")
else:
    print("CUDA is not available. Running on CPU.")
