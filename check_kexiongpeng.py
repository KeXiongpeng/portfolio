#!/usr/bin/env python3
"""
查询数据库中是否存在 kexiongpeng 账号
"""
import paramiko

def run_ssh_command(host, username, password, command):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(host, username=username, password=password)
        stdin, stdout, stderr = ssh.exec_command(command)
        output = stdout.read().decode('utf-8')
        error = stderr.read().decode('utf-8')
        return output, error
    finally:
        ssh.close()

if __name__ == "__main__":
    HOST = "120.77.222.102"
    USER = "root"
    PASS = "Wtd021219"

    print("=" * 60)
    print("查询 kexiongpeng 账号信息")
    print("=" * 60)

    # 1. 查询 users 表
    print("\n【1. 查询 users 表中的 kexiongpeng 用户】")
    sql1 = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"SELECT id, username, email, role_id, created_at FROM users WHERE username = 'kexiongpeng';\""
    output, error = run_ssh_command(HOST, USER, PASS, sql1)
    if output:
        print(output)
    if error and 'ERROR' in error:
        print("错误:", error)

    # 2. 查询 accounts 表
    print("\n【2. 查询 accounts 表中相关账户】")
    sql2 = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"SELECT a.id, a.user_id, a.provider, a.provider_user_id, u.username FROM accounts a LEFT JOIN users u ON a.user_id = u.id WHERE u.username = 'kexiongpeng' OR a.provider_user_id = 'kexiongpeng';\""
    output, error = run_ssh_command(HOST, USER, PASS, sql2)
    if output:
        print(output)
    if error and 'ERROR' in error:
        print("错误:", error)

    # 3. 查询所有用户（确认数据库状态）
    print("\n【3. 查询所有用户（确认数据库状态）】")
    sql3 = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"SELECT id, username, email, role_id FROM users ORDER BY id;\""
    output, error = run_ssh_command(HOST, USER, PASS, sql3)
    if output:
        print(output)

    # 4. 查询所有账户
    print("\n【4. 查询所有账户】")
    sql4 = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"SELECT id, user_id, provider, provider_user_id FROM accounts ORDER BY id;\""
    output, error = run_ssh_command(HOST, USER, PASS, sql4)
    if output:
        print(output)

    print("\n" + "=" * 60)
    print("查询完成")
    print("=" * 60)