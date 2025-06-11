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
        outputText.value = ''; // Clear previous output

        try {
            const translatedText = await translateText(textToTranslate, sourceLang, targetLang);
            outputText.value = translatedText;
            statusMessage.textContent = "Translation complete!";
        } catch (error) {
            console.error("Translation failed:", error);
            // Provide a more specific error message if the API gives one
            statusMessage.textContent = `Error: ${error.message}`;
        } finally {
            translateBtn.disabled = false; // Re-enable button
        }
    }

    /**
     * Calls the MyMemory API and robustly handles the response.
     * @param {string} text - The text to translate.
     * @param {string} sourceLang - The source language code.
     * @param {string} targetLang - The target language code.
     * @returns {Promise<string>} - A promise that resolves with the translated text.
     */
    async function translateText(text, sourceLang, targetLang) {
        const encodedText = encodeURIComponent(text);
        // Added a fake email to comply with API usage recommendations for higher limits
        const apiUrl = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${sourceLang}|${targetLang}&de=youremail@example.com`;
        
        console.log("Calling API:", apiUrl); // For debugging
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Network error (status ${response.status}). Please try again later.`);
        }

        const data = await response.json();
        console.log("API Response:", data); // For debugging

        // **THIS IS THE CRITICAL FIX**
        // We now safely check if the expected data exists before trying to use it.
        if (data.responseData && data.responseData.translatedText) {
            // The API sometimes returns HTML entities (like ' for '). This decodes them.
            return decodeHtmlEntities(data.responseData.translatedText);
        } else if (data.responseStatus === 429) {
            throw new Error("API rate limit exceeded. Please wait a moment.");
        } else if (data.responseDetails) {
            throw new Error(`API Error: ${data.responseDetails}`);
        } else {
            throw new Error("Could not find a valid translation in the API response.");
        }
    }

    /**
     * A helper function to decode HTML entities (e.g., ' becomes ').
     * @param {string} text - The text with HTML entities.
     * @returns {string} - The decoded text.
     */
    function decodeHtmlEntities(text) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    }
});
