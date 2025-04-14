"use strict";

export let submenu = $("#submenu");

import { display } from './ui.js';

$(document).ready(function () {

    function activateMainButton(buttonId) {
        $("#std-btn, #matrix-btn, #bin-btn, #plot-btn, #trig-btn, #conv-btn").removeClass("active-main");
        $(buttonId).addClass("active-main");
    }

    // Standard
    $("#std-btn").click(() => {
        activateMainButton("#std-btn");
        submenu.empty();
        display.val('');
    });

    // Matrix
    $("#matrix-btn").click(() => {
        activateMainButton("#matrix-btn");
        submenu.empty();
        display.val('');
    });

    // Binär
    $("#bin-btn").click(() => {
        activateMainButton("#bin-btn");
        submenu.empty().show().append(`
    
    <button id="decToBin" class="sub-btn" data-value="" title="Dezimal zu Binär">dec ➔ bin</button>
    <button id="decToOct" class="sub-btn" data-value="" title="Dezimal zu Oktal">dec ➔ oct</button>
    <button id="decToHex" class="sub-btn" data-value="" title="Dezimal zu Hex">dec ➔ hex</button>
    <button id="binToDec" class="sub-btn" data-value="" title="Binär zu Dezimal">bin ➔ dec</button>
    <button id="octToDec" class="sub-btn" data-value="" title="Oktal zu Dezimal">oct ➔ dec</button>
    <button id="hexToDec" class="sub-btn" data-value="" title="Hex zu Dezimal">hex ➔ dec</button>
`);
        display.val('');
    });

    // Plot
    $("#plot-btn").click(() => {
        activateMainButton("#plot-btn");
        submenu.empty().show().append(`
    <input type="text" id="plotInput" placeholder="z.B. sin(x)">
    <button id="analyzeBtn" class="sub-btn" data-value="">Show</button>
    <button id="reset-zoom" class="sub-btn" data-value="">Res</button>
    <label for="minX">Intervall:</label>
    <input type="number" id="minX" value="-10" />
    <label for="maxX">bis:</label>
    <input type="number" id="maxX" value="10" />
    <button id="openAnalyseBtn" class="sub-btn" data-value="">Analyse Function</button>
`);
    });

    // Trigonometrie
    $("#trig-btn").click(() => {
        activateMainButton("#trig-btn");
        submenu.empty().show().append(`
    <button class="sub-btn func">sin</button>
    <button class="sub-btn func">cos</button>
    <button class="sub-btn func">tan</button>
    <button class="sub-btn func" data-value="sin⁻¹">sin⁻¹</button>
    <button class="sub-btn func" data-value="cos⁻¹">cos⁻¹</button>
    <button class="sub-btn func" data-value="tan⁻¹">tan⁻¹</button>
`);
        display.val('');
    });

    // Konverter
    $("#conv-btn").click(() => {
        activateMainButton("#conv-btn");
        submenu.empty();
        display.val('');
    });

    // Sub-Button Aktivierung
    $(document).on("click", ".sub-btn", function () {
        $(this).toggleClass("active-sub");
    });
});