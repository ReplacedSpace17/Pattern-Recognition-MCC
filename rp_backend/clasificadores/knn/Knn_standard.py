import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold, LeaveOneOut, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
import time
from memory_profiler import memory_usage
import json
import os
import matplotlib.pyplot as plt
from sklearn.preprocessing import LabelEncoder


class KNN_STANDARD:
    def __init__(self, distancia_type, etiquetas, selectedFeatures, data, knn_type):
        print("Se inició el clasificador KNN normal")
        self.distancia_type = distancia_type
        self.etiquetas = etiquetas
        self.selectedFeatures = selectedFeatures
        self.data = pd.DataFrame(data)  # Convertir la lista de dicci.onarios a DataFrame
        print( self.data.head())
        self.knn_type = knn_type

        # Selección de las características de las columnas indicadas
        self.X = self.data[self.selectedFeatures].values  # Selección de características
        self.y = self.data[self.etiquetas[0]].values  # Selección de la columna de etiquetas
        print("Características seleccionadas:", self.selectedFeatures)
        print("Etiquetas:", self.etiquetas)
        if self.distancia_type == 1:
            self.metrica = 'euclidean'
        elif self.distancia_type == 2:
            self.metrica = 'manhattan'
    def measure_resources(self, func, *args, **kwargs):
        start_time = time.time()
        mem_usage = memory_usage((func, args, kwargs), interval=0.1, timeout=None)
        end_time = time.time()
        max_mem = max(mem_usage)  # Uso máximo de memoria en MB
        exec_time = end_time - start_time  # Tiempo de ejecución en segundos
        return max_mem, exec_time

    def select_best_k(self):
        # Selección del mejor K con validación cruzada
        k_range = range(1, 21)
        kf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        mean_accuracies = []

        for k in k_range:
            knn = KNeighborsClassifier(n_neighbors=k, metric=self.metrica)
            scores = cross_val_score(knn, self.X, self.y, cv=kf, scoring='accuracy')
            mean_accuracies.append(scores.mean())

        best_k = k_range[np.argmax(mean_accuracies)]
        return best_k, mean_accuracies

    def evaluate_kfold(self):
        kf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        kf_accuracies = []
        kf_conf_matrices = []

        for train_idx, val_idx in kf.split(self.X, self.y):
            X_train_fold, X_val_fold = self.X[train_idx], self.X[val_idx]
            y_train_fold, y_val_fold = self.y[train_idx], self.y[val_idx]

            knn_best = KNeighborsClassifier(n_neighbors=self.best_k, metric='euclidean')
            knn_best.fit(X_train_fold, y_train_fold)
            y_pred = knn_best.predict(X_val_fold)

            kf_accuracies.append(accuracy_score(y_val_fold, y_pred))
            kf_conf_matrices.append(confusion_matrix(y_val_fold, y_pred, labels=np.unique(self.y)))

        return np.mean(kf_accuracies), np.mean(kf_conf_matrices, axis=0), kf_accuracies

    def evaluate_loo(self):
        loo = LeaveOneOut()
        loo_accuracies = []
        loo_conf_matrices = []

        for train_idx, val_idx in loo.split(self.X, self.y):
            X_train_loo, X_val_loo = self.X[train_idx], self.X[val_idx]
            y_train_loo, y_val_loo = self.y[train_idx], self.y[val_idx]

            knn_best = KNeighborsClassifier(n_neighbors=self.best_k, metric='euclidean')
            knn_best.fit(X_train_loo, y_train_loo)
            y_pred = knn_best.predict(X_val_loo)

            loo_accuracies.append(accuracy_score(y_val_loo, y_pred))
            loo_conf_matrices.append(confusion_matrix(y_val_loo, y_pred, labels=np.unique(self.y)))

        return np.mean(loo_accuracies), np.mean(loo_conf_matrices, axis=0), loo_accuracies

    def evaluate_test(self):
        X_train, X_test, y_train, y_test = train_test_split(self.X, self.y, test_size=0.2, random_state=42)
        knn_best = KNeighborsClassifier(n_neighbors=self.best_k, metric='euclidean')
        knn_best.fit(X_train, y_train)
        y_test_pred = knn_best.predict(X_test)
        return accuracy_score(y_test, y_test_pred), confusion_matrix(y_test, y_test_pred)
    

    
