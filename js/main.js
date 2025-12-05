import { DataManager } from './modules/DataManager.js';
import { QuizEngine } from './modules/QuizEngine.js';
import { UIManager } from './modules/UIManager.js';
import { StorageManager } from './modules/StorageManager.js';

document.addEventListener('DOMContentLoaded', () => {
    const quizEngine = new QuizEngine();
    const uiManager = new UIManager();
    let configData = [];
    let topicsData = [];
    let examsData = []; // New
    let currentMode = 'random'; // 'random' or 'fixed'
    let currentBlockSize = 30;

    // --- Initialization ---
    async function init() {
        try {
            // Check for saved session
            const savedSession = StorageManager.loadSession();
            if (savedSession) {
                if (confirm("Tienes un test guardado a medias. ¿Quieres continuarlo?")) {
                    quizEngine.restoreState(savedSession);
                    uiManager.startQuizDisplay();
                    uiManager.renderQuestions(quizEngine.questions);

                    // Restore answers visually
                    const userAnswers = quizEngine.userAnswers;
                    for (const [index, value] of Object.entries(userAnswers)) {
                        const radio = document.getElementById(`q${index}_${value}`);
                        if (radio) {
                            radio.checked = true;
                            // Trigger change event manually or update grid
                            const gridItem = uiManager.elements.questionGrid.children[index];
                            if (gridItem) gridItem.classList.add('answered');
                        }
                    }

                    uiManager.bindAnswerEvents((index, value) => {
                        quizEngine.saveAnswer(index, value);
                    });
                    uiManager.toggleActions(true, 'quiz');
                    bindActionEvents();
                    return; // Skip normal setup
                } else {
                    StorageManager.clearSession();
                }
            }

            // Check for Repeat Exam Request
            const repeatQuestions = StorageManager.loadRepeatExam();
            if (repeatQuestions) {
                StorageManager.clearRepeatExam(); // Consume the flag
                quizEngine.init(repeatQuestions);
                uiManager.startQuizDisplay();
                uiManager.renderQuestions(repeatQuestions);
                uiManager.toggleActions(true, 'quiz');
                bindActionEvents();

                uiManager.bindAnswerEvents((index, value) => {
                    quizEngine.saveAnswer(index, value);
                });
                return; // Skip normal setup
            }

            // Load Data
            [configData, topicsData, examsData] = await Promise.all([
                DataManager.loadConfig(),
                DataManager.loadTopics(),
                DataManager.loadExams()
            ]);

            // Render Tabs
            uiManager.renderTabs((tab) => {
                // Always show mode selector
                uiManager.elements.modeSelectorContainer.classList.remove('hidden');

                if (tab === 'leyes') {
                    uiManager.renderMateriaCards(configData, () => {
                        updateAvailableQuestions();
                        uiManager.updateSelectionSummary();
                    });
                } else if (tab === 'temas') {
                    uiManager.renderTopicCards(topicsData, () => {
                        updateAvailableQuestions();
                        uiManager.updateSelectionSummary();
                    });
                    // Only hide block selector initially (will be shown by updateAvailableQuestions if needed)
                    uiManager.hideBlockSelector();
                } else if (tab === 'examenes') {
                    uiManager.renderExamCards(examsData, () => {
                        updateAvailableQuestions();
                        uiManager.updateSelectionSummary();
                    });
                    uiManager.hideBlockSelector();
                    // Hide mode selector for exams (always fixed)
                    uiManager.elements.modeSelectorContainer.classList.add('hidden');
                }
                updateAvailableQuestions();
                uiManager.updateSelectionSummary();
            });

            // Initial Render (Leyes)
            uiManager.renderMateriaCards(configData, () => {
                updateAvailableQuestions();
                uiManager.updateSelectionSummary();
            });

            uiManager.renderModeSelector((mode) => {
                currentMode = mode;
                updateAvailableQuestions();
            });

            // Initialize Preset Buttons
            uiManager.renderPresetButtons((val) => {
                // Handle preset click
                updateAvailableQuestions();
            });

            uiManager.updateSelectionSummary();

            // XML Upload Handler
            const uploadBtn = document.createElement('button');
            uploadBtn.textContent = "📂 Cargar Revisión (XML)";
            uploadBtn.className = "xml-upload-btn";
            uploadBtn.onclick = () => uiManager.elements.fileInput.click();
            document.querySelector('.setup-section:last-of-type').appendChild(uploadBtn);

            // Failed Questions Button
            const failedQuestions = StorageManager.getFailedQuestions();
            if (failedQuestions.length > 0) {
                const failedBtn = document.createElement('button');
                failedBtn.textContent = `⚠️ Repasar Fallos (${failedQuestions.length})`;
                failedBtn.className = "xml-upload-btn"; // Reuse style
                failedBtn.style.marginTop = "10px";
                failedBtn.style.borderColor = "var(--danger)";
                failedBtn.style.color = "var(--danger)";

                failedBtn.onclick = () => {
                    if (confirm(`¿Quieres generar un test con tus ${failedQuestions.length} preguntas falladas?`)) {
                        quizEngine.init(failedQuestions);
                        uiManager.startQuizDisplay();
                        uiManager.renderQuestions(failedQuestions);
                        uiManager.toggleActions(true, 'quiz');
                        bindActionEvents();

                        uiManager.bindAnswerEvents((index, value) => {
                            quizEngine.saveAnswer(index, value);
                        });
                    }
                };
                document.querySelector('.setup-section:last-of-type').appendChild(failedBtn);
            }

            uiManager.elements.fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                try {
                    const session = await StorageManager.importSessionFromXML(file);
                    quizEngine.restoreState(session);
                    uiManager.startQuizDisplay();
                    uiManager.renderQuestions(quizEngine.questions);
                    uiManager.enterReviewMode(quizEngine.questions, quizEngine.userAnswers);
                    uiManager.toggleActions(true, 'review');
                    bindActionEvents();
                } catch (err) {
                    alert("Error al leer el archivo XML.");
                    console.error(err);
                }
            });

            updateAvailableQuestions(); // Initial check
        } catch (error) {
            uiManager.showError("Error al cargar la configuración. Por favor, recarga la página.");
            console.error(error);
        }
    }

    // --- Event Handlers ---

    function updateAvailableQuestions() {
        const { checkedBoxes, mode } = uiManager.getSelectedOptions();

        if (mode === 'examenes') {
            uiManager.hideBlockSelector();
            if (checkedBoxes.length === 1) {
                const exam = examsData.find(e => e.id === checkedBoxes[0].id);
                // Force input to exam total and update UI
                uiManager.elements.input.value = exam.total_preguntas;
                uiManager.updateAvailableCount(exam.total_preguntas);
            } else {
                uiManager.updateAvailableCount(0);
            }
            return;
        }

        if (checkedBoxes.length === 1 && currentMode === 'fixed') {
            // Show block selector for both Laws and Topics
            const id = checkedBoxes[0].id;
            let total = 0;

            if (mode === 'leyes') {
                const config = configData.find(t => t.id === id);
                total = parseInt(config.total_preguntas, 10);
            } else if (mode === 'temas') {
                const topic = topicsData.find(t => t.id === id);
                // Calculate total from sources
                total = topic.fuentes.reduce((sum, f) => sum + f.indices.length, 0);
            }

            uiManager.renderBlockSelector(total, currentBlockSize, () => { });

            // Force input to block size for Fixed Mode
            uiManager.elements.input.value = currentBlockSize;
            uiManager.updateAvailableCount(total);
        } else {
            // Random mode or multiple selection
            uiManager.hideBlockSelector();
            let totalQuestions = 0;
            checkedBoxes.forEach(box => {
                totalQuestions += parseInt(box.dataset.questions, 10);
            });
            uiManager.updateAvailableCount(totalQuestions);
        }
    }

    function bindActionEvents() {
        // Quiz Mode Actions
        if (uiManager.elements.btnSave) {
            uiManager.elements.btnSave.onclick = () => {
                StorageManager.saveCurrentSession(quizEngine.getState());
                alert("Sesión guardada. Puedes cerrar la página y continuar luego.");
            };
        }

        if (uiManager.elements.btnFinish) {
            uiManager.elements.btnFinish.onclick = () => {
                finishQuiz();
            };
        }

        // Review Mode Actions
        if (uiManager.elements.btnRedo) {
            uiManager.elements.btnRedo.onclick = () => {
                if (confirm("¿Quieres volver a realizar este mismo test?")) {
                    // Reset answers but keep questions
                    quizEngine.userAnswers = {};
                    uiManager.startQuizDisplay();
                    uiManager.renderQuestions(quizEngine.questions);
                    uiManager.toggleActions(true, 'quiz');
                    bindActionEvents();

                    uiManager.bindAnswerEvents((index, value) => {
                        quizEngine.saveAnswer(index, value);
                    });
                }
            };
        }

        if (uiManager.elements.btnRetryFailed) {
            uiManager.elements.btnRetryFailed.onclick = () => {
                const failedQs = StorageManager.getFailedQuestions();
                if (failedQs.length === 0) {
                    alert("No hay preguntas falladas para repasar.");
                    return;
                }
                if (confirm(`¿Generar test con las ${failedQs.length} preguntas falladas?`)) {
                    quizEngine.init(failedQs);
                    uiManager.startQuizDisplay();
                    uiManager.renderQuestions(failedQs);
                    uiManager.toggleActions(true, 'quiz');
                    bindActionEvents();

                    uiManager.bindAnswerEvents((index, value) => {
                        quizEngine.saveAnswer(index, value);
                    });
                }
            };
        }

        if (uiManager.elements.btnExportXml) {
            uiManager.elements.btnExportXml.onclick = () => {
                StorageManager.exportSessionToXML(quizEngine.getState());
            };
        }

        // Common Actions
        if (uiManager.elements.btnExit) {
            uiManager.elements.btnExit.onclick = () => {
                if (confirm("¿Seguro que quieres salir? Se perderá el progreso no guardado.")) {
                    location.reload();
                }
            };
        }
    }

    function finishQuiz() {
        const results = quizEngine.calculateResults();
        StorageManager.saveFailedQuestions(results.failedQuestions);
        StorageManager.clearSession();

        // Save to History
        StorageManager.saveExamResult({
            date: new Date().toISOString(),
            score: results.finalGrade,
            correct: results.correct,
            incorrect: results.incorrect,
            unanswered: results.unanswered,
            total: results.total,
            questions: quizEngine.questions // Save questions to allow repeating exact test
        });

        // Generate Results HTML
        let breakdownHTML = '<ul class="results-breakdown">';
        for (const theme in results.themeCounts) {
            breakdownHTML += `<li><span>${theme}</span><strong>${results.themeCounts[theme]} p.</strong></li>`;
        }
        breakdownHTML += '</ul>';

        const html = `
            <h1>Resultados del Test</h1>
            <div class="results-summary">
                <p>Respuestas Correctas: <strong style="color:var(--success);">${results.correct}</strong></p>
                <p>Respuestas Incorrectas: <strong style="color:var(--danger);">${results.incorrect}</strong></p>
                <p>Sin Contestar: <strong>${results.unanswered}</strong></p>
                
                <hr>
                <h4>Desglose por Tema</h4>
                ${breakdownHTML}
                <hr>

                <p>Puntos Netos: <strong>${results.netScore.toFixed(3)}</strong></p>
            </div>
            <div class="final-grade-container">
                <p>Nota Final:</p><p class="final-grade">${results.finalGrade.toFixed(2)} / 10</p>
            </div>
            <div class="results-buttons">
                <button id="review-button">Revisar Test</button>
                <button id="restart-button">Hacer otro test</button>
            </div>`;

        uiManager.showResultsModal(
            html,
            () => {
                uiManager.enterReviewMode(quizEngine.questions, quizEngine.userAnswers);
                uiManager.toggleActions(true, 'review');
                bindActionEvents(); // Rebind for review mode
            },
            () => location.reload()
        );
    }

    uiManager.elements.startButton.addEventListener('click', async () => {
        const { checkedBoxes, numQuestions, mode } = uiManager.getSelectedOptions();

        // Capture block index BEFORE showLoading() wipes the DOM
        let blockIndex = 0;
        if (currentMode === 'fixed' && checkedBoxes.length === 1) {
            const blockSelect = document.getElementById('block-select');
            if (blockSelect) {
                blockIndex = parseInt(blockSelect.value, 10);
            }
        }

        uiManager.showLoading();

        try {
            let questions = [];

            if (mode === 'examenes') {
                // Exam Mode
                const examId = checkedBoxes[0].id;
                questions = await DataManager.fetchQuestionsByExam(examId);

            } else if (mode === 'temas') {
                // Topic Mode
                const topicIds = checkedBoxes.map(box => box.id);

                if (currentMode === 'fixed' && checkedBoxes.length === 1) {
                    // Fixed Block Mode (Topic)
                    questions = await DataManager.fetchQuestionsByTopic(topicIds, numQuestions, blockIndex, currentBlockSize);
                } else {
                    // Random Mode (Topic)
                    questions = await DataManager.fetchQuestionsByTopic(topicIds, numQuestions);
                }

            } else if (currentMode === 'fixed' && checkedBoxes.length === 1) {
                // Fixed Block Mode (Leyes)
                const config = configData.find(t => t.id === checkedBoxes[0].id);

                if (!config) throw new Error("Configuración del test no encontrada.");
                if (isNaN(blockIndex)) throw new Error("Índice de bloque inválido o selector no encontrado.");

                console.log(`Loading block ${blockIndex} from ${config.valor}`);
                questions = await DataManager.fetchQuestionsByBlock(config.valor, blockIndex, currentBlockSize);
            } else {
                // Random Mode (Leyes)
                const sources = checkedBoxes.map(box => {
                    const config = configData.find(t => t.id === box.id);
                    return {
                        path: config.valor,
                        available: parseInt(config.total_preguntas, 10)
                    };
                });

                // Distribute questions count logic
                const totalAvailable = sources.reduce((sum, s) => sum + s.available, 0);
                let questionsToFetch = sources.map(s => ({
                    ...s,
                    count: Math.round((s.available / totalAvailable) * numQuestions)
                }));

                let currentSum = questionsToFetch.reduce((sum, s) => sum + s.count, 0);
                let i = 0;
                while (currentSum < numQuestions) {
                    questionsToFetch[i % sources.length].count++;
                    currentSum++;
                    i++;
                }
                while (currentSum > numQuestions) {
                    if (questionsToFetch[i % sources.length].count > 0) {
                        questionsToFetch[i % sources.length].count--;
                        currentSum--;
                    }
                    i++;
                }

                questions = await DataManager.fetchQuestions(questionsToFetch);
            }

            if (questions.length === 0) {
                throw new Error("No se han encontrado preguntas con los criterios seleccionados.");
            }

            quizEngine.init(questions);

            uiManager.startQuizDisplay();
            uiManager.renderQuestions(questions);
            uiManager.toggleActions(true, 'quiz');
            bindActionEvents();

            uiManager.bindAnswerEvents((index, value) => {
                quizEngine.saveAnswer(index, value);
            });

        } catch (error) {
            uiManager.showError(`Error al cargar las preguntas: ${error.message}`);
            console.error(error);
            alert(`Detalles del error:\n${error.message}\n\nRevisa la consola (F12) para más info.`);
        }
    });

    // Finish button (legacy button in sidebar, kept for compatibility but Bottom Bar is preferred)
    if (uiManager.elements.finishButton) {
        uiManager.elements.finishButton.addEventListener('click', () => {
            finishQuiz();
        });
    }

    init();
});
