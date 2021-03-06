/**
 * I18N service
 * @module i18n/services/i18n
 */
const merge = require('merge');

/**
 * Internationalization service
 */
class I18n {
    /**
     * Create the service
     * @param {App} app                         The application
     */
    constructor(app) {
        this.translations = {};
        this.formatters = new Map();

        this._app = app;
        this._defaultLocale = 'en';
    }

    /**
     * Service name is 'i18n'
     * @type {string}
     */
    static get provides() {
        return 'i18n';
    }

    /**
     * Dependencies as constructor arguments
     * @type {string[]}
     */
    static get requires() {
        return ['app'];
    }

    /**
     * This service is a singleton
     * @type {string}
     */
    static get lifecycle() {
        return 'singleton';
    }

    /**
     * Default locale
     * @param {string} locale
     */
    set defaultLocale(locale) {
        this._defaultLocale = locale;
    }

    /**
     * Default locale
     * @type {string}
     */
    get defaultLocale() {
        return this._defaultLocale;
    }

    /**
     * Load translations
     * @return {Promise}
     */
    async load(locale, filename) {
        if (!this.translations[locale])
            this.translations[locale] = {};

        let translation = await this._app.constructor._require(filename);
        if (!translation)
            throw new Error(`Could not load translations from ${filename}`);
        for (let key of Object.keys(translation)) {
            if (Array.isArray(translation[key].message))
                translation[key].message = translation[key].message.join('');
        }
        merge.recursive(this.translations[locale], translation);
    }

    /**
     * Translate message
     * @param {string} locale
     * @param {string} id
     * @param {object} [options]
     * @return {string}
     */
    translate(locale, id, options = {}) {
        if (!locale)
            throw new Error(`No locale is set`);

        let formatter = this.formatters.get(locale);
        if (!formatter) {
            formatter = require('format-message');
            formatter.setup({
                locale: locale,
                translations: this.translations,
            });
            this.formatters.set(locale, formatter);
        }

        try {
            return formatter(id, options);
        } catch (error) {
            throw new Error(error.message);
        }
    }
}

module.exports = I18n;