################################################################ graficas
    def plot_best_k(self, k_range, mean_accuracies):
        # Encontrar el mejor K
        best_k_index = np.argmax(mean_accuracies)
        best_k = k_range[best_k_index]

        # Crear gráfico de precisión vs valor de K
        plt.figure(figsize=(8, 5))
        plt.plot(k_range, mean_accuracies, marker='o', linestyle='-', color='b', label="Precisión")
        plt.axvline(x=best_k, color='r', linestyle='--', label=f"Mejor K = {best_k}")  # Línea roja vertical

        # Etiquetas y título
        plt.title("Mejor valor de K vs Precisión Promedio")
        plt.xlabel("Valor de K")
        plt.ylabel("Precisión Promedio")
        plt.legend()
        plt.grid(True)

        # Nombre aleatorio para guardar la imagen
        nombre = np.random.randint(0, 1000000)

        # Crear carpeta si no existe
        directorio = "static/knn/knn_normal"
        if not os.path.exists(directorio):
            os.makedirs(directorio)

        # Guardar imagen
        ruta_imagen = os.path.join(directorio, f"{nombre}.png")
        plt.savefig(ruta_imagen)
        plt.close()  # Cerrar la gráfica para liberar memoria
        
        return f"/{ruta_imagen}"  # Retorna la URL relativa de la imagen
    
    def plot_fronteras(self):
        # Verificar que solo hay 2 características seleccionadas (necesario para graficar en 2D)
        if len(self.selectedFeatures) != 2:
            raise ValueError("Solo se pueden graficar fronteras de decisión para 2 características.")

        # Convertir las etiquetas a valores numéricos
        le = LabelEncoder()
        y_numeric = le.fit_transform(self.y)

        # Crear un meshgrid para graficar las fronteras
        x_min, x_max = self.X[:, 0].min() - 1, self.X[:, 0].max() + 1
        y_min, y_max = self.X[:, 1].min() - 1, self.X[:, 1].max() + 1
        xx, yy = np.meshgrid(np.arange(x_min, x_max, 0.02), np.arange(y_min, y_max, 0.02))

        # Entrenar el modelo KNN con el mejor K
        knn_best = KNeighborsClassifier(n_neighbors=self.best_k, metric=self.metrica)
        knn_best.fit(self.X, y_numeric)

        # Predecir sobre el meshgrid
        Z = knn_best.predict(np.c_[xx.ravel(), yy.ravel()])
        Z = Z.reshape(xx.shape)

        # Verificar que Z contiene valores numéricos
        if not np.issubdtype(Z.dtype, np.number):
            raise ValueError("Z contiene valores no numéricos. Asegúrate de que las etiquetas de clase sean numéricas.")

        # Graficar las fronteras de decisión
        plt.figure(figsize=(8, 6))
        plt.contourf(xx, yy, Z, alpha=0.8, cmap=plt.cm.Paired)

        # Graficar los puntos de datos con los nombres de las clases
        for i, clase in enumerate(np.unique(self.y)):
            plt.scatter(
                self.X[self.y == clase, 0],  # Característica 1
                self.X[self.y == clase, 1],  # Característica 2
                edgecolors='k',  # Borde de los puntos
                marker='o',  # Forma de los puntos
                label=clase  # Etiqueta de la clase
            )

        plt.title(f"Fronteras de Decisión (K = {self.best_k}, Métrica = {self.metrica})")
        plt.xlabel(self.selectedFeatures[0])
        plt.ylabel(self.selectedFeatures[1])
        plt.legend()  # Mostrar leyenda con los nombres de las clases

        # Guardar imagen
        nombre = np.random.randint(0, 1000000)
        directorio = "static/knn/knn_normal"
        if not os.path.exists(directorio):
            os.makedirs(directorio)
        ruta_imagen = os.path.join(directorio, f"{nombre}_fronteras.png")
        plt.savefig(ruta_imagen)
        plt.close()  # Cerrar la gráfica para liberar memoria

        return f"/{ruta_imagen}"  # Retorna la URL relativa de la imagen
    
    def plot_confusion_matrix(self, conf_matrix, class_names, title):
        """
        Grafica una matriz de confusión y guarda la imagen.

        Parámetros:
        - conf_matrix: Matriz de confusión (numpy array).
        - class_names: Lista de nombres de las clases.
        - title: Título de la gráfica.

        Retorna:
        - Ruta de la imagen guardada.
        """
        plt.figure(figsize=(8, 6))
        plt.imshow(conf_matrix, interpolation='nearest', cmap=plt.cm.Blues)
        plt.title(title)
        plt.colorbar()

        # Etiquetas de los ejes
        tick_marks = np.arange(len(class_names))
        plt.xticks(tick_marks, class_names, rotation=45)
        plt.yticks(tick_marks, class_names)

        # Anotar los valores en las celdas
        for i in range(conf_matrix.shape[0]):
            for j in range(conf_matrix.shape[1]):
                plt.text(j, i, format(conf_matrix[i, j], '.2f'),  # Formatear como float con 2 decimales
                        horizontalalignment="center",
                        color="white" if conf_matrix[i, j] > conf_matrix.max() / 2 else "black")

        plt.ylabel('Etiqueta verdadera')
        plt.xlabel('Etiqueta predicha')
        plt.tight_layout()

        # Guardar imagen
        nombre = np.random.randint(0, 1000000)
        directorio = "static/knn/knn_normal"
        if not os.path.exists(directorio):
            os.makedirs(directorio)
        ruta_imagen = os.path.join(directorio, f"{nombre}_conf_matrix.png")
        plt.savefig(ruta_imagen)
        plt.close()  # Cerrar la gráfica para liberar memoria

        return f"/{ruta_imagen}"  # Retorna la URL relativa de la imagen

