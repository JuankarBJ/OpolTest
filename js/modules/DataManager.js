export class DataManager {
    static async loadConfig() {
        try {
            const response = await fetch('config.json');
            if (!response.ok) throw new Error('Failed to load config');
            const data = await response.json();
            return data.tests;
        } catch (error) {
            console.error("Error loading config:", error);
            throw error;
        }
    }

    static async fetchQuestions(sources) {
        // sources: [{ path, count }]
        const promises = sources.map(source =>
            fetch(source.path)
                .then(res => {
                    if (!res.ok) throw new Error(`Failed to load ${source.path}`);
                    return res.json();
                })
                .then(questions => {
                    // Randomize and slice
                    questions.sort(() => Math.random() - 0.5);
                    return questions.slice(0, source.count);
                })
        );

        const questionSubsets = await Promise.all(promises);
        const allQuestions = questionSubsets.flat();
        allQuestions.sort(() => Math.random() - 0.5);
        return allQuestions;
    }

    static async fetchQuestionsByBlock(sourcePath, blockIndex, blockSize) {
        console.log(`[DataManager] Fetching block: Path=${sourcePath}, Index=${blockIndex}, Size=${blockSize}`);
        try {
            const response = await fetch(sourcePath);
            if (!response.ok) {
                console.error(`[DataManager] Fetch failed: ${response.status} ${response.statusText}`);
                throw new Error(`Failed to load ${sourcePath}`);
            }
            const allQuestions = await response.json();
            console.log(`[DataManager] Loaded ${allQuestions.length} questions from ${sourcePath}`);

            const start = blockIndex * blockSize;
            const end = start + blockSize;
            console.log(`[DataManager] Slicing from ${start} to ${end}`);

            const sliced = allQuestions.slice(start, end);
            console.log(`[DataManager] Returning ${sliced.length} questions`);
            return sliced;
        } catch (error) {
            console.error("[DataManager] Error loading block:", error);
            throw error;
        }
    }
}
