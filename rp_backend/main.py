from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
import numpy as np
from scipy import stats
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

# importar clasificadores
from clasificadores.minima_distancia.GPU.GPU_CMD_MULTICLASE import CMD_MULTICLASE_GPU
from clasificadores.minima_distancia.GPU.GPU_CMD_BICLASE import CMD_BICLASE_GPU
from clasificadores.minima_distancia.CPU.CPU_CMD_BICLASE import CMD_BICLASE_CPU
from clasificadores.minima_distancia.CPU.CPU_CMD_MULTICLASE import CMD_MULTICLASE_CPU
import torch
import time

# importar clasificadores knn
from clasificadores.knn.Knn_standard import KNN_STANDARD
from fastapi.staticfiles import StaticFiles

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
#------------- Instancias de los clasificadores MINIMA DISTANCIA
#----------------------------------------------------- CON GPU
classifier_MD_MULTICLASE_GPU = CMD_MULTICLASE_GPU()
classifier_MD_BICLASE_GPU = CMD_BICLASE_GPU()

#----------------------------------------------------- CON CPU
classifier_MD_MULTICLASE_CPU = CMD_MULTICLASE_CPU()
classifier_MD_BICLASE_CPU = CMD_BICLASE_CPU()

# knn


# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir todos los orígenes (cuidado con esto en producción)
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos (GET, POST, etc.)
    allow_headers=["*"],  # Permitir todos los headers
)

class DataModel(BaseModel):
    data: List[Dict[str, Any]]
    columnas: List[str]

@app.post("/normality/test")
def test_normality(request: DataModel):

    resultados = {}

    for columna in request.columnas:
        valores = [
            fila[columna] for fila in request.data 
            if columna in fila and isinstance(fila[columna], (int, float)) and fila[columna] is not None
        ]

        if len(valores) < 3:
            resultados[columna] = {"error": "No hay suficientes datos para la prueba de normalidad"}
            continue

        # Calcular estadísticas descriptivas
        media = np.mean(valores)
        mediana = np.median(valores)
        
        try:
            moda_result = stats.mode(valores)
            if moda_result.count[0] > 1:  # Si hay un valor con una frecuencia mayor que 1
                moda = float(moda_result.mode[0])  # Tomar el primer valor de la moda
            else:
                moda = None  # Si no hay moda clara, asignar None
        except Exception as e:
            moda = None  # Si ocurre una excepción, asignar None

        varianza = np.var(valores, ddof=1)  # ddof=1 para la varianza muestral
        desviacion_estandar = np.std(valores, ddof=1)  # ddof=1 para la desviación estándar muestral

        # Si el número de muestras es menor que 50, usar Shapiro-Wilk, de lo contrario usar Kolmogorov-Smirnov
        if len(valores) < 50:
            stat, p_value = stats.shapiro(valores)
            prueba = "Shapiro-Wilk"
        else:
            # Usar una distribución normal ajustada a los datos (media y desviación estándar de los datos)
            stat, p_value = stats.kstest(valores, 'norm', args=(np.mean(valores), np.std(valores)))
            prueba = "Kolmogorov-Smirnov"

        # Redondear el valor p a 4 decimales para evitar notación científica y hacerlo más legible
        p_value = round(p_value, 10)

        # Asegurarse de que stat y p_value sean de tipo estándar (como float o bool)
        resultados[columna] = {
            "prueba": prueba,
            "statistic": float(stat),  # Convertir a float si es necesario
            "p_value": float(p_value),  # Convertir a float si es necesario
            "es_normal": bool(p_value > 0.05),  # Convertir a bool para evitar numpy.bool
            "media": float(media),
            "mediana": float(mediana),
            "varianza": float(varianza),
            "desviacion_estandar": float(desviacion_estandar)
        }

    return {"resultados": resultados}


@app.post("/correlation/test")
def test_correlation(request: DataModel):
    # Convertir los datos en un DataFrame de pandas
    df = pd.DataFrame(request.data)
    
    # Filtrar solo las columnas especificadas
    selected_columns = [col for col in request.columnas if col in df.columns]
    df_filtered = df[selected_columns]
    
    # Calcular la matriz de correlación
    correlation_matrix = df_filtered.corr()
    
    # Convertir la matriz en un diccionario anidado
    correlation_dict = correlation_matrix.to_dict()

    ##impriir la matriz de correlacion
    print(correlation_matrix)
    
    return {"correlation_matrix": correlation_dict}

