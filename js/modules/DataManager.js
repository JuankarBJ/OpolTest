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
    static async loadTopics() {
        try {
            const response = await fetch('data/topics.json');
            if (!response.ok) throw new Error('Failed to load topics');
            return await response.json();
        } catch (error) {
            console.error("Error loading topics:", error);
            throw error;
        }
    }

    static async fetchQuestionsByTopic(topicIds, numQuestions, blockIndex = null, blockSize = 30) {
        // topicIds: array of strings (e.g., ["tema1", "tema3"])
        try {
            const topics = await this.loadTopics();
            const selectedTopics = topics.filter(t => topicIds.includes(t.id));

            // Gather all source requests
            // We need to fetch files and extract specific indices
            const fileRequests = {}; // "file.json": [index1, index2...]

            selectedTopics.forEach(topic => {
                topic.fuentes.forEach(fuente => {
                    if (!fileRequests[fuente.archivo]) {
                        fileRequests[fuente.archivo] = new Set();
                    }
                    fuente.indices.forEach(idx => fileRequests[fuente.archivo].add(idx));
                });
            });

            // Fetch files and extract questions
            const promises = Object.keys(fileRequests).map(async (filePath) => {
                const response = await fetch(filePath);
                if (!response.ok) throw new Error(`Failed to load ${filePath}`);
                const allQuestions = await response.json();
                const indices = Array.from(fileRequests[filePath]);

                // Extract only requested indices
                return indices.map(idx => {
                    if (allQuestions[idx]) return allQuestions[idx];
                    return null;
                }).filter(q => q !== null);
            });

            const questionSubsets = await Promise.all(promises);
            const allQuestions = questionSubsets.flat();

            if (blockIndex !== null) {
                // Block Mode: Slice specific range
                // Note: Questions are NOT randomized in block mode to ensure consistency
                const start = blockIndex * blockSize;
                const end = start + blockSize;
                return allQuestions.slice(start, end);
            } else {
                // Random Mode: Randomize and limit
                allQuestions.sort(() => Math.random() - 0.5);
                return allQuestions.slice(0, numQuestions);
            }

        } catch (error) {
            console.error("Error fetching questions by topic:", error);
            throw error;
        }
    }
    static async loadExams() {
        try {
            const response = await fetch('data/exams.json');
            if (!response.ok) throw new Error('Failed to load exams');
            return await response.json();
        } catch (error) {
            console.error("Error loading exams:", error);
            throw error;
        }
    }

    static async fetchQuestionsByExam(examId) {
        try {
            const exams = await this.loadExams();
            const exam = exams.find(e => e.id === examId);
            if (!exam) throw new Error("Exam not found");

            // Gather all source requests
            const fileRequests = {};

            exam.fuentes.forEach(fuente => {
                if (!fileRequests[fuente.archivo]) {
                    fileRequests[fuente.archivo] = new Set();
                }
                fuente.indices.forEach(idx => fileRequests[fuente.archivo].add(idx));
            });

            // Fetch files and extract questions
            const promises = Object.keys(fileRequests).map(async (filePath) => {
                const response = await fetch(filePath);
                if (!response.ok) throw new Error(`Failed to load ${filePath}`);
                const allQuestions = await response.json();
                const indices = Array.from(fileRequests[filePath]);

                // Extract only requested indices and preserve order if needed, 
                // but for exams we usually want the specific set.
                // We'll map indices to questions.
                return indices.map(idx => {
                    if (allQuestions[idx]) return allQuestions[idx];
                    return null;
                }).filter(q => q !== null);
            });

            const questionSubsets = await Promise.all(promises);
            const allQuestions = questionSubsets.flat();

            // For real exams, we might want a specific order, but for now we'll just return the set.
            // If the exam defines a specific order via the sources, this preserves it roughly 
            // (file by file). If we need exact question order, the JSON structure would need to be different.
            // Assuming random order within the exam subset is NOT desired, but usually exams have a fixed order.
            // However, our current structure gathers by file. 
            // Let's shuffle them for now to simulate a "generated" exam from that pool, 
            // OR keep them as is. Let's keep them as is (by file order) for consistency.

            return allQuestions;

        } catch (error) {
            console.error("Error fetching exam questions:", error);
            throw error;
        }
    }
}
