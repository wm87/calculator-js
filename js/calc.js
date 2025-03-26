"use strict";

import { tokenize } from './utils.js';


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

// Berechnung der Eingabe
export function calculate(expression) {

    if (!isValidExpression(expression)) return { history: expression, result: "Error" };

    let tokens = tokenize(expression);

    let history = tokens.join('') + "=";
    let result = evaluate(tokens);

    return { history, result };
}