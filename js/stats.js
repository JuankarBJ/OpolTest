import { StorageManager } from './modules/StorageManager.js';

document.addEventListener('DOMContentLoaded', () => {
    loadStatistics();
});

function loadStatistics() {
    const history = StorageManager.getExamHistory();

    // Update Summary Cards
    document.getElementById('total-tests').textContent = history.length;

    if (history.length > 0) {
        const totalScore = history.reduce((sum, item) => sum + item.score, 0);
        const avg = totalScore / history.length;
        document.getElementById('avg-grade').textContent = avg.toFixed(2);

        const best = Math.max(...history.map(item => item.score));
        document.getElementById('best-grade').textContent = best.toFixed(2);

        document.getElementById('no-data-msg').style.display = 'none';
        renderChart(history);
        renderHistoryList(history);
    }
}

function renderChart(history) {
    const container = document.getElementById('chart-container');
    // Take last 10 items and reverse to show oldest to newest left-to-right
    const recent = history.slice(0, 10).reverse();

    recent.forEach((item, index) => {
        const height = (item.score / 10) * 100; // Assuming max score 10
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = `${height}%`;
        bar.title = `Nota: ${item.score.toFixed(2)}`;

        // Color coding
        if (item.score >= 5) bar.style.backgroundColor = 'var(--success)';
        else bar.style.backgroundColor = 'var(--danger)';

        const value = document.createElement('div');
        value.className = 'bar-value';
        value.textContent = item.score.toFixed(1);

        const label = document.createElement('div');
        label.className = 'bar-label';
        label.textContent = new Date(item.date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' });

        bar.appendChild(value);
        bar.appendChild(label);
        container.appendChild(bar);
    });
}

function renderHistoryList(history) {
    const list = document.getElementById('history-list');
    list.innerHTML = '';

    history.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'history-item';

        const date = new Date(item.date).toLocaleString();
        const isPass = item.score >= 5;
        const gradeClass = isPass ? 'grade-pass' : 'grade-fail';

        li.innerHTML = `
            <div class="history-info">
                <h4>Examen #${history.length - index}</h4>
                <div class="history-meta">${date} • ${item.total} Preguntas</div>
            </div>
            <div style="display:flex; align-items:center;">
                <div class="grade-badge ${gradeClass}">${item.score.toFixed(2)}</div>
                <button class="repeat-btn" onclick="repeatExam(${index})">Repetir</button>
            </div>
        `;
        list.appendChild(li);
    });
}

// Expose to global scope for onclick
window.repeatExam = function (index) {
    const history = StorageManager.getExamHistory();
    const exam = history[index];
    if (exam && exam.questions) {
        if (confirm("¿Quieres repetir este examen exacto?")) {
            StorageManager.saveRepeatExam(exam.questions);
            window.location.href = 'index.html';
        }
    } else {
        alert("No se pueden recuperar las preguntas de este examen.");
    }
};
