/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    pgm.createTable('favourite_cities', {
        id: {
            type: 'serial',
            primaryKey: true,
            notNull: true
        },

        user_id: {
            type: 'integer',
            references: 'users(id)',
            notNull: true
        },

        city_name: {
            type: 'text',
            notNull: true
        },

        latitude: {
            type: 'real',
            notNull: true
        },

        longitude: {
            type: 'real',
            notNull: true
        },

        created_at: {
            type: 'timestamptz',
            default: 'now()',
            notNull: true
        }
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable('favourite_cities');
};
