"use strict";

export let datasets = [], foundZeros = [], foundExtrema = [], errorFunctions = [];
export let chart;
export let ctx = document.getElementById('plot-canvas').getContext('2d');

import { powerOn, display } from './ui.js';
import { submenu } from './subs.js';

let outputWindow;
let latestAnalysis = '';

let x_vals = [], y_vals = [];
let extrempunkte = [], wendepunkte = [], sattelpunkte = [], nullstellen = [];
let result = '';

export function plotChart() {

    submenu.on('click', '#analyzeBtn', function () {

        if (!powerOn) return;

        display.val('');

        let f, dfExpr, ddfExpr, dddfExpr, df, ddf, dddf;
        let input = $('#plotInput').val();

        const minX = parseFloat($('#minX').val());
        const maxX = parseFloat($('#maxX').val());

        if (isNaN(minX) || isNaN(maxX) || minX >= maxX) {
            alert('⚠️ Ungültige Intervallgrenzen.');
            return;
        }

        if (!input) return;

        try {
            f = math.parse(input).compile();
            dfExpr = math.derivative(input, 'x');
            ddfExpr = math.derivative(dfExpr, 'x');
            dddfExpr = math.derivative(ddfExpr, 'x');
            df = dfExpr.compile();
            ddf = ddfExpr.compile();
            dddf = dddfExpr.compile();
        } catch (err) {
            latestAnalysis = '⚠️ Fehler in der Funktionsdefinition:\n' + err.message;
            return;
        }

        x_vals = [], y_vals = [];
        extrempunkte = [], wendepunkte = [], sattelpunkte = [], nullstellen = [];

        result = `📌 Schritt-für-Schritt Ableitungen:\n`;
        result += `f(x)   = ${input}\n`;
        result += `f'(x)  = ${dfExpr.toString()}\n`;
        result += `f''(x) = ${ddfExpr.toString()}\n`;
        result += `f'''(x)= ${dddfExpr.toString()}\n\n`;

        for (let x = minX; x <= maxX; x += 0.01) {
            let fx;
            try {
                fx = f.evaluate({ x });
                if (!isFinite(fx) || Math.abs(fx) > 100) fx = null;
            } catch {
                fx = null;
            }

            x_vals.push(x);
            y_vals.push(fx);

            if (fx === null) continue;

            let f1 = df.evaluate({ x });
            let f1Next = df.evaluate({ x: x + 0.01 });
            let f2 = ddf.evaluate({ x });
            let f2Next = ddf.evaluate({ x: x + 0.01 });
            let f3 = dddf.evaluate({ x });

            // Nullstellen
            try {
                const y1 = fx;
                const y2 = f.evaluate({ x: x + 0.01 });
                if (isFinite(y2) && y1 * y2 < 0) {
                    const x0 = x + 0.005;
                    const y0 = f.evaluate({ x: x0 });
                    nullstellen.push({ x: x0, y: y0 });
                }
            } catch { }

            // Extrempunkte
            if (f1 * f1Next < 0) {
                const x0 = x + 0.005;
                const y0 = f.evaluate({ x: x0 });
                const f2val = ddf.evaluate({ x: x0 });
                if (!(Math.abs(f2val) < 1e-3 && Math.abs(f3) > 1e-3)) {
                    const type = f2val < 0 ? 'Hochpunkt' : 'Tiefpunkt';
                    extrempunkte.push({ x: x0, y: y0, type });
                }
            }

            // Wendepunkte & Sattelpunkte
            if (f2 * f2Next < 0) {
                const x0 = x + 0.005;
                const y0 = f.evaluate({ x: x0 });
                const f1val = df.evaluate({ x: x0 });
                if (Math.abs(f1val) < 1e-3) {
                    sattelpunkte.push({ x: x0, y: y0 });
                } else {
                    wendepunkte.push({ x: x0, y: y0 });
                }
            }
        }

        // Monotonie
        let extremstellen_x = extrempunkte.map(p => p.x).sort((a, b) => a - b);
        let intervalgrenzen = [-Infinity, ...extremstellen_x, Infinity];
        result += `📈 Monotonie-Intervalle:\n`;
        for (let i = 0; i < intervalgrenzen.length - 1; i++) {
            let a = intervalgrenzen[i];
            let b = intervalgrenzen[i + 1];
            let testX = (a === -Infinity) ? b - 1 : (b === Infinity) ? a + 1 : (a + b) / 2;
            let f1test = df.evaluate({ x: testX });
            let richtung = f1test > 0 ? 'streng steigend' : 'streng fallend';
            result += `f(x) ist ${richtung} in (${a === -Infinity ? '-∞' : a.toFixed(2)}, ${b === Infinity ? '∞' : b.toFixed(2)})\n`;
        }

        // Ausgaben
        result += `\nNullstellen:\n`;
        nullstellen.forEach(p => {
            result += `f(x) = 0 bei x ≈ ${p.x.toFixed(2)}, f(x) ≈ ${p.y.toFixed(2)}\n`;
        });

        result += `\nExtrempunkte:\n`;
        extrempunkte.forEach(p => {
            result += `${p.type} bei x ≈ ${p.x.toFixed(2)}, f(x) ≈ ${p.y.toFixed(2)}\n`;
        });

        result += `\nWendepunkte:\n`;
        wendepunkte.forEach(p => {
            result += `Wendepunkt bei x ≈ ${p.x.toFixed(2)}, f(x) ≈ ${p.y.toFixed(2)}\n`;
        });

        result += `\nSattelpunkte:\n`;
        sattelpunkte.forEach(p => {
            result += `Sattelpunkt bei x ≈ ${p.x.toFixed(2)}, f(x) ≈ ${p.y.toFixed(2)}\n`;
        });

        latestAnalysis = result; // speichern

        datasets = [
            {
                label: 'Extrempunkt',
                data: extrempunkte.map(p => ({ x: p.x, y: p.y })),
                backgroundColor: 'red',
                borderColor: 'red',
                pointRadius: 5,
                pointStyle: 'circle',
                type: 'scatter'
            },
            {
                label: 'Wendepunkt',
                data: wendepunkte.map(p => ({ x: p.x, y: p.y })),
                backgroundColor: 'green',
                borderColor: 'green',
                pointRadius: 5,
                pointStyle: 'cross',
                type: 'scatter'
            },
            {
                label: 'Sattelpunkt',
                data: sattelpunkte.map(p => ({ x: p.x, y: p.y })),
                backgroundColor: 'yellow',
                borderColor: 'black',
                pointRadius: 5,
                pointStyle: 'triangle',
                type: 'scatter'
            },
            {
                label: 'Nullstelle',
                data: nullstellen.map(p => ({ x: p.x, y: p.y })),
                backgroundColor: 'brown',
                borderColor: 'brown',
                pointRadius: 5,
                pointStyle: 'diamond',
                type: 'scatter'
            },
            {
                label: 'f(x)',
                data: x_vals.map((x, i) => ({ x: x, y: y_vals[i] })),
                borderColor: 'grey',
                borderWidth: 2,
                fill: false,
                pointRadius: 0,
                spanGaps: false
            },
            {
                label: 'f\'(x)',
                data: x_vals.map(x => ({ x: x, y: df.evaluate({ x }) })),
                borderColor: 'orange',
                borderDash: [5, 5],
                borderWidth: 1,
                pointRadius: 0,
                fill: false
            },
            {
                label: "f''(x)",
                data: x_vals.map(x => ({ x: x, y: ddf.evaluate({ x }) })),
                borderColor: 'violet',
                borderDash: [2, 5],
                borderWidth: 1,
                pointRadius: 0,
                fill: false
            }
        ];

        if (chart) {
            chart.data.labels = x_vals;
            chart.data.datasets = datasets;

            // X- und Y-Achsen neu setzen
            chart.options.scales.x.min = minX;
            chart.options.scales.x.max = maxX;

            chart.update();
        } else {
            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: x_vals,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'nearest' },
                    scales: {
                        x: { type: 'linear', min: minX, max: maxX },
                        y: { min: -10, max: 10 }
                    },
                    plugins: {
                        legend: { labels: { usePointStyle: true } },
                        tooltip: {
                            callbacks: {
                                label: ctx => {
                                    const label = ctx.dataset.label || '';
                                    return `${label}: x ≈ ${ctx.parsed.x.toFixed(2)}, y ≈ ${ctx.parsed.y?.toFixed(2) ?? 'undefiniert'}`;
                                }
                            }
                        },
                        zoom: {
                            zoom: {
                                wheel: { enabled: true },
                                pinch: { enabled: true },
                                mode: 'xy'
                            },
                            pan: {
                                enabled: true,
                                mode: 'xy'
                            }
                        }
                    }
                }
            });
        }


    });
}

submenu.on('click', '#openAnalyseBtn', function () {
    if (!latestAnalysis) {
        alert('Bitte zuerst eine Funktion eingeben.');
        return;
    }
    if (!outputWindow || outputWindow.closed) {
        outputWindow = window.open('', 'Funktionsanalyse', 'width=600,height=600');
    }

    outputWindow.document.body.innerHTML = `<pre style="white-space: pre-wrap; font-family: monospace;">${latestAnalysis}</pre>`;
    outputWindow.document.title = "Analyse-Ergebnisse";
});

submenu.on('click', '#reset-zoom', function () { if (chart) chart.resetZoom(); });

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
