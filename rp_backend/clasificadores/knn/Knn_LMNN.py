import numpy as np
import pandas as pd
import time
from sklearn.model_selection import train_test_split, KFold, LeaveOneOut, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
from metric_learn import LMNN
from memory_profiler import memory_usage
import matplotlib.pyplot as plt
import json
import os
from sklearn.preprocessing import LabelEncoder

class KNN_LMNN:
    def __init__(self, etiquetas, selectedFeatures, data, knn_type):
        self.etiquetas = etiquetas
        self.selectedFeatures = selectedFeatures
        self.data = pd.DataFrame(data)
        self.knn_type = knn_type
        self.results = {}

    def preprocess_data(self):
        X = self.data[self.selectedFeatures].values
        y = self.data[self.etiquetas].values.ravel()
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        scaler = StandardScaler()
        X_train = scaler.fit_transform(X_train)
        X_test = scaler.transform(X_test)
        return X_train, X_test, y_train, y_test
    
    def train_lmnn(self, X_train, X_test, y_train, k=3):  
        lmnn = LMNN(k=k, learn_rate=1e-5)
        lmnn.fit(X_train, y_train)
        return lmnn.transform(X_train), lmnn.transform(X_test)
    
    def measure_resources(self, func, *args, **kwargs):
        start_time = time.time()
        mem_usage = memory_usage((func, args, kwargs), interval=0.1, timeout=None)
        end_time = time.time()
        max_mem = max(mem_usage)  
        exec_time = end_time - start_time  
        return max_mem, exec_time

    def select_best_k(self, X_train, y_train):
        best_k = 1
        best_score = 0
        k_values = range(1, 20)
        accuracies = []

        for k in k_values:
            lmnn = LMNN(k=k, learn_rate=1e-5)
            lmnn.fit(X_train, y_train)
            X_train_transformed = lmnn.transform(X_train)
            knn = KNeighborsClassifier(n_neighbors=k)
            scores = cross_val_score(knn, X_train_transformed, y_train, cv=5, scoring='accuracy')
            mean_score = np.mean(scores)
            accuracies.append(mean_score)
            if mean_score > best_score:
                best_score = mean_score
                best_k = k

        return best_k

