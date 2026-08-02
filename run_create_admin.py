#!/usr/bin/env python3
"""
运行服务器上的 create-admin 脚本
"""
import paramiko
import time

def run_ssh_command_interactive(host, username, password, commands):
    """交互式 SSH 命令执行"""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        ssh.connect(host, username=username, password=password)
        channel = ssh.get_transport().open_session()
        channel.get_pty()
        channel.exec_command(commands[0])

        output = ""
        for i, cmd in enumerate(commands[1:], 1):
            while True:
                if channel.recv_ready():
                    data = channel.recv(1024).decode('utf-8')
                    output += data
                    print(data, end='')
                    break
                time.sleep(0.1)

            # 发送输入
            channel.send(cmd + '\n')
            time.sleep(0.5)

        # 读取剩余输出
        while True:
            if channel.recv_ready():
                data = channel.recv(1024).decode('utf-8')
                output += data
                print(data, end='')
            if channel.exit_status_ready():
                break
            time.sleep(0.1)

        return output
    finally:
        ssh.close()

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
    print("尝试运行 create-admin 脚本")
    print("=" * 60)

    # 方法1: 尝试使用 node 直接运行编译后的脚本
    print("\n【方法1: 使用 node 运行编译后的脚本】")
    print("执行命令: cd /root/server && node dist/src/scripts/create-admin.js")

    # 注意：这个脚本需要交互式输入，在 SSH 中无法自动输入
    # 所以我们提供一个指导说明

    print("\n" + "=" * 60)
    print("请在服务器上手动执行以下命令：")
    print("=" * 60)
    print("\n1. SSH 连接到服务器:")
    print("   ssh root@120.77.222.102")
    print("   密码: Wtd021219")
    print("\n2. 进入 server 目录:")
    print("   cd /root/server")
    print("\n3. 运行创建管理员脚本:")
    print("   node dist/src/scripts/create-admin.js")
    print("\n4. 按提示输入以下信息:")
    print("   用户名: kexiongpeng")
    print("   邮箱: 1443546343@qq.com")
    print("   密码: Wtd021219")
    print("   确认密码: Wtd021219")
    print("\n" + "=" * 60)
    print("注意：这是一个交互式脚本，需要手动输入信息")
    print("=" * 60)

    # 检查是否可以通过其他方式创建
    print("\n【检查 package.json】")
    cmd = "cat /root/server/package.json"
    output, error = run_ssh_command(HOST, USER, PASS, cmd)
    if output:
        # 查找 scripts 部分
        lines = output.split('\n')
        in_scripts = False
        print("\npackage.json scripts:")
        for line in lines:
            if '"scripts"' in line:
                in_scripts = True
            if in_scripts:
                print(line)
                if '},\n' in line or line.strip() == '}':
                    break