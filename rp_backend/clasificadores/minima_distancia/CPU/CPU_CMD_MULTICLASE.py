import numpy as np
import pandas as pd
from sklearn.model_selection import KFold, StratifiedKFold, LeaveOneOut
from sklearn.metrics import confusion_matrix, accuracy_score, precision_score, recall_score, f1_score
from sklearn.preprocessing import StandardScaler
import time
import resource  # Para medir el uso de recursos en sistemas Unix-like
import psutil  # Para medir el uso de recursos en sistemas multiplataforma

class CMD_MULTICLASE_CPU:
    def __init__(self, distancia_type='euclidiana'):
        self.distancia_type = distancia_type

    def euclidean_distance(self, x1, x2):
        return np.sqrt(np.sum((x1 - x2) ** 2))

    def manhattan_distance(self, x1, x2):
        return np.sum(np.abs(x1 - x2))

    def minkowski_distance(self, x1, x2, p=3):
        return np.sum(np.abs(x1 - x2) ** p) ** (1/p)

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
        for test_sample in X_test:
            distances = [(self.distance(test_sample, train_sample), label)
                         for train_sample, label in zip(X_train, y_train)]
            min_dist_label = min(distances, key=lambda x: x[0])[1]
            y_pred.append(min_dist_label)
        return np.array(y_pred)

    def k_fold_validation(self, X, y, k=5):
        start_time = time.time()
        kf = KFold(n_splits=k)
        accuracy_scores = []
        for train_index, test_index in kf.split(X):
            X_train, X_test = X[train_index], X[test_index]
            y_train, y_test = y[train_index], y[test_index]
            y_pred = self.minimum_distance_classifier(X_train, y_train, X_test)
            accuracy_scores.append(accuracy_score(y_test, y_pred))
        end_time = time.time()
        return np.mean(accuracy_scores), end_time - start_time

    def stratified_k_fold_validation(self, X, y, k=5):
        start_time = time.time()
        skf = StratifiedKFold(n_splits=k)
        accuracy_scores = []
        for train_index, test_index in skf.split(X, y):
            X_train, X_test = X[train_index], X[test_index]
            y_train, y_test = y[train_index], y[test_index]
            y_pred = self.minimum_distance_classifier(X_train, y_train, X_test)
            accuracy_scores.append(accuracy_score(y_test, y_pred))
        end_time = time.time()
        return np.mean(accuracy_scores), end_time - start_time

    def leave_one_out_validation(self, X, y):
        start_time = time.time()
        loo = LeaveOneOut()
        accuracy_scores = []
        for train_index, test_index in loo.split(X):
            X_train, X_test = X[train_index], X[test_index]
            y_train, y_test = y[train_index], y[test_index]
            y_pred = self.minimum_distance_classifier(X_train, y_train, X_test)
            accuracy_scores.append(accuracy_score(y_test, y_pred))
        end_time = time.time()
        return np.mean(accuracy_scores), end_time - start_time

    def get_resource_usage(self):
        # Uso de memoria en bytes
        memory_usage_bytes = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
        # Convertir a MB
        memory_usage_mb = memory_usage_bytes / (1024 * 1024)
        # Uso de CPU en segundos
        cpu_usage = resource.getrusage(resource.RUSAGE_SELF).ru_utime + resource.getrusage(resource.RUSAGE_SELF).ru_stime
        return memory_usage_mb, cpu_usage

    def classify(self, data, selected_features, etiquetas):
        df = pd.DataFrame(data)
        X = df[selected_features].values
        y = df[etiquetas[0]].values
        class_labels = np.unique(y)

        # Normalización de las características seleccionadas (solo las columnas numéricas)
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        # Medir tiempo y recursos para K-Fold
        k_fold_accuracy, k_fold_time = self.k_fold_validation(X_scaled, y)
        k_fold_memory, k_fold_cpu = self.get_resource_usage()

        # Medir tiempo y recursos para Stratified K-Fold
        stratified_k_fold_accuracy, stratified_k_fold_time = self.stratified_k_fold_validation(X_scaled, y)
        stratified_k_fold_memory, stratified_k_fold_cpu = self.get_resource_usage()

        # Medir tiempo y recursos para Leave-One-Out
        loo_accuracy, loo_time = self.leave_one_out_validation(X_scaled, y)
        loo_memory, loo_cpu = self.get_resource_usage()

        y_pred = self.minimum_distance_classifier(X_scaled, y, X_scaled)
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
                "Exactitud": k_fold_accuracy,
                "Sensibilidad (Recall)": recall_score(y, y_pred, average='weighted'),
                "Especificidad": f1_score(y, y_pred, average='weighted'),
                "Tiempo de Procesamiento (s)": k_fold_time,
                "Uso de Memoria (MB)": k_fold_memory,  # Memoria en MB
                "Uso de CPU (s)": k_fold_cpu
            },
            "Stratified K-Folds": {
                "Matriz de Confusión": conf_matrix_dict,
                "Precisión": precision_score(y, y_pred, average='weighted'),
                "Exactitud": stratified_k_fold_accuracy,
                "Sensibilidad (Recall)": recall_score(y, y_pred, average='weighted'),
                "Especificidad": f1_score(y, y_pred, average='weighted'),
                "Tiempo de Procesamiento (s)": stratified_k_fold_time,
                "Uso de Memoria (MB)": stratified_k_fold_memory,  # Memoria en MB
                "Uso de CPU (s)": stratified_k_fold_cpu
            },
            "Leave-One-Out": {
                "Matriz de Confusión": conf_matrix_dict,
                "Precisión": precision_score(y, y_pred, average='weighted'),
                "Exactitud": loo_accuracy,
                "Sensibilidad (Recall)": recall_score(y, y_pred, average='weighted'),
                "Especificidad": f1_score(y, y_pred, average='weighted'),
                "Tiempo de Procesamiento (s)": loo_time,
                "Uso de Memoria (MB)": loo_memory,  # Memoria en MB
                "Uso de CPU (s)": loo_cpu
            }
        }
        return final_results