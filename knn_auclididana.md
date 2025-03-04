🔹 Mejor valor de K seleccionado: 6 con precisión 0.9500
Uso máximo de memoria en selección de k: 284.72 MB
Tiempo de ejecución en selección de k: 0.5051 segundos

📌 Validación K-Folds (5 folds)
Precisión Promedio: 0.9500 ± 0.0408
Uso máximo de memoria en K-Folds: 284.72 MB
Tiempo de ejecución: 0.1016 segundos

Matriz de Confusión Promedio (K-Folds):
[[7.8 0.2 0. ]
 [0.  7.8 0.4]
 [0.  0.6 7.2]]

📌 Validación Leave-One-Out (LOO)
Precisión Promedio: 0.9333 ± 0.2494
Uso máximo de memoria en LOO: 284.73 MB
Tiempo de ejecución: 0.4172 segundos

Matriz de Confusión Promedio (LOO):
[[0.325      0.00833333 0.        ]
 [0.         0.325      0.01666667]
 [0.         0.04166667 0.28333333]]

📌 Evaluación en el conjunto de prueba
Precisión en el conjunto de prueba: 0.8333
Uso máximo de memoria en evaluación de prueba: 284.73 MB
Tiempo de ejecución: 0.0961 segundos

Matriz de Confusión en el Conjunto de Prueba:
[[10  0  0]
 [ 0  7  2]
 [ 0  3  8]]

Reporte de Clasificación (Prueba):
              precision    recall  f1-score   support

           0       1.00      1.00      1.00        10
           1       0.70      0.78      0.74         9
           2       0.80      0.73      0.76        11

    accuracy                           0.83        30
   macro avg       0.83      0.84      0.83        30
weighted avg       0.84      0.83      0.83        30
