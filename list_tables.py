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

    print("=== 1. 列出所有数据库 ===")
    sql1 = "docker exec root-postgres-1 psql -U postgres -c '\\l'"
    result1 = run_ssh_command(HOST, USER, PASS, sql1)
    print(result1)

    print("\n=== 2. 连接到myapp数据库并列出所有表 ===")
    sql2 = "docker exec root-postgres-1 psql -U postgres -d myapp -c '\\dt'"
    result2 = run_ssh_command(HOST, USER, PASS, sql2)
    print(result2)

    print("\n=== 3. 查询users表结构 ===")
    sql3 = "docker exec root-postgres-1 psql -U postgres -d myapp -c '\\d users'"
    result3 = run_ssh_command(HOST, USER, PASS, sql3)
    print(result3)