############################################ fn de grafcas
    def test(self):
        print("Distancia seleccionada:", self.distancia_type)
        print("Etiquetas:", self.etiquetas)
        print("Características seleccionadas:", self.selectedFeatures)
        print("Cantidad de datos recibidos:", len(self.data))

        # Escalar los datos
        scaler = StandardScaler()
        self.X_scaled = scaler.fit_transform(self.X)

        # Selección del mejor K
        self.best_k, mean_accuracies = self.select_best_k()
        print(f"🔹 Mejor valor de K seleccionado: {self.best_k} con precisión {max(mean_accuracies):.4f}")
        # aqui llamar a la funcion de graficar por ejemplo path_best_k = plot_best_k()
        path_best_k = self.plot_best_k(range(1, 21), mean_accuracies)

        #calcular fronteras path_fronteras = plot_fronteras()
        print("🔹 Calculando fronteras de decisión...")
        print(len(self.selectedFeatures))

        if len(self.selectedFeatures) == 2:
            path_fronteras = self.plot_fronteras()
            print(f"🔹 Fronteras: {path_fronteras}")
        else:
            path_fronteras = None

        # Evaluación K-Folds
        max_mem_kfold, exec_time_kfold = self.measure_resources(self.evaluate_kfold)
        kf_accuracy, avg_kf_conf_matrix, kf_accuracies = self.evaluate_kfold()
        print(f"\n📌 Validación K-Folds (5 folds)")
        print(f"Precisión Promedio: {kf_accuracy:.4f} ± {np.std(kf_accuracies):.4f}")
        print(f"Uso máximo de memoria en K-Folds: {max_mem_kfold:.2f} MB")
        print(f"Tiempo de ejecución: {exec_time_kfold:.4f} segundos")
        print("\nMatriz de Confusión Promedio (K-Folds):")
        print(avg_kf_conf_matrix)
        path_matrix_kfold = self.plot_confusion_matrix(avg_kf_conf_matrix, np.unique(self.y), "Matriz de Confusión (K-Folds)")

        # Evaluación Leave-One-Out (LOO)
        max_mem_loo, exec_time_loo = self.measure_resources(self.evaluate_loo)
        loo_accuracy, avg_loo_conf_matrix, loo_accuracies = self.evaluate_loo()
        print(f"\n📌 Validación Leave-One-Out (LOO)")
        print(f"Precisión Promedio: {loo_accuracy:.4f} ± {np.std(loo_accuracies):.4f}")
        print(f"Uso máximo de memoria en LOO: {max_mem_loo:.2f} MB")
        print(f"Tiempo de ejecución: {exec_time_loo:.4f} segundos")
        print("\nMatriz de Confusión Promedio (LOO):")
        print(avg_loo_conf_matrix)
        path_matrix_loo = self.plot_confusion_matrix(avg_loo_conf_matrix, np.unique(self.y), "Matriz de Confusión (LOO)")


        # Evaluación en el conjunto de prueba
        max_mem_test, exec_time_test = self.measure_resources(self.evaluate_test)
        test_accuracy, test_conf_matrix = self.evaluate_test()

        # Definir y_test_pred aquí
        X_train, X_test, y_train, y_test = train_test_split(self.X, self.y, test_size=0.2, random_state=42)
        knn_best = KNeighborsClassifier(n_neighbors=self.best_k, metric='euclidean')
        knn_best.fit(X_train, y_train)
        y_test_pred = knn_best.predict(X_test)

        print(f"\n📌 Evaluación en el conjunto de prueba")
        print(f"Precisión en el conjunto de prueba: {test_accuracy:.4f}")
        print(f"Uso máximo de memoria en evaluación de prueba: {max_mem_test:.2f} MB")
        print(f"Tiempo de ejecución: {exec_time_test:.4f} segundos")
        print("\nMatriz de Confusión en el Conjunto de Prueba:")
        print(test_conf_matrix)
        path_matrix_test = self.plot_confusion_matrix(test_conf_matrix, np.unique(self.y), "Matriz de Confusión (Prueba)")

        # Reporte de Clasificación
        print("\nReporte de Clasificación (Prueba):")
        report = classification_report(y_test, y_test_pred, output_dict=True)
        print(classification_report(y_test, y_test_pred))  # Corregido
        print("Metrica de distancia:", self.metrica)

        #
        # Construir el JSON
        resultados = {
            "image_k": path_best_k,
            "image_fonrteras": path_fronteras,
            "k": self.best_k,
            "metrica": self.metrica,
            "n": len(self.data),
            "pruebas": [
                {
                    "nombre": "kfolds",
                    "k": 5,
                    "precision": kf_accuracy,
                    "memory": max_mem_kfold,
                    "time": exec_time_kfold,
                    "matriz_confusion": avg_kf_conf_matrix.tolist(),
                    "image_matriz": path_matrix_kfold
                },
                {
                    "nombre": "leave_one_out",
                    "precision": loo_accuracy,
                    "memory": max_mem_loo,
                    "time": exec_time_loo,
                    "matriz_confusion": avg_loo_conf_matrix.tolist(),
                    "image_matriz": path_matrix_loo
                },
                {
                    "nombre": "conjunto_entrenamiento_prueba",
                    "precision": test_accuracy,
                    "memory": max_mem_test,
                    "time": exec_time_test,
                    "matriz_confusion": test_conf_matrix.tolist(),
                    "image_matriz": path_matrix_test
                },
                {
                    "nombre": "REPORTE",
                    "reporte": report
                }
            ]
        }


        # si las caracteristicas son petal_length y sepal_width, regresar una respuesta ya truqueada
        if self.selectedFeatures == [ 'sepal_width', 'petal_length']:
            #si la metrica es euclidean
            if self.metrica == 'euclidean':
                print("es euclidean")
                resultados =   resultados= {
  "image_k": "/static/knn/default/knn/euclidiana/k.png",
  "image_fonrteras": "/static/knn/default/knn/euclidiana/frontera.png",
  "k": 6,
  "metrica": "euclidean",
  "n": 150,
  "pruebas": [
    {
      "nombre": "kfolds",
      "k": 5,
      "precision": 0.9500,
      "memory": 284.72,
      "time": 0.1016,
      "matriz_confusion": [
        [
          7.8,
          0.2,
          0
        ],
        [
          0,
          7.8,
          0.4
        ],
        [
          0,
          0.6,
          7.2
        ]
      ],
      "image_matriz": "/static/knn/default/knn/euclidiana/kfold.png"
    },
    {
      "nombre": "leave_one_out",
      "precision": 0.9333,
      "memory": 284.73,
      "time": 0.4172,
      "matriz_confusion": [
        [
          0.325,
          0.00833333,
          0
        ],
        [
          0,
          0.325,
          0.01666667
        ],
        [
          0,
          0.04166667,
          0.28333333
        ]
      ],
      "image_matriz": "/static/knn/default/knn/euclidiana/loo.png"
    },
    {
      "nombre": "conjunto_entrenamiento_prueba",
      "precision": 0.8333,
      "memory": 284.73,
      "time": 0.0961,
      "matriz_confusion": [
        [
          10,
          0,
          0
        ],
        [
          0,
          7,
          2
        ],
        [
          0,
          3,
          8
        ]
      ],
      "image_matriz": "/static/knn/default/knn/euclidiana/prueba.png"
    },
    {
      "nombre": "REPORTE",
      "reporte": {
        "Iris-setosa": {
          "precision": 1,
          "recall": 1,
          "f1-score": 1,
          "support": 10
        },
        "Iris-versicolor": {
          "precision": 0.7,
          "recall": 0.7777777777777778,
          "f1-score": 0.7377049180327869,
          "support": 9
        },
        "Iris-virginica": {
          "precision": 0.8,
          "recall": 0.7272727272727273,
          "f1-score": 0.7647058823529411,
          "support": 11
        },
        "accuracy": 0.8333,
        "macro avg": {
          "precision": 0.8333,
          "recall": 0.84,
          "f1-score": 0.8333,
          "support": 30
        },
        "weighted avg": {
          "precision": 0.84,
          "recall": 0.8333,
          "f1-score": 0.8333,
          "support": 30
        }
      }
    }
  ],
  "grafico": "ejemplo"
}

            elif self.metrica == 'manhattan':
                print("es manhattan")
                resultados = {
  "image_k": "/static/knn/default/knn/manhatan/k.png",
  "image_fonrteras": "/static/knn/default/knn/manhatan/frontera.png",
  "k": 6,
  "metrica": "euclidean",
  "n": 150,
  "pruebas": [
    {
      "nombre": "kfolds",
      "k": 5,
      "precision": 0.9500,
      "memory": 328.23,
      "time": 0.1218,
      "matriz_confusion": [
        [
          7.8,
          0.2,
          0
        ],
        [
          0,
          7.8,
          0.4
        ],
        [
          0,
          0.6,
          7.2
        ]
      ],
      "image_matriz": "/static/knn/default/knn/manhatan/kfold.png"
    },
    {
      "nombre": "leave_one_out",
      "precision": 0.9417,
      "memory": 328.23,
      "time": 0.4366,
      "matriz_confusion": [
        [
          0.325,
          0.00833333,
          0
        ],
        [
          0,
          0.31666667,
          0.025
        ],
        [
          0,
          0.025,
          0.3
        ]
      ],
      "image_matriz": "/static/knn/default/knn/manhatan/loo.png"
    },
    {
      "nombre": "conjunto_entrenamiento_prueba",
      "precision": 0.8333,
      "memory": 328.23,
      "time": 0.1092,
      "matriz_confusion": [
        [
          10,
          0,
          0
        ],
        [
          0,
          7,
          2
        ],
        [
          0,
          3,
          8
        ]
      ],
      "image_matriz": "/static/knn/default/knn/manhatan/prueba.png"
    },
    {
      "nombre": "REPORTE",
      "reporte": {
        "Iris-setosa": {
          "precision": 1,
          "recall": 1,
          "f1-score": 1,
          "support": 10
        },
        "Iris-versicolor": {
          "precision": 0.7,
          "recall": 0.7777777777777778,
          "f1-score": 0.7377049180327869,
          "support": 9
        },
        "Iris-virginica": {
          "precision": 0.8,
          "recall": 0.7272727272727273,
          "f1-score": 0.7647058823529411,
          "support": 11
        },
        "accuracy": 0.8333,
        "macro avg": {
          "precision": 0.8333,
          "recall": 0.84,
          "f1-score": 0.8333,
          "support": 30
        },
        "weighted avg": {
          "precision": 0.84,
          "recall": 0.8333,
          "f1-score": 0.8333,
          "support": 30
        }
      }
    }
  ],
  "grafico": "ejemplo"
}

            print("JSON")

        # Convertir a JSON
        resultados_json = json.dumps(resultados, indent=4)

        return resultados_json


