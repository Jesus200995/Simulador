import paramiko
c=paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('31.97.8.51', username='root', password='Lab-TeamMar@3690')

sql_query = """
SELECT
    COALESCE(u.municipality_name, u.municipality_id, 'Sin municipio') AS municipio,
    COALESCE(u.state_name, u.state_id, 'Sin estado') AS estado,
    COUNT(DISTINCT p.producer_id) AS productores_disponibles,
    COALESCE(SUM(cc.yield_expected), 0)::numeric(12,2) AS toneladas_estimadas,
    'esta_semana' AS ventana_predominante,
    0 AS distancia_km
FROM up u
JOIN producer p ON p.producer_id = u.producer_id
JOIN cycle cy ON cy.up_id = u.up_id
LEFT JOIN cycle_crop cc ON cc.cycle_id = cy.cycle_id AND cc.crop = 'maiz'
WHERE cy.cycle_year >= EXTRACT(YEAR FROM CURRENT_DATE)::int - 1
GROUP BY u.municipality_name, u.municipality_id, u.state_name, u.state_id
HAVING COUNT(DISTINCT p.producer_id) > 0
ORDER BY productores_disponibles DESC
LIMIT 10;
"""

cmd = f"su - postgres -c \"psql -d bodegas -c \\\"{sql_query}\\\"\""
_,o,e=c.exec_command(cmd)
print("OUT:", o.read().decode())
print("ERR:", e.read().decode())
