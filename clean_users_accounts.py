#!/usr/bin/env python3
"""
清理生产数据库中的用户和账户表数据
保留 roles、profiles、projects、blogs 等其他表
"""
import paramiko
import time

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
    print("清理生产数据库中的用户和账户表")
    print("=" * 60)

    # 1. 查看删除前的数据统计
    print("\n【删除前数据统计】")
    print("-" * 40)

    sql_before_users = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"SELECT COUNT(*) as users_count FROM users;\""
    output, error = run_ssh_command(HOST, USER, PASS, sql_before_users)
    if output:
        print("users 表:", output.strip())

    sql_before_accounts = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"SELECT COUNT(*) as accounts_count FROM accounts;\""
    output, error = run_ssh_command(HOST, USER, PASS, sql_before_accounts)
    if output:
        print("accounts 表:", output.strip())

    # 2. 删除 accounts 表数据（先删除依赖表）
    print("\n【步骤1: 删除 accounts 表数据】")
    print("-" * 40)
    sql_delete_accounts = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"TRUNCATE TABLE accounts CASCADE;\""
    output, error = run_ssh_command(HOST, USER, PASS, sql_delete_accounts)
    if output:
        print("✓ accounts 表已清空")
        print(output)
    if error and 'ERROR' in error:
        print("✗ 删除失败:", error)

    # 3. 删除 users 表数据
    print("\n【步骤2: 删除 users 表数据】")
    print("-" * 40)
    sql_delete_users = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"TRUNCATE TABLE users CASCADE;\""
    output, error = run_ssh_command(HOST, USER, PASS, sql_delete_users)
    if output:
        print("✓ users 表已清空")
        print(output)
    if error and 'ERROR' in error:
        print("✗ 删除失败:", error)

    # 4. 验证删除结果
    print("\n【删除后数据统计】")
    print("-" * 40)

    sql_after_users = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"SELECT COUNT(*) as users_count FROM users;\""
    output, error = run_ssh_command(HOST, USER, PASS, sql_after_users)
    if output:
        print("users 表:", output.strip())

    sql_after_accounts = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"SELECT COUNT(*) as accounts_count FROM accounts;\""
    output, error = run_ssh_command(HOST, USER, PASS, sql_after_accounts)
    if output:
        print("accounts 表:", output.strip())

    print("\n" + "=" * 60)
    print("清理完成！现在可以重新创建管理员账号")
    print("=" * 60)