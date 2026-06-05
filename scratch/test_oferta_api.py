import paramiko
c=paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('31.97.8.51', username='root', password='Lab-TeamMar@3690')

node_script = """
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const pool = new Pool(); // Uses env vars

async function run() {
  const { rows } = await pool.query(`SELECT u.id, u.email FROM usuarios u JOIN bodeguero_bodegas bb ON bb.usuario_id=u.id WHERE u.rol='bodega' LIMIT 1`);
  if (!rows.length) { console.log("No bodeguero found"); process.exit(1); }
  const user = rows[0];
  const token = jwt.sign({ userId: user.id, rol: 'bodega' }, process.env.JWT_SECRET || 'secret_key_123_simac_development_only', { expiresIn: '1h' });
  
  const res = await fetch('http://localhost:3005/api/oferta/municipios?tipo_maiz=blanco', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const data = await res.json();
  console.log("RESPONSE FOR BODEGUERO:", JSON.stringify(data, null, 2));
  process.exit(0);
}
run();
"""

sftp = c.open_sftp()
with sftp.open('/var/www/Simulador/backend/test_api.js', 'w') as f:
    f.write(node_script)

_,o,e=c.exec_command('cd /var/www/Simulador/backend && node test_api.js')
print("OUT:", o.read().decode())
print("ERR:", e.read().decode())
