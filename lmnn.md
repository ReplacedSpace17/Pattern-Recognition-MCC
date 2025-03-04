    Mejor k seleccionado: 5
Uso máximo de memoria en selección de k: 295.17 MB
Tiempo de ejecución en selección de k: 22.1673 segundos

Uso máximo de memoria en entrenamiento de LMNN: 295.57 MB
Tiempo de ejecución en entrenamiento de LMNN: 0.7901 segundos

Evaluación con 5-Fold Cross-Validation:
Uso máximo de memoria en 5-Fold: 295.50 MB
Tiempo de ejecución en 5-Fold: 0.1278 segundos
Precisión promedio: 0.9583

Evaluación con Leave-One-Out (LOO):
Uso máximo de memoria en LOO: 295.50 MB
Tiempo de ejecución en LOO: 0.4810 segundos
Precisión promedio: 0.9583


Evaluación en el Conjunto de Prueba:
Uso máximo de memoria en evaluación de prueba: 295.50 MB
Tiempo de ejecución en evaluación de prueba: 0.1517 segundos
Precisión en el conjunto de prueba: 0.9667


Matriz de Confusión (5-Fold Cross-Validation):
[[8.  0.  0. ]
 [0.  7.6 0.6]
 [0.  0.4 7.4]]

Matriz de Confusión (Leave-One-Out):
[[40  0  0]
 [ 0 38  3]
 [ 0  2 37]]

Matriz de Confusión (Conjunto de Prueba):
[[10  0  0]
 [ 0  8  1]
 [ 0  0 11]]


Reporte de Clasificación (Conjunto de Prueba):
              precision    recall  f1-score   support

      setosa       1.00      1.00      1.00        10
  versicolor       1.00      0.89      0.94         9
   virginica       0.92      1.00      0.96        11

    accuracy                           0.97        30
   macro avg       0.97      0.96      0.97        30
weighted avg       0.97      0.97      0.97        30

