"use strict";

export const units = {
    length: { km: 1, mile: 0.621371, m: 1000, cm: 100000, inch: 39370.1 },
    volume: { liter: 1, ml: 1000, gallon: 0.264172, m3: 0.001 },
    weight: { kg: 1, g: 1000, lb: 2.20462, oz: 35.274 },
    pressure: { pascal: 1, bar: 0.00001, psi: 0.000145038 },
    speed: { kmh: 1, ms: 0.277778, mph: 0.621371 },
    power: { watt: 1, kw: 0.001, ps: 0.00135962 },
    temperature: "special",
    time: { sec: 1, min: 1 / 60, hour: 1 / 3600, day: 1 / 86400, week: 1 / 604800 },
    energy: { joule: 1, kj: 0.001, cal: 0.239006, kwh: 2.77778e-7, btu: 0.000947817 },
    torque: { nm: 1, kgm: 0.101972, ftlb: 0.737562 },
    area: { m2: 1, ha: 0.0001, km2: 0.000001, ft2: 10.7639, acre: 0.000247105 },
    data: { bit: 1, byte: 0.125, kb: 0.000125, mb: 1.25e-7, gb: 1.25e-10, tb: 1.25e-13 }
};

// Kategorien in Dropdown füllen
$.each(units, function (category) {
    $("#category").append(new Option(category.charAt(0).toUpperCase() + category.slice(1), category));
});

export function updateUnits(category) {
    let unitSelects = $("#unitFrom, #unitTo");
    unitSelects.empty();

    if (category === "temperature") {
        unitSelects.append(new Option("Celsius", "celsius"));
        unitSelects.append(new Option("Fahrenheit", "fahrenheit"));
        unitSelects.append(new Option("Kelvin", "kelvin"));
    } else {
        $.each(units[category], function (unit) {
            unitSelects.append(new Option(unit, unit));
        });
    }
}



export function convertTemperature(value, from, to) {
    if (from === to) return value;

    if (from === "celsius") {
        if (to === "fahrenheit") return value * 9 / 5 + 32;
        if (to === "kelvin") return value + 273.15;
    } else if (from === "fahrenheit") {
        if (to === "celsius") return (value - 32) * 5 / 9;
        if (to === "kelvin") return (value - 32) * 5 / 9 + 273.15;
    } else if (from === "kelvin") {
        if (to === "celsius") return value - 273.15;
        if (to === "fahrenheit") return (value - 273.15) * 9 / 5 + 32;
    }

    return value;
}

updateUnits("length");
