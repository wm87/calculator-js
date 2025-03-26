"use strict";

export const power = $("#power");
export let powerOn = false;
export let display = $("#display");
export let chart;
export let ctx = document.getElementById('plot-canvas').getContext('2d');

const clear = $("#clear");
const backspace = $("#backspace");
const statusLed = $("#status-led");
const themeToggle = $("#theme-toggle");
const calculator = $("#calculator");
const execute = $("#execute");

import { updateChartAndTable, adjustScaling, removeChart } from './plot.js';
import { calculate } from './calc.js';

$(document).ready(function () {

    // Power ON/OFF
    power.on("click", function () {
        powerOn = !powerOn;

        removeChart(chart);

        display.prop("disabled", !powerOn)
            .css("background-color", powerOn ? "white" : "")
            .val("");
        statusLed.toggleClass("on", powerOn).toggleClass("off", !powerOn);
        setTimeout(() => { display.val(""); }, 500);
    });

    // AC Button
    clear.on("click", function () {
        if (powerOn) {
            $('#display').val('');   // Textfeld leeren
            if (chart) {
                chart.destroy();
                chart = null;
            }
        }
    });

    // Backspace
    backspace.on("click", function () {
        if (powerOn) {
            let currentValue = display.val();
            display.val(currentValue.slice(0, -1)); // 1 Zeichen löschen
        }
    });

    // Dark/Light Mode Toggle
    themeToggle.on("click", function () {
        calculator.toggleClass("light-mode dark-mode");
    });

    // Plot-Button-Event
    $('#plot-btn').on('click', function () {
        if (!powerOn) return;

        display.val('');   // Textfeld leeren
        let expr = prompt("Gib die Funktion in Abhängigkeit von x ein (z.B. sin(x), x^2, log(x)):");
        if (!expr) return;

        removeChart(chart);

        // Neues Diagramm erstellen
        chart = new Chart(ctx, {
            type: 'line',
            options: {
                responsive: true,
                datasets: [],
                interaction: { mode: 'nearest' },
                scales: { x: { type: 'linear', min: -10, max: 10 }, y: { min: -10, max: 10 } },
                plugins: {
                    legend: { labels: { usePointStyle: true } },
                    tooltip: { callbacks: { label: ctx => `x: ${ctx.parsed.x.toFixed(2)}, y: ${ctx.parsed.y !== null ? ctx.parsed.y.toFixed(2) : 'undefiniert'}` } },
                    zoom: {
                        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' },
                        pan: { enabled: true, mode: 'xy' }
                    }
                }
            }
        });

        updateChartAndTable(expr);
        adjustScaling();
    });

    // EXE-Button
    execute.on("click", function () {
        if (powerOn) {
            try {
                let lines = display.val().split("\n");
                let currentExpression = lines[lines.length - 1];

                let { history, result } = calculate(currentExpression);

                if (result === "Error" || isNaN(result)) {
                    lines[lines.length - 1] = `${history}${result}`;
                    display.val(lines.join("\n"));
                    return;
                }
                lines[lines.length - 1] = `${history}${result}`;
                lines.push(result);
                display.val(lines.join("\n"));
            } catch (e) {
                display.val("Error");
            }

            // Scrollt die Textarea automatisch ans Ende
            display.scrollTop(display[0].scrollHeight);
        }
    });

});