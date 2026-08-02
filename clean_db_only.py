#!/usr/bin/env python3
"""
清空数据库中的用户和账户表
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
    print("清空用户和账户表")
    print("=" * 60)

    # 1. 删除所有账户
    print("\n【删除 accounts 表数据】")
    sql1 = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"DELETE FROM accounts;\""
    output, error = run_ssh_command(HOST, USER, PASS, sql1)
    print(output)

    # 2. 删除所有用户
    print("\n【删除 users 表数据】")
    sql2 = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"DELETE FROM users;\""
    output, error = run_ssh_command(HOST, USER, PASS, sql2)
    print(output)

    # 3. 验证
    print("\n【验证删除结果】")
    sql3 = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"SELECT COUNT(*) as users_count FROM users; SELECT COUNT(*) as accounts_count FROM accounts;\""
    output, error = run_ssh_command(HOST, USER, PASS, sql3)
    print(output)

    print("\n" + "=" * 60)
    print("✓ 数据已清空，你可以自己创建管理员账号了")
    print("=" * 60)