"use strict";

$(document).ready(function () {
  let powerOn = false;
  const display = $("#display");
  const buttons = $(".btn");
  const execute = $("#execute");
  const power = $("#power");
  const clear = $("#clear");
  const backspace = $("#backspace");
  const statusLed = $("#status-led");
  const themeToggle = $("#theme-toggle");
  const calculator = $("#calculator");

  let ctx = document.getElementById('plot-canvas').getContext('2d');
  let datasets = [], errorFunctions = [];

  // Neues Diagramm erstellen
  let chart;

  // Power ON/OFF
  power.on("click", function () {
    powerOn = !powerOn;

    display.prop("disabled", !powerOn)
      .css("background-color", powerOn ? "white" : "")
      .val("");
    statusLed.toggleClass("on", powerOn).toggleClass("off", !powerOn);
    setTimeout(() => { display.val(""); }, 500);
  });

  // Update Display
  function updateDisplay(value) {
    if (!powerOn) return;

    display.val(display.val() + value);
  }

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

  function generateData(fx) {
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

  function adjustScaling() {
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

  // Plot-Button-Event
  $('#plot-btn').on('click', function () {
    if (!powerOn) return;

    $('#display').val('');   // Textfeld leeren
    let expr = prompt("Gib die Funktion in Abhängigkeit von x ein (z.B. sin(x), x^2, log(x)):");
    if (!expr) return;

    if (!chart) {
      // Neues Diagramm erstellen
      chart = new Chart(ctx, {
        type: 'line',
        data: { datasets: [] },
        options: {
          responsive: true,
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
    }

    datasets = [];
    errorFunctions = [];
    let functions = expr.split(',');

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

    updateChartAndTable();
    adjustScaling();
  });

  function updateChartAndTable() {
    chart.data.datasets = datasets;
    chart.update();
  }

  function getRandomColor() {
    return `hsl(${Math.random() * 360}, 70%, 50%)`;
  }

  $('#zoom-in').on('click', function () {
    if (chart) chart.zoom(1.2);
  });

  $('#zoom-out').on('click', function () {
    if (chart) chart.zoom(0.8);
  });

  $('#reset-zoom').on('click', function () {
    if (chart) chart.resetZoom();
  });

  buttons.each(function () {
    if ($(this).attr('id') === 'backspace') return;

    $(this).on("click", function () {
      const value = $(this).data("value") !== undefined ? $(this).data("value") : $(this).text();
      updateDisplay(value);
    });
  });

  // Klammern- und Ausdrucks-Check
  function isValidExpression(expression) {
    let stack = [];
    for (let char of expression) {
      if (char === "(") stack.push(char);
      else if (char === ")") {
        if (stack.length === 0) return false;
        stack.pop();
      }
    }
    return stack.length === 0;
  }

  // Tokenizer inkl. neue Operatoren
  function tokenize(expr) {
    const regex = /(sin⁻¹|cos⁻¹|tan⁻¹|sin|cos|tan|log|ln|√|π|mod|e)|(\d+(\.\d+)?)|[+\-×÷^%()]|²|³|!/g;
    let tokens = [];
    let match;
    while ((match = regex.exec(expr)) !== null) {
      tokens.push(match[0]);
    }

    // Negative Zahlen direkt vorzeichen-richtig verarbeiten
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] === '-' && (i === 0 || ['+', '-', '×', '÷', 'mod', '^', '('].includes(tokens[i - 1]))) {
        tokens[i + 1] = '-' + tokens[i + 1];
        tokens.splice(i, 1);
      }
    }

    // Implizite Multiplikation einbauen: Zahl gefolgt von π oder sin, cos, tan, Klammer
    const implicitTargets = ['π', 'e', 'sin', 'cos', 'tan', 'ln', 'log', '(', '√'];

    for (let i = 0; i < tokens.length - 1; i++) {
      if ((/^\d+(\.\d+)?$/.test(tokens[i]) || tokens[i] === 'π' || tokens[i] === ')' || tokens[i] === 'e') &&
        (implicitTargets.includes(tokens[i + 1]) || /^\d+(\.\d+)?$/.test(tokens[i + 1]))) {
        tokens.splice(i + 1, 0, '×');
        i++; // Weiter nach der eingefügten Multiplikation prüfen
      }
    }

    return tokens;
  }


  // Fakultät (rekursiv)
  function factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    return n * factorial(n - 1);
  }

  // Priorität
  function precedence(op) {
    if (op === '+' || op === '-') return 1;
    if (op === '×' || op === '÷' || op === 'mod') return 2;
    if (op === '^') return 3;
    if (op === 'sin' || op === 'cos' || op === 'tan' || op === '√' || op === '!') return 4;
    return 0;
  }

  // Rechnen
  function compute(numStack, opStack) {

    let op = opStack.pop();

    if (op === '!') {
      let a = numStack.pop();
      numStack.push(factorial(a));
    }
    else if (op === '²') {
      let a = numStack.pop();
      numStack.push(a ** 2);
    }
    else if (op === '³') {
      let a = numStack.pop();
      numStack.push(a ** 3);
    }
    else if (op === '%') {
      let a = numStack.pop();
      numStack.push(a / 100);
    }
    else if (['sin', 'cos', 'tan', 'sin⁻¹', 'cos⁻¹', 'tan⁻¹', '√', 'log', 'ln'].includes(op)) {
      let a = numStack.pop();
      if (op === 'sin') numStack.push(Math.sin(a * Math.PI / 180));
      if (op === 'cos') numStack.push(Math.cos(a * Math.PI / 180));
      if (op === 'tan') numStack.push(Math.tan(a * Math.PI / 180));
      if (op === 'sin⁻¹') numStack.push(Math.asin(a) * 180 / Math.PI);
      if (op === 'cos⁻¹') numStack.push(Math.acos(a) * 180 / Math.PI);
      if (op === 'tan⁻¹') numStack.push(Math.atan(a) * 180 / Math.PI);
      if (op === '√') numStack.push(Math.sqrt(a));
      if (op === 'log') numStack.push(Math.log10(a));  // log zur Basis 10
      if (op === 'ln') numStack.push(Math.log(a));     // natürlicher Logarithmus
    } else {
      let b = numStack.pop();
      let a = numStack.pop();
      if (op === '+') numStack.push(a + b);
      if (op === '-') numStack.push(a - b);
      if (op === '×') numStack.push(a * b);
      if (op === '÷') {
        if (b === 0) throw new Error("Division by zero");
        numStack.push(a / b);
      };
      if (op === 'mod') numStack.push(a % b);
      if (op === '^') numStack.push(a ** b);
    }
  }

  // Shunting Yard Algorithmus + Berechnung
  function evaluate(tokens) {
    let numStack = [];
    let opStack = [];

    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i];
      if (!isNaN(token)) {
        numStack.push(parseFloat(token));
      } else if (token === 'π') {
        numStack.push(Math.PI);
      } else if (token === 'e') {    // <- NEU!
        numStack.push(Math.E);
      }
      else if (token === '(') {
        opStack.push(token);
      } else if (token === ')') {
        while (opStack.length && opStack[opStack.length - 1] !== '(') compute(numStack, opStack);
        opStack.pop(); // '(' entfernen
      } else {
        while (opStack.length && precedence(opStack[opStack.length - 1]) >= precedence(token)) compute(numStack, opStack);
        opStack.push(token);
      }
    }
    while (opStack.length) compute(numStack, opStack);
    return numStack[0];
  }

  // Berechnen mit History
  function calculate(expression) {
    if (!isValidExpression(expression)) return "Error";

    let tokens = tokenize(expression);
    let history = tokens.join('') + "=";
    let result = evaluate(tokens);

    return { history, result };
  }

  // = Button
  execute.on("click", function () {
    if (powerOn) {
      try {
        let lines = display.val().split("\n");
        let currentExpression = lines[lines.length - 1];
        let { history, result } = calculate(currentExpression);

        if (result === "Error" || isNaN(result)) {
          display.val("Error");
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


  //Binär-Rechner

  function validateDecimal(input) {
    if (input === null || input.trim() === "" || isNaN(input)) {
      alert("Bitte eine gültige Dezimalzahl eingeben!");
      return false;
    }
    return true;
  }

  // Dezimal zu Binär
  $("#decToBin").click(function () {
    if (!powerOn) return;

    let dec = prompt("Gib eine Dezimalzahl ein:");
    if (validateDecimal(dec)) {
      let bin = parseInt(dec, 10).toString(2);
      updateDisplay(`${dec} (dez) = ${bin} (bin)`);
    }
  });

  // Binär zu Dezimal
  $("#binToDec").click(function () {
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
  $("#decToOct").click(function () {
    if (!powerOn) return;

    let dec = prompt("Gib eine Dezimalzahl ein:");
    if (validateDecimal(dec)) {
      let oct = parseInt(dec, 10).toString(8);
      updateDisplay(`${dec} (dez) = ${oct} (oct)`);
    }
  });

  // Oktal zu Dezimal
  $("#octToDec").click(function () {
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
  $("#decToHex").click(function () {
    if (!powerOn) return;

    let dec = prompt("Gib eine Dezimalzahl ein:");
    if (validateDecimal(dec)) {
      let hex = parseInt(dec, 10).toString(16).toUpperCase();
      updateDisplay(`${dec} (dez) = ${hex} (hex)`);
    }
  });

  // Hexadezimal zu Dezimal
  $("#hexToDec").click(function () {
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