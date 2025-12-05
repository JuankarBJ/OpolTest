import json
import csv
import sys

def parse_anki(file_path, output_path):
    questions = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            # Anki exports can be weird with quotes, but usually tab separated is simple
            # We'll use csv reader with tab delimiter
            reader = csv.reader(f, delimiter='\t', quoting=csv.QUOTE_NONE)
            
            for row in reader:
                if not row or row[0].startswith('#'):
                    continue
                
                # Ensure we have enough columns. The user sample has at least 8 columns for data + tags
                if len(row) < 8:
                    print(f"Skipping malformed row: {row}")
                    continue

                # Extract fields
                # 0: ID (GUADA1)
                # 1: Tema
                # 2: Pregunta
                # 3: Op A
                # 4: Op B
                # 5: Op C
                # 6: Op D
                # 7: Correct (A/B/C/D)
                # ...
                # Last: Tags
                
                # Clean up question text (sometimes has "1. - " prefix we might want to keep or remove? 
                # The user's sample has "1. - ", "2.- ". 
                # CE.json questions don't have numbers. AGE_2019.json don't have numbers.
                # I should probably remove the leading number and separator if possible, but for now I'll keep it to be safe unless it looks very standard.
                # Actually, looking at the sample: "1. - Según...", "2.- Según..."
                # It's better to strip it for consistency if the app adds numbers.
                
                question_text = row[2].strip()
                # Simple regex-like cleanup for "1. - ", "1.-", "1 - "
                import re
                question_text = re.sub(r'^\d+[\.\-\s]+', '', question_text)

                tags = []
                if len(row) > 10:
                    # The tags seem to be in the last column or specifically column 14 (index 13)
                    # In the sample, "TestReal" is at the end.
                    # Let's take the last non-empty column as tags if it looks like tags
                    tags_raw = row[-1]
                    if tags_raw:
                        tags = tags_raw.split(' ')

                question = {
                    "id": len(questions) + 1,
                    "tema": row[1],
                    "pregunta": question_text,
                    "opciones": {
                        "a": row[3],
                        "b": row[4],
                        "c": row[5],
                        "d": row[6]
                    },
                    "respuestaCorrecta": row[7].lower(),
                    "explicacion": "", # Placeholder
                    "tags": tags
                }
                questions.append(question)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(questions, f, indent=4, ensure_ascii=False)
            
        print(f"Successfully converted {len(questions)} questions to {output_path}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    parse_anki(r"c:\Users\Juan Carlos\Web Pages\TEST\anki_fragment.txt", r"c:\Users\Juan Carlos\Web Pages\TEST\data\Guadalajara2024.json")