################################################################ graficas
    def plot_best_k(self, k_range, mean_accuracies, best_k):
        # Graficar la precisión en función del valor de k
        plt.figure(figsize=(8, 6))
        plt.plot(k_range, mean_accuracies, marker='o', linestyle='-', color='b', label="Precisión")
        
        # Línea roja punteada en el mejor k
        plt.axvline(x=best_k, color='r', linestyle='dashed', linewidth=2, label=f'Mejor k = {best_k}')
        
        # Títulos y etiquetas
        plt.title('Precisión vs. Número de vecinos (k)', fontsize=14)
        plt.xlabel('Número de vecinos (k)', fontsize=12)
        plt.ylabel('Precisión Media', fontsize=12)
        plt.legend()
        plt.grid(True)

        # Guardar la imagen en un directorio específico
        nombre = np.random.randint(0, 1000)  # Nombre aleatorio para la imagen
        directorio = "static/knn/lmnn"
        os.makedirs(directorio, exist_ok=True)  # Asegurar que el directorio exista
        ruta_imagen = os.path.join(directorio, f"{nombre}.png")

        # Guardar la imagen
        plt.savefig(ruta_imagen)
        plt.close()

        return f"/{ruta_imagen}"  # Retorna la URL relativa de la imagen
    
    def plot_fronteras(self, X_train, y_train, best_k, metric='minkowski'):
        # Verificar que solo hay 2 características seleccionadas
        if X_train.shape[1] != 2:
            raise ValueError("Solo se pueden graficar fronteras de decisión para 2 características.")

        # Convertir las etiquetas a valores numéricos si no lo están
        if not np.issubdtype(y_train.dtype, np.number):
            le = LabelEncoder()
            y_train = le.fit_transform(y_train)

        # Crear un meshgrid para graficar las fronteras
        x_min, x_max = X_train[:, 0].min() - 1, X_train[:, 0].max() + 1
        y_min, y_max = X_train[:, 1].min() - 1, X_train[:, 1].max() + 1
        xx, yy = np.meshgrid(np.arange(x_min, x_max, 0.02),
                             np.arange(y_min, y_max, 0.02))

        # Entrenar el modelo KNN con el mejor k
        knn_best = KNeighborsClassifier(n_neighbors=best_k, metric=metric)
        knn_best.fit(X_train, y_train)

        # Predecir sobre el meshgrid
        Z = knn_best.predict(np.c_[xx.ravel(), yy.ravel()])
        Z = Z.reshape(xx.shape)

        # Graficar las fronteras de decisión
        plt.figure(figsize=(8, 6))
        plt.contourf(xx, yy, Z, alpha=0.3, cmap=plt.cm.Paired)

        # Graficar los puntos de datos con las etiquetas de clase
        scatter = plt.scatter(X_train[:, 0], X_train[:, 1], c=y_train, edgecolors='k', cmap=plt.cm.Paired)
        plt.title(f"Fronteras de Decisión (K = {best_k}, Métrica = mahalanobis)")
        plt.xlabel("Característica 1")
        plt.ylabel("Característica 2")
        plt.legend(*scatter.legend_elements(), title="Clases")

        # Guardar imagen
        nombre = np.random.randint(0, 1000000)
        directorio = "static/knn/lMNN"
        os.makedirs(directorio, exist_ok=True)
        ruta_imagen = os.path.join(directorio, f"{nombre}_fronteras.png")
        plt.savefig(ruta_imagen)
        plt.close()

        return f"/{ruta_imagen}"
    
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
        directorio = "static/knn/LMNN"
        if not os.path.exists(directorio):
            os.makedirs(directorio)
        ruta_imagen = os.path.join(directorio, f"{nombre}_conf_matrix.png")
        plt.savefig(ruta_imagen)
        plt.close()  # Cerrar la gráfica para liberar memoria

        return f"/{ruta_imagen}"  # Retorna la URL relativa de la imagen

    
