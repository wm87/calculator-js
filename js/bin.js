"use strict";

import { powerOn } from './ui.js';
import { updateDisplay } from './plot.js';
import { submenu } from './subs.js';

$(document).ready(function () {

    //Binär-Rechner

    function validateDecimal(input) {
        if (input === null || input.trim() === "" || isNaN(input)) {
            alert("Bitte eine gültige Dezimalzahl eingeben!");
            return false;
        }
        return true;
    }

    // Dezimal zu Binär
    submenu.on("click", "#decToBin", function () {
        if (!powerOn) return;

        let dec = prompt("Gib eine Dezimalzahl ein:");
        if (validateDecimal(dec)) {
            let bin = parseInt(dec, 10).toString(2);
            updateDisplay(`${dec} (dez) = ${bin} (bin)`);
        }
    });

    // Binär zu Dezimal
    submenu.on("click", "#binToDec", function () {
        if (!powerOn) return;

        let bin = prompt("Gib eine Binärzahl ein (z.B. 1010):");
        if (bin && /^[01]+$/.test(bin)) {
            let dec = parseInt(bin, 2);
            updateDisplay(`${bin} (bin) = ${dec} (dez)`);
        } else {
            alert("Nur 0 und 1 erlaubt!");
        }
    });

    // Dezimal zu Oktal
    submenu.on("click", "#decToOct", function () {
        if (!powerOn) return;

        let dec = prompt("Gib eine Dezimalzahl ein:");
        if (validateDecimal(dec)) {
            let oct = parseInt(dec, 10).toString(8);
            updateDisplay(`${dec} (dez) = ${oct} (oct)`);
        }
    });

    // Oktal zu Dezimal
    submenu.on("click", "#octToDec", function () {
        if (!powerOn) return;

        let oct = prompt("Gib eine Oktalzahl ein (z.B. 17):");
        if (oct && /^[0-7]+$/.test(oct)) {
            let dec = parseInt(oct, 8);
            updateDisplay(`${oct} (oct) = ${dec} (dez)`);
        } else {
            alert("Nur Ziffern von 0 bis 7 erlaubt!");
        }
    });

    // Dezimal zu Hexadezimal
    submenu.on("click", "#decToHex", function () {
        if (!powerOn) return;

        let dec = prompt("Gib eine Dezimalzahl ein:");
        if (validateDecimal(dec)) {
            let hex = parseInt(dec, 10).toString(16).toUpperCase();
            updateDisplay(`${dec} (dez) = ${hex} (hex)`);
        }
    });

    // Hexadezimal zu Dezimal
    submenu.on("click", "#hexToDec", function () {
        if (!powerOn) return;

        let hex = prompt("Gib eine Hexadezimalzahl ein (z.B. 1A):");
        if (hex && /^[0-9a-fA-F]+$/.test(hex)) {
            let dec = parseInt(hex, 16);
            updateDisplay(`${hex.toUpperCase()} (hex) = ${dec} (dez)`);
        } else {
            alert("Bitte eine gültige Hexadezimalzahl eingeben!");
        }
    });

});