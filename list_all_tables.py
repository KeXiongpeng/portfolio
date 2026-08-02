#!/usr/bin/env python3
"""
查询数据库中的所有表和数据统计
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
    print("查询portfolio数据库中的所有表和数据统计")
    print("=" * 60)

    # 1. 列出所有表
    print("\n【1. 数据库中的所有表】")
    sql1 = "docker exec root-postgres-1 psql -U postgres -d portfolio -c '\\dt'"
    output, error = run_ssh_command(HOST, USER, PASS, sql1)
    if output:
        print(output)
    if error:
        print("错误:", error)

    # 2. 统计每个表的数据量
    print("\n【2. 各表数据统计】")
    tables = ['users', 'accounts', 'profiles', 'projects', 'blogs', 'contact_messages', 'visits', 'roles']
    for table in tables:
        sql = f"docker exec root-postgres-1 psql -U postgres -d portfolio -c \"SELECT COUNT(*) FROM {table};\""
        output, error = run_ssh_command(HOST, USER, PASS, sql)
        if output and 'ERROR' not in output:
            print(f"{table}: {output.strip()}")
        # 如果表不存在，不显示错误

    print("\n" + "=" * 60)
    print("查询完成")
    print("=" * 60)