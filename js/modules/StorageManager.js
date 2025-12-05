export class StorageManager {
    static CURRENT_SESSION_KEY = 'opo_current_session';
    static FAILED_QUESTIONS_KEY = 'opo_failed_questions';
    static EXAM_HISTORY_KEY = 'opo_exam_history';
    static REPEAT_EXAM_KEY = 'opo_repeat_exam';

    // --- LocalStorage: Session ---

    static saveCurrentSession(state) {
        try {
            localStorage.setItem(this.CURRENT_SESSION_KEY, JSON.stringify(state));
            console.log("Session saved locally.");
        } catch (e) {
            console.error("Failed to save session:", e);
        }
    }

    static loadSession() {
        try {
            const data = localStorage.getItem(this.CURRENT_SESSION_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error("Failed to load session:", e);
            return null;
        }
    }

    static clearSession() {
        localStorage.removeItem(this.CURRENT_SESSION_KEY);
    }

    // --- LocalStorage: Failed Questions ---

    static saveFailedQuestions(failedQuestions) {
        // failedQuestions: Array of { id, tema, pregunta, ... } or just IDs if we had a global DB.
        // Since we don't have a global ID system guaranteed across files, we'll store the full question object 
        // but adding a 'source' or 'id' if available would be better. 
        // For now, we store the full object to ensure we can review it.

        try {
            let currentFailures = this.getFailedQuestions();

            // Avoid duplicates based on question text (primitive check)
            const newFailures = failedQuestions.filter(fq =>
                !currentFailures.some(cf => cf.pregunta === fq.pregunta)
            );

            currentFailures = [...currentFailures, ...newFailures];
            localStorage.setItem(this.FAILED_QUESTIONS_KEY, JSON.stringify(currentFailures));
        } catch (e) {
            console.error("Failed to save failures:", e);
        }
    }

    static getFailedQuestions() {
        try {
            const data = localStorage.getItem(this.FAILED_QUESTIONS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    // --- LocalStorage: Exam History ---

    static saveExamResult(result) {
        try {
            const history = this.getExamHistory();
            // Add timestamp if not present
            if (!result.date) result.date = new Date().toISOString();

            // Add to beginning of array
            history.unshift(result);

            // Limit history to last 50 exams to save space
            if (history.length > 50) history.pop();

            localStorage.setItem(this.EXAM_HISTORY_KEY, JSON.stringify(history));
        } catch (e) {
            console.error("Failed to save exam history:", e);
        }
    }

    static getExamHistory() {
        try {
            const data = localStorage.getItem(this.EXAM_HISTORY_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    // --- LocalStorage: Repeat Exam ---

    static saveRepeatExam(questions) {
        try {
            localStorage.setItem(this.REPEAT_EXAM_KEY, JSON.stringify(questions));
        } catch (e) {
            console.error("Failed to save repeat exam:", e);
        }
    }

    static loadRepeatExam() {
        try {
            const data = localStorage.getItem(this.REPEAT_EXAM_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    static clearRepeatExam() {
        localStorage.removeItem(this.REPEAT_EXAM_KEY);
    }

    // --- XML Export/Import ---

    static exportSessionToXML(state) {
        // state: { questions: [], userAnswers: {}, ... }

        let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<quiz_session>\n';

        // Metadata
        xmlContent += `  <metadata>\n`;
        xmlContent += `    <date>${new Date().toISOString()}</date>\n`;
        xmlContent += `    <total_questions>${state.questions.length}</total_questions>\n`;
        xmlContent += `  </metadata>\n`;

        // Questions & Answers
        xmlContent += `  <questions>\n`;
        state.questions.forEach((q, index) => {
            const userAnswer = state.userAnswers[index] || "";
            xmlContent += `    <question index="${index}">\n`;
            xmlContent += `      <text><![CDATA[${q.pregunta}]]></text>\n`;
            xmlContent += `      <theme><![CDATA[${q.tema}]]></theme>\n`;
            xmlContent += `      <correct_answer>${q.respuestaCorrecta}</correct_answer>\n`;
            xmlContent += `      <user_answer>${userAnswer}</user_answer>\n`;
            xmlContent += `      <explanation><![CDATA[${q.explicacion}]]></explanation>\n`;

            // Options
            xmlContent += `      <options>\n`;
            for (const key in q.opciones) {
                xmlContent += `        <option key="${key}"><![CDATA[${q.opciones[key]}]]></option>\n`;
            }
            xmlContent += `      </options>\n`;

            xmlContent += `    </question>\n`;
        });
        xmlContent += `  </questions>\n`;
        xmlContent += `</quiz_session>`;

        const blob = new Blob([xmlContent], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `opotest_session_${new Date().toISOString().slice(0, 10)}.xml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    static async importSessionFromXML(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(e.target.result, "text/xml");

                    const questions = [];
                    const userAnswers = {};

                    const questionNodes = xmlDoc.getElementsByTagName('question');

                    for (let i = 0; i < questionNodes.length; i++) {
                        const node = questionNodes[i];
                        const index = parseInt(node.getAttribute('index'), 10);

                        const options = {};
                        const optionNodes = node.getElementsByTagName('option');
                        for (let j = 0; j < optionNodes.length; j++) {
                            options[optionNodes[j].getAttribute('key')] = optionNodes[j].textContent;
                        }

                        const question = {
                            pregunta: node.getElementsByTagName('text')[0].textContent,
                            tema: node.getElementsByTagName('theme')[0].textContent,
                            respuestaCorrecta: node.getElementsByTagName('correct_answer')[0].textContent,
                            explicacion: node.getElementsByTagName('explanation')[0].textContent,
                            opciones: options
                        };

                        questions.push(question);

                        const ua = node.getElementsByTagName('user_answer')[0].textContent;
                        if (ua) userAnswers[i] = ua;
                    }

                    resolve({ questions, userAnswers });
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
}
