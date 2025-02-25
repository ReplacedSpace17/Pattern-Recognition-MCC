import cupy as cp
import numpy as np
import pandas as pd
from sklearn.model_selection import KFold, StratifiedKFold, LeaveOneOut
from sklearn.metrics import confusion_matrix, accuracy_score, precision_score, recall_score, f1_score
import time

class CMD_MULTICLASE_GPU:
    def __init__(self, distancia_type='euclidiana'):
        self.distancia_type = distancia_type

    def euclidean_distance(self, x1, x2):
        return cp.sqrt(cp.sum((x1 - x2) ** 2))

    def manhattan_distance(self, x1, x2):
        return cp.sum(cp.abs(x1 - x2))

    def minkowski_distance(self, x1, x2, p=3):
        return cp.sum(cp.abs(x1 - x2) ** p) ** (1/p)

    def distance(self, x1, x2):
        if self.distancia_type == 'euclidiana':
            return self.euclidean_distance(x1, x2)
        elif self.distancia_type == 'manhattan':
            return self.manhattan_distance(x1, x2)
        elif self.distancia_type == 'minkowski':
            return self.minkowski_distance(x1, x2)
        else:
            raise ValueError(f"Distancia no soportada: {self.distancia_type}")

    def minimum_distance_classifier(self, X_train, y_train, X_test):
        y_pred = []
        X_train_cp = cp.asarray(X_train)  # Convertir a CuPy array
        X_test_cp = cp.asarray(X_test)    # Convertir a CuPy array

        for test_sample in X_test_cp:
            distances = [(self.distance(test_sample, train_sample), label)
                         for train_sample, label in zip(X_train_cp, y_train)]
            min_dist_label = min(distances, key=lambda x: x[0])[1]
            y_pred.append(min_dist_label)
        return np.array(y_pred)

    def k_fold_validation(self, X, y, k=5):
        kf = KFold(n_splits=k)
        accuracy_scores = []
        for train_index, test_index in kf.split(X):
            X_train, X_test = X[train_index], X[test_index]
            y_train, y_test = y[train_index], y[test_index]
            y_pred = self.minimum_distance_classifier(X_train, y_train, X_test)
            accuracy_scores.append(accuracy_score(y_test, y_pred))
        return np.mean(accuracy_scores)

    def stratified_k_fold_validation(self, X, y, k=5):
        skf = StratifiedKFold(n_splits=k)
        accuracy_scores = []
        for train_index, test_index in skf.split(X, y):
            X_train, X_test = X[train_index], X[test_index]
            y_train, y_test = y[train_index], y[test_index]
            y_pred = self.minimum_distance_classifier(X_train, y_train, X_test)
            accuracy_scores.append(accuracy_score(y_test, y_pred))
        return np.mean(accuracy_scores)

    def leave_one_out_validation(self, X, y):
        loo = LeaveOneOut()
        accuracy_scores = []
        for train_index, test_index in loo.split(X):
            X_train, X_test = X[train_index], X[test_index]
            y_train, y_test = y[train_index], y[test_index]
            y_pred = self.minimum_distance_classifier(X_train, y_train, X_test)
            accuracy_scores.append(accuracy_score(y_test, y_pred))
        return np.mean(accuracy_scores)

    def classify(self, data, selected_features, etiquetas):
        df = pd.DataFrame(data)
        X = df[selected_features].values
        y = df[etiquetas[0]].values
        class_labels = np.unique(y)

        # Normalización de los datos en GPU
        X_cp = cp.asarray(X)  # Convertir a CuPy array
        X_mean = cp.mean(X_cp, axis=0)
        X_std = cp.std(X_cp, axis=0)
        X_normalized = (X_cp - X_mean) / X_std  # Normalización

        results = {
            'K-Folds': self.k_fold_validation(X_normalized, y),
            'Stratified K-Folds': self.stratified_k_fold_validation(X_normalized, y),
            'Leave-One-Out': self.leave_one_out_validation(X_normalized, y)
        }
        
        cp.cuda.Device(0).synchronize()
        start_time = time.time()
        y_pred = self.minimum_distance_classifier(X_normalized, y, X_normalized)
        cp.cuda.Device(0).synchronize()
        end_time = time.time()

        # Estadísticas de memoria GPU
        mem_info = cp.cuda.Device(0).mem_info
        free_mem, total_mem = mem_info
        used_mem = total_mem - free_mem

        print(f"Tiempo de ejecución: {end_time - start_time:.6f} segundos")
        print(f"Memoria GPU utilizada: {used_mem / 1e6:.2f} MB / {total_mem / 1e6:.2f} MB")

        conf_matrix = confusion_matrix(y, y_pred, labels=class_labels)
        conf_matrix_dict = {
            class_labels[i]: {class_labels[j]: int(conf_matrix[i, j]) for j in range(len(class_labels))}
            for i in range(len(class_labels))
        }

        final_results = {
            "type_classification": "multiclase",
            "tipo_distancia": self.distancia_type,
            "Sin_Prueba_Estadistica": {
                "Matriz de Confusión": conf_matrix_dict,
                "Precisión": precision_score(y, y_pred, average='weighted'),
                "Exactitud": accuracy_score(y, y_pred),
                "Sensibilidad (Recall)": recall_score(y, y_pred, average='weighted'),
                "Especificidad": f1_score(y, y_pred, average='weighted')
            },
            "K-Folds": {
                "Matriz de Confusión": conf_matrix_dict,
                "Precisión": precision_score(y, y_pred, average='weighted'),
                "Exactitud": accuracy_score(y, y_pred),
                "Sensibilidad (Recall)": recall_score(y, y_pred, average='weighted'),
                "Especificidad": f1_score(y, y_pred, average='weighted')
            },
            "Stratified K-Folds": {
                "Matriz de Confusión": conf_matrix_dict,
                "Precisión": precision_score(y, y_pred, average='weighted'),
                "Exactitud": accuracy_score(y, y_pred),
                "Sensibilidad (Recall)": recall_score(y, y_pred, average='weighted'),
                "Especificidad": f1_score(y, y_pred, average='weighted')
            },
            "Leave-One-Out": {
                "Matriz de Confusión": conf_matrix_dict,
                "Precisión": precision_score(y, y_pred, average='weighted'),
                "Exactitud": accuracy_score(y, y_pred),
                "Sensibilidad (Recall)": recall_score(y, y_pred, average='weighted'),
                "Especificidad": f1_score(y, y_pred, average='weighted')
            }
        }
        return final_results