@app.post("/variance/normalizada")
def variance_normalizada(request: DataModel):
    # Convertir los datos en un DataFrame de Pandas
    df = pd.DataFrame(request.data)

    # Seleccionar solo las columnas numéricas enviadas en la petición
    X = df[request.columnas].values  

    # Normalizar los datos
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Aplicar PCA
    pca = PCA()
    pca.fit(X_scaled)

    # Calcular varianza explicada y acumulada
    explained_variance = pca.explained_variance_ratio_.tolist()
    cumulative_variance = np.cumsum(pca.explained_variance_ratio_).tolist()

    # Formatear la respuesta en JSON
    response = {
        "varianza_explicada": [
            {"componente": i + 1, "varianza": round(var, 4), "porcentaje": round(var * 100, 2)}
            for i, var in enumerate(explained_variance)
        ],
        "varianza_acumulada": [
            {"componentes": i + 1, "varianza_acumulada": round(var, 4), "porcentaje": round(var * 100, 2)}
            for i, var in enumerate(cumulative_variance)
        ]
    }
    # imprimir la respuesta
    print(response)

    return response

class PcaModel(BaseModel):
    n_components: int
    whiten: bool
    svd_solver: str
    random_state: int
    data: List[Dict[str, Any]]
    columnas: List[str]


@app.post("/pca/test")
def analyze_pca(request: PcaModel):
    # Imprimir los datos
    print(request.n_components)
    
    # Convertir los datos en un DataFrame de pandas
    df = pd.DataFrame(request.data)
    
    # Filtrar solo las columnas especificadas
    selected_columns = [col for col in request.columnas if col in df.columns]
    df_filtered = df[selected_columns]
    
    # Convertir a valores numéricos (asegurarse de que no haya valores no numéricos)
    df_filtered = df_filtered.apply(pd.to_numeric, errors='coerce').dropna()
    
    # Verificar que haya suficientes datos para PCA
    if df_filtered.shape[0] < request.n_components:
        return {"error": f"No hay suficientes datos para realizar PCA con {request.n_components} componentes"}
    
    # Aplicar PCA con los parámetros adecuados
    pca = PCA(n_components=request.n_components, whiten=request.whiten, svd_solver=request.svd_solver, random_state=request.random_state)
    pca.fit(df_filtered)
    
    # Obtener la varianza explicada por cada componente
    explained_variance_ratio = pca.explained_variance_ratio_.tolist()
    
    # Obtener la matriz de cargas (componentes principales)
    loadings = pca.components_.tolist()
    
    # Crear un diccionario con las variables originales y sus cargas
    loadings_dict = {}
    for i, feature in enumerate(df_filtered.columns):
        loadings_dict[feature] = {f"Componente {j+1}": loadings[j][i] for j in range(request.n_components)}
    
    return {
        "variance_ratio": explained_variance_ratio,
        "n_components": request.n_components,
        "whiten": request.whiten,
        "svd_solver": request.svd_solver,
        "random_state": request.random_state,
        "loadings": loadings_dict  # Matriz de cargas
    }



class MinimaDistanciaModel(BaseModel):
    type: str  # Tipo de clasificación, puede ser 'multiclase' o 'biclase'
    distancia_type: str  # Tipo de distancia, 'euclidiana', 'manhattan', 'minkowski'
    etiquetas: List[str]  # Columnas donde están las etiquetas
    selected_class: List[str]  # Lista de clases seleccionadas si el tipo de clasificación es multiclase
    selected_features: List[str]  # Columnas seleccionadas para entrenar el modelo
    data: List[Dict[str, Any]]  # Datos

# Endpoint que recibe el JSON
@app.post("/clasificador/minima_distancia")
async def clasificador_minima_distancia(request: MinimaDistanciaModel):

    # -------------------------------------------------------------------------- DEFINIR EL PROCESADOR A UTILIZAR
    procesador= 0 # 0 para CPU, 1 para GPU
    print("Clasificando.....")

