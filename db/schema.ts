import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const releases=sqliteTable('releases',{id:text('id').primaryKey(),category:text('category').notNull(),title:text('title').notNull(),version:text('version').notNull(),notes:text('notes').notNull(),url:text('url'),key:text('key'),filename:text('filename'),created:integer('created').notNull()});
