#!/usr/bin/env python3
import paramiko

def run_ssh_command(host, username, password, command):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(host, username=username, password=password)
        stdin, stdout, stderr = ssh.exec_command(command)
        return stdout.read().decode('utf-8')
    finally:
        ssh.close()

if __name__ == "__main__":
    HOST = "120.77.222.102"
    USER = "root"
    PASS = "Wtd021219"

    print("=== 查询所有用户 ===")
    sql = "docker exec root-postgres-1 psql -U postgres -d myapp -c \"SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC;\""
    result = run_ssh_command(HOST, USER, PASS, sql)
    print(result)

    print("\n=== 查询所有账户（包含密码哈希）===")
    sql2 = "docker exec root-postgres-1 psql -U postgres -d myapp -c \"SELECT user_id, provider, provider_id FROM accounts;\""
    result2 = run_ssh_command(HOST, USER, PASS, sql2)
    print(result2)