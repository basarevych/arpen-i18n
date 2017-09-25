/**
 * Express I18N middleware
 * @module i18n/middleware/express
 */
const fs = require('fs');
const path = require('path');

/**
 * Internationalization
 */
class I18n {
    /**
     * Create the service
     * @param {object} config           Configuration
     * @param {I18n} i18n               I18n service
     */
    constructor(config, i18n) {
        this._config = config;
        this._i18n = i18n;
    }

    /**
     * Service name is 'express.i18n'
     * @type {string}
     */
    static get provides() {
        return 'express.i18n';
    }

    /**
     * Dependencies as constructor arguments
     * @type {string[]}
     */
    static get requires() {
        return [ 'config', 'i18n' ];
    }

    /**
     * Register middleware
     * @param {Express} server          The server
     * @return {Promise}
     */
    async register(server) {
        for (let [ moduleName, moduleConfig ] of this._config.modules) {
            for (let dir of moduleConfig.i18n || []) {
                let filename = dir[0] === '/'
                    ? dir
                    : path.join(this._config.base_path, 'modules', moduleName, dir);

                for (let file of fs.readdirSync(filename)) {
                    if (!file.endsWith('.json'))
                        continue;

                    await this._i18n.load(path.basename(file, '.json'), path.join(filename, file));
                }
            }
        }

        server.express.use((req, res, next) => {
            res.locals.locale = null;
            if (Object.keys(this._i18n.translations).length) {
                if (req.cookies)
                    res.locals.locale = Object.keys(this._i18n.translations).includes(req.cookies.locale) ? req.cookies.locale : null;
                if (!res.locals.locale)
                    res.locals.locale = req.acceptsLanguages(Object.keys(this._i18n.translations));
            }
            if (!res.locals.locale)
                res.locals.locale = this._i18n.defaultLocale;

            res.locals.i18n = (id, ...args) => {
                let options = {};
                let locale = res.locals.locale;
                if (args.length >= 2) {
                    options = args[0];
                    locale = args[1];
                } else if (args.length === 1) {
                    if (typeof args[0] === 'object')
                        options = args[0];
                    else
                        locale = args[0];
                }
                return this._i18n.translate(locale, id, options);
            };

            next();
        });
    }
}

module.exports = I18n;
