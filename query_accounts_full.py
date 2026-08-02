#!/usr/bin/env python3
"""
查询 accounts 表的详细信息
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

    print("查询 accounts 表...")
    sql = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"SELECT * FROM accounts;\""
    output, error = run_ssh_command(HOST, USER, PASS, sql)
    if output:
        print(output)
    if error:
        print("错误:", error)