INSERT INTO skills (name, category)
VALUES ('JavaScript', 'Programming Language')
ON CONFLICT (name) DO NOTHING;

DELETE FROM skill_aliases
WHERE lower(alias) IN ('js', 'javascript', 'java script');

INSERT INTO skill_aliases (skill_id, alias)
SELECT s.id, aliases.alias
FROM skills s
CROSS JOIN (VALUES ('JS'), ('Javascript'), ('Java Script')) AS aliases(alias)
WHERE lower(s.name) = 'javascript'
ON CONFLICT (alias) DO UPDATE SET skill_id = EXCLUDED.skill_id;
