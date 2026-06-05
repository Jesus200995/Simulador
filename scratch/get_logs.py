import paramiko
import sys
c=paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('31.97.8.51', username='root', password='Lab-TeamMar@3690')

cmd = "pm2 logs bodegas-api --lines 50 --nostream"
_,o,e=c.exec_command(cmd)

out_text = o.read().decode('utf-8', errors='ignore')
sys.stdout.buffer.write(out_text.encode('utf-8'))
