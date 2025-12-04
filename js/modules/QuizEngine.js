export class QuizEngine {
    constructor() {
        this.questions = [];
        this.userAnswers = {}; // { questionIndex: value }
    }

    init(questions) {
        this.questions = questions;
        this.userAnswers = {};
    }

    saveAnswer(index, value) {
        this.userAnswers[index] = value;
    }

    getAnswer(index) {
        return this.userAnswers[index];
    }

    calculateResults() {
        let correct = 0, incorrect = 0, unanswered = 0;
        const themeCounts = {};
        const failedQuestions = [];

        this.questions.forEach((q, i) => {
            // Theme stats
            themeCounts[q.tema] = (themeCounts[q.tema] || 0) + 1;

            const selectedValue = this.userAnswers[i];

            if (!selectedValue) {
                unanswered++;
            } else if (selectedValue === q.respuestaCorrecta) {
                correct++;
            } else {
                incorrect++;
                failedQuestions.push(q);
            }
        });

        const netScore = correct - (incorrect / 3);
        const finalGrade = Math.max(0, (netScore / this.questions.length) * 10);

        return {
            correct,
            incorrect,
            unanswered,
            netScore,
            finalGrade,
            themeCounts,
            failedQuestions,
            totalQuestions: this.questions.length
        };
    }

    getState() {
        return {
            questions: this.questions,
            userAnswers: this.userAnswers
        };
    }

    restoreState(state) {
        this.questions = state.questions || [];
        this.userAnswers = state.userAnswers || {};
    }
}
