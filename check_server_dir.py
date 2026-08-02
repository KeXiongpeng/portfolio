#!/usr/bin/env python3
"""
检查 server 目录并尝试运行 create-admin 脚本
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
    print("检查 server 目录")
    print("=" * 60)

    # 1. 列出 server 目录内容
    print("\n【1. /root/server 目录内容】")
    cmd1 = "ls -la /root/server"
    output, error = run_ssh_command(HOST, USER, PASS, cmd1)
    if output:
        print(output)

    # 2. 查看 package.json 中的 scripts
    print("\n【2. package.json 中的 scripts】")
    cmd2 = "cd /root/server && cat package.json | grep -A 20 '\"scripts\"'"
    output, error = run_ssh_command(HOST, USER, PASS, cmd2)
    if output:
        print(output)

    # 3. 检查 dist 目录（编译后的文件）
    print("\n【3. 检查 dist 目录】")
    cmd3 = "ls -la /root/server/dist/src/scripts/ 2>/dev/null || echo 'dist 目录不存在'"
    output, error = run_ssh_command(HOST, USER, PASS, cmd3)
    if output:
        print(output)

    # 4. 检查 node_modules/.bin
    print("\n【4. 检查是否有 node_modules】")
    cmd4 = "ls /root/server/node_modules 2>/dev/null | head -5 || echo 'node_modules 不存在'"
    output, error = run_ssh_command(HOST, USER, PASS, cmd4)
    if output:
        print(output)

    print("\n" + "=" * 60)
    print("检查完成")
    print("=" * 60)