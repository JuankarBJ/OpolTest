const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'anki_fragment.txt');
const outputFile = path.join(__dirname, 'data', 'Guadalajara2024.json');

try {
    const data = fs.readFileSync(inputFile, 'utf8');
    const lines = data.split('\n');
    const questions = [];

    for (const line of lines) {
        if (!line.trim() || line.startsWith('#')) continue;

        const parts = line.split('\t');
        if (parts.length < 8) continue;

        // 0: ID
        // 1: Tema
        // 2: Pregunta
        // 3-6: Opciones
        // 7: Correcta
        // ... Tags

        let questionText = parts[2].trim();
        // Remove leading "1. - " etc
        questionText = questionText.replace(/^\d+[\.\-\s]+/, '');

        // Handle tags: sometimes empty columns at the end
        // The sample has "TestReal" at the very end.
        let tags = [];
        const lastCol = parts[parts.length - 1].trim();
        if (lastCol) {
            tags = lastCol.split(' ');
        }

        const question = {
            id: questions.length + 1,
            tema: parts[1],
            pregunta: questionText,
            opciones: {
                a: parts[3],
                b: parts[4],
                c: parts[5],
                d: parts[6]
            },
            respuestaCorrecta: parts[7].toLowerCase(),
            explicacion: "",
            tags: tags
        };
        questions.push(question);
    }

    fs.writeFileSync(outputFile, JSON.stringify(questions, null, 4), 'utf8');
    console.log(`Successfully converted ${questions.length} questions to ${outputFile}`);

} catch (err) {
    console.error(err);
}
