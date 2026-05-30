import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('31.97.8.51', username='root', password='Lab-TeamMar@3690')
stdin, stdout, stderr = c.exec_command("su - postgres -c \"psql -d bodegas -c 'SELECT clave, valor FROM referencias_externas;'\"")
print("STDOUT:", stdout.read().decode())
print("STDERR:", stderr.read().decode())
