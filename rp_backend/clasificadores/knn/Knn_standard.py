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


class KNN_STANDARD:
    def __init__(self, distancia_type, etiquetas, selectedFeatures, data, knn_type):
        print("Se inició el clasificador KNN normal")
        self.distancia_type = distancia_type
        self.etiquetas = etiquetas
        self.selectedFeatures = selectedFeatures
        self.data = pd.DataFrame(data)  # Convertir la lista de dicci.onarios a DataFrame
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
    

    def generar_grafico(self, datos, nombre):
        plt.figure(figsize=(6, 4))
        plt.plot(range(1, len(datos) + 1), datos, marker='o', linestyle='-', color='b')
        plt.xlabel("K")
        plt.ylabel("Precisión")
        plt.title(f"Precisión en función de K - {nombre}")
        plt.grid()

        # Crear carpeta si no existe
        directorio = "static/knn/knn_normal"
        if not os.path.exists(directorio):
            os.makedirs(directorio)

        # Guardar imagen
        ruta_imagen = os.path.join(directorio, f"{nombre}.png")
        plt.savefig(ruta_imagen)
        plt.close()
        return f"/{ruta_imagen}"  # Retorna la URL relativa de la imagen 
    


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

        # Evaluación K-Folds
        max_mem_kfold, exec_time_kfold = self.measure_resources(self.evaluate_kfold)
        kf_accuracy, avg_kf_conf_matrix, kf_accuracies = self.evaluate_kfold()
        print(f"\n📌 Validación K-Folds (5 folds)")
        print(f"Precisión Promedio: {kf_accuracy:.4f} ± {np.std(kf_accuracies):.4f}")
        print(f"Uso máximo de memoria en K-Folds: {max_mem_kfold:.2f} MB")
        print(f"Tiempo de ejecución: {exec_time_kfold:.4f} segundos")
        print("\nMatriz de Confusión Promedio (K-Folds):")
        print(avg_kf_conf_matrix)

        # Evaluación Leave-One-Out (LOO)
        max_mem_loo, exec_time_loo = self.measure_resources(self.evaluate_loo)
        loo_accuracy, avg_loo_conf_matrix, loo_accuracies = self.evaluate_loo()
        print(f"\n📌 Validación Leave-One-Out (LOO)")
        print(f"Precisión Promedio: {loo_accuracy:.4f} ± {np.std(loo_accuracies):.4f}")
        print(f"Uso máximo de memoria en LOO: {max_mem_loo:.2f} MB")
        print(f"Tiempo de ejecución: {exec_time_loo:.4f} segundos")
        print("\nMatriz de Confusión Promedio (LOO):")
        print(avg_loo_conf_matrix)

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

        # Reporte de Clasificación
        print("\nReporte de Clasificación (Prueba):")
        report = classification_report(y_test, y_test_pred, output_dict=True)
        print(classification_report(y_test, y_test_pred))  # Corregido
        print("Metrica de distancia:", self.metrica)

        # Construir el JSON
        resultados = {
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
                    "matriz_confusion": avg_kf_conf_matrix.tolist()
                },
                {
                    "nombre": "leave_one_out",
                    "precision": loo_accuracy,
                    "memory": max_mem_loo,
                    "time": exec_time_loo,
                    "matriz_confusion": avg_loo_conf_matrix.tolist()
                },
                {
                    "nombre": "conjunto_entrenamiento_prueba",
                    "precision": test_accuracy,
                    "memory": max_mem_test,
                    "time": exec_time_test,
                    "matriz_confusion": test_conf_matrix.tolist()
                },
                {
                    "nombre": "REPORTE",
                    "reporte": report
                }
            ]
        }

        #generar un nombre aleatorio para la imagen
        nombre_aleatorio = str(time.time())
        image_example = self.generar_grafico([1,2, 2,3 ,4, 4, 5], nombre_aleatorio)
        print(image_example)
        # Convertir a JSON
        resultados_json = json.dumps(resultados, indent=4)
        return resultados_json


