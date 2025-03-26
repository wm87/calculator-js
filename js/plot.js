"use strict";

export let datasets = [], foundZeros = [], foundExtrema = [], errorFunctions = [];

import { powerOn, chart, display } from './ui.js';
import { submenu } from './subs.js';


const zeroDataset = {
    label: 'Nullstellen',
    data: [],
    pointBackgroundColor: 'red',
    pointBorderColor: 'red',
    pointStyle: 'cross',
    pointRadius: 8,
    pointBorderWidth: 2,
    showLine: false,
    type: 'scatter'
};

const extremaDataset = {
    label: 'Extremstellen',
    data: [],
    pointRadius: 8,
    showLine: false,
    type: 'scatter',
    backgroundColor: []
};


function computeY(fx, x) {
    try {
        let expr = fx.replace(/x/g, `(${x})`)
            .replace(/cot\((.*?)\)/g, '1/Math.tan($1)');
        // Umwandlung von Potenzen x^3 -> Math.pow(x,3)
        expr = expr.replace(/(\([^()]+\)|[a-zA-Z0-9.]+)\s*\^\s*([\-]?\d+)/g, 'Math.pow($1,$2)');
        if (/sin|cos|tan|cot/.test(fx)) expr = `Math.${expr}`;
        let y = eval(expr);
        if (isNaN(y) || !isFinite(y)) throw new Error("Ungültiger Wert");
        return y;
    } catch {
        throw new Error(`Fehler in Funktion: ${fx}`);
    }
}

export function generateData(fx) {
    let step = 0.02;
    let data = [];
    let lastY = null;
    const asymptoteThreshold = 10; // Schwellenwert für Sprung-Erkennung
    for (let x = -10; x <= 10; x += step) {
        try {
            let y = computeY(fx, x);
            if (lastY !== null && Math.abs(y - lastY) > asymptoteThreshold) {
                // Asymptote erkannt - Lücke erzeugen
                data.push({ x, y: null });
                lastY = null;
            } else {
                data.push({ x, y });
                lastY = y;
            }
        } catch {
            data.push({ x, y: null }); // NaN/Inf -> Lücke
            lastY = null;
        }
    }

    return data;
}

export function adjustScaling() {
    // Berechne die minimalen und maximalen x- und y-Werte
    let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;

    // Durchlaufe alle Daten und bestimme die min/max Werte für x und y
    datasets.forEach(ds => {
        ds.data.forEach(point => {
            if (point.x < xMin) xMin = point.x;
            if (point.x > xMax) xMax = point.x;
            if (point.y < yMin) yMin = point.y;
            if (point.y > yMax) yMax = point.y;
        });
    });

    // Falls keine Werte gefunden wurden, setze Standardwerte
    if (xMin === Infinity) xMin = -10;
    if (xMax === -Infinity) xMax = 10;
    if (yMin === Infinity) yMin = -50;
    if (yMax === -Infinity) yMax = 50;

    // Update den Chart
    chart.update();
}

export function updateChartAndTable(expr) {

    datasets = [];
    errorFunctions = [];
    let functions = expr.split(',');

    resetZeros();
    resetExtrema();

    $.each(functions, function (index, func) {
        let trimmed = func.trim();
        let data = generateData(trimmed);
        if (data) {
            datasets.push({
                label: trimmed,
                data: data,
                borderColor: getRandomColor(),
                fill: false,
                spanGaps: false,
                tension: 0.1,
                parsing: { xAxisKey: 'x', yAxisKey: 'y' }
            });
        } else {
            errorFunctions.push(trimmed);
        }
    });

    chart.data.datasets = [zeroDataset, extremaDataset, ...datasets];
    chart.update();
}

submenu.on('click', '#findZeros', function () {
    resetZeros();  // Löscht vorherige Nullstellen
    datasets.forEach(ds => {
        let data = ds.data;
        for (let i = 1; i < data.length; i++) {
            // Prüfen, ob keiner der beiden benachbarten Punkte eine Lücke hat (y !== null)
            if (data[i - 1].y !== null && data[i].y !== null && data[i - 1].y * data[i].y <= 0) {
                let zeroX = interpolateZero(data[i - 1], data[i]);
                if (zeroX !== null) markZero(zeroX, ds.label);
            }
        }
    });
    chart.update();
});

function interpolateZero(p1, p2) {
    // Interpoliert zwischen den beiden benachbarten Punkten, um den Nullpunkt zu finden
    let x = p1.x - (p1.y * (p2.x - p1.x)) / (p2.y - p1.y);
    return isFinite(x) ? x : null;
}


function markZero(x, funcLabel) {
    zeroDataset.data.push({ x, y: 0, func: funcLabel });
    foundZeros.push({ x, func: funcLabel });
}

submenu.on('click', '#findExtrema', function () {
    resetExtrema(); // Vorherige Ergebnisse löschen

    datasets.forEach(ds => {
        const funcStr = ds.label; // Funktions-String z.B. 'x^5'
        const f = math.parse(funcStr).compile();
        const df = math.derivative(funcStr, 'x').compile();     // 1. Ableitung
        const d2f = math.derivative(math.derivative(funcStr, 'x'), 'x').compile(); // 2. Ableitung

        const data = ds.data;

        for (let i = 0; i < data.length; i++) {
            const x = data[i].x;
            const y = f.evaluate({ x });
            const dy = df.evaluate({ x });
            const d2y = d2f.evaluate({ x });

            // Toleranzen für numerische Berechnung
            const dyEpsilon = 0.01;
            const d2yEpsilon = 0.001;

            // Extremstellen (Hoch- oder Tiefpunkt): dy ≈ 0, d2y != 0
            if (Math.abs(dy) < dyEpsilon && Math.abs(d2y) > d2yEpsilon) {

                const type = d2y < 0 ? 'Hochpunkt' : 'Tiefpunkt';
                const color = d2y < 0 ? 'green' : 'blue';

                extremaDataset.data.push({ x, y, func: funcStr });
                extremaDataset.backgroundColor.push(color);
                foundExtrema.push({ x, y, type, func: funcStr });
            }

            // Sattelpunkt / Wendepunkt: dy ≈ 0 und d2y ≈ 0
            else if (Math.abs(dy) < dyEpsilon && Math.abs(d2y) < d2yEpsilon) {
                extremaDataset.data.push({ x, y, func: funcStr });
                extremaDataset.backgroundColor.push('orange');
                foundExtrema.push({ x, y, type: 'Sattelpunkt', func: funcStr });
            }
        }
    });

    chart.update();
});

submenu.on('click', '#resetZeros', () => { resetZeros(); chart.update(); });
submenu.on('click', '#resetExtrema', () => { resetExtrema(); chart.update(); });
submenu.on('click', '#zoom-in', function () { if (chart) chart.zoom(1.2); });
submenu.on('click', '#zoom-out', function () { if (chart) chart.zoom(0.8); });
submenu.on('click', '#reset-zoom', function () { if (chart) chart.resetZoom(); });


export function getRandomColor() {
    return `hsl(${Math.random() * 360}, 70%, 50%)`;
}

// Update Display
export function updateDisplay(value) {
    if (!powerOn) return;

    display.val(display.val() + value);
}

export function removeChart(chart) {
    if (chart) {
        chart.destroy();
        chart = null;
    }
}

function resetZeros() {
    foundZeros = [];
    zeroDataset.data = [];
}

function resetExtrema() {
    foundExtrema = [];
    extremaDataset.data = [];
    extremaDataset.backgroundColor = [];
}