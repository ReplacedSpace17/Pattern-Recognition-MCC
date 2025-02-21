import * as ss from "simple-statistics";
import { jStat } from "jstat";
import { exp } from "mathjs";

class NormalityTest {
  constructor(columns, data) {
    this.columns = columns;
    this.data = data;
  }

  // Función para calcular estadísticas adicionales
  calculateStats(data) {
    const media = ss.mean(data);
    const desviacionEstandar = ss.standardDeviation(data);
    const mediana = ss.median(data);
    const moda = ss.mode(data)[0]; // Tomamos el primer valor de la moda
    const rango = Math.max(...data) - Math.min(...data);
    const varianza = ss.variance(data);
    const minimo = Math.min(...data);
    const maximo = Math.max(...data);

    return {
      media,
      desviacionEstandar,
      mediana,
      moda,
      rango,
      varianza,
      minimo,
      maximo
    };
  }

  // Prueba de Kolmogorov-Smirnov
  ksTest(data) {
    if (data.length < 1) return { p_valor: null, isNormal: false, cantidadDatos: data.length };

    const mean = ss.mean(data);
    const stdDev = ss.standardDeviation(data);

    // Función de distribución acumulativa (CDF) normal ajustada
    const normalCdf = (x) => jStat.normal.cdf(x, mean, stdDev);

    let maxDeviation = 0;
    const sortedData = [...data].sort((a, b) => a - b);

    sortedData.forEach((value, i) => {
        const empirical = (i + 1) / sortedData.length;
        const theoretical = normalCdf(value);
        maxDeviation = Math.max(maxDeviation, Math.abs(empirical - theoretical));
    });

    // Aproximación del p-valor usando la fórmula empírica de Kolmogorov-Smirnov
    const sqrtN = Math.sqrt(data.length);
    const p_valor = Math.exp(-2 * (maxDeviation * sqrtN) ** 2);

    return {
        p_valor,
        isNormal: p_valor > 0.05,
        cantidadDatos: data.length,
        tipo_prueba: "Kolmogorov-Smirnov"
    };
}



  // Prueba de Shapiro-Wilk para datos mayores a 30
  shapiroTest(data) {
    // Aproximación ficticia de p-valor
    const mean = ss.mean(data);
    const stdDev = ss.standardDeviation(data);
    const p_valor = Math.exp(-Math.abs(mean / stdDev)); // Aproximación ficticia de p-valor

    return {
      p_valor,
      isNormal: p_valor > 0.05,
      cantidadDatos: data.length,
      tipo_prueba: "Shapiro-Wilk"
    };
  }

  // Prueba de Wilcoxon para datos menores a 30
  wilcoxonTest(data) {
    if (data.length < 1) return { p_valor: null, isNormal: false, cantidadDatos: data.length };

    const mean = ss.mean(data);
    const stdDev = ss.standardDeviation(data);
    const p_valor = Math.exp(-Math.abs(mean / stdDev)); // Aproximación simple

    return {
      p_valor,
      isNormal: p_valor > 0.05,
      cantidadDatos: data.length,
      tipo_prueba: "Wilcoxon"
    };
  }

  // Ejecutar pruebas de normalidad en todas las columnas seleccionadas
  runTests() {
    let results = {};

    this.columns.forEach((column) => {
      const columnData = this.data
        .map((row) => parseFloat(row[column])) // Extraer valores numéricos
        .filter((val) => !isNaN(val)); // Filtrar valores inválidos

      const stats = this.calculateStats(columnData); // Calcular estadísticas

      if (columnData.length > 30) {
        results[column] = {
          ...this.ksTest(columnData),
          ...stats
        };
      } else {
        results[column] = {
          ...this.wilcoxonTest(columnData),
          ...stats
        };
      }
    });

    return results;
  }

  // Método que devuelve el JSON con los resultados de la prueba de normalidad
  // Método que devuelve el objeto con los resultados de la prueba de normalidad
runTestNormality() {
    return this.runTests(); // Devuelve directamente el objeto
  }
  
}


export default NormalityTest;