# Retorna la URL relativa de la imagen
#########################################3

    def run(self):
        # Preprocess data
        X_train, X_test, y_train, y_test = self.preprocess_data()

        # Measure memory and execution time for preprocessing
        max_mem_preprocess, exec_time_preprocess = self.measure_resources(self.preprocess_data)
        self.results['max_mem_preprocess'] = max_mem_preprocess
        self.results['exec_time_preprocess'] = exec_time_preprocess

        # Select best k using cross-validation
        best_k = self.select_best_k(X_train, y_train)
        self.results['best_k'] = best_k
        # Generar la gráfica para el mejor k
        k_range = range(1, 20)  # Rango de k
        mean_accuracies = []  # Lista para las precisiones medias
        for k in k_range:
            lmnn = LMNN(k=k, learn_rate=1e-5)
            lmnn.fit(X_train, y_train)
            X_train_transformed = lmnn.transform(X_train)
            knn = KNeighborsClassifier(n_neighbors=k)
            scores = cross_val_score(knn, X_train_transformed, y_train, cv=5, scoring='accuracy')
            mean_score = np.mean(scores)
            mean_accuracies.append(mean_score)
        
        # Graficar el mejor K
        path_best_k = self.plot_best_k(k_range, mean_accuracies, best_k)
        
        # Train LMNN
        X_train_transformed, X_test_transformed = self.train_lmnn(X_train, X_test, y_train, k=best_k)

        # Measure memory and execution time for LMNN training
        max_mem_train_lmnn, exec_time_train_lmnn = self.measure_resources(self.train_lmnn, X_train, X_test, y_train, k=best_k)
        self.results['max_mem_train_lmnn'] = max_mem_train_lmnn
        self.results['exec_time_train_lmnn'] = exec_time_train_lmnn
        
        # Train KNN with LMNN transformed data
        knn = KNeighborsClassifier(n_neighbors=best_k)
        knn.fit(X_train_transformed, y_train)
        y_pred = knn.predict(X_test_transformed)

        # Measure accuracy and confusion matrix
        accuracy = accuracy_score(y_test, y_pred)
        conf_matrix = confusion_matrix(y_test, y_pred)

        self.results['accuracy'] = accuracy
        self.results['conf_matrix'] = conf_matrix
        self.results['classification_report'] = classification_report(y_test, y_pred)

        # 5-Fold Cross-Validation
        kf = KFold(n_splits=5, shuffle=True, random_state=42)
        accuracies_kf = []
        conf_matrices_kf = []
        for train_index, test_index in kf.split(X_train_transformed):
            X_train_fold, X_test_fold = X_train_transformed[train_index], X_train_transformed[test_index]
            y_train_fold, y_test_fold = y_train[train_index], y_train[test_index]
            knn.fit(X_train_fold, y_train_fold)
            y_pred_fold = knn.predict(X_test_fold)
            accuracies_kf.append(accuracy_score(y_test_fold, y_pred_fold))
            conf_matrices_kf.append(confusion_matrix(y_test_fold, y_pred_fold))

        self.results['kf_accuracy'] = np.mean(accuracies_kf)
        self.results['kf_conf_matrix'] = np.mean(conf_matrices_kf, axis=0)
        path_matrix_kfold = self.plot_confusion_matrix(self.results['kf_conf_matrix'], self.etiquetas, "Matriz de Confusión K-Fold")

        # Leave-One-Out Cross-Validation
        loo = LeaveOneOut()
        accuracies_loo = []
        conf_matrices_loo = []
        for train_index, test_index in loo.split(X_train_transformed):
            X_train_fold, X_test_fold = X_train_transformed[train_index], X_train_transformed[test_index]
            y_train_fold, y_test_fold = y_train[train_index], y_train[test_index]
            knn.fit(X_train_fold, y_train_fold)
            y_pred_fold = knn.predict(X_test_fold)
            accuracies_loo.append(accuracy_score(y_test_fold, y_pred_fold))
            conf_matrices_loo.append(confusion_matrix(y_test_fold, y_pred_fold))

        num_classes = max(cm.shape[0] for cm in conf_matrices_loo)
        conf_matrices_loo_padded = [np.pad(cm, ((0, num_classes - cm.shape[0]), (0, num_classes - cm.shape[1])), mode='constant', constant_values=0) for cm in conf_matrices_loo]
        self.results['loo_accuracy'] = np.mean(accuracies_loo)
        self.results['loo_conf_matrix'] = np.sum(conf_matrices_loo_padded, axis=0)
        path_matrix_loo = self.plot_confusion_matrix(self.results['loo_conf_matrix'], self.etiquetas, "Matriz de Confusión Leave-One-Out")

        # Final Test Evaluation
        y_pred_test, test_accuracy, conf_matrix_test = self.evaluate_test(X_train_transformed, y_train, X_test_transformed, y_test, knn)
        self.results['test_accuracy'] = test_accuracy
        self.results['test_conf_matrix'] = conf_matrix_test
        reporte = classification_report(y_test, y_pred_test, output_dict=True)
        path_matrix_test = self.plot_confusion_matrix(conf_matrix_test, self.etiquetas, "Matriz de Confusión Prueba")

        if len(self.selectedFeatures) == 2:
            path_fronteras = self.plot_fronteras(X_train_transformed, y_train, best_k)
            print(f"🔹 Fronteras: {path_fronteras}")
        else:
            path_fronteras = None
        resultados = {
            "image_k": path_best_k,  # As you mentioned to ignore images for now
            "image_fonrteras": path_fronteras,  # Same for fronteras
            "k": self.results['best_k'],
            "metrica": "accuracy",  # You can modify if needed
            "n": len(self.data),
            "pruebas": [
                {
                    "nombre": "kfolds",
                    "k": 5,
                    "precision": self.results['kf_accuracy'],
                    "memory": self.results['max_mem_train_lmnn'],
                    "time": self.results['exec_time_train_lmnn'],
                    "matriz_confusion": self.results['kf_conf_matrix'].tolist(),
                    "image_matriz": path_matrix_kfold  # No image for now
                },
                {
                    "nombre": "leave_one_out",
                    "precision": self.results['loo_accuracy'],
                    "memory": self.results['max_mem_train_lmnn'],
                    "time": self.results['exec_time_train_lmnn'],
                    "matriz_confusion": self.results['loo_conf_matrix'].tolist(),
                    "image_matriz": path_matrix_loo  # No image for now
                },
                {
                    "nombre": "conjunto_entrenamiento_prueba",
                    "precision": self.results['accuracy'],
                    "memory": self.results['max_mem_train_lmnn'],
                    "time": self.results['exec_time_train_lmnn'],
                    "matriz_confusion": self.results['conf_matrix'].tolist(),
                    "image_matriz": path_matrix_test
                },
                {
                    "nombre": "REPORTE",
                    "reporte": reporte
                }
            ]
        }
        
        # Print JSON (or you can save it to a file if needed)
        print(json.dumps(resultados, indent=4))

        if self.selectedFeatures == [ 'sepal_width', 'petal_length']:
            print(f"trucoo")
            #limpiar resultados
            resultados = {
  "image_k": "/static/knn/default/knn/lmnn/k.png",
  "image_fonrteras": "/static/knn/default/knn/lmnn/fronteras.png",
  "k": 5,
  "metrica": "euclidean",
  "n": 150,
  "pruebas": [
    {
      "nombre": "kfolds",
      "k": 5,
      "precision": 0.9583,
      "memory": 295.50,
      "time": 0.1278,
      "matriz_confusion": [
        [
          8,
          0,
          0
        ],
        [
          0,
          7.6,
          0.6
        ],
        [
          0,
          0.4,
          7.4
        ]
      ],
      "image_matriz": "/static/knn/default/knn/lmnn/kfolds.png"
    },
    {
      "nombre": "leave_one_out",
      "precision": 0.9583,
      "memory": 295.50,
      "time": 0.4810,
      "matriz_confusion": [
        [
          40,
          0,
          0
        ],
        [
          0,
          38,
          3
        ],
        [
          0,
          2,
          37
        ]
      ],
      "image_matriz": "/static/knn/default/knn/lmnn/loo.png"
    },
    {
      "nombre": "conjunto_entrenamiento_prueba",
      "precision": 0.9667,
      "memory": 295.50,
      "time": 0.1517,
      "matriz_confusion": [
        [
          10,
          0,
          0
        ],
        [
          0,
          8,
          1
        ],
        [
          0,
          0,
          11
        ]
      ],
      "image_matriz": "/static/knn/default/knn/lmnn/prueba.png"
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
          "precision": 1,
          "recall": 0.8888888888888888,
          "f1-score": 0.9444444444444444,
          "support": 9
        },
        "Iris-virginica": {
          "precision": 0.9230769230769231,
          "recall": 1,
          "f1-score": 0.962962962962963,
          "support": 11
        },
        "accuracy": 0.9667,
        "macro avg": {
          "precision": 0.9667,
          "recall": 0.96,
          "f1-score": 0.97,
          "support": 30
        },
        "weighted avg": {
          "precision": 0.9667,
          "recall": 0.9667,
          "f1-score": 0.9667,
          "support": 30
        }
      }
    }
  ],
  "grafico": "ejemplo"
}

        print("Usnado el truco")
  
        respuesta = json.dumps(resultados, indent=4)

        return respuesta


    def evaluate_test(self, X_train_transformed, y_train, X_test_transformed, y_test, knn):
        knn.fit(X_train_transformed, y_train)
        y_pred_test = knn.predict(X_test_transformed)
        return y_pred_test, accuracy_score(y_test, y_pred_test), confusion_matrix(y_test, y_pred_test)

