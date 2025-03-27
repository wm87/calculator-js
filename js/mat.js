"use strict";

export let historyStack = [];

export function createMatrix(rows, cols, id) {
    let html = '<table class="matrix">';
    for (let i = 0; i < rows; i++) {
        html += '<tr>';
        for (let j = 0; j < cols; j++) {
            html += '<td><input type="number" value="0"></td>';
        }
        html += '</tr>';
    }
    html += '</table>';
    $(id).html(html);
}

export function readMatrix(id) {
    let matrix = [];
    $(id + " table tr").each(function () {
        let row = [];
        $(this).find("input").each(function () {
            row.push(parseFloat($(this).val()) || 0);
        });
        matrix.push(row);
    });
    return matrix;
}

export function displayMatrix(matrix) {
    if (typeof matrix === 'string' || typeof matrix === 'number') return matrix;
    let html = '<table class="result-table">';
    matrix.forEach(row => {
        html += '<tr>' + row.map(val => `<td>${val}</td>`).join('') + '</tr>';
    });
    html += '</table>';
    return html;
}

export function displayResult(operation, result) {
    const stepHtml = `<strong>${operation}</strong>${displayMatrix(result)}`;
    $('#result').html(stepHtml);
    historyStack.unshift(stepHtml);
    updateHistory();
}

export function updateHistory() {
    let historyHtml = historyStack.map((step, i) => `
      <div class="${i === 0 ? 'latest' : 'step'}">
        ${step}
      </div>
      ${i < historyStack.length - 1 ? '<hr>' : ''}
    `).join("");
    $('#history').html(historyHtml);
}

export function addMatrices(a, b) {
    if (a.length !== b.length || a[0].length !== b[0].length) return 'Dimensionen passen nicht';
    return a.map((row, i) => row.map((val, j) => val + b[i][j]));
}

export function subtractMatrices(a, b) {
    if (a.length !== b.length || a[0].length !== b[0].length) return 'Dimensionen passen nicht';
    return a.map((row, i) => row.map((val, j) => val - b[i][j]));
}

export function multiplyMatrices(a, b) {
    if (a[0].length !== b.length) return 'Dimensionen passen nicht';
    let result = [];
    for (let i = 0; i < a.length; i++) {
        result[i] = [];
        for (let j = 0; j < b[0].length; j++) {
            let sum = 0;
            for (let k = 0; k < b.length; k++) {
                sum += a[i][k] * b[k][j];
            }
            result[i][j] = sum;
        }
    }
    return result;
}

export function transposeMatrix(m) {
    return m[0].map((_, i) => m.map(row => row[i]));
}

export function inverseMatrix(mat) {
    let n = mat.length;
    if (n !== mat[0].length) return 'Nicht quadratisch';
    let I = mat.map((row, i) => row.map((_, j) => (i === j ? 1 : 0)));
    mat = JSON.parse(JSON.stringify(mat));

    for (let i = 0; i < n; i++) {
        let factor = mat[i][i];
        if (factor === 0) return 'Nicht invertierbar';
        for (let j = 0; j < n; j++) {
            mat[i][j] /= factor;
            I[i][j] /= factor;
        }
        for (let k = 0; k < n; k++) {
            if (k !== i) {
                let factor2 = mat[k][i];
                for (let j = 0; j < n; j++) {
                    mat[k][j] -= factor2 * mat[i][j];
                    I[k][j] -= factor2 * I[i][j];
                }
            }
        }
    }
    return I;
}

export function determinant(m) {
    const n = m.length;
    if (n !== m[0].length) return 'Nicht quadratisch';
    if (n === 1) return m[0][0];
    if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
    let det = 0;
    for (let i = 0; i < n; i++) {
        const minor = m.slice(1).map(row => row.filter((_, idx) => idx !== i));
        det += (i % 2 === 0 ? 1 : -1) * m[0][i] * determinant(minor);
    }
    return det;
}



export function downloadMatrix(matrix, filename) {
    let data = new Blob([JSON.stringify(matrix)], { type: 'application/json' });
    let a = document.createElement('a');
    a.href = URL.createObjectURL(data);
    a.download = filename;
    a.click();
}

export function uploadMatrix(input, id) {
    let reader = new FileReader();
    reader.onload = function () {
        let data = JSON.parse(reader.result);
        let html = '<table class="matrix">';
        data.forEach(row => {
            html += '<tr>';
            row.forEach(val => html += `<td><input type="number" value="${val}"></td>`);
            html += '</tr>';
        });
        html += '</table>';
        $(id).html(html);
    };
    reader.readAsText(input.files[0]);
}

export function clearHistory() {
    historyStack = [];
    updateHistory();
}
