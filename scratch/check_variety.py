import paramiko
c=paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('31.97.8.51', username='root', password='Lab-TeamMar@3690')
_,o,_=c.exec_command('sudo -u postgres psql -d simac -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'cycle_crop\' AND column_name = \'variety_id\';"')
print(o.read().decode())
