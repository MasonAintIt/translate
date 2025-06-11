document.addEventListener('DOMContentLoaded', () => {

    // --- Element References ---
    const sourceLangSelector = document.getElementById('source-language-selector');
    const targetLangSelector = document.getElementById('target-language-selector');
    const translateBtn = document.getElementById('translate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const statusMessage = document.getElementById('status-message');
    
    const englishContent = document.getElementById('english-content');
    const arabicContent = document.getElementById('arabic-content');
    
    // --- Store Original Content ---
    const originalEnglishHTML = englishContent.innerHTML;
    const originalArabicHTML = arabicContent.innerHTML;

    // --- Event Listeners ---
    translateBtn.addEventListener('click', translatePage);
    resetBtn.addEventListener('click', resetToOriginal);
    sourceLangSelector.addEventListener('change', switchSourceContent);

    /**
     * Shows the correct content block (English or Arabic) based on the
     * source language selection and resets the text.
     */
    function switchSourceContent() {
        const selectedSource = sourceLangSelector.value;
        if (selectedSource === 'en') {
            englishContent.style.display = 'block';
            arabicContent.style.display = 'none';
        } else if (selectedSource === 'ar') {
            englishContent.style.display = 'none';
            arabicContent.style.display = 'block';
        }
        resetToOriginal(); // Reset content when switching
    }

    /**
     * Resets the currently active content to its original state.
     */
    function resetToOriginal() {
        const selectedSource = sourceLangSelector.value;
        if (selectedSource === 'en') {
            englishContent.innerHTML = originalEnglishHTML;
            statusMessage.textContent = 'Content has been reset to original English.';
        } else if (selectedSource === 'ar') {
            arabicContent.innerHTML = originalArabicHTML;
            statusMessage.textContent = 'تمت إعادة تعيين المحتوى إلى اللغة العربية الأصلية.'; // "Content has been reset to original Arabic."
        }
    }

    /**
     * Main function to handle the translation process.
     */
    async function translatePage() {
        const sourceLang = sourceLangSelector.value;
        const targetLang = targetLangSelector.value;
        const sourceName = sourceLangSelector.options[sourceLangSelector.selectedIndex].text;
        const targetName = targetLangSelector.options[targetLangSelector.selectedIndex].text;

        if (sourceLang === targetLang) {
            statusMessage.textContent = "Source and target languages are the same.";
            return;
        }

        statusMessage.textContent = `Translating from ${sourceName} to ${targetName}...`;
        translateBtn.disabled = true;

        const activeContentDiv = (sourceLang === 'en') ? englishContent : arabicContent;
        const elementsToTranslate = activeContentDiv.querySelectorAll('p, h1, strong');

        const translationPromises = Array.from(elementsToTranslate).map(element => {
            const originalText = element.textContent;
            if (originalText.trim() === '') {
                return Promise.resolve(); // Skip empty elements
            }
            return translateText(originalText, sourceLang, targetLang)
                .then(translatedText => {
                    element.textContent = translatedText;
                })
                .catch(error => {
                    console.error('Translation error for element:', element, error);
                });
        });

        await Promise.all(translationPromises);

        statusMessage.textContent = 'Translation complete!';
        translateBtn.disabled = false;
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

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            const data = await response.json();
            
            if (data.responseData && data.responseData.translatedText) {
                // The API sometimes returns HTML entities, this decodes them
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = data.responseData.translatedText;
                return tempDiv.textContent || tempDiv.innerText || "";
            } else {
                return text; // If translation not found, return original text
            }
        } catch (error) {
            console.error("API call failed:", error);
            return text; // In case of an error, return the original text
        }
    }
});
