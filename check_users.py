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

    print("=== 1. 列出portfolio数据库中的所有表 ===")
    sql1 = "docker exec root-postgres-1 psql -U postgres -d portfolio -c '\\dt'"
    result1 = run_ssh_command(HOST, USER, PASS, sql1)
    print(result1)

    print("\n=== 2. 查询所有用户 ===")
    sql2 = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC;\""
    result2 = run_ssh_command(HOST, USER, PASS, sql2)
    print(result2)

    print("\n=== 3. 查询所有账户（包含密码哈希）===")
    sql3 = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"SELECT user_id, provider, provider_id FROM accounts;\""
    result3 = run_ssh_command(HOST, USER, PASS, sql3)
    print(result3)