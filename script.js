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
    
    const statusMessage = document.getElementById('status-message');

    // --- Event Listeners ---
    translateBtn.addEventListener('click', handleTranslation);
    clearBtn.addEventListener('click', handleClear);
    swapBtn.addEventListener('click', handleSwap);
    fileInput.addEventListener('change', handleFileImport);

    /**
     * Swaps the selected source and target languages.
     */
    function handleSwap() {
        const sourceVal = sourceLangSelector.value;
        const targetVal = targetLangSelector.value;

        sourceLangSelector.value = targetVal;
        targetLangSelector.value = sourceVal;

        // Also swap the text in the input/output boxes
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
     * Reads a text file selected by the user and places its content in the input box.
     */
    function handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

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
     * Main function to handle the translation process via API call.
     */
    async function handleTranslation() {
        const textToTranslate = inputText.value.trim();
        const sourceLang = sourceLangSelector.value;
        const targetLang = targetLangSelector.value;

        if (!textToTranslate) {
            statusMessage.textContent = "Please enter some text to translate.";
            return;
        }

        if (sourceLang === targetLang) {
            statusMessage.textContent = "Source and target languages are the same.";
            outputText.value = textToTranslate;
            return;
        }

        statusMessage.textContent = "Translating...";
        translateBtn.disabled = true;

        try {
            const translatedText = await translateText(textToTranslate, sourceLang, targetLang);
            outputText.value = translatedText;
            statusMessage.textContent = "Translation complete!";
        } catch (error) {
            console.error("Translation failed:", error);
            statusMessage.textContent = "Error: Could not complete translation.";
        } finally {
            translateBtn.disabled = false; // Re-enable button regardless of outcome
        }
    }

    /**
     * Calls the MyMemory API to translate a single piece of text.
     * @param {string} text - The text to translate.
     * @param {string} sourceLang - The source language code (e.g., 'en').
     * @param {string} targetLang - The target language code (e.g., 'es').
     * @returns {Promise<string>} - A promise that resolves with the translated text.
     */
    async function translateText(text, sourceLang, targetLang) {
        const encodedText = encodeURIComponent(text);
        const apiUrl = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${sourceLang}|${targetLang}`;

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        if (data.responseStatus !== 200) {
            throw new Error(`API returned an error: ${data.responseDetails}`);
        }
        
        // Decode HTML entities (like ' for ') for a cleaner output
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = data.responseData.translatedText;
        return tempDiv.textContent || tempDiv.innerText || "";
    }
});
