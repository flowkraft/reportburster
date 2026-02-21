\set jwt_secret `echo "$JWT_SECRET"`
\set jwt_exp `echo "$JWT_EXP"`
\set pgdb `echo "$PGDATABASE"`

ALTER DATABASE :"pgdb" SET "app.settings.jwt_secret" TO :'jwt_secret';
ALTER DATABASE :"pgdb" SET "app.settings.jwt_exp" TO :'jwt_exp';
