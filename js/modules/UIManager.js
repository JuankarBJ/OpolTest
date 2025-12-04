export class UIManager {
    constructor() {
        this.elements = {
            setupContainer: document.getElementById('setup-container'),
            materiasContainer: document.getElementById('materias-container'),
            totalAvailable: document.getElementById('total-available-questions'),
            // Removed slider, added preset container
            presetButtonsContainer: document.getElementById('preset-buttons-container'),
            input: document.getElementById('num-questions-input'),
            startButton: document.getElementById('start-button'),
            quizLayout: document.getElementById('quiz-page-layout'),
            questionsContainer: document.getElementById('all-questions-container'),
            questionGrid: document.getElementById('question-grid'),
            finishButton: document.getElementById('finish-button'),
            finishButtonContainer: document.getElementById('finish-button-container'),
            modal: document.getElementById('modal-overlay'),
            resultsContainer: document.getElementById('results-container'),
            quizTitle: document.getElementById('quiz-title'),
            // New Elements (Sidebar Actions)
            actionsContainer: document.getElementById('sidebar-actions'),
            btnSave: document.getElementById('action-save'),
            btnFinish: document.getElementById('action-finish'),
            btnRedo: document.getElementById('action-redo'),
            btnRetryFailed: document.getElementById('action-retry-failed'),
            btnExportXml: document.getElementById('action-export-xml'),
            btnExit: document.getElementById('action-exit'),

            modeSelectorContainer: document.getElementById('mode-selector-container'),
            blockSelectorContainer: document.getElementById('block-selector-container'),
            fileInput: document.getElementById('xml-upload'),

            // Phase 5: Modal Selection
            selectionModal: document.getElementById('selection-modal'),
            openSelectionBtn: document.getElementById('open-selection-modal'),
            closeSelectionBtn: document.getElementById('close-selection-modal'),
            confirmSelectionBtn: document.getElementById('confirm-selection'),
            selectionSummary: document.getElementById('selection-summary'),
            selectionTabs: document.getElementById('selection-tabs'),

            // Mobile Toggle
            mobileToggle: document.getElementById('mobile-sidebar-toggle'),
            toggleIcon: document.getElementById('toggle-icon'),
            toggleText: document.getElementById('toggle-text'),
            quizSidebar: document.getElementById('quiz-sidebar')
        };

        this.bindEvents();
    }

    bindEvents() {
        // Modal Selection Events
        if (this.elements.openSelectionBtn) {
            this.elements.openSelectionBtn.addEventListener('click', () => {
                this.elements.selectionModal.classList.remove('hidden');
            });
        }
        if (this.elements.closeSelectionBtn) {
            this.elements.closeSelectionBtn.addEventListener('click', () => {
                this.elements.selectionModal.classList.add('hidden');
            });
        }
        if (this.elements.confirmSelectionBtn) {
            this.elements.confirmSelectionBtn.addEventListener('click', () => {
                this.elements.selectionModal.classList.add('hidden');
                this.updateSelectionSummary();
            });
        }

        // Modal closing (General & Selection)
        this.elements.modal.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) this.hideModal();
        });
        this.elements.selectionModal.addEventListener('click', (e) => {
            if (e.target === this.elements.selectionModal) this.elements.selectionModal.classList.add('hidden');
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.elements.modal.classList.contains('visible')) this.hideModal();
                if (!this.elements.selectionModal.classList.contains('hidden')) this.elements.selectionModal.classList.add('hidden');
            }
        });

        // Mobile Sidebar Toggle
        if (this.elements.mobileToggle) {
            this.elements.mobileToggle.addEventListener('click', () => {
                this.elements.quizSidebar.classList.toggle('expanded');
                const isExpanded = this.elements.quizSidebar.classList.contains('expanded');
                this.elements.toggleIcon.textContent = isExpanded ? '▼' : '▲';
                this.elements.toggleText.textContent = isExpanded ? 'Ocultar Preguntas' : 'Mostrar Preguntas';
            });
        }
    }

    renderModeSelector(onChange) {
        // Simple toggle or radio buttons for Random vs Fixed
        this.elements.modeSelectorContainer.innerHTML = `
            <div class="mode-toggle">
                <input type="radio" name="quiz-mode" id="mode-random" value="random" checked>
                <label for="mode-random">Aleatorio</label>
                
                <input type="radio" name="quiz-mode" id="mode-fixed" value="fixed">
                <label for="mode-fixed">Por Bloques</label>
            </div>
        `;
        this.elements.modeSelectorContainer.addEventListener('change', (e) => onChange(e.target.value));
    }

    renderBlockSelector(totalQuestions, blockSize, onSelect) {
        const numBlocks = Math.ceil(totalQuestions / blockSize);
        let html = '<select id="block-select" class="block-select">';
        for (let i = 0; i < numBlocks; i++) {
            const start = i * blockSize + 1;
            const end = Math.min((i + 1) * blockSize, totalQuestions);
            html += `<option value="${i}">Test ${i + 1} (Preguntas ${start}-${end})</option>`;
        }
        html += '</select>';

        this.elements.blockSelectorContainer.innerHTML = html;
        this.elements.blockSelectorContainer.classList.remove('hidden');

        // Hide random controls
        document.querySelector('.config-controls').classList.add('hidden');
    }

    hideBlockSelector() {
        this.elements.blockSelectorContainer.classList.add('hidden');
        document.querySelector('.config-controls').classList.remove('hidden');
    }

    toggleActions(visible, mode = 'quiz') {
        if (!visible) {
            this.elements.actionsContainer.classList.add('hidden');
            return;
        }
        this.elements.actionsContainer.classList.remove('hidden');

        // Hide all first
        this.elements.btnSave.classList.add('hidden');
        this.elements.btnFinish.classList.add('hidden');
        this.elements.btnRedo.classList.add('hidden');
        this.elements.btnRetryFailed.classList.add('hidden');
        this.elements.btnExportXml.classList.add('hidden');

        // Always show exit
        this.elements.btnExit.classList.remove('hidden');

        if (mode === 'quiz') {
            this.elements.btnSave.classList.remove('hidden');
            this.elements.btnFinish.classList.remove('hidden');
        } else if (mode === 'review') {
            this.elements.btnRedo.classList.remove('hidden');
            this.elements.btnRetryFailed.classList.remove('hidden');
            this.elements.btnExportXml.classList.remove('hidden');
        }
    }

    renderPresetButtons(onChange) {
        const presets = [10, 20, 30, 40, 50, 60, 70];
        this.elements.presetButtonsContainer.innerHTML = '';

        presets.forEach(num => {
            const btn = document.createElement('button');
            btn.className = 'preset-btn';
            btn.textContent = num;
            btn.dataset.value = num;
            if (num === 30) btn.classList.add('active'); // Default

            btn.addEventListener('click', () => {
                // Update active state
                this.elements.presetButtonsContainer.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Update hidden input
                this.elements.input.value = num;
                onChange(num);
            });

            this.elements.presetButtonsContainer.appendChild(btn);
        });
    }

    updateSelectionSummary() {
        const { checkedBoxes, mode } = this.getSelectedOptions();
        const count = checkedBoxes.length;
        const type = mode === 'leyes' ? (count === 1 ? 'Ley' : 'Leyes') : (count === 1 ? 'Tema' : 'Temas');

        if (count === 0) {
            this.elements.selectionSummary.innerHTML = '<p>No hay materias seleccionadas.</p>';
        } else {
            const names = checkedBoxes.map(box => box.nextElementSibling.textContent).join(', ');
            this.elements.selectionSummary.innerHTML = `
                <p><strong>${count} ${type} seleccionada${count > 1 ? 's' : ''}:</strong> ${names}</p>
            `;
        }
    }

    renderTabs(onTabChange) {
        // Use the container inside the modal
        const tabContainer = this.elements.selectionTabs;

        tabContainer.innerHTML = `
            <button class="tab-btn active" data-tab="leyes">Leyes</button>
            <button class="tab-btn" data-tab="temas">Temas</button>
            <button class="tab-btn" data-tab="examenes">Exámenes</button>
        `;

        const buttons = tabContainer.querySelectorAll('.tab-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                onTabChange(btn.dataset.tab);
            });
        });
    }

    renderMateriaCards(tests, onSelectionChange) {
        this.elements.materiasContainer.innerHTML = '';
        this.elements.materiasContainer.dataset.mode = 'leyes'; // Track mode
        tests.forEach(test => {
            const card = document.createElement('div');
            card.classList.add('materia-card', 'compact'); // Added compact class
            card.innerHTML = `
                <input type="checkbox" id="${test.id}" data-type="ley" data-questions="${test.total_preguntas}" value="${test.valor}">
                <label for="${test.id}">${test.nombre}</label>
                <div class="materia-info"><span>${test.total_preguntas} pregs.</span></div>
            `;
            this.elements.materiasContainer.appendChild(card);
        });

        this.elements.materiasContainer.addEventListener('change', () => onSelectionChange());
    }

    renderTopicCards(topics, onSelectionChange) {
        this.elements.materiasContainer.innerHTML = '';
        this.elements.materiasContainer.dataset.mode = 'temas'; // Track mode
        topics.forEach(topic => {
            // Calculate total questions for this topic
            const totalQuestions = topic.fuentes.reduce((sum, f) => sum + f.indices.length, 0);

            const card = document.createElement('div');
            card.classList.add('materia-card', 'compact'); // Added compact class
            card.innerHTML = `
                <input type="checkbox" id="${topic.id}" data-type="tema" data-questions="${totalQuestions}" value="${topic.id}">
                <label for="${topic.id}">${topic.nombre}</label>
                <div class="materia-info"><span>${totalQuestions} pregs.</span></div>
            `;
            this.elements.materiasContainer.appendChild(card);
        });

        // Re-attach listener since we cleared innerHTML
        this.elements.materiasContainer.addEventListener('change', () => onSelectionChange());
    }

    renderExamCards(exams, onSelectionChange) {
        this.elements.materiasContainer.innerHTML = '';
        this.elements.materiasContainer.dataset.mode = 'examenes'; // Track mode
        exams.forEach(exam => {
            const card = document.createElement('div');
            card.classList.add('materia-card', 'compact');
            card.innerHTML = `
                <input type="checkbox" id="${exam.id}" data-type="examen" data-questions="${exam.total_preguntas}" value="${exam.id}">
                <label for="${exam.id}">${exam.nombre}</label>
                <div class="materia-info"><span>${exam.total_preguntas} pregs.</span></div>
            `;
            this.elements.materiasContainer.appendChild(card);
        });

        this.elements.materiasContainer.addEventListener('change', () => onSelectionChange());
    }

    updateAvailableCount(count) {
        this.elements.totalAvailable.textContent = count;

        // Update preset buttons availability
        const buttons = this.elements.presetButtonsContainer.querySelectorAll('.preset-btn');
        let maxAvailable = 0;

        buttons.forEach(btn => {
            const val = parseInt(btn.dataset.value, 10);
            if (val > count) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.classList.remove('active');
            } else {
                btn.disabled = false;
                btn.style.opacity = '1';
                maxAvailable = Math.max(maxAvailable, val);
            }
        });

        // Ensure current selection is valid
        let currentVal = parseInt(this.elements.input.value, 10);
        if (currentVal > count) {
            // Select the largest possible button
            const validBtns = Array.from(buttons).filter(b => !b.disabled);
            if (validBtns.length > 0) {
                const lastBtn = validBtns[validBtns.length - 1];
                lastBtn.click();
            } else {
                this.elements.input.value = 0;
            }
        }

        this.elements.startButton.disabled = (count === 0 || parseInt(this.elements.input.value, 10) < 1);
    }

    getSelectedOptions() {
        const checkedBoxes = Array.from(this.elements.materiasContainer.querySelectorAll('input[type="checkbox"]:checked'));
        const numQuestions = parseInt(this.elements.input.value, 10);
        const mode = this.elements.materiasContainer.dataset.mode || 'leyes';
        return { checkedBoxes, numQuestions, mode };
    }

    showLoading() {
        this.elements.setupContainer.innerHTML = '<h2>Cargando y preparando preguntas, por favor espera...</h2>';
    }

    showError(message) {
        this.elements.setupContainer.innerHTML = `<p style="color:red;">${message}</p>`;
    }

    startQuizDisplay() {
        this.elements.setupContainer.classList.add('hidden');
        this.elements.quizLayout.classList.remove('hidden');
    }

    renderQuestions(questions) {
        this.elements.questionsContainer.innerHTML = '';
        this.elements.questionGrid.innerHTML = '';

        questions.forEach((question, index) => {
            // Render Options
            let optionsHTML = '';
            for (const key in question.opciones) {
                optionsHTML += `
                    <input type="radio" name="pregunta-${index}" id="q${index}_${key}" value="${key}">
                    <label for="q${index}_${key}"><b>${key.toUpperCase()}.</b> ${question.opciones[key]}</label>
                `;
            }

            // Render Question Block
            const questionBlock = document.createElement('div');
            questionBlock.classList.add('question-block');
            questionBlock.id = `question-${index}`;
            questionBlock.innerHTML = `
                <div class="question-header">
                    <span class="question-number">${index + 1}.</span>
                    <div class="question-content">
                        <span class="question-theme">${question.tema}</span>
                        <p class="question-text">${question.pregunta}</p>
                    </div>
                </div>
                <div class="options-group" data-question-index="${index}">
                    ${optionsHTML}
                </div>
                <div class="explanation hidden"></div>
            `;
            this.elements.questionsContainer.appendChild(questionBlock);

            // Render Grid Item
            const gridItem = document.createElement('a');
            gridItem.classList.add('grid-item');
            gridItem.textContent = index + 1;
            gridItem.href = `#question-${index}`;
            gridItem.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById(`question-${index}`).scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            this.elements.questionGrid.appendChild(gridItem);
        });
    }

    bindAnswerEvents(onAnswer) {
        this.elements.questionsContainer.addEventListener('change', (e) => {
            if (e.target.type === 'radio') {
                const questionIndex = parseInt(e.target.name.split('-')[1], 10);
                const value = e.target.value;

                // Update Grid
                const gridItem = this.elements.questionGrid.children[questionIndex];
                gridItem.classList.add('answered');

                onAnswer(questionIndex, value);
            }
        });
    }

    showResultsModal(resultsHTML, onReview, onRestart) {
        this.elements.resultsContainer.innerHTML = resultsHTML;

        // Bind buttons in the new HTML
        document.getElementById('review-button').addEventListener('click', onReview);
        document.getElementById('restart-button').addEventListener('click', onRestart);

        this.showModal();
    }

    showModal() {
        this.elements.modal.classList.remove('hidden');
        setTimeout(() => {
            this.elements.modal.classList.add('visible');
            document.body.classList.add('modal-open');
        }, 10);
    }

    hideModal() {
        this.elements.modal.classList.remove('visible');
        document.body.classList.remove('modal-open');
        setTimeout(() => {
            this.elements.modal.classList.add('hidden');
        }, 300);
    }

    enterReviewMode(questions, userAnswers) {
        this.hideModal();
        this.elements.quizTitle.textContent = "Modo Revisión";

        questions.forEach((q, i) => {
            const questionBlock = document.getElementById(`question-${i}`);
            const optionsGroup = questionBlock.querySelector('.options-group');
            const explanationDiv = questionBlock.querySelector('.explanation');
            const gridItem = this.elements.questionGrid.children[i];

            optionsGroup.classList.add('review-mode');
            const userChoice = userAnswers[i];

            if (!userChoice) {
                gridItem.classList.add('unanswered');
            } else if (userChoice === q.respuestaCorrecta) {
                gridItem.classList.add('correct');
            } else {
                gridItem.classList.add('incorrect');
                // Highlight incorrect user choice
                const userLabel = optionsGroup.querySelector(`label[for="q${i}_${userChoice}"]`);
                if (userLabel) userLabel.classList.add('incorrect');
            }

            // Always highlight correct answer
            const correctLabel = optionsGroup.querySelector(`label[for="q${i}_${q.respuestaCorrecta}"]`);
            if (correctLabel) correctLabel.classList.add('correct');

            explanationDiv.innerHTML = q.explicacion;
            explanationDiv.classList.remove('hidden');

            // Disable inputs
            optionsGroup.querySelectorAll('input').forEach(radio => radio.disabled = true);
        });

        this.elements.quizLayout.scrollIntoView({ behavior: 'smooth' });
    }
}
