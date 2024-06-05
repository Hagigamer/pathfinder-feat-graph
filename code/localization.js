const defaultLocale = "de";
const supportedLocale = ["en", "de"];

let locale;

let translations = { };

// After the page finished loading, localization functions are called.
document.addEventListener("DOMContentLoaded", 
    () => {
        const initialLocale = GetCurrentOrDefaultLocale(browserLocales(true));
        setLocale(initialLocale);
        bindLocaleSwitcher(initialLocale);
    }
);

// Checks if a locale is supported. Returns boolean.
function isSupported(locale)
{
    return supportedLocale.indexOf(locale) >= 0;
}

// Returns the given locale or default, if given is not supported.
function GetCurrentOrDefaultLocale(locales)
{
    return locales.find(isSupported) || defaultLocale;
}

// Changes current locale.
async function setLocale(newLocale)
{
    if (newLocale === locale)
        return;
    const newTranslations = await fetchTranslations(newLocale);
    locale = newLocale;
    translations = newTranslations;
    translatePage();
}

// Retrieves translations from the server.
async function fetchTranslations(newLocale)
{
    const response = await fetch(`./data/${newLocale}/resources.json`);
    return await response.json();
}

// Calls translateElement for every translatable element.
function translatePage()
{
    document.querySelectorAll("[resource]").forEach(translateElement);
}

// Retrieves the translation for a single element.
function translateElement(element) 
{
    const key = element.getAttribute("resource");
    const translation = getResourceByKey(key);
    element.innerText = translation;
}

// Creates an event handler and binds it to selection change of the resource switcher.
function bindLocaleSwitcher(initialValue)
{
    const switcher = document.querySelector("[resource-switcher]");
    switcher.value = initialValue;
    switcher.onchange = (e) => {
        setLocale(e.target.value);
    }
}

// Reads the preferred language from the browser.
function browserLocales(languageCodeOnly = false) 
{
    return navigator.languages.map((locale) =>
      languageCodeOnly ? locale.split("-")[0] : locale,
    );
}

// Retrieves the value corresponding to a key.
function getResourceByKey(key)
{
    return translations[key];
}