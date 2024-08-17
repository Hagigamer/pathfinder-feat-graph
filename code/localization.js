// Default and supported locales
const defaultLocale = "de";
const supportedLocales = ["en", "de"];

// Global variables for current locale and translations
let locale;
let translations = { };

/**
 * Initializes localization after the page has loaded.
 */
document.addEventListener("DOMContentLoaded", () => {
    const initialLocale = getCurrentOrDefaultLocale(browserLocales(true));
    setLocale(initialLocale);
    bindLocaleSwitcher(initialLocale);
});

/**
 * Checks if a given locale is supported.
 * @param {string} locale - The locale code to check.
 * @returns {boolean} - True if the locale is supported, otherwise false.
 */
function isSupported(locale) {
    return supportedLocales.includes(locale);
}

/**
 * Returns the current locale if supported, otherwise returns the default locale.
 * @param {string[]} locales - List of locales to check.
 * @returns {string} - The supported locale or default locale.
 */
function getCurrentOrDefaultLocale(locales) {
    return locales.find(isSupported) || defaultLocale;
}

/**
 * Updates the locale and translations, and translates the page content.
 * @param {string} newLocale - The new locale code.
 */
async function setLocale(newLocale) {
    if (newLocale === locale) return; // No change if the locale is the same

    const newTranslations = await fetchTranslations(newLocale);
    locale = newLocale;
    translations = newTranslations;
    translatePage(); // Update page content with new translations

    // Call the function to update the graph with the new locale
    if (typeof updateGraphForLocale === 'function') {
        updateGraphForLocale(newLocale);
    }
}

/**
 * Fetches translations from the server for the given locale.
 * @param {string} newLocale - The locale code to fetch translations for.
 * @returns {Promise<object>} - A promise that resolves to the translations object.
 */
async function fetchTranslations(newLocale) {
    const response = await fetch(`./data/${newLocale}/resources.json`);
    return await response.json();
}

/**
 * Translates all elements on the page that have a "resource" attribute.
 */
function translatePage() {
    document.querySelectorAll("[resource]").forEach(translateElement);
    translatePlaceholders(); // Update placeholder text
}

/**
 * Translates a single element based on its "resource" attribute.
 * @param {HTMLElement} element - The element to translate.
 */
function translateElement(element) {
    const key = element.getAttribute("resource");
    const translation = getResourceByKey(key);
    element.innerText = translation;
}

/**
 * Binds the locale switcher to handle locale changes.
 * @param {string} initialValue - The initial value of the locale switcher.
 */
function bindLocaleSwitcher(initialValue) {
    const switcher = document.querySelector("[resource-switcher]");
    switcher.value = initialValue;
    switcher.onchange = async (e) => {
        console.log("Language changed to:", e.target.value); // Log the selected locale
        await setLocale(e.target.value); // Update locale asynchronously
    };
}

/**
 * Retrieves the preferred languages from the browser.
 * @param {boolean} languageCodeOnly - If true, only return language codes (e.g., 'en'), otherwise full locales.
 * @returns {string[]} - An array of preferred languages.
 */
function browserLocales(languageCodeOnly = false) {
    return navigator.languages.map(locale =>
        languageCodeOnly ? locale.split("-")[0] : locale
    );
}

/**
 * Retrieves the translation for a given key.
 * @param {string} key - The key for the desired translation.
 * @returns {string} - The translation string.
 */
function getResourceByKey(key) {
    return translations[key];
}

/**
 * Translates placeholders for input elements.
 */
function translatePlaceholders() {
    document.querySelectorAll("[resource]").forEach(element => {
        const key = element.getAttribute("resource");
        const translation = getResourceByKey(key);
        if (element.tagName === "INPUT" && element.hasAttribute("placeholder")) {
            element.setAttribute("placeholder", translation); // Update placeholder text
        } else {
            element.innerText = translation; // Update inner text
        }
    });
}
