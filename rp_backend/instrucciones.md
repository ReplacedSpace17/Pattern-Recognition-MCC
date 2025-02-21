python -m venv backend_rp
source backend_rp/bin/activate
pip install fastapi uvicorn

pip freeze > requirements.txt
pip install -r requirements.txt

deactivate


uvicorn main:app --reload
