"use strict";

// Tokenizer inkl. neue Operatoren
export function tokenize(expr) {
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

