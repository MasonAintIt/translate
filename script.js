document.addEventListener('DOMContentLoaded', () => {

    // --- Element References ---
    const sourceLangSelector = document.getElementById('source-language-selector');
    const targetLangSelector = document.getElementById('target-language-selector');
    const swapBtn = document.getElementById('swap-btn');
    
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    const fileInput = document.getElementById('file-input');

    const translateBtn = document.getElementById('translate-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');
    
    const statusMessage = document.getElementById('status-message');

    // --- Event Listeners ---
    translateBtn.addEventListener('click', handleTranslation);
    clearBtn.addEventListener('click', handleClear);
    swapBtn.addEventListener('click', handleSwap);
    fileInput.addEventListener('change', handleFileImport);
    copyBtn.addEventListener('click', handleCopy);

    /**
     * Copies the content of the output text area to the clipboard.
     */
    function handleCopy() {
        const textToCopy = outputText.value;
        if (!textToCopy) {
            statusMessage.textContent = "Nothing to copy.";
            return;
        }

        navigator.clipboard.writeText(textToCopy).then(() => {
            statusMessage.textContent = "Copied to clipboard!";
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            statusMessage.textContent = "Could not copy text.";
        });
    }

    /**
     * Swaps the selected source and target languages and the text content.
     */
    function handleSwap() {
        const sourceVal = sourceLangSelector.value;
        const targetVal = targetLangSelector.value;

        sourceLangSelector.value = targetVal;
        targetLangSelector.value = sourceVal;

        const inputVal = inputText.value;
        const outputVal = outputText.value;
        inputText.value = outputVal;
        outputText.value = inputVal;
    }

    /**
     * Clears the input and output text areas and the status message.
     */
    function handleClear() {
        inputText.value = '';
        outputText.value = '';
        statusMessage.textContent = '';
    }

    /**
     * Reads a text file and places its content in the input box.
     */
    function handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            inputText.value = e.target.result;
            statusMessage.textContent = `Imported content from ${file.name}.`;
        };
        reader.onerror = () => {
            statusMessage.textContent = `Error reading file: ${file.name}.`;
        };
        reader.readAsText(file);
    }
    
    /**
     * Main function to trigger the translation process.
     */
    async function handleTranslation() {
        const textToTranslate = inputText.value; // Don't trim yet, preserve newlines
        const sourceLang = sourceLangSelector.value;
        const targetLang = targetLangSelector.value;

        if (!textToTranslate.trim()) {
            statusMessage.textContent = "Please enter some text to translate.";
            return;
        }

        if (sourceLang === targetLang) {
            statusMessage.textContent = "Source and target languages are the same.";
            outputText.value = textToTranslate;
            return;
        }

        statusMessage.textContent = "Processing... Preparing to translate.";
        translateBtn.disabled = true;
        outputText.value = ''; // Clear previous output

        try {
            // Split the text into lines and translate them in parallel
            const lines = textToTranslate.split('\n');
            statusMessage.textContent = `Translating ${lines.length} lines...`;

            // Create an array of promises, one for each line
            const translationPromises = lines.map(line => {
                // If a line is just whitespace, don't call the API for it
                if (line.trim() === '') {
                    return Promise.resolve(line);
                }
                return translateText(line, sourceLang, targetLang);
            });
            
            // Wait for all the translation promises to complete
            const translatedLines = await Promise.all(translationPromises);
            
            // Join the translated lines back together
            outputText.value = translatedLines.join('\n');
            statusMessage.textContent = "Translation complete!";

        } catch (error) {
            console.error("Translation failed:", error);
            statusMessage.textContent = `Error: ${error.message}`;
        } finally {
            translateBtn.disabled = false; // Re-enable button
        }
    }

    /**
     * Calls the MyMemory API for a SINGLE line of text.
     * @param {string} text - The text to translate.
     * @param {string} sourceLang - The source language code.
     * @param {string} targetLang - The target language code.
     * @returns {Promise<string>} - A promise that resolves with the translated text.
     */
    async function translateText(text, sourceLang, targetLang) {
        const encodedText = encodeURIComponent(text);
        const apiUrl = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${sourceLang}|${targetLang}&de=youremail@example.com`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Network error (status ${response.status}).`);
        }

        const data = await response.json();
        
        if (data.responseData && data.responseData.translatedText) {
            return decodeHtmlEntities(data.responseData.translatedText);
        } else if (data.responseStatus === 429) {
            throw new Error("API rate limit exceeded. Please wait a moment.");
        } else {
            // If API can't translate a specific line (e.g., it's just code), return the original line
            return text;
        }
    }

    /**
     * A helper function to decode HTML entities (e.g., ' becomes ').
     */
    function decodeHtmlEntities(text) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    }
});
