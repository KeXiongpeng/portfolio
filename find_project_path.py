#!/usr/bin/env python3
"""
在服务器上查找项目路径
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
    print("查找项目部署路径")
    print("=" * 60)

    # 1. 查找 create-admin.ts 文件
    print("\n【1. 查找 create-admin.ts 文件】")
    cmd1 = "find / -name 'create-admin.ts' 2>/dev/null"
    output, error = run_ssh_command(HOST, USER, PASS, cmd1)
    if output.strip():
        print("找到文件:")
        print(output)
    else:
        print("未找到 create-admin.ts 文件")

    # 2. 查找 docker-compose.yml 文件
    print("\n【2. 查找 docker-compose.yml 文件】")
    cmd2 = "find /root -name 'docker-compose.yml' 2>/dev/null"
    output, error = run_ssh_command(HOST, USER, PASS, cmd2)
    if output.strip():
        print("找到文件:")
        print(output)

    # 3. 查看当前运行的容器信息
    print("\n【3. 查看运行中的容器】")
    cmd3 = "docker ps --format '{{.Names}}\t{{.Image}}\t{{.Status}}'"
    output, error = run_ssh_command(HOST, USER, PASS, cmd3)
    if output:
        print(output)

    # 4. 查看容器的挂载信息（找到项目路径）
    print("\n【4. 查看 web 容器的挂载信息】")
    cmd4 = "docker inspect root-web-1 --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}\n{{end}}' 2>/dev/null || docker inspect $(docker ps -q -f name=web) --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}\n{{end}}' 2>/dev/null"
    output, error = run_ssh_command(HOST, USER, PASS, cmd4)
    if output.strip():
        print("容器挂载信息:")
        print(output)

    # 5. 查看 server 容器的挂载信息
    print("\n【5. 查看 server 容器的挂载信息】")
    cmd5 = "docker inspect root-server-1 --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}\n{{end}}' 2>/dev/null || docker inspect $(docker ps -q -f name=server) --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}\n{{end}}' 2>/dev/null"
    output, error = run_ssh_command(HOST, USER, PASS, cmd5)
    if output.strip():
        print("容器挂载信息:")
        print(output)

    # 6. 在 root 目录下查找 package.json（server 目录）
    print("\n【6. 查找 server 目录下的 package.json】")
    cmd6 = "find /root -type f -name 'package.json' -path '*/server/*' 2>/dev/null"
    output, error = run_ssh_command(HOST, USER, PASS, cmd6)
    if output.strip():
        print("找到 package.json:")
        print(output)

    # 7. 列出 root 目录下的所有文件夹
    print("\n【7. /root 目录下的文件夹】")
    cmd7 = "ls -la /root"
    output, error = run_ssh_command(HOST, USER, PASS, cmd7)
    if output:
        print(output)

    print("\n" + "=" * 60)
    print("查找完成")
    print("=" * 60)