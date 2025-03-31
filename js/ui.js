"use strict";

export const power = $("#power");
export let powerOn = false;
export let display = $("#display");
export let welcome = $("#view0");


const clear = $("#clear");
const backspace = $("#backspace");
const statusLed = $("#status-led");
const themeToggle = $("#theme-toggle");
const calculator = $("#calculator");
const execute = $("#execute");

import { chart, plotChart, removeChart } from './plot.js';
import { calculate } from './calc.js';
import * as Matrix from './mat.js';
import * as Conv from './conv.js';
import { submenu } from './subs.js';

$(document).ready(function () {

    // Power ON/OFF
    power.on("click", function () {

        if (powerOn) {
            submenu.empty();
            $("#std-btn, #matrix-btn, #bin-btn, #plot-btn, #trig-btn, #conv-btn").prop("disabled", true);
            $("#std-btn, #matrix-btn, #bin-btn, #plot-btn, #trig-btn, #conv-btn").removeClass("active-main");
            $(".textarea-wrapper").hide();
            $('.view-content').hide();

            setTimeout(() => {
                $('.off-content').show();
                $(this).text('ON');
            }, 500);
        } else {
            $('.off-content').hide();
            $("#std-btn, #matrix-btn, #bin-btn, #plot-btn, #trig-btn, #conv-btn").prop("disabled", false);

            setTimeout(() => {
                welcome.show();
                $(this).text('OFF');
            }, 500);
        }

        powerOn = !powerOn;

        setTimeout(() => {
            statusLed.toggleClass("on", powerOn).toggleClass("off", !powerOn);
        }, 500);
    });

    // Tabs wechseln (nur wenn eingeschaltet)
    $('.switchView').click(function () {

        if (powerOn) {
            let target = $(this).data('target');
            $('.view-content').hide();
            $('#' + target).fadeIn();

            // Textarea nur anzeigen bei:
            if (target === "view0" || target === "view2" || target === "view4") {
                $(".textarea-wrapper").show();
            } else {
                $(".textarea-wrapper").hide();
            }
        }
    });

    // AC Button
    clear.on("click", function () {
        if (powerOn) {
            $('#display').val('');
            removeChart(chart);
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
    plotChart();

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


    // Matrix-Buttons
    $('#generateA').click(() => Matrix.createMatrix($('#rowsA').val(), $('#colsA').val(), '#matrixA'));
    $('#generateB').click(() => Matrix.createMatrix($('#rowsB').val(), $('#colsB').val(), '#matrixB'));

    $('#add').click(() => Matrix.displayResult('Addition A + B', Matrix.addMatrices(Matrix.readMatrix('#matrixA'), Matrix.readMatrix('#matrixB'))));
    $('#subtract').click(() => Matrix.displayResult('Subtraction A - B', Matrix.subtractMatrices(Matrix.readMatrix('#matrixA'), Matrix.readMatrix('#matrixB'))));
    $('#multiply').click(() => Matrix.displayResult('Multiplication A × B', Matrix.multiplyMatrices(Matrix.readMatrix('#matrixA'), Matrix.readMatrix('#matrixB'))));
    $('#transposeA').click(() => Matrix.displayResult('Transpose A', Matrix.transposeMatrix(Matrix.readMatrix('#matrixA'))));
    $('#transposeB').click(() => Matrix.displayResult('Transpose B', Matrix.transposeMatrix(Matrix.readMatrix('#matrixB'))));
    $('#inverseA').click(() => Matrix.displayResult('Inverse A', Matrix.inverseMatrix(Matrix.readMatrix('#matrixA'))));
    $('#inverseB').click(() => Matrix.displayResult('Inverse B', Matrix.inverseMatrix(Matrix.readMatrix('#matrixB'))));

    $('#detA').click(() => Matrix.displayResult('Determinant A', Matrix.determinant(Matrix.readMatrix('#matrixA'))));
    $('#detB').click(() => Matrix.displayResult('Determinant B', Matrix.determinant(Matrix.readMatrix('#matrixB'))));

    $('#downloadA').click(() => Matrix.downloadMatrix(Matrix.readMatrix('#matrixA'), 'matrixA.json'));
    $('#downloadB').click(() => Matrix.downloadMatrix(Matrix.readMatrix('#matrixB'), 'matrixB.json'));

    $('#uploadA').change(function () { Matrix.uploadMatrix(this, '#matrixA'); });
    $('#uploadB').change(function () { Matrix.uploadMatrix(this, '#matrixB'); });

    $('#clearHistory').click(() => { Matrix.clearHistory(); });


    //Conversion-Buttons
    $("#category").change(function () {
        Conv.updateUnits($(this).val());
    });

    $("#convert").click(function () {
        let value = parseFloat($("#inputValue").val());
        let category = $("#category").val();
        let unitFrom = $("#unitFrom").val();
        let unitTo = $("#unitTo").val();

        if (isNaN(value)) {
            $("#resultConv").val("Fehler");
            return;
        }

        let result = category === "temperature"
            ? Conv.convertTemperature(value, unitFrom, unitTo)
            : (value / Conv.units[category][unitFrom]) * Conv.units[category][unitTo];

        $("#resultConv").val(result.toFixed(4));
    });
});