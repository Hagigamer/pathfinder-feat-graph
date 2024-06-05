const defaultLocale = "de";
let locale;

let translations = { };

document.addEventListener("DOMContentLoaded", 
    () => {setLocale(defaultLocale);}
);

async function setLocale(newLocale) 
{
    if (newLocale === locale)
        return;
    const newTranslations = await fetchTranslations(newLocale);
    locale = newLocale;
    translations = newTranslations;
    translatePage();
}

async function fetchTranslations(newLocale)
{
    const response = await fetch(`./data/${newLocale}/resources.json`);
    return await response.json();
}

function translatePage()
{
    document.querySelectorAll("[resource]").forEach(translateElement);
}

function translateElement(element) 
{
    const key = element.getAttribute("resource");
    const translation = translations[key];
    element.innerText = translation;
}