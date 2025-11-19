### Drizzle ORM
- Always use `db:push`, whenever you make changes into database schema, in order to apply them to the db. Do not use anyother command e.g. db:generate.

### Subscriptions
- For free users, there is no subscription row in database; for paid users, there is one containing details. Therefore, the absence of a subscription record indicates the user is on the free tier.
