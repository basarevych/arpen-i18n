/**
 * Telegram I18N middleware
 * @module i18n/middleware/telegram
 */
const fs = require('fs');
const path = require('path');

/**
 * Internationalization
 */
class TelegramI18n {
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
     * Service name is 'telegram.i18n'
     * @type {string}
     */
    static get provides() {
        return 'telegram.i18n';
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
     * @param {Telegram} server          The server
     * @return {Promise}
     */
    async register(server) {
        for (let [ moduleName, moduleConfig ] of this._config.modules) {
            for (let dir of moduleConfig.i18n || []) {
                let filename = (dir[0] === '/') ? dir : path.join(moduleConfig.base_path, dir);
                for (let file of fs.readdirSync(filename)) {
                    if (!file.endsWith('.json'))
                        continue;

                    await this._i18n.load(path.basename(file, '.json'), path.join(filename, file));
                }
            }
        }

        server.bot.use(async (ctx, next) => {
            if (!ctx.session.locale)
                ctx.session.locale = this._i18n.defaultLocale;

            ctx.i18n = (id, ...args) => {
                let options = {};
                let locale = ctx.session.locale || this._i18n.defaultLocale;
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

            return next(ctx);
        });
    }
}

module.exports = TelegramI18n;