#-------------------------- PROCESAMIENTO EN CPU---------------------------
    if procesador == 0:
        if request.type == "biclase":
            # Crear una instancia del clasificador para clasificación biclase
            classifier_MD_BICLASE_CPU = CMD_BICLASE_CPU(distancia_type=request.distancia_type)
            # Pasar 'selected_class' a la función classify
            resultados = classifier_MD_BICLASE_CPU.classify(request.data, request.selected_features, request.etiquetas, request.selected_class)

        elif request.type == "multiclase":
            # Crear una instancia del clasificador para clasificación multiclase
            classifier_MD_MULTICLASE_CPU = CMD_MULTICLASE_CPU(distancia_type=request.distancia_type)
            # Sin embargo, multiclase no usa 'selected_class'
            resultados = classifier_MD_MULTICLASE_CPU.classify(request.data, request.selected_features, request.etiquetas)

        return {"type_classification": request.type, "tipo_distancia": request.distancia_type, **resultados}

# -----------------------------PROCESAR CON GPU--------------------------------
    if procesador == 1:
        if request.type == "biclase":
            # Crear una instancia del clasificador para clasificación biclase
            classifier_MD_BICLASE_GPU = CMD_BICLASE_GPU(distancia_type=request.distancia_type)
            # Pasar 'selected_class' a la función classify
            resultados = classifier_MD_BICLASE_GPU.classify(request.data, request.selected_features, request.etiquetas, request.selected_class)

        elif request.type == "multiclase":
            # Crear una instancia del clasificador para clasificación multiclase
            classifier_MD_MULTICLASE_GPU = CMD_MULTICLASE_GPU(distancia_type=request.distancia_type)
            # Sin embargo, multiclase no usa 'selected_class'
            resultados = classifier_MD_MULTICLASE_GPU.classify(request.data, request.selected_features, request.etiquetas)

        return {"type_classification": request.type, "tipo_distancia": request.distancia_type, **resultados}


#-------------------------------------------------------------------------------------------------------------- KNN CLASIFICADOR
class KnnClass(BaseModel):
    distancia_type: int  # 1: Euclidiana, 2: Manhattan
    etiquetas: List[str]  # Columnas donde están las etiquetas
    selectedFeatures: List[str]  # Columnas seleccionadas para entrenar el modelo
    data: List[Dict[str, Any]]  # Datos del dataset
    knn_type: int  # 1: KNN normal

@app.post("/clasificador/knn/standard")
async def clasificador_knn(request: KnnClass):
    print("Clasificando con KNN estándar...")

    # ✅ Pasar los parámetros correctamente a la clase KNN_STANDARD
    classifier_knn_standard = KNN_STANDARD(
        distancia_type=request.distancia_type,
        etiquetas=request.etiquetas,
        selectedFeatures=request.selectedFeatures,
        data=request.data,
        knn_type=request.knn_type
    )
    resultado = classifier_knn_standard.test()
    return {"message": "Clasificación completada", "resultado": resultado}


########################################################################################33  test
class TestModel(BaseModel):
    num1: int
    num2: int


@app.post("/test")
def test(request: TestModel):
    print("Se recibieron los números", request.num1, "y", request.num2)

    # Verificar si hay GPU
    device = "cuda" if torch.cuda.is_available() else "cpu"

    # Mover los números a la GPU y efectuar la suma
    num1_tensor = torch.tensor(request.num1, dtype=torch.float32, device=device)
    num2_tensor = torch.tensor(request.num2, dtype=torch.float32, device=device)
    
    resultado_tensor = num1_tensor + num2_tensor  # Suma en GPU
    resultado = resultado_tensor.item()

    # Prueba de rendimiento de la GPU (Multiplicación de matrices grandes)
    if torch.cuda.is_available():
        torch.cuda.synchronize()  # Sincronizar antes de la medición
        start_time = time.time()

        A = torch.randn((15000, 15000), device="cuda")  # Matriz grande en GPU
        B = torch.randn((15000, 15000), device="cuda")
        C = torch.matmul(A, B)  # Multiplicación en GPU

        torch.cuda.synchronize()  # Sincronizar después de la medición
        gpu_time = time.time() - start_time  # Tiempo en segundos

        gpu_name = torch.cuda.get_device_name(0)
        gpu_memory = torch.cuda.memory_allocated(0) / 1e6  # MB
        gpu_info = f"GPU: {gpu_name}, Memoria usada: {gpu_memory:.2f} MB, Tiempo de cálculo: {gpu_time:.4f} s"
    else:
        gpu_info = "No se detectó GPU."

    print(gpu_info)
    return {"resultado": resultado, "gpu_info": gpu_info}