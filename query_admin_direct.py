#!/usr/bin/env python3
"""
快速查询管理员账号信息
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
    print("查询portfolio数据库中的管理员账号信息")
    print("=" * 60)

    # 1. 查询所有用户
    print("\n【1. 查询所有用户】")
    sql1 = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC;\""
    output, error = run_ssh_command(HOST, USER, PASS, sql1)
    if output:
        print(output)
    if error:
        print("错误:", error)

    # 2. 查询所有账户
    print("\n【2. 查询所有账户】")
    sql2 = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"SELECT user_id, provider, provider_id FROM accounts;\""
    output, error = run_ssh_command(HOST, USER, PASS, sql2)
    if output:
        print(output)
    if error:
        print("错误:", error)

    # 3. 查询特定用户详细信息
    print("\n【3. 查询用户名为 'kexiongpeng' 的详细信息】")
    sql3 = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"SELECT * FROM users WHERE username = 'kexiongpeng';\""
    output, error = run_ssh_command(HOST, USER, PASS, sql3)
    if output:
        print(output)
    if error:
        print("错误:", error)

    # 4. 查询users表结构
    print("\n【4. users表结构】")
    sql4 = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"\\d users\""
    output, error = run_ssh_command(HOST, USER, PASS, sql4)
    if output:
        print(output)
    if error:
        print("错误:", error)

    print("\n" + "=" * 60)
    print("查询完成")
    print("=" * 60)