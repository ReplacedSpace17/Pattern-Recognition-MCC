from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
import numpy as np
from scipy import stats
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from sklearn.decomposition import PCA

app = FastAPI()

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


class PcaModel(BaseModel):
    n_components: int
    whiten: bool
    svd_solver: str
    random_state: int
    data: List[Dict[str, Any]]
    columnas: List[str]

@app.post("/pca/test")
def analyze_pca(request: PcaModel):
    #imprimir los datos
    print(request.n_components)
    # Convertir los datos en un DataFrame de pandas
    df = pd.DataFrame(request.data)
    
    # Filtrar solo las columnas especificadas
    selected_columns = [col for col in request.columnas if col in df.columns]
    df_filtered = df[selected_columns]
    
    # Convertir a valores numéricos (asegurarse de que no hay valores no numéricos)
    df_filtered = df_filtered.apply(pd.to_numeric, errors='coerce').dropna()
    
    # Verificar que haya suficientes datos para PCA
    if df_filtered.shape[0] < request.n_components:
        return {"error": f"No hay suficientes datos para realizar PCA con {request.n_components} componentes"}
    
    # Aplicar PCA con los parámetros adecuados
    pca = PCA(n_components=request.n_components, whiten=request.whiten, svd_solver=request.svd_solver, random_state=request.random_state)
    pca.fit(df_filtered)
    
    # Obtener la varianza explicada por cada componente
    explained_variance_ratio = pca.explained_variance_ratio_.tolist()
    
    return {
        "variance_ratio": explained_variance_ratio,
        "n_components": request.n_components,
        "whiten": request.whiten,
        "svd_solver": request.svd_solver,
        "random_state": request.random_state
    